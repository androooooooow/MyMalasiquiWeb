import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { SESSION_IDLE_MS, signSessionToken, verifySessionToken } from '../services/sessionToken.js';

test('sessions expire after five minutes, including old 30-day tokens', () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'session-test-secret';
    try {
        assert.equal(SESSION_IDLE_MS, 300000);
        const fresh = signSessionToken({ id: 7, sessionVersion: 2 });
        assert.equal(verifySessionToken(fresh).id, 7);
        assert.equal(jwt.decode(fresh).exp - jwt.decode(fresh).iat, 300);

        const oldIssuedAt = Math.floor(Date.now() / 1000) - 301;
        const oldThirtyDayToken = jwt.sign(
            { id: 7, sv: 2, iat: oldIssuedAt },
            process.env.JWT_SECRET,
            { expiresIn: '30d', algorithm: 'HS256' },
        );
        assert.throws(() => verifySessionToken(oldThirtyDayToken));
    } finally {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    }
});
