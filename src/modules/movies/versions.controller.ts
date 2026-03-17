import type { Request, Response } from 'express';
import * as VersionService from './services/versions.service';
import { catchAsync } from '../../shared/utils/catchAsync';
import { addVersionSchema, movieParamsSchema, movieVersionParamsSchema } from './validators/movies.validator';

export const getMany = catchAsync(async (req: Request, res: Response) => {
    const { id } = movieParamsSchema.parse(req.params);

    const versions = await VersionService.getAllMovieVersions(id);

    res.status(200).json({ status: 'success', data: { versions } });
});

export const addVersion = catchAsync(async (req: Request, res: Response) => {
    const { id } = movieParamsSchema.parse(req.params);
    const { height } = addVersionSchema.parse(req.body);

    await VersionService.addMovieVersion(id, height);

    res.status(201).json({ status: 'success' });
});

export const deleteVersion = catchAsync(async (req: Request, res: Response) => {
    const { id, versionId } = movieVersionParamsSchema.parse(req.params);

    await VersionService.deleteMovieVersion(id, versionId);

    res.status(204).json({ status: 'success' });
});
