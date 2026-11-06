// Basic production protections that don't need extra packages

// Safe default HTTP headers for every response
function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff'); // don't guess file types
    res.setHeader('X-Frame-Options', 'DENY'); // can't be put inside another site's iframe
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
}

/**
 * Limits how many requests one visitor (IP address) can make to a route in a time window.
 * Used on login / register so nobody can guess passwords by trying thousands of times.
 */
function rateLimit({ windowMs, max, message }) {
    const hits = new Map(); // ip -> { count, resetAt }

    // Forget old entries now and then so memory doesn't grow
    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
    }, windowMs);
    cleanup.unref();

    return function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const key = req.ip || 'unknown';
        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }
        entry.count++;
        if (entry.count > max) {
            res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
            return res.status(429).json({ message });
        }
        next();
    };
}

module.exports = { securityHeaders, rateLimit };
