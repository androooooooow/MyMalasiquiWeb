import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { z } from 'zod';
import { requireTrustedBrowserOrigin, safeApiError } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { decryptPrivate, encryptPrivate, isEncryptedPrivate } from '../services/privateFields.js';

function response() {
    return {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
}

test('private fields round-trip, reject tampering, and read legacy plaintext', () => {
    const previous = process.env.FIELD_ENCRYPTION_KEY;
    process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    try {
        const ciphertext = encryptPrivate('Malasiqui, Pangasinan', 'address');
        assert.equal(isEncryptedPrivate(ciphertext), true);
        assert.notEqual(ciphertext, 'Malasiqui, Pangasinan');
        assert.equal(decryptPrivate(ciphertext, 'address'), 'Malasiqui, Pangasinan');
        assert.equal(decryptPrivate('Existing plaintext', 'address'), 'Existing plaintext');
        assert.throws(() => decryptPrivate(ciphertext, 'phone'));
        const parts = ciphertext.split(':');
        parts[3] = `${parts[3].startsWith('A') ? 'B' : 'A'}${parts[3].slice(1)}`;
        const tampered = parts.join(':');
        assert.throws(() => decryptPrivate(tampered, 'address'));
    } finally {
        if (previous === undefined) delete process.env.FIELD_ENCRYPTION_KEY;
        else process.env.FIELD_ENCRYPTION_KEY = previous;
    }
});

test('cookie mutations require a trusted browser origin, while native Bearer requests remain usable', () => {
    const guard = requireTrustedBrowserOrigin(new Set(['http://localhost:5173']));
    function request({ method = 'POST', origin, referer, cookie, authorization }) {
        const headers = { origin, referer, authorization };
        const req = { method, cookies: cookie ? { token: cookie } : {}, get: (name) => headers[name] };
        const res = response();
        let passed = false;
        guard(req, res, () => { passed = true; });
        return { passed, res };
    }

    assert.equal(request({ origin: 'http://localhost:5173', cookie: 'session' }).passed, true);
    assert.equal(request({ origin: 'https://attacker.example', cookie: 'session' }).res.statusCode, 403);
    assert.equal(request({ cookie: 'session' }).res.statusCode, 403);
    assert.equal(request({ referer: 'http://localhost:5173/citizen', cookie: 'session' }).passed, true);
    assert.equal(request({ authorization: 'Bearer native-token' }).passed, true);
    assert.equal(request({ method: 'GET', cookie: 'session' }).passed, true);
});

test('strict body validation rejects extra fields and safe errors do not leak internals', () => {
    const middleware = validate(z.object({ name: z.string().min(1) }).strict());
    const req = { body: { name: 'Citizen', role: 'admin' } };
    const res = response();
    middleware(req, res, () => assert.fail('Unexpected validation success'));
    assert.equal(res.statusCode, 400);

    const failure = response();
    const originalLog = console.error;
    console.error = () => {};
    try {
        safeApiError(new Error('database password=secret'), { method: 'GET', path: '/api/private' }, failure, () => {});
    } finally {
        console.error = originalLog;
    }
    assert.equal(failure.statusCode, 500);
    assert.doesNotMatch(JSON.stringify(failure.body), /secret|password/);
});
