const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireTrustedBrowserOrigin(allowedOrigins) {
    return (req, res, next) => {
        if (SAFE_METHODS.has(req.method)) return next();

        const origin = req.get('origin');
        if (origin) {
            if (allowedOrigins.has(origin)) return next();
            return res.status(403).json({ message: 'Request origin is not allowed.' });
        }

        // Native clients use Bearer tokens and may not send Origin. Browser
        // sessions use cookies; require a trusted Referer if Origin is absent.
        const bearer = req.get('authorization')?.startsWith('Bearer ');
        if (!bearer && req.cookies?.token) {
            try {
                if (allowedOrigins.has(new URL(req.get('referer')).origin)) return next();
            } catch {
                // Missing or malformed Referer is not sufficient for cookie auth.
            }
            return res.status(403).json({ message: 'Request origin is required.' });
        }
        return next();
    };
}

export function safeApiError(error, req, res, next) {
    if (res.headersSent) return next(error);
    const status = error?.status || error?.statusCode;
    const code = error?.code;
    console.error('[API error]', { method: req.method, path: req.path, name: error?.name, code });

    if (status === 413 || error?.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body is too large.' });
    }
    if (error instanceof SyntaxError && error?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON request body.' });
    }
    if (error?.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'Request origin is not allowed.' });
    }
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
