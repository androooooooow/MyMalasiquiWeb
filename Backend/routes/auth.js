import crypto from 'node:crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendVerificationEmail } from '../services/email.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be no more than 72 characters')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number');

const registerSchema = z.object({
    name: z.string().trim().min(2, 'Enter your full name').max(100)
        .regex(/^[\p{L}\p{M} .'-]+$/u, 'Name contains invalid characters'),
    address: z.string().trim().min(5, 'Enter a complete address').max(250),
    phone_num: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
    email: emailSchema,
    role: z.enum(['citizen', 'respondent'], { message: 'Choose a valid account type' }),
    password: passwordSchema,
}).strict();
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(72) }).strict();
const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid verification link') }).strict();
const resendSchema = z.object({ email: emailSchema }).strict();
const googleSchema = z.object({ credential: z.string().min(100).max(5000) }).strict();

const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please wait and try again.' },
});

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
};

function generateSessionToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function newVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    return {
        token,
        digest: crypto.createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        address: user.address,
        phone_num: user.phoneNum,
        email: user.email,
        role: user.role,
        created_at: user.createdAt,
    };
}

function issueSession(res, user) {
    const token = generateSessionToken(user.id);
    res.cookie('token', token, cookieOptions);
    return token;
}

function hasErrorCode(error, codes) {
    let current = error;
    while (current) {
        if (codes.includes(current.code)) return true;
        current = current.cause;
    }
    return false;
}

const googleConnectionCodes = [
    'EACCES', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN',
];

async function verifyGoogleCredential(credential) {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    } catch (error) {
        if (!hasErrorCode(error, googleConnectionCodes)) throw error;

        // Google's token-info endpoint independently validates the signature.
        // This is a narrow fallback for Windows/proxy certificate-chain issues;
        // the claims are still checked locally before an application session is issued.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const url = new URL('https://oauth2.googleapis.com/tokeninfo');
            url.searchParams.set('id_token', credential);
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw error;
            const payload = await response.json();
            const now = Math.floor(Date.now() / 1000);
            const issuerValid = ['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss);
            const audienceValid = payload.aud === process.env.GOOGLE_CLIENT_ID;
            const expiryValid = Number(payload.exp) > now;
            if (!issuerValid || !audienceValid || !expiryValid) throw new Error('Invalid Google token claims');
            return payload;
        } finally {
            clearTimeout(timeout);
        }
    }
}

router.post('/register', sensitiveLimiter, validate(registerSchema), async (req, res, next) => {
    try {
        const { name, address, phone_num, email, role, password } = req.validatedBody;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

        const verification = newVerificationToken();
        const user = await prisma.user.create({
            data: {
                name, address, phoneNum: phone_num, email, role,
                password: await bcrypt.hash(password, 12),
                emailVerificationToken: verification.digest,
                verificationExpiresAt: verification.expiresAt,
            },
        });
        await sendVerificationEmail({ email: user.email, token: verification.token });
        return res.status(201).json({
            message: 'Account created. Check your email to verify your account before signing in.',
            email: user.email,
            requiresVerification: true,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/verify-email', sensitiveLimiter, validate(tokenSchema), async (req, res, next) => {
    try {
        const digest = crypto.createHash('sha256').update(req.validatedBody.token).digest('hex');
        const user = await prisma.user.findFirst({
            where: { emailVerificationToken: digest, verificationExpiresAt: { gt: new Date() } },
        });
        if (!user) return res.status(400).json({ message: 'This verification link is invalid or has expired.' });

        const verified = await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date(), emailVerificationToken: null, verificationExpiresAt: null },
        });
        const token = issueSession(res, verified);
        return res.json({ message: 'Email verified successfully.', user: publicUser(verified), token });
    } catch (error) {
        next(error);
    }
});

router.post('/resend-verification', sensitiveLimiter, validate(resendSchema), async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { email: req.validatedBody.email } });
        if (user && !user.emailVerifiedAt) {
            const verification = newVerificationToken();
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerificationToken: verification.digest, verificationExpiresAt: verification.expiresAt },
            });
            await sendVerificationEmail({ email: user.email, token: verification.token });
        }
        return res.json({ message: 'If an unverified account exists, a new verification email has been sent.' });
    } catch (error) {
        next(error);
    }
});

router.post('/login', sensitiveLimiter, validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.validatedBody;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        if (!user.emailVerifiedAt) {
            return res.status(403).json({
                message: 'Verify your email before signing in.',
                requiresVerification: true,
                email: user.email,
            });
        }
        const token = issueSession(res, user);
        return res.json({ user: publicUser(user), token });
    } catch (error) {
        next(error);
    }
});

router.post('/google', sensitiveLimiter, validate(googleSchema), async (req, res, next) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({ message: 'Google sign-in is not configured.' });
        }
        const payload = await verifyGoogleCredential(req.validatedBody.credential);
        const emailVerified = payload?.email_verified === true || payload?.email_verified === 'true';
        if (!payload?.sub || !payload.email || !emailVerified) {
            return res.status(401).json({ message: 'Google could not verify this email address.' });
        }

        const email = payload.email.toLowerCase();
        const existing = await prisma.user.findFirst({ where: { OR: [{ googleSub: payload.sub }, { email }] } });
        const user = existing
            ? await prisma.user.update({
                where: { id: existing.id },
                data: {
                    googleSub: payload.sub,
                    emailVerifiedAt: existing.emailVerifiedAt || new Date(),
                    authProvider: existing.authProvider === 'local' ? 'local,google' : existing.authProvider,
                    emailVerificationToken: null,
                    verificationExpiresAt: null,
                },
            })
            : await prisma.user.create({
                data: {
                    name: payload.name || email.split('@')[0],
                    address: '',
                    phoneNum: '',
                    email,
                    role: 'citizen',
                    password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
                    googleSub: payload.sub,
                    authProvider: 'google',
                    emailVerifiedAt: new Date(),
                },
            });

        const token = issueSession(res, user);
        return res.json({ user: publicUser(user), token });
    } catch (error) {
        if (hasErrorCode(error, googleConnectionCodes) || error?.name === 'AbortError') {
            return res.status(503).json({ message: 'The server could not reach Google securely. Check the backend internet connection and try again.' });
        }
        if (error?.code === 'P2002') {
            return res.status(409).json({ message: 'This Google account is already linked to another RESCUE APP account.' });
        }
        if (
            error?.message?.includes('Token used too late')
            || error?.message?.includes('Wrong recipient')
            || error?.message?.includes('Invalid token')
            || error?.message?.includes('Wrong number of segments')
        ) {
            return res.status(401).json({ message: 'Google sign-in expired or is invalid. Please try again.' });
        }
        next(error);
    }
});

router.get('/session', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies.token;
    if (!token) return res.json({ user: null });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user?.emailVerifiedAt) return res.json({ user: null });
        return res.json({ user: publicUser(user) });
    } catch {
        return res.json({ user: null });
    }
});

router.get('/me', protect, (req, res) => res.json(req.user));
router.post('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Logged out successfully' });
});

export default router;
