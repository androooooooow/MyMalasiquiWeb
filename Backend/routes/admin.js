import express from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    responderUnit: true,
    emailVerifiedAt: true,
    blockedAt: true,
    blockReason: true,
    createdAt: true,
};
const pageSchema = z.coerce.number().int().min(1).max(1000).default(1);
const usersQuerySchema = z.object({
    page: pageSchema,
    search: z.string().trim().max(80).default(''),
    role: z.enum(['all', 'citizen', 'respondent', 'admin']).default('all'),
    status: z.enum(['all', 'active', 'blocked']).default('all'),
}).strict();
const analyticsQuerySchema = z.object({
    period: z.enum(['day', 'week', 'month', 'year']).default('day'),
}).strict();
const auditQuerySchema = z.object({ page: pageSchema }).strict();
const blockSchema = z.object({
    blocked: z.boolean(),
    reason: z.string().trim().max(250).optional(),
}).strict().superRefine((value, context) => {
    if (value.blocked && (!value.reason || value.reason.length < 5)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['reason'], message: 'Provide a reason of at least 5 characters.' });
    }
});

function startOfPeriod(date, period) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    if (period === 'week') start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
    if (period === 'month' || period === 'year') start.setUTCDate(1);
    if (period === 'year') start.setUTCMonth(0);
    return start;
}

function addPeriod(date, period, amount) {
    const next = new Date(date);
    if (period === 'day') next.setUTCDate(next.getUTCDate() + amount);
    if (period === 'week') next.setUTCDate(next.getUTCDate() + amount * 7);
    if (period === 'month') next.setUTCMonth(next.getUTCMonth() + amount);
    if (period === 'year') next.setUTCFullYear(next.getUTCFullYear() + amount);
    return next;
}

router.use(protect, allowRoles('admin'));

router.get('/overview', async (req, res, next) => {
    try {
        const [citizens, responders, admins, blockedUsers, totalIncidents, activeIncidents, recentIncidents, recentAudit] = await Promise.all([
            prisma.user.count({ where: { role: 'citizen' } }),
            prisma.user.count({ where: { role: 'respondent' } }),
            prisma.user.count({ where: { role: 'admin' } }),
            prisma.user.count({ where: { blockedAt: { not: null } } }),
            prisma.emergencyRequest.count(),
            prisma.emergencyRequest.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'EN_ROUTE'] } } }),
            prisma.emergencyRequest.findMany({
                take: 8,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, service: true, status: true, createdAt: true,
                    citizen: { select: { id: true, name: true } },
                    assignedResponder: { select: { id: true, name: true } },
                },
            }),
            prisma.adminAuditLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, action: true, reason: true, createdAt: true,
                    actor: { select: { id: true, name: true } },
                    targetUser: { select: { id: true, name: true } },
                },
            }),
        ]);
        return res.json({
            counts: { citizens, responders, admins, blockedUsers, totalIncidents, activeIncidents },
            recentIncidents,
            recentAudit,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/users', async (req, res, next) => {
    try {
        const query = usersQuerySchema.parse(req.query);
        const where = {
            ...(query.role !== 'all' ? { role: query.role } : {}),
            ...(query.status === 'active' ? { blockedAt: null } : {}),
            ...(query.status === 'blocked' ? { blockedAt: { not: null } } : {}),
            ...(query.search ? { OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ] } : {}),
        };
        const [users, total] = await Promise.all([
            prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * 20, take: 20 }),
            prisma.user.count({ where }),
        ]);
        return res.json({ users, total, page: query.page, pageSize: 20 });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid user filters.' });
        next(error);
    }
});

router.patch('/users/:id/block', validate(blockSchema), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid user ID.' });
        if (id === req.user.id) return res.status(403).json({ message: 'You cannot block your own account.' });
        const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
        if (!target) return res.status(404).json({ message: 'User not found.' });
        if (target.role === 'admin') return res.status(403).json({ message: 'Administrator accounts cannot be blocked here.' });

        const { blocked, reason } = req.validatedBody;
        const changed = await prisma.$transaction(async (tx) => {
            const result = await tx.user.updateMany({
                where: { id, blockedAt: blocked ? null : { not: null } },
                data: { blockedAt: blocked ? new Date() : null, blockReason: blocked ? reason : null },
            });
            if (!result.count) return null;
            await tx.adminAuditLog.create({
                data: {
                    actorId: req.user.id,
                    targetUserId: id,
                    action: blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
                    reason: blocked ? reason : null,
                },
            });
            return tx.user.findUnique({ where: { id }, select: userSelect });
        });
        if (!changed) return res.status(409).json({ message: blocked ? 'User is already blocked.' : 'User is already active.' });
        return res.json({ user: changed });
    } catch (error) {
        next(error);
    }
});

router.get('/analytics', async (req, res, next) => {
    try {
        const { period } = analyticsQuerySchema.parse(req.query);
        const windowSize = { day: 14, week: 12, month: 12, year: 5 }[period];
        const currentStart = startOfPeriod(new Date(), period);
        const firstStart = addPeriod(currentStart, period, 1 - windowSize);
        const end = addPeriod(currentStart, period, 1);
        const rows = await prisma.$queryRaw`
            SELECT date_trunc(${period}::text, "created_at") AS bucket, COUNT(*)::int AS count
            FROM "emergency_requests"
            WHERE "created_at" >= ${firstStart} AND "created_at" < ${end}
            GROUP BY 1 ORDER BY 1
        `;
        const counts = new Map(rows.map((row) => [new Date(row.bucket).toISOString().slice(0, 10), row.count]));
        const buckets = Array.from({ length: windowSize }, (_, index) => {
            const start = addPeriod(firstStart, period, index).toISOString().slice(0, 10);
            return { start, count: counts.get(start) || 0 };
        });
        return res.json({ period, timezone: 'UTC', total: buckets.reduce((sum, bucket) => sum + bucket.count, 0), buckets });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid analytics period.' });
        next(error);
    }
});

router.get('/audit-log', async (req, res, next) => {
    try {
        const { page } = auditQuerySchema.parse(req.query);
        const [entries, total] = await Promise.all([
            prisma.adminAuditLog.findMany({
                take: 30,
                skip: (page - 1) * 30,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, action: true, reason: true, createdAt: true,
                    actor: { select: { id: true, name: true, email: true } },
                    targetUser: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.adminAuditLog.count(),
        ]);
        return res.json({ entries, total, page, pageSize: 30 });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid audit log page.' });
        next(error);
    }
});

export default router;
