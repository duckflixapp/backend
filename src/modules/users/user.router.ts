import { Router } from 'express';
import * as UsersController from './user.controller';
import rateLimit from 'express-rate-limit';
import { limiterConfigs } from '../../shared/limiters';

const router = Router();

router.get(
    '/@me',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    UsersController.getMe
);

router.get(
    '/@me/notifications',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    UsersController.getUserNotifications
);

router.patch(
    '/@me/notifications/mark',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 45 per 3s
        limit: 45,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    UsersController.markUserNotifications
);

router.delete(
    '/@me/notifications',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 3 * 1000, // 15 per 3s
        limit: 15,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    UsersController.clearUserNotifications
);

export default router;
