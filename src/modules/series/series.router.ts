import { limiterConfigs } from '@shared/limiters';
import { hasRole } from '@shared/middlewares/auth.middleware';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

// ------------------------------------
// Series
// ------------------------------------
router.get(
    '/:seriesId',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    })
);

router.delete(
    '/:seriesId',
    hasRole('contributor'),
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    })
);

// ------------------------------------
// Seasons
// ------------------------------------
router.get(
    '/:seriesId/:seasonId',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    })
);

router.delete(
    '/:seriesId/:seasonId',
    hasRole('contributor'),
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    })
);

// ------------------------------------
// Episodes
// ------------------------------------
router.get(
    '/:seriesId/:seasonId/:episodeId',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    })
);
