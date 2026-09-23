import jwt from 'jsonwebtoken';

export const SESSION_IDLE_MS = 5 * 60 * 1000;

export function signSessionToken(user) {
    return jwt.sign(
        { id: user.id, sv: user.sessionVersion },
        process.env.JWT_SECRET,
        { expiresIn: '5m', algorithm: 'HS256' },
    );
}

export function verifySessionToken(token) {
    // maxAge also invalidates previously issued 30-day tokens after five minutes.
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], maxAge: '5m' });
}
