import { rateLimit } from 'express-rate-limit';

// Applied only after `protect`, so multiple users behind one hotspot do not
// consume each other's emergency, chat, or admin allowance.
export function userRateLimit(limit, message) {
    return rateLimit({
        windowMs: 60 * 1000,
        limit,
        keyGenerator: (req) => `user:${req.user.id}`,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { message },
    });
}
