import swaggerJsdoc from 'swagger-jsdoc';
import path from 'node:path';

const description = `
## Authentication

Duckflix API uses cookie-based authentication with JWT access tokens.

### Flow
1. POST /auth/login — sets three cookies:
   - auth_token (HttpOnly) — short-lived JWT access token
   - refresh_token (HttpOnly, path restricted) — long-lived session token
   - csrf_token (readable by JS) — CSRF protection token
2. Include auth_token cookie on all authenticated requests (automatic in browsers)
3. When access token expires, call POST /auth/refresh to rotate both tokens
4. Refresh token rotation is implemented — reuse of an old token invalidates all sessions

### CSRF Protection
All non-GET requests require the X-CSRF-Token header matching the csrf_token cookie value.

### Bearer Token
Alternatively, pass the JWT as Authorization: Bearer <token> header (useful for API clients and testing).

### Roles
- admin — full access
- contributor — can upload and manage content
- watcher — read-only access
`;

export const swaggerDoc = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Duckflix API',
            version: '0.1.0',
            description,
        },
        servers: [{ url: '/v1' }],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'auth_token',
                },
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Alternative to cookie auth, useful for API clients',
                },
                csrfToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-CSRF-Token',
                    description: 'Required for all non-GET requests alongside cookieAuth',
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Not authenticated or token expired',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string', example: 'Unauthorized access' },
                                },
                            },
                        },
                    },
                },
                Forbidden: {
                    description: 'Insufficient permissions or email not verified',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string', example: 'Forbidden' },
                                },
                            },
                        },
                    },
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string', example: 'Not found' },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [{ cookieAuth: [], csrfToken: [] }],
    },
    apis: [path.resolve('./src/modules/**/*.openapi.ts'), path.resolve('./src/routes/**/*.ts'), path.resolve('./src/shared/swagger/*.ts')],
});
