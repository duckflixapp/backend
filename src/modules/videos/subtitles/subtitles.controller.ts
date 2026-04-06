import { catchAsync } from '@shared/utils/catchAsync';
import type { Request, Response } from 'express';
import { importBodySchema, searchQuerySchema, subtitleParamsSchema, uploadBodySchema, videoParamsSchema } from './subtitles.validator';
import { deleteSubtitleById, importOpenSubtitles, saveSubtitle, searchOpenSubtitles } from './subtitles.service';
import { AppError } from '@shared/errors';

export const uploadSubtitle = catchAsync(async (req: Request, res: Response) => {
    const { videoId } = videoParamsSchema.parse(req.params);
    const { language } = uploadBodySchema.parse(req.body);
    const subtitleFile = req.file;

    if (!subtitleFile) throw new AppError('Please provide a valid subtitle file', { statusCode: 400 });

    const subtitle = await saveSubtitle({ videoId, tempPath: subtitleFile.path, originalName: subtitleFile.originalname, language });

    res.status(201).json({
        status: 'success',
        data: { subtitle },
    });
});

export const deleteSubtitle = catchAsync(async (req: Request, res: Response) => {
    const { videoId, subtitleId } = subtitleParamsSchema.parse(req.params);

    await deleteSubtitleById({ videoId, subtitleId });

    res.sendStatus(204);
});

export const searchSubtitles = catchAsync(async (req: Request, res: Response) => {
    const { videoId } = videoParamsSchema.parse(req.params);
    const { language } = searchQuerySchema.parse(req.query);

    const subtitles = await searchOpenSubtitles({ videoId, language });

    res.status(200).json({
        status: 'success',
        data: { subtitles },
    });
});

export const importSubtitles = catchAsync(async (req: Request, res: Response) => {
    const { videoId } = videoParamsSchema.parse(req.params);
    const { fileId } = importBodySchema.parse(req.body);

    const subtitle = await importOpenSubtitles({ videoId, fileId });

    res.status(201).json({
        status: 'success',
        data: { subtitle },
    });
});
