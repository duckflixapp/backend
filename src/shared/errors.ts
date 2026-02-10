import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public override message: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const globalErrorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation error',
            details: err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.statusCode < 500 ? 'fail' : 'error',
            message: err.message,
        });
    }
    console.error('ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
};
