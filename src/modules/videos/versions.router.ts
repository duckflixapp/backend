import { limiterConfigs } from '@shared/limiters';
import rateLimit from 'express-rate-limit';
import * as VideoVersionsController from './versions.controller';
import { Router } from 'express';

const router = Router({ mergeParams: true });

router.get(
    '/',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 30 per 2s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoVersionsController.getMany
);

router.post(
    '/',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 30 per 2s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoVersionsController.addVersion
);

router.delete(
    '/:versionId',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 30 per 2s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoVersionsController.deleteVersion
);

export default router;
