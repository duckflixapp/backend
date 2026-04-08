import rateLimit from 'express-rate-limit';
import { videoUpload } from '@shared/configs/multer.config';
import { limiterConfigs } from '@shared/limiters';
import { hasRole } from '@shared/middlewares/auth.middleware';
import * as VideoController from './video.controller';
import { Router } from 'express';

import versionsRouter from './versions.router';
import subtitlesRouter from './subtitles/subtitles.router';

export const router = Router();

router.post(
    '/upload',
    hasRole('contributor'),
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 30 * 1000, // 20 per 30s
        limit: 20,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    videoUpload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'torrent', maxCount: 1 },
    ]),
    VideoController.upload
);

router.get(
    '/:id',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 30 per 2s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoController.getVideo
);

router.delete(
    '/:id',
    hasRole('contributor'),
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 30 per 2s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoController.deleteVideo
);

router.get(
    '/:id/progress',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 30 per 2s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoController.getVideoProgress
);

router.post(
    '/:id/progress',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 30 per 2s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoController.saveVideoProgress
);

router.get(
    '/:id/resolve',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 20 per 30s
        limit: 30,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    VideoController.resolveVideo
);

router.use('/:id/versions', hasRole('contributor'), versionsRouter);
router.use('/:videoId/subtitles', hasRole('contributor'), subtitlesRouter);

export default router;
