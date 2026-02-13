import type { Request, Response } from 'express';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { movieVersions } from '../../shared/schema';
import { catchAsync } from '../../shared/utils/catchAsync';
import { AppError } from '../../shared/errors';
import { streamParamsSchema } from './media.validator';
import { paths } from '../../shared/configs/path.config';

export const stream = catchAsync(async (req: Request, res: Response) => {
    const { versionId } = streamParamsSchema.parse(req.params);

    const version = await db.query.movieVersions.findFirst({ where: eq(movieVersions.id, versionId) });

    if (!version) {
        throw new AppError('Video version not found', 404);
    }

    const absolutePath = path.resolve(paths.storage, version.storageKey);

    res.sendFile(absolutePath, (err) => {
        if (err) {
            if (res.headersSent) return;
            console.error('Streaming error:', err);
        }
    });
});
