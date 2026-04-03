import { Router } from 'express';
import * as MediaController from './media.controller';
import * as LiveMediaController from './live.controller';
import { limiterConfigs } from '@shared/limiters';
import rateLimit from 'express-rate-limit';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { validateMediaSession } from './media.middleware';
import { liveMasterSchema } from './media.validator';

const router = Router();

const limiterStream = rateLimit({
    ...limiterConfigs.defaults(),
    windowMs: 1000, // 40 per 1s
    limit: 40, // because of seeking
    keyGenerator: limiterConfigs.authenticatedKey,
});

const limiterSubtitle = rateLimit({
    ...limiterConfigs.defaults(),
    windowMs: 1000, // 40 per 1s
    limit: 40, // because of seeking
    keyGenerator: limiterConfigs.authenticatedKey,
});

router.post('/session', authenticate(), MediaController.sessionCreate);

router.get('/stream/:versionId{/:file}', limiterStream, MediaController.stream);
router.get('/subtitle/:subtitleId', limiterSubtitle, MediaController.subtitle);

router.get(
    '/live/:videoId/master.m3u8',
    validateMediaSession((req) => liveMasterSchema.parse(req.params).videoId),
    LiveMediaController.getLiveMaster
);
router.get(
    '/live/:videoId/:height/index.m3u8',
    validateMediaSession((req) => liveMasterSchema.parse(req.params).videoId),
    LiveMediaController.getLiveManifest
);
router.get(
    '/live/:videoId/:height/:segmentName',
    validateMediaSession((req) => liveMasterSchema.parse(req.params).videoId),
    LiveMediaController.getLiveSegment
);

export default router;
