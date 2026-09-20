import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import net from 'node:net';
import { test } from 'node:test';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import authRoutes from '../routes/auth.js';
import adminRoutes from '../routes/admin.js';

async function startMailServer() {
    const messages = [];
    const server = net.createServer((socket) => {
        let input = '';
        let collecting = false;
        let message = '';
        socket.write('220 local test mail server\r\n');
        socket.on('data', (chunk) => {
            input += chunk.toString('utf8');
            let end;
            while ((end = input.indexOf('\r\n')) !== -1) {
                const line = input.slice(0, end);
                input = input.slice(end + 2);
                if (collecting) {
                    if (line === '.') {
                        collecting = false;
                        messages.push(message);
                        socket.write('250 message accepted\r\n');
                    } else {
                        message += `${line}\n`;
                    }
                } else if (/^EHLO|^HELO/i.test(line)) {
                    socket.write('250-localhost\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n');
                } else if (/^AUTH/i.test(line)) {
                    socket.write('235 authenticated\r\n');
                } else if (/^DATA$/i.test(line)) {
                    collecting = true;
                    message = '';
                    socket.write('354 send message\r\n');
                } else if (/^QUIT$/i.test(line)) {
                    socket.end('221 goodbye\r\n');
                } else {
                    socket.write('250 OK\r\n');
                }
            }
        });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    return { server, messages, port: server.address().port };
}

test('responder account is created only after admin approval and email verification', async () => {
    const unique = randomBytes(8).toString('hex');
    const email = `responder-${unique}@example.invalid`;
    const rejectedEmail = `rejected-${unique}@example.invalid`;
    const smtpSettings = Object.fromEntries(['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS']
        .map((key) => [key, process.env[key]]));
    let admin;
    let appServer;
    let mailServer;

    try {
        mailServer = await startMailServer();
        Object.assign(process.env, {
            SMTP_HOST: '127.0.0.1', SMTP_PORT: String(mailServer.port), SMTP_SECURE: 'false',
            SMTP_USER: 'test@example.invalid', SMTP_PASS: 'test-only',
        });
        admin = await prisma.user.create({
            data: {
                name: 'Approval Admin', email: `approval-admin-${unique}@example.invalid`,
                role: 'admin', address: 'Test address', phoneNum: '', password: 'test-only',
                emailVerifiedAt: new Date(),
            },
        });
        const app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api/auth', authRoutes);
        app.use('/api/admin', adminRoutes);
        app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }));
        appServer = await new Promise((resolve) => {
            const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        });
        const base = `http://127.0.0.1:${appServer.address().port}`;
        const adminToken = jwt.sign({ id: admin.id, sv: 0 }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const post = (path, body, token) => fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(body),
        });
        const details = {
            name: 'Responder Test', address: 'Test address', phone_num: '09123456789',
            email, role: 'respondent', responder_unit: 'HEALTH_AMBULANCE', password: 'TestPassword123',
        };

        const registered = await post('/api/auth/register', details);
        assert.equal(registered.status, 201);
        assert.equal((await registered.json()).pendingApproval, true);
        assert.equal(await prisma.user.findUnique({ where: { email } }), null);
        assert.equal((await post('/api/auth/login', { email, password: details.password })).status, 401);
        const application = await prisma.responderApplication.findUnique({ where: { email } });
        assert.equal(application.status, 'PENDING');
        assert.ok(application.passwordHash.startsWith('$2'));

        const queue = await fetch(`${base}/api/admin/responder-applications`, { headers: { Authorization: `Bearer ${adminToken}` } });
        assert.equal(queue.status, 200);
        assert.ok((await queue.json()).applications.some((entry) => entry.id === application.id));
        const approved = await post(`/api/admin/responder-applications/${application.id}/approve`, {}, adminToken);
        assert.equal(approved.status, 200);
        assert.equal((await approved.json()).emailSent, true);
        const created = await prisma.user.findUnique({ where: { email } });
        assert.equal(created.role, 'respondent');
        assert.equal(created.responderUnit, 'HEALTH_AMBULANCE');
        assert.equal(created.emailVerifiedAt, null);
        assert.equal((await prisma.responderApplication.findUnique({ where: { email } })).passwordHash, null);
        assert.equal((await post('/api/auth/login', { email, password: details.password })).status, 403);
        assert.equal(mailServer.messages.length, 1);
        const code = mailServer.messages[0].match(/\b\d{6}\b/)?.[0];
        assert.match(code || '', /^\d{6}$/);
        assert.equal((await post('/api/auth/verify-email', { email, code })).status, 200);
        const signedIn = await post('/api/auth/login', { email, password: details.password });
        assert.equal(signedIn.status, 200);
        const responderToken = (await signedIn.json()).token;
        assert.equal((await fetch(`${base}/api/admin/responder-applications`, {
            headers: { Authorization: `Bearer ${responderToken}` },
        })).status, 403);
        assert.equal((await post(`/api/admin/responder-applications/${application.id}/approve`, {}, adminToken)).status, 409);

        const rejectedRegistration = await post('/api/auth/register', { ...details, email: rejectedEmail });
        assert.equal(rejectedRegistration.status, 201);
        const rejectedApplication = await prisma.responderApplication.findUnique({ where: { email: rejectedEmail } });
        assert.equal((await post(`/api/admin/responder-applications/${rejectedApplication.id}/reject`, { reason: 'No valid unit assignment' }, adminToken)).status, 200);
        assert.equal(mailServer.messages.length, 2);
        assert.equal(await prisma.user.findUnique({ where: { email: rejectedEmail } }), null);
        assert.equal((await prisma.responderApplication.findUnique({ where: { email: rejectedEmail } })).passwordHash, null);
        assert.equal((await post('/api/auth/register', { ...details, email: rejectedEmail })).status, 201);
    } finally {
        if (appServer) await new Promise((resolve) => appServer.close(resolve));
        if (mailServer) await new Promise((resolve) => mailServer.server.close(resolve));
        for (const [key, value] of Object.entries(smtpSettings)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
        await prisma.responderApplication.deleteMany({ where: { email: { in: [email, rejectedEmail] } } });
        const users = await prisma.user.findMany({ where: { email: { in: [email, admin?.email].filter(Boolean) } }, select: { id: true } });
        await prisma.activityLog.deleteMany({ where: { actorId: { in: users.map((user) => user.id) } } });
        await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
        await prisma.$disconnect();
    }
});
