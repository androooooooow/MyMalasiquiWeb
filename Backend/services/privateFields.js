import crypto from 'node:crypto';

const PREFIX = 'enc:v1:';

function encryptionKey() {
    const configured = process.env.FIELD_ENCRYPTION_KEY;
    if (!configured) return null;
    const key = Buffer.from(configured, 'base64');
    if (key.length !== 32 || key.toString('base64') !== configured) {
        throw new Error('FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
    }
    return key;
}

export function assertProductionEncryption() {
    if (process.env.NODE_ENV === 'production' && !encryptionKey()) {
        throw new Error('FIELD_ENCRYPTION_KEY is required in production.');
    }
}

export function encryptPrivate(value, field) {
    if (value == null || value === '') return value;
    const key = encryptionKey();
    if (!key) return value;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(field));
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${PREFIX}${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptPrivate(value, field) {
    if (value == null || !value.startsWith(PREFIX)) return value;
    const key = encryptionKey();
    if (!key) throw new Error('FIELD_ENCRYPTION_KEY is required to read encrypted data.');
    const parts = value.slice(PREFIX.length).split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted field.');
    const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, 'base64url'));
    if (iv.length !== 12 || tag.length !== 16) throw new Error('Invalid encrypted field.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(field));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function isEncryptedPrivate(value) {
    return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptUserContact({ address, phoneNum }) {
    return {
        address: encryptPrivate(address, 'address'),
        phoneNum: encryptPrivate(phoneNum, 'phone'),
    };
}

export function decryptUserContact(user) {
    if (!user) return user;
    return {
        ...user,
        address: decryptPrivate(user.address, 'address'),
        phoneNum: decryptPrivate(user.phoneNum, 'phone'),
    };
}

export function decryptEmergencyContact(emergency) {
    if (!emergency) return emergency;
    return {
        ...emergency,
        callbackPhone: decryptPrivate(emergency.callbackPhone, 'phone'),
        description: decryptPrivate(emergency.description, 'incident'),
        landmark: decryptPrivate(emergency.landmark, 'incident'),
        citizen: decryptUserContact(emergency.citizen),
        assignedResponder: decryptUserContact(emergency.assignedResponder),
    };
}

export function decryptChatMessage(message) {
    if (!message) return message;
    return { ...message, body: decryptPrivate(message.body, 'chat') };
}
