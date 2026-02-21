import { Router } from 'express';
import { db } from '../shared/configs/db';
import { sql } from 'drizzle-orm';
import rateLimit from 'express-rate-limit';
import { limiterConfigs } from '../shared/limiters';

const router = Router();

const healthLimiter = rateLimit({
    ...limiterConfigs.defaults(),
    windowMs: 60 * 1000, // 50 per 1m
    max: 50,
    message: 'Health check rate limit exceeded',
});

router.get('/', healthLimiter, async (_req, res) => {
    try {
        await db.execute(sql`SELECT 1`);

        res.status(200).json({
            status: 'healthy',
            uptime: Math.floor(process.uptime()) + 's',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '0.0.1',
        });
    } catch {
        res.status(503).json({
            status: 'unhealthy',
            reason: 'Database connection failed',
        });
    }
});

export default router;
