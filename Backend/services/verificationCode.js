import crypto from 'node:crypto';

export function verificationDigest(email, code) {
    return crypto.createHmac('sha256', process.env.JWT_SECRET)
        .update(`${email}:${code}`)
        .digest('hex');
}

export function newVerificationCode(email) {
    const code = crypto.randomInt(100000, 1000000).toString();
    return {
        code,
        digest: verificationDigest(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
}
