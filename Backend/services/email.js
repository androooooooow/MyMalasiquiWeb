import nodemailer from 'nodemailer';

function getTransporter() {
    const { SMTP_HOST, SMTP_PORT = '587', SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
}

export async function sendVerificationEmail({ email, token }) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${encodeURIComponent(token)}`;
    const transporter = getTransporter();
    if (!transporter) {
        if (process.env.NODE_ENV === 'production') throw new Error('Email delivery is not configured');
        console.info(`[development] Verification link for ${email}: ${verificationUrl}`);
        return;
    }
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Malasiqui Rescue <no-reply@malasiqui.local>',
        to: email,
        subject: 'Verify your Malasiqui Rescue account',
        text: `Verify your email by opening this link: ${verificationUrl}. This link expires in 30 minutes.`,
        html: `<p>Please verify your email before accessing your dashboard.</p><p><a href="${verificationUrl}">Verify email address</a></p><p>This link expires in 30 minutes.</p>`,
    });
}
