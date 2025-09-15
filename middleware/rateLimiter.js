import rateLimit from "express-rate-limit";

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, 
    message: { error: "Too many requests, slow down." },
    standardHeaders: true,
    legacyHeaders: false, 
    handler: (req, res) => {
        console.log("Rate limit triggered for IP:", req.ip);
        res.status(429).json({ error: "Too many requests, slow down." });
    },
});

export default rateLimiter;
