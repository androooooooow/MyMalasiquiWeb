import express from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { allowRoles, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const units = ['HEALTH_AMBULANCE', 'PNP_POLICE', 'BFP_FIRE', 'MDRRMO'];
const clients = new Set();
const conversationSelect = {
    id: true,
    citizenId: true,
    responderUnit: true,
    createdAt: true,
    updatedAt: true,
    citizen: { select: { id: true, name: true } },
    messages: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true },
    },
};
const messageSelect = {
    id: true,
    conversationId: true,
    senderId: true,
    body: true,
    createdAt: true,
    sender: { select: { id: true, name: true, role: true, responderUnit: true } },
};

function accessFilter(user) {
    if (user.role === 'citizen') return { citizenId: user.id };
    if (user.role === 'respondent' && user.responder_unit) {
        return { responderUnit: user.responder_unit };
    }
    return null;
}

async function accessibleConversation(id, user) {
    const access = accessFilter(user);
    if (!access) return null;
    return prisma.chatConversation.findFirst({ where: { id, ...access }, select: { id: true, citizenId: true, responderUnit: true } });
}

function notifyConversation(conversation) {
    const payload = `event: refresh\ndata: ${JSON.stringify({ conversationId: conversation.id })}\n\n`;
    for (const client of clients) {
        if (client.userId === conversation.citizenId ||
            (client.role === 'respondent' && client.responderUnit === conversation.responderUnit)) {
            try {
                client.response.write(payload);
            } catch {
                clients.delete(client);
            }
        }
    }
}

router.use(protect, allowRoles('citizen', 'respondent'));

router.get('/stream', (req, res) => {
    if (!accessFilter(req.user)) return res.status(403).json({ message: 'A responder unit is required for chat.' });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('event: ready\ndata: {}\n\n');

    const client = {
        userId: req.user.id,
        role: req.user.role,
        responderUnit: req.user.responder_unit,
        response: res,
    };
    clients.add(client);
    const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 25000);
    req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(client);
    });
});

router.get('/conversations', async (req, res, next) => {
    try {
        const access = accessFilter(req.user);
        if (!access) return res.status(403).json({ message: 'A responder unit is required for chat.' });
        const conversations = await prisma.chatConversation.findMany({
            where: access,
            select: conversationSelect,
            orderBy: { updatedAt: 'desc' },
            take: 100,
        });
        return res.json({ conversations: conversations.map(({ messages, ...conversation }) => ({
            ...conversation,
            lastMessage: messages[0] || null,
        })) });
    } catch (error) {
        next(error);
    }
});

router.post('/conversations', allowRoles('citizen'),
    validate(z.object({ responderUnit: z.enum(units) }).strict()), async (req, res, next) => {
        try {
            const conversation = await prisma.chatConversation.upsert({
                where: { citizenId_responderUnit: { citizenId: req.user.id, responderUnit: req.validatedBody.responderUnit } },
                update: {},
                create: { citizenId: req.user.id, responderUnit: req.validatedBody.responderUnit },
                select: conversationSelect,
            });
            notifyConversation(conversation);
            const { messages, ...details } = conversation;
            return res.status(201).json({ conversation: { ...details, lastMessage: messages[0] || null } });
        } catch (error) {
            next(error);
        }
    });

router.get('/conversations/:id/messages', async (req, res, next) => {
    try {
        const conversation = await accessibleConversation(req.params.id, req.user);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

        const messages = await prisma.chatMessage.findMany({
            where: { conversationId: conversation.id },
            select: messageSelect,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 100,
        });
        return res.json({ messages: messages.reverse() });
    } catch (error) {
        next(error);
    }
});

router.post('/conversations/:id/messages',
    validate(z.object({ body: z.string().trim().min(1, 'Enter a message.').max(2000, 'Message is too long.')
        .regex(/^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/, 'Message contains unsupported characters') }).strict()),
    async (req, res, next) => {
        try {
            const conversation = await accessibleConversation(req.params.id, req.user);
            if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

            const message = await prisma.$transaction(async (tx) => {
                const created = await tx.chatMessage.create({
                    data: { conversationId: conversation.id, senderId: req.user.id, body: req.validatedBody.body },
                    select: messageSelect,
                });
                await tx.chatConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
                return created;
            });
            notifyConversation(conversation);
            return res.status(201).json({ message });
        } catch (error) {
            next(error);
        }
    });

export default router;
