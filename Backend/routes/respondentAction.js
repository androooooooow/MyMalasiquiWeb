import express from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const statusSchema = z.object({ status: z.enum(['EN_ROUTE', 'RESOLVED']) }).strict();
const responderLocationSchema = z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    accuracyMeters: z.number().int().min(0).max(50000000),
}).strict();
const idSchema = z.object({ id: z.string().cuid('Invalid emergency request') });

const servicesByResponderUnit = {
    HEALTH_AMBULANCE: ['AMBULANCE'],
    PNP_POLICE: ['POLICE'],
    BFP_FIRE: ['FIRE'],
    MDRRMO: ['SEARCH_RESCUE', 'DISASTER', 'OTHER'],
};
const emergencyInclude = {
    citizen: { select: { id: true, name: true, address: true, phoneNum: true } },
    assignedResponder: { select: { id: true, name: true, phoneNum: true, responderUnit: true } },
};
const activeStatuses = ['ACCEPTED', 'EN_ROUTE'];

function servicesForResponder(user) {
    return servicesByResponderUnit[user.responder_unit] || [];
}

function parseId(req, res) {
    const result = idSchema.safeParse(req.params);
    if (!result.success) {
        res.status(400).json({ message: result.error.issues[0]?.message || 'Invalid emergency request' });
        return null;
    }
    return result.data.id;
}

router.use(protect);

router.get('/team', allowRoles('respondent'), async (req, res, next) => {
    try {
        const unit = req.user.responder_unit;
        if (!unit) return res.status(403).json({ message: 'Your responder account does not have a response unit assigned.' });
        const members = await prisma.user.findMany({
            where: { role: 'respondent', responderUnit: unit },
            select: {
                id: true,
                name: true,
                assignedEmergencyRequests: {
                    where: { status: { in: activeStatuses } },
                    select: {
                        id: true, status: true, service: true, acceptedAt: true,
                        citizen: { select: { name: true } },
                    },
                    orderBy: { acceptedAt: 'desc' },
                },
            },
            orderBy: { name: 'asc' },
        });
        return res.json({ members });
    } catch (error) {
        next(error);
    }
});

router.get('/queue', allowRoles('respondent', 'admin'), async (req, res, next) => {
    try {
        const responderServices = servicesForResponder(req.user);
        if (req.user.role === 'respondent' && responderServices.length === 0) {
            return res.status(403).json({ message: 'Your responder account does not have a response unit assigned.' });
        }
        const where = req.user.role === 'admin'
            ? { status: { in: ['PENDING', 'ACCEPTED', 'EN_ROUTE'] } }
            : {
                OR: [
                    { status: 'PENDING', assignedResponderId: null, service: { in: responderServices } },
                    { assignedResponder: { responderUnit: req.user.responder_unit }, status: { in: activeStatuses } },
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
        const responderServices = servicesForResponder(req.user);
        if (responderServices.length === 0) {
            return res.status(403).json({ message: 'Your responder account does not have a response unit assigned.' });
        }
        const accepted = await prisma.$transaction(async (transaction) => {
            const result = await transaction.emergencyRequest.updateMany({
                where: { id, status: 'PENDING', assignedResponderId: null, service: { in: responderServices } },
                data: { status: 'ACCEPTED', assignedResponderId: req.user.id, acceptedAt: new Date() },
            });
            if (result.count !== 1) return null;
            return transaction.emergencyRequest.findUnique({ where: { id }, include: emergencyInclude });
        });
        if (!accepted) {
            return res.status(409).json({ message: 'This request is not available to your unit or was already accepted.' });
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
        const current = await prisma.emergencyRequest.findFirst({ where: { id, assignedResponderId: req.user.id } });
        if (!current) return res.status(404).json({ message: 'Assigned emergency request not found.' });

        const nextStatus = req.validatedBody.status;
        const transitionAllowed = (current.status === 'ACCEPTED' && nextStatus === 'EN_ROUTE')
            || (['ACCEPTED', 'EN_ROUTE'].includes(current.status) && nextStatus === 'RESOLVED');
        if (!transitionAllowed) {
            return res.status(409).json({ message: `Cannot change this request from ${current.status} to ${nextStatus}.` });
        }
        if (nextStatus === 'EN_ROUTE' && (current.responderLatitude === null || current.responderLongitude === null)) {
            return res.status(400).json({ message: 'Share your current location before marking this request en route.' });
        }
        const emergency = await prisma.emergencyRequest.update({
            where: { id },
            data: {
                status: nextStatus,
                resolvedAt: nextStatus === 'RESOLVED' ? new Date() : null,
                activeCitizenId: nextStatus === 'RESOLVED' ? null : current.activeCitizenId,
            },
            include: emergencyInclude,
        });
        return res.json({ message: 'Emergency status updated.', emergency });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/responder-location', allowRoles('respondent'), validate(responderLocationSchema), async (req, res, next) => {
    try {
        const id = parseId(req, res);
        if (!id) return;
        const result = await prisma.emergencyRequest.updateMany({
            where: { id, assignedResponderId: req.user.id, status: { in: ['ACCEPTED', 'EN_ROUTE'] } },
            data: {
                responderLatitude: req.validatedBody.latitude,
                responderLongitude: req.validatedBody.longitude,
                responderAccuracyMeters: req.validatedBody.accuracyMeters,
                responderLocationUpdatedAt: new Date(),
            },
        });
        if (result.count !== 1) {
            return res.status(404).json({ message: 'Active assigned emergency request not found.' });
        }
        const emergency = await prisma.emergencyRequest.findUnique({ where: { id }, include: emergencyInclude });
        return res.json({ message: 'Responder location updated.', emergency });
    } catch (error) {
        next(error);
    }
});

export default router;
