import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import citizenRoutes from '../routes/citizenReq.js';
import chatRoutes from '../routes/chats.js';
import { encryptUserContact, isEncryptedPrivate } from '../services/privateFields.js';

test('emergency and chat PII are encrypted in storage and readable to the owning citizen', async () => {
    const previousKey = process.env.FIELD_ENCRYPTION_KEY;
    process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    const unique = randomBytes(8).toString('hex');
    let citizen;
    let server;

    try {
        citizen = await prisma.user.create({ data: {
            name: 'Encrypted Test Citizen', email: `encrypted-${unique}@example.invalid`,
            role: 'citizen', password: 'test-only', emailVerifiedAt: new Date(),
            ...encryptUserContact({ address: 'Malasiqui test address', phoneNum: '09123456789' }),
        } });
        const app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api/emergencies', citizenRoutes);
        app.use('/api/chats', chatRoutes);
        app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }));
        server = await new Promise((resolve) => {
            const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        });
        const base = `http://127.0.0.1:${server.address().port}`;
        const token = jwt.sign({ id: citizen.id, sv: 0 }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const post = async (path, body) => fetch(`${base}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const emergencyResponse = await post('/api/emergencies', {
            service: 'AMBULANCE', description: 'Patient needs urgent assistance',
            peopleAffected: '1', landmark: 'Near the market', callbackPhone: '09123456789',
            latitude: 15.9, longitude: 120.4, accuracyMeters: 25,
        });
        assert.equal(emergencyResponse.status, 201, await emergencyResponse.clone().text());
        const emergency = (await emergencyResponse.json()).emergency;
        assert.equal(emergency.description, 'Patient needs urgent assistance');
        assert.equal(emergency.citizen.address, 'Malasiqui test address');
        const storedEmergency = await prisma.emergencyRequest.findUnique({ where: { id: emergency.id } });
        assert.equal(isEncryptedPrivate(storedEmergency.description), true);
        assert.equal(isEncryptedPrivate(storedEmergency.landmark), true);
        assert.equal(isEncryptedPrivate(storedEmergency.callbackPhone), true);

        const conversationResponse = await post('/api/chats/conversations', { responderUnit: 'HEALTH_AMBULANCE' });
        assert.equal(conversationResponse.status, 201, await conversationResponse.clone().text());
        const conversationId = (await conversationResponse.json()).conversation.id;
        const messageResponse = await post(`/api/chats/conversations/${conversationId}/messages`, { body: 'Please bring medical supplies.' });
        assert.equal(messageResponse.status, 201, await messageResponse.clone().text());
        assert.equal((await messageResponse.json()).message.body, 'Please bring medical supplies.');
        const storedMessage = await prisma.chatMessage.findFirst({ where: { conversationId } });
        assert.equal(isEncryptedPrivate(storedMessage.body), true);
        const listed = await fetch(`${base}/api/chats/conversations/${conversationId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        assert.equal(listed.status, 200);
        assert.equal((await listed.json()).messages[0].body, 'Please bring medical supplies.');
    } finally {
        if (server) await new Promise((resolve) => server.close(resolve));
        if (citizen) {
            await prisma.activityLog.deleteMany({ where: { actorId: citizen.id } });
            await prisma.chatConversation.deleteMany({ where: { citizenId: citizen.id } });
            await prisma.emergencyRequest.deleteMany({ where: { citizenId: citizen.id } });
            await prisma.user.delete({ where: { id: citizen.id } });
        }
        if (previousKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY;
        else process.env.FIELD_ENCRYPTION_KEY = previousKey;
        await prisma.$disconnect();
    }
});
