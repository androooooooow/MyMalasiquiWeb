import crypto from 'node:crypto';
import https from 'node:https';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { EmailDeliveryError, isEmailDeliveryConfigured, sendVerificationEmail } from '../services/email.js';
import { trustedCertificates } from '../config/trustedCertificates.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleCertificateCache = { certificates: null, expiresAt: 0 };
const googleIssuers = ['accounts.google.com', 'https://accounts.google.com'];
const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const nameSchema = z.string().trim().min(2, 'Enter your full name').max(100)
    .regex(/^[\p{L}\p{M} .'-]+$/u, 'Name contains invalid characters');
const addressSchema = z.string().trim().min(5, 'Enter a complete address').max(250);
const phoneSchema = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number');
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be no more than 72 characters')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number');
const responderUnitSchema = z.enum(['HEALTH_AMBULANCE', 'PNP_POLICE', 'BFP_FIRE', 'MDRRMO']);

const registerSchema = z.object({
    name: nameSchema,
    address: addressSchema,
    phone_num: phoneSchema,
    email: emailSchema,
    role: z.enum(['citizen', 'respondent'], { message: 'Choose a valid account type' }),
    responder_unit: responderUnitSchema.optional(),
    password: passwordSchema,
}).strict().superRefine((account, context) => {
    if (account.role === 'respondent' && !account.responder_unit) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['responder_unit'],
            message: 'Choose the response unit you belong to',
        });
    }
});
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(72) }).strict();
const verificationCodeSchema = z.object({
    email: emailSchema,
    code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit verification code'),
}).strict();
const resendSchema = z.object({ email: emailSchema }).strict();
const googleSchema = z.object({ credential: z.string().min(100).max(5000) }).strict();
const profileSchema = z.object({
    name: nameSchema,
    address: addressSchema,
    phone_num: phoneSchema,
}).strict();

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

function verificationDigest(email, code) {
    return crypto.createHmac('sha256', process.env.JWT_SECRET)
        .update(`${email}:${code}`)
        .digest('hex');
}

function newVerificationCode(email) {
    const code = crypto.randomInt(100000, 1000000).toString();
    return {
        code,
        digest: verificationDigest(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
}

function emailDeliveryResponse(error, res) {
    if (!(error instanceof EmailDeliveryError)) return false;
    const status = error.code === 'EMAIL_NOT_CONFIGURED' ? 503 : 502;
    res.status(status).json({
        message: error.code === 'EMAIL_NOT_CONFIGURED'
            ? 'Email verification is not configured. Add the Gmail SMTP account and App Password to the backend.'
            : 'The verification code could not be sent. Check the Gmail SMTP settings and try again.',
        code: error.code,
    });
    return true;
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        address: user.address,
        phone_num: user.phoneNum,
        email: user.email,
        role: user.role,
        responder_unit: user.responderUnit,
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
    'GOOGLE_CERTIFICATE_HTTP', 'GOOGLE_CERTIFICATE_RESPONSE',
];

function fetchGoogleCertificates() {
    return new Promise((resolve, reject) => {
        const request = https.get('https://www.googleapis.com/oauth2/v1/certs', {
            ca: trustedCertificates,
            // Some Windows networks reject Node's IPv6 socket with EACCES even
            // though the same Google host is reachable over IPv4 in the browser.
            family: 4,
            headers: { accept: 'application/json' },
            timeout: 10000,
        }, (response) => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                body += chunk;
                if (body.length > 1024 * 1024) request.destroy(new Error('Google certificate response is too large'));
            });
            response.on('end', () => {
                if (response.statusCode !== 200) {
                    const error = new Error(`Google certificate endpoint returned ${response.statusCode}`);
                    error.code = 'GOOGLE_CERTIFICATE_HTTP';
                    reject(error);
                    return;
                }
                try {
                    const certificates = JSON.parse(body);
                    const maxAge = Number(/max-age=(\d+)/i.exec(response.headers['cache-control'] || '')?.[1] || 300);
                    resolve({ certificates, expiresAt: Date.now() + Math.max(60, maxAge) * 1000 });
                } catch (cause) {
                    const error = new Error('Google returned an invalid certificate response', { cause });
                    error.code = 'GOOGLE_CERTIFICATE_RESPONSE';
                    reject(error);
                }
            });
        });
        request.on('timeout', () => {
            const error = new Error('Google certificate request timed out');
            error.code = 'ETIMEDOUT';
            request.destroy(error);
        });
        request.on('error', reject);
    });
}

async function getGoogleCertificates(forceRefresh = false) {
    if (!forceRefresh && googleCertificateCache.certificates && Date.now() < googleCertificateCache.expiresAt) {
        return googleCertificateCache.certificates;
    }
    const fresh = await fetchGoogleCertificates();
    googleCertificateCache.certificates = fresh.certificates;
    googleCertificateCache.expiresAt = fresh.expiresAt;
    return fresh.certificates;
}

function googleTokenKeyId(credential) {
    try {
        return JSON.parse(Buffer.from(credential.split('.')[0], 'base64url').toString('utf8')).kid;
    } catch {
        return null;
    }
}

async function verifyGoogleCredential(credential) {
    try {
        let certificates = await getGoogleCertificates();
        const keyId = googleTokenKeyId(credential);
        if (keyId && !certificates[keyId]) certificates = await getGoogleCertificates(true);
        const ticket = await googleClient.verifySignedJwtWithCertsAsync(
            credential,
            certificates,
            process.env.GOOGLE_CLIENT_ID,
            googleIssuers,
        );
        return ticket.getPayload();
    } catch (error) {
        if (hasErrorCode(error, googleConnectionCodes)) throw error;
        const invalidCredential = new Error('Google ID token is invalid', { cause: error });
        invalidCredential.code = 'GOOGLE_INVALID_CREDENTIAL';
        throw invalidCredential;
    }
}

router.post('/register', sensitiveLimiter, validate(registerSchema), async (req, res, next) => {
    try {
        const { name, address, phone_num, email, role, responder_unit, password } = req.validatedBody;
        if (!isEmailDeliveryConfigured()) {
            return res.status(503).json({
                message: 'Email verification is not configured. Add the Gmail SMTP account and App Password to the backend.',
                code: 'EMAIL_NOT_CONFIGURED',
            });
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing?.emailVerifiedAt) {
            return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
        }

        const verification = newVerificationCode(email);
        const accountData = {
            name,
            address,
            phoneNum: phone_num,
            role,
            responderUnit: role === 'respondent' ? responder_unit : null,
            password: await bcrypt.hash(password, 12),
            emailVerificationToken: verification.digest,
            verificationExpiresAt: verification.expiresAt,
        };
        const user = existing
            ? await prisma.user.update({ where: { id: existing.id }, data: accountData })
            : await prisma.user.create({ data: { ...accountData, email } });

        await sendVerificationEmail({ email: user.email, code: verification.code });
        return res.status(existing ? 200 : 201).json({
            message: existing
                ? 'Your pending account was updated. Enter the new 6-digit code sent to your email.'
                : 'Account created. Enter the 6-digit code sent to your email before signing in.',
            email: user.email,
            requiresVerification: true,
        });
    } catch (error) {
        if (emailDeliveryResponse(error, res)) return;
        next(error);
    }
});

router.post('/verify-email', sensitiveLimiter, validate(verificationCodeSchema), async (req, res, next) => {
    try {
        const { email, code } = req.validatedBody;
        const digest = verificationDigest(email, code);
        const user = await prisma.user.findFirst({
            where: { email, emailVerificationToken: digest, verificationExpiresAt: { gt: new Date() } },
        });
        if (!user) return res.status(400).json({ message: 'The verification code is invalid or has expired.' });

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
            if (!isEmailDeliveryConfigured()) {
                return res.status(503).json({
                    message: 'Email verification is not configured. Add the Gmail SMTP account and App Password to the backend.',
                    code: 'EMAIL_NOT_CONFIGURED',
                });
            }
            const verification = newVerificationCode(user.email);
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerificationToken: verification.digest, verificationExpiresAt: verification.expiresAt },
            });
            await sendVerificationEmail({ email: user.email, code: verification.code });
        }
        return res.json({ message: 'If an unverified account exists, a new verification email has been sent.' });
    } catch (error) {
        if (emailDeliveryResponse(error, res)) return;
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
    res.setHeader('X-Rescue-Auth-Version', 'google-cert-v5-avast-safe');
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
            const diagnosticCode = error?.code || error?.cause?.code || error?.name || 'UNKNOWN';
            console.error('[Google auth certificate error]', {
                code: diagnosticCode,
                syscall: error?.syscall || error?.cause?.syscall,
                address: error?.address || error?.cause?.address,
                port: error?.port || error?.cause?.port,
            });
            return res.status(503).json({
                message: `Google verification could not load its signing certificates. Restart the updated backend and try again. [AUTH-V5:${diagnosticCode}]`,
            });
        }
        if (error?.code === 'P2002') {
            return res.status(409).json({ message: 'This Google account is already linked to another RESCUE APP account.' });
        }
        if (error?.code === 'GOOGLE_INVALID_CREDENTIAL') {
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
router.patch('/profile', protect, validate(profileSchema), async (req, res, next) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: req.validatedBody.name,
                address: req.validatedBody.address,
                phoneNum: req.validatedBody.phone_num,
            },
        });
        return res.json({ message: 'Profile updated successfully.', user: publicUser(user) });
    } catch (error) {
        next(error);
    }
});
router.post('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Logged out successfully' });
});

export default router;
