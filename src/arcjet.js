import arcjet from "@arcjet/node";
import { detectBot, slidingWindow, shield } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if (!arcjetKey) throw new Error('ARCJET_KEY is not defined');

export const httpArcjet = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode }),
        detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
        slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
    ]
});

export const wsArcjet = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode }),
        slidingWindow({ mode: arcjetMode, interval: '10s', max: 5})
    ]
});
export function securityMiddleware() {
    return async (req, res, next) => {
        if (!httpArcjet) return next();
        try {
            const decision = await httpArcjet.protect(req);
            if (decision.isDenied()) {
                // ✅ Fixed: use decision.reason.isRateLimit()
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: 'Too many requests' });
                } else {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }
        } catch (e) {
            console.error("Arcjet middleware error", e);
            return res.status(503).json({ error: 'Service unavailable' });
        }
        next();
    };
}