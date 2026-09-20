import express from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { isEmailDeliveryConfigured, sendResponderRejectionEmail, sendVerificationEmail } from '../services/email.js';
import { newVerificationCode } from '../services/verificationCode.js';
import { decryptUserContact, encryptUserContact } from '../services/privateFields.js';
import { userRateLimit } from '../middleware/userRateLimit.js';

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
const auditQuerySchema = z.object({
    page: pageSchema,
    role: z.enum(['all', 'citizen', 'respondent', 'admin']).default('all'),
    action: z.string().trim().max(80).default('all'),
    search: z.string().trim().max(80).default(''),
}).strict();
const blockSchema = z.object({
    blocked: z.boolean(),
    reason: z.string().trim().max(250).optional(),
}).strict().superRefine((value, context) => {
    if (value.blocked && (!value.reason || value.reason.length < 5)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['reason'], message: 'Provide a reason of at least 5 characters.' });
    }
});
const applicationQuerySchema = z.object({
    page: pageSchema,
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
}).strict();
const rejectApplicationSchema = z.object({ reason: z.string().trim().min(5).max(250) }).strict();
const applicationSelect = {
    id: true, name: true, address: true, phoneNum: true, email: true,
    responderUnit: true, status: true, reviewReason: true,
    reviewedAt: true, emailSentAt: true, createdAt: true,
    reviewedBy: { select: { id: true, name: true } },
};

async function sendResponderApprovalCode(application, user) {
    const verification = newVerificationCode(user.email);
    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: verification.digest, verificationExpiresAt: verification.expiresAt },
    });
    try {
        await sendVerificationEmail({ email: user.email, code: verification.code, approvedResponder: true });
    } catch (error) {
        await prisma.user.updateMany({
            where: { id: user.id, emailVerificationToken: verification.digest },
            data: {
                emailVerificationToken: user.emailVerificationToken,
                verificationExpiresAt: user.verificationExpiresAt,
            },
        });
        console.error('[Responder approval email failed]', { applicationId: application.id, code: error?.code || 'UNKNOWN' });
        return false;
    }
    try {
        await prisma.responderApplication.update({ where: { id: application.id }, data: { emailSentAt: new Date() } });
    } catch (error) {
        console.error('[Responder approval email timestamp failed]', { applicationId: application.id, code: error?.code });
    }
    return true;
}

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

router.use(protect, allowRoles('admin'), userRateLimit(120, 'Too many admin requests. Please wait briefly and try again.'));

router.get('/overview', async (req, res, next) => {
    try {
        const [citizens, responders, admins, blockedUsers, totalIncidents, activeIncidents, recentIncidents, recentAudit, pendingResponderApplications] = await Promise.all([
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
            prisma.activityLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, action: true, details: true, createdAt: true,
                    actorName: true, actorRole: true, subjectType: true, subjectId: true,
                },
            }),
            prisma.responderApplication.count({ where: { status: 'PENDING' } }),
        ]);
        return res.json({
            counts: { citizens, responders, admins, blockedUsers, totalIncidents, activeIncidents, pendingResponderApplications },
            recentIncidents,
            recentAudit,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/responder-applications', async (req, res, next) => {
    try {
        const { page: requestedPage, status } = applicationQuerySchema.parse(req.query);
        const where = { status };
        const pageSize = 10;
        const total = await prisma.responderApplication.count({ where });
        const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize)));
        const applications = await prisma.responderApplication.findMany({
            where, select: applicationSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * pageSize, take: pageSize,
        });
        const accounts = status === 'APPROVED' && applications.length
            ? await prisma.user.findMany({
                where: { email: { in: applications.map((application) => application.email) } },
                select: { email: true, emailVerifiedAt: true },
            })
            : [];
        const verifiedByEmail = new Map(accounts.map((account) => [account.email, account.emailVerifiedAt]));
        return res.json({
            applications: applications.map((application) => ({
                ...decryptUserContact(application),
                accountVerifiedAt: verifiedByEmail.get(application.email) || null,
            })),
            total, page, pageSize,
        });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid application filters.' });
        next(error);
    }
});

router.post('/responder-applications/:id/approve', async (req, res, next) => {
    try {
        const id = z.string().cuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid application ID.' });
        if (!isEmailDeliveryConfigured()) {
            return res.status(503).json({ message: 'Set up SMTP email delivery before approving a responder.' });
        }
        const application = await prisma.responderApplication.findUnique({ where: { id: id.data } });
        if (!application) return res.status(404).json({ message: 'Responder application not found.' });
        if (application.status !== 'PENDING') return res.status(409).json({ message: 'This application has already been reviewed.' });
        if (!application.passwordHash) return res.status(409).json({ message: 'This application is missing its pending credentials.' });

        const user = await prisma.$transaction(async (tx) => {
            const claimed = await tx.responderApplication.updateMany({
                where: { id: application.id, status: 'PENDING' },
                data: { status: 'APPROVED', reviewedById: req.user.id, reviewedAt: new Date(), passwordHash: null },
            });
            if (!claimed.count) return null;
            const created = await tx.user.create({
                data: {
                    name: application.name,
                    ...encryptUserContact(decryptUserContact(application)),
                    email: application.email, role: 'respondent', responderUnit: application.responderUnit,
                    password: application.passwordHash, authProvider: 'local',
                },
            });
            await tx.activityLog.create({ data: {
                actorId: req.user.id, actorName: req.user.name, actorEmail: req.user.email, actorRole: req.user.role,
                action: 'RESPONDER_APPLICATION_APPROVED', subjectType: 'responder_application',
                subjectId: application.id, details: application.email,
            } });
            return created;
        });
        if (!user) return res.status(409).json({ message: 'This application has already been reviewed.' });

        const emailSent = await sendResponderApprovalCode(application, user);
        return res.json({
            message: emailSent
                ? 'Responder approved. A verification code was emailed to the applicant.'
                : 'Responder approved, but the email could not be sent. Use Resend approval email to retry.',
            emailSent,
        });
    } catch (error) {
        if (error?.code === 'P2002') return res.status(409).json({ message: 'An account with this email already exists. Review it before approving.' });
        next(error);
    }
});

router.post('/responder-applications/:id/reject', validate(rejectApplicationSchema), async (req, res, next) => {
    try {
        const id = z.string().cuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid application ID.' });
        const application = await prisma.responderApplication.findUnique({ where: { id: id.data }, select: { id: true, email: true, status: true } });
        if (!application) return res.status(404).json({ message: 'Responder application not found.' });
        const rejected = await prisma.$transaction(async (tx) => {
            const changed = await tx.responderApplication.updateMany({
                where: { id: application.id, status: 'PENDING' },
                data: {
                    status: 'REJECTED', passwordHash: null, reviewedById: req.user.id,
                    reviewedAt: new Date(), reviewReason: req.validatedBody.reason,
                },
            });
            if (!changed.count) return false;
            await tx.activityLog.create({ data: {
                actorId: req.user.id, actorName: req.user.name, actorEmail: req.user.email, actorRole: req.user.role,
                action: 'RESPONDER_APPLICATION_REJECTED', subjectType: 'responder_application',
                subjectId: application.id, details: application.email,
            } });
            return true;
        });
        if (!rejected) return res.status(409).json({ message: 'This application has already been reviewed.' });
        let emailSent = false;
        if (isEmailDeliveryConfigured()) {
            try {
                await sendResponderRejectionEmail({ email: application.email, reason: req.validatedBody.reason });
                emailSent = true;
            } catch (error) {
                console.error('[Responder rejection email failed]', { applicationId: application.id, code: error?.code || 'UNKNOWN' });
            }
        }
        return res.json({
            message: emailSent
                ? 'Application rejected. The applicant was notified by email and may apply again.'
                : 'Application rejected, but the decision email could not be sent. The applicant may apply again.',
            emailSent,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/responder-applications/:id/resend-verification', async (req, res, next) => {
    try {
        const id = z.string().cuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid application ID.' });
        if (!isEmailDeliveryConfigured()) return res.status(503).json({ message: 'SMTP email delivery is not configured.' });
        const application = await prisma.responderApplication.findUnique({ where: { id: id.data } });
        if (!application || application.status !== 'APPROVED') return res.status(404).json({ message: 'Approved application not found.' });
        const user = await prisma.user.findUnique({ where: { email: application.email } });
        if (!user || user.role !== 'respondent') return res.status(404).json({ message: 'Approved responder account not found.' });
        if (user.emailVerifiedAt) return res.status(409).json({ message: 'This responder has already verified their email.' });
        if (application.emailSentAt && application.emailSentAt > new Date(Date.now() - 60 * 1000)) {
            return res.status(429).json({ message: 'Wait one minute before sending another code.' });
        }
        const emailSent = await sendResponderApprovalCode(application, user);
        return res.status(emailSent ? 200 : 502).json({ message: emailSent ? 'A new verification code was emailed.' : 'The verification email could not be sent. Please try again.' });
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
        const pageSize = 10;
        const total = await prisma.user.count({ where });
        const page = Math.min(query.page, Math.max(1, Math.ceil(total / pageSize)));
        const users = await prisma.user.findMany({
            where, select: userSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * pageSize, take: pageSize,
        });
        return res.json({ users, total, page, pageSize });
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
            await tx.activityLog.create({
                data: {
                    actorId: req.user.id,
                    actorName: req.user.name,
                    actorEmail: req.user.email,
                    actorRole: req.user.role,
                    action: blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
                    subjectType: 'user',
                    subjectId: String(id),
                    details: blocked ? reason : null,
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
        const { page: requestedPage, role, action, search } = auditQuerySchema.parse(req.query);
        const where = {
            ...(role !== 'all' ? { actorRole: role } : {}),
            ...(action !== 'all' ? { action } : {}),
            ...(search ? { OR: [
                { actorName: { contains: search, mode: 'insensitive' } },
                { actorEmail: { contains: search, mode: 'insensitive' } },
            ] } : {}),
        };
        const pageSize = 10;
        const total = await prisma.activityLog.count({ where });
        const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize)));
        const entries = await prisma.activityLog.findMany({
            where,
            take: pageSize,
            skip: (page - 1) * pageSize,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
                id: true, action: true, details: true, createdAt: true,
                actorName: true, actorEmail: true, actorRole: true,
                subjectType: true, subjectId: true,
            },
        });
        return res.json({ entries, total, page, pageSize });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid audit log page.' });
        next(error);
    }
});

export default router;
