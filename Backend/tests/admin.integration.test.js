import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import adminRoutes from '../routes/admin.js';
import authRoutes from '../routes/auth.js';

test('admin can block and unblock a user with an audit trail', async () => {
    const unique = randomBytes(8).toString('hex');
    let admin;
    let citizen;
    let server;

    try {
        admin = await prisma.user.create({
            data: {
                name: 'Admin Test', email: `admin-${unique}@example.invalid`, role: 'admin',
                address: 'Test address', phoneNum: '', password: 'test-only', emailVerifiedAt: new Date(),
            },
        });
        citizen = await prisma.user.create({
            data: {
                name: 'Citizen Test', email: `citizen-${unique}@example.invalid`, role: 'citizen',
                address: 'Test address', phoneNum: '', password: 'test-only', emailVerifiedAt: new Date(),
            },
        });

        const app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api/admin', adminRoutes);
        app.use('/api/auth', authRoutes);
        server = await new Promise((resolve) => {
            const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        });
        const base = `http://127.0.0.1:${server.address().port}`;
        const adminToken = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const citizenToken = jwt.sign({ id: citizen.id }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const request = (path, token, options = {}) => fetch(`${base}${path}`, {
            ...options,
            headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
        });

        assert.equal((await request('/api/admin/overview', citizenToken)).status, 403);
        assert.equal((await request('/api/admin/overview', adminToken)).status, 200);
        for (const period of ['day', 'week', 'month', 'year']) {
            const response = await request(`/api/admin/analytics?period=${period}`, adminToken);
            assert.equal(response.status, 200);
            const analytics = await response.json();
            assert.equal(analytics.period, period);
            assert.ok(analytics.buckets.length > 0);
        }

        const blocked = await request(`/api/admin/users/${citizen.id}/block`, adminToken, {
            method: 'PATCH', body: JSON.stringify({ blocked: true, reason: 'Integration test account' }),
        });
        assert.equal(blocked.status, 200);
        assert.equal((await request('/api/auth/me', citizenToken)).status, 403);
        const logs = await (await request('/api/admin/audit-log', adminToken)).json();
        assert.ok(logs.entries.some((entry) => entry.targetUser.id === citizen.id && entry.action === 'USER_BLOCKED'));

        const unblocked = await request(`/api/admin/users/${citizen.id}/block`, adminToken, {
            method: 'PATCH', body: JSON.stringify({ blocked: false }),
        });
        assert.equal(unblocked.status, 200);
        assert.equal((await request('/api/auth/me', citizenToken)).status, 200);
    } finally {
        if (server) await new Promise((resolve) => server.close(resolve));
        if (admin || citizen) {
            await prisma.adminAuditLog.deleteMany({ where: { OR: [
                ...(admin ? [{ actorId: admin.id }] : []),
                ...(citizen ? [{ targetUserId: citizen.id }] : []),
            ] } });
            await prisma.user.deleteMany({ where: { id: { in: [admin?.id, citizen?.id].filter(Boolean) } } });
        }
        await prisma.$disconnect();
    }
});
