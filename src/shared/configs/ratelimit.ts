import { rateLimit } from 'elysia-rate-limit';

interface RateLimitOptions {
    max?: number;
    duration?: number;
    scoping?: 'global' | 'scoped';
}

export const createRateLimit = ({ max = 50, duration = 3000, scoping = 'scoped' }: RateLimitOptions = {}) => {
    return rateLimit({
        max,
        duration,
        scoping,
        generator: (request, server, { user }) => {
            if (user?.id) {
                console.log(user.id);
                return user.id;
            }

            const ip = server?.requestIP(request)?.address || request.headers.get('x-forwarded-for') || 'localhost';
            console.log(ip);
            return ip;
        },
        errorResponse: new Response(
            JSON.stringify({
                status: 'fail',
                message: 'Too many requests. Try again later',
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
    });
};
