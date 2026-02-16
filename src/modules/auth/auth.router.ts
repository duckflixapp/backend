import { Router } from 'express';
import * as AuthController from './auth.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';
import { limiterConfigs } from '../../shared/limiters';

const router = Router();

router.post(
    '/register',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 30 * 1000, // 20 per 30s
        limit: 20,
    }),
    AuthController.register
);
router.post(
    '/login',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 30 * 1000, // 20 per 30s
        limit: 20,
    }),
    AuthController.login
);
router.post(
    '/logout',
    rateLimit({
        ...limiterConfigs.defaults(),
        windowMs: 10 * 1000, // 10 per 10s
        limit: 10,
        keyGenerator: limiterConfigs.authenticatedKey,
    }),
    authenticate,
    AuthController.logout
);

export default router;
