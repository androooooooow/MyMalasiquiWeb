import nodemailer from 'nodemailer';
import { lookup } from 'node:dns/promises';

async function getTransporter() {
    const { SMTP_HOST, SMTP_PORT = '587', SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
    const { address } = await lookup(SMTP_HOST, { family: 4 });
    return nodemailer.createTransport({
        host: address,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === 'true',
        // Connect to the resolved IPv4 address while retaining the original
        // hostname for secure certificate verification.
        tls: { servername: SMTP_HOST },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
}

export function isEmailDeliveryConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export class EmailDeliveryError extends Error {
    constructor(message, code, cause) {
        super(message, { cause });
        this.name = 'EmailDeliveryError';
        this.code = code;
    }
}

export async function sendVerificationEmail({ email, code, approvedResponder = false }) {
    const transporter = await getTransporter();
    if (!transporter) {
        throw new EmailDeliveryError(
            'Gmail delivery is not configured on the server.',
            'EMAIL_NOT_CONFIGURED',
        );
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: approvedResponder
                ? `Your RESCUE APP responder application is approved — verification code ${code}`
                : `${code} is your RESCUE APP verification code`,
            text: approvedResponder
                ? `Your responder application was approved by an administrator. Enter code ${code} on the RESCUE APP email verification screen within 10 minutes to activate your account. Do not share this code.`
                : `Your RESCUE APP verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#10243e">
                    <h2>${approvedResponder ? 'Your responder application was approved' : 'Verify your RESCUE APP account'}</h2>
                    <p>Enter this code on the email verification screen:</p>
                    <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
                    <p>This code expires in 10 minutes. Do not share it with anyone.</p>
                    <p>If you did not request this account, you can ignore this email.</p>
                </div>`,
        });
    } catch (error) {
        throw new EmailDeliveryError(
            'Gmail could not send the verification code.',
            'EMAIL_DELIVERY_FAILED',
            error,
        );
    }
}

export async function sendPasswordResetEmail({ email, code }) {
    const transporter = await getTransporter();
    if (!transporter) {
        throw new EmailDeliveryError('Email delivery is not configured on the server.', 'EMAIL_NOT_CONFIGURED');
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: `${code} is your RESCUE APP password reset code`,
            text: `Your RESCUE APP password reset code is ${code}. It expires in 10 minutes. Do not share this code. If you did not request a password reset, ignore this email.`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#10243e">
                    <h2>Reset your RESCUE APP password</h2>
                    <p>Enter this code on the password reset screen:</p>
                    <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
                    <p>This code expires in 10 minutes. Do not share it with anyone.</p>
                    <p>If you did not request this change, you can ignore this email.</p>
                </div>`,
        });
    } catch (error) {
        throw new EmailDeliveryError('Could not send the password reset code.', 'EMAIL_DELIVERY_FAILED', error);
    }
}

export async function sendResponderRejectionEmail({ email, reason }) {
    const transporter = await getTransporter();
    if (!transporter) {
        throw new EmailDeliveryError('Email delivery is not configured on the server.', 'EMAIL_NOT_CONFIGURED');
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Update on your RESCUE APP responder application',
            text: `Your responder application was not approved. Reason: ${reason}\n\nYou may submit a new application with updated details. If you have questions, contact the rescue network administrator.`,
        });
    } catch (error) {
        throw new EmailDeliveryError('Could not send the responder decision email.', 'EMAIL_DELIVERY_FAILED', error);
    }
}
