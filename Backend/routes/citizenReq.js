import express from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const safeText = (minimum, maximum, message) => z.string().trim()
    .min(minimum, message)
    .max(maximum)
    .regex(/^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/, 'Text contains unsupported characters');

const createEmergencySchema = z.object({
    service: z.enum(['AMBULANCE', 'FIRE', 'POLICE', 'SEARCH_RESCUE', 'DISASTER', 'OTHER']),
    description: safeText(10, 600, 'Describe what happened using at least 10 characters'),
    peopleAffected: z.enum(['1', '2-5', '6-10', '10+', 'unknown']),
    landmark: safeText(0, 180, '').optional().default(''),
    callbackPhone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid callback number').optional().or(z.literal('')),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    // Browser geolocation can legitimately report very large accuracy radii
    // when GPS is weak or the device falls back to Wi-Fi/cell positioning.
    // Keep that value for responder context instead of blocking the request.
    accuracyMeters: z.number().int().min(0).max(50000000, 'Location accuracy is outside the supported range'),
}).strict();

const statusSchema = z.object({
    status: z.enum(['EN_ROUTE', 'RESOLVED']),
}).strict();

const idSchema = z.object({ id: z.string().cuid('Invalid emergency request') });

const emergencyInclude = {
    citizen: { select: { id: true, name: true, address: true, phoneNum: true } },
    assignedResponder: { select: { id: true, name: true, phoneNum: true } },
};

function parseId(req, res) {
    const result = idSchema.safeParse(req.params);
    if (!result.success) {
        res.status(400).json({ message: result.error.issues[0]?.message || 'Invalid emergency request' });
        return null;
    }
    return result.data.id;
}

router.use(protect);

router.post('/', allowRoles('citizen'), validate(createEmergencySchema), async (req, res, next) => {
    try {
        const { landmark, callbackPhone, ...details } = req.validatedBody;
        const emergency = await prisma.emergencyRequest.create({
            data: {
                ...details,
                landmark: landmark || null,
                callbackPhone: callbackPhone || req.user.phone_num || null,
                citizenId: req.user.id,
            },
            include: emergencyInclude,
        });
        return res.status(201).json({
            message: 'Emergency request sent to the responder queue.',
            emergency,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/mine', allowRoles('citizen'), async (req, res, next) => {
    try {
        const emergencies = await prisma.emergencyRequest.findMany({
            where: { citizenId: req.user.id },
            include: emergencyInclude,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return res.json({ emergencies });
    } catch (error) {
        next(error);
    }
});

router.get('/queue', allowRoles('respondent', 'admin'), async (req, res, next) => {
    try {
        const where = req.user.role === 'admin'
            ? { status: { in: ['PENDING', 'ACCEPTED', 'EN_ROUTE'] } }
            : {
                OR: [
                    { status: 'PENDING', assignedResponderId: null },
                    { assignedResponderId: req.user.id, status: { in: ['ACCEPTED', 'EN_ROUTE'] } },
                ],
            };
        const emergencies = await prisma.emergencyRequest.findMany({
            where,
            include: emergencyInclude,
            orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
            take: 100,
        });
        return res.json({ emergencies });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/accept', allowRoles('respondent'), async (req, res, next) => {
    try {
        const id = parseId(req, res);
        if (!id) return;

        const accepted = await prisma.$transaction(async (transaction) => {
            const result = await transaction.emergencyRequest.updateMany({
                where: { id, status: 'PENDING', assignedResponderId: null },
                data: { status: 'ACCEPTED', assignedResponderId: req.user.id, acceptedAt: new Date() },
            });
            if (result.count !== 1) return null;
            return transaction.emergencyRequest.findUnique({ where: { id }, include: emergencyInclude });
        });

        if (!accepted) {
            return res.status(409).json({ message: 'This request was already accepted or is no longer available.' });
        }
        return res.json({ message: 'Emergency request accepted.', emergency: accepted });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/status', allowRoles('respondent'), validate(statusSchema), async (req, res, next) => {
    try {
        const id = parseId(req, res);
        if (!id) return;
        const current = await prisma.emergencyRequest.findFirst({
            where: { id, assignedResponderId: req.user.id },
        });
        if (!current) return res.status(404).json({ message: 'Assigned emergency request not found.' });

        const nextStatus = req.validatedBody.status;
        const transitionAllowed = (current.status === 'ACCEPTED' && nextStatus === 'EN_ROUTE')
            || (['ACCEPTED', 'EN_ROUTE'].includes(current.status) && nextStatus === 'RESOLVED');
        if (!transitionAllowed) {
            return res.status(409).json({ message: `Cannot change this request from ${current.status} to ${nextStatus}.` });
        }

        const emergency = await prisma.emergencyRequest.update({
            where: { id },
            data: { status: nextStatus, resolvedAt: nextStatus === 'RESOLVED' ? new Date() : null },
            include: emergencyInclude,
        });
        return res.json({ message: 'Emergency status updated.', emergency });
    } catch (error) {
        next(error);
    }
});

export default router;
