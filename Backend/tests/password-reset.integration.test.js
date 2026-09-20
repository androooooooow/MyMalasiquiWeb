import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import authRoutes from '../routes/auth.js';

test('password reset consumes the code and invalidates older sessions', async () => {
    const unique = crypto.randomBytes(8).toString('hex');
    const email = `reset-${unique}@example.invalid`;
    const code = '123456';
    let user;
    let server;

    try {
        user = await prisma.user.create({
            data: {
                name: 'Reset Test', email, role: 'citizen', address: 'Test address', phoneNum: '',
                password: await bcrypt.hash('OldPassword123', 10), emailVerifiedAt: new Date(),
                passwordResetToken: crypto.createHmac('sha256', process.env.JWT_SECRET)
                    .update(`password-reset:${email}:${code}`).digest('hex'),
                passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
        const staleToken = jwt.sign({ id: user.id, sv: 0 }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api/auth', authRoutes);
        server = await new Promise((resolve) => {
            const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        });
        const base = `http://127.0.0.1:${server.address().port}`;
        const post = (path, body) => fetch(`${base}${path}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });

        const bad = await post('/api/auth/reset-password', { email, code: '000000', newPassword: 'NewPassword123' });
        assert.equal(bad.status, 400);
        assert.equal((await prisma.user.findUnique({ where: { id: user.id } })).passwordResetAttempts, 1);

        const reset = await post('/api/auth/reset-password', { email, code, newPassword: 'NewPassword123' });
        assert.equal(reset.status, 200);
        const changed = await prisma.user.findUnique({ where: { id: user.id } });
        assert.equal(changed.passwordResetToken, null);
        assert.equal(changed.sessionVersion, 1);
        assert.equal(await bcrypt.compare('NewPassword123', changed.password), true);
        assert.equal(await bcrypt.compare('OldPassword123', changed.password), false);
        assert.equal((await post('/api/auth/reset-password', { email, code, newPassword: 'OtherPassword123' })).status, 400);
        assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${staleToken}` } })).status, 401);
        assert.equal((await post('/api/auth/login', { email, password: 'OldPassword123' })).status, 401);
        assert.equal((await post('/api/auth/login', { email, password: 'NewPassword123' })).status, 200);
        const events = await prisma.activityLog.findMany({ where: { actorId: user.id, action: 'PASSWORD_RESET_COMPLETED' } });
        assert.equal(events.length, 1);
    } finally {
        if (server) await new Promise((resolve) => server.close(resolve));
        if (user) {
            await prisma.activityLog.deleteMany({ where: { actorId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
        await prisma.$disconnect();
    }
});
