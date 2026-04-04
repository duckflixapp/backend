import { limiterConfigs } from '@shared/limiters';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as SubtitlesController from './subtitles.controller';
import { subtitleUpload } from '@shared/configs/multer.config';

const router = Router({ mergeParams: true });

router.post(
    '/',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 15 per 2s
        limit: 15,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    subtitleUpload.single('subtitle'),
    SubtitlesController.uploadSubtitle
);

router.delete(
    '/:subtitleId',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 2 * 1000, // 15 per 2s
        limit: 15,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    SubtitlesController.deleteSubtitle
);
export default router;
