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

const emergencyInclude = {
    citizen: { select: { id: true, name: true, address: true, phoneNum: true } },
    assignedResponder: { select: { id: true, name: true, phoneNum: true, responderUnit: true } },
};

router.use(protect);

router.post('/', allowRoles('citizen'), validate(createEmergencySchema), async (req, res, next) => {
    try {
        const { landmark, callbackPhone, ...details } = req.validatedBody;
        const activeRequest = await prisma.emergencyRequest.findFirst({
            where: { citizenId: req.user.id, status: { in: ['PENDING', 'ACCEPTED', 'EN_ROUTE'] } },
            select: { id: true },
        });
        if (activeRequest) {
            return res.status(409).json({
                message: 'You already have an active emergency request. Wait until it is resolved before creating another one.',
                activeRequestId: activeRequest.id,
            });
        }
        const emergency = await prisma.emergencyRequest.create({
            data: {
                ...details,
                landmark: landmark || null,
                callbackPhone: callbackPhone || req.user.phone_num || null,
                citizenId: req.user.id,
                activeCitizenId: req.user.id,
            },
            include: emergencyInclude,
        });
        return res.status(201).json({
            message: 'Emergency request sent to the responder queue.',
            emergency,
        });
    } catch (error) {
        if (error?.code === 'P2002' && error?.meta?.target?.includes?.('active_citizen_id')) {
            return res.status(409).json({ message: 'You already have an active emergency request.' });
        }
        next(error);
    }
});

router.get('/active', allowRoles('citizen'), async (req, res, next) => {
    try {
        const emergency = await prisma.emergencyRequest.findFirst({
            where: { citizenId: req.user.id, status: { in: ['PENDING', 'ACCEPTED', 'EN_ROUTE'] } },
            include: emergencyInclude,
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ emergency });
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

export default router;
