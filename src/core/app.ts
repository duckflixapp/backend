import { Elysia } from 'elysia';
import { env } from '@core/env';
import { corsPlugin } from '@shared/configs/cors';
import { helmetPlugin } from '@shared/configs/helmet';
import { loggerPlugin } from '@shared/configs/httpLogger';
import { errorPlugin } from '@shared/errors';
import { v1 } from '../routes/v1';
import { openapi } from '@elysiajs/openapi';

const app = new Elysia().use(loggerPlugin).use(errorPlugin).use(corsPlugin).use(helmetPlugin).use(v1);

if (env.NODE_ENV !== 'production') {
    app.use(openapi({ specPath: '/openapi.json', path: '/swagger' }));
}

export { app };
