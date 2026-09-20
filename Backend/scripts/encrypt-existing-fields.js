import prisma from '../config/db.js';
import { decryptPrivate, encryptPrivate, isEncryptedPrivate } from '../services/privateFields.js';

if (!process.env.FIELD_ENCRYPTION_KEY) {
    throw new Error('Set FIELD_ENCRYPTION_KEY before running this backfill.');
}

function encryptedValue(value, field) {
    if (value == null || value === '') return value;
    if (isEncryptedPrivate(value)) {
        decryptPrivate(value, field); // Fail on a wrong key before continuing.
        return value;
    }
    return encryptPrivate(value, field);
}

async function verifyExisting(model, fields) {
    let cursor;
    while (true) {
        const rows = await model.findMany({
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: 100,
            orderBy: { id: 'asc' },
            select: { id: true, ...Object.fromEntries(fields.map(([name]) => [name, true])) },
        });
        if (!rows.length) break;
        for (const row of rows) {
            for (const [name, field] of fields) {
                if (isEncryptedPrivate(row[name])) decryptPrivate(row[name], field);
            }
        }
        cursor = rows.at(-1).id;
    }
}

async function backfill(model, fields) {
    let cursor;
    let changed = 0;
    while (true) {
        const rows = await model.findMany({
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: 100,
            orderBy: { id: 'asc' },
            select: { id: true, ...Object.fromEntries(fields.map(([name]) => [name, true])) },
        });
        if (!rows.length) break;
        for (const row of rows) {
            const data = Object.fromEntries(fields.map(([name, field]) => [name, encryptedValue(row[name], field)]));
            if (fields.some(([name]) => data[name] !== row[name])) {
                await model.update({ where: { id: row.id }, data });
                changed += 1;
            }
        }
        cursor = rows.at(-1).id;
    }
    return changed;
}

try {
    const targets = [
        ['users', prisma.user, [['address', 'address'], ['phoneNum', 'phone']]],
        ['responder applications', prisma.responderApplication, [['address', 'address'], ['phoneNum', 'phone']]],
        ['emergency requests', prisma.emergencyRequest, [
            ['callbackPhone', 'phone'], ['description', 'incident'], ['landmark', 'incident'],
        ]],
        ['chat messages', prisma.chatMessage, [['body', 'chat']]],
    ];
    for (const [, model, fields] of targets) await verifyExisting(model, fields);
    const counts = [];
    for (const [name, model, fields] of targets) counts.push(`${name}=${await backfill(model, fields)}`);
    console.log(`Encrypted records: ${counts.join(', ')}.`);
} finally {
    await prisma.$disconnect();
}
