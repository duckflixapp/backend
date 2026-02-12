import type { Request, Response } from 'express';
import * as MoviesService from './movies.service';
import * as GenresService from './genres.service';
import { catchAsync } from '../../shared/utils/catchAsync';
import { AppError } from '../../shared/errors';
import { createMovieSchema, movieParamsSchema, movieQuerySchema } from './movies.validator';
import { handleWorkflowError } from './movies.handler';

export const upload = catchAsync(async (req: Request, res: Response) => {
    const validatedData = createMovieSchema.parse(req.body);
    const file = req.file;
    const magnet = validatedData.magnet;

    if (!file && !magnet) throw new AppError('Please provide either a video file or a magnet link', 400);

    const movie = await MoviesService.initiateUpload({ userId: req.userId!, ...validatedData });

    if (file)
        MoviesService.processMovieWorkflow({
            movieId: movie.id,
            tempPath: file.path,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
        }).catch((e) => handleWorkflowError(movie.id, e, 'movie'));
    else {
        MoviesService.processMagnetWorkflow({
            movieId: movie.id,
            magnet: magnet!,
        }).catch((e) => handleWorkflowError(movie.id, e, 'torrent'));
    }

    res.status(201).json({
        status: 'success',
        message: magnet ? 'Magnet download initiated.' : 'Video processing started.',
        data: { movie },
    });
});

export const getMany = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, search } = movieQuerySchema.parse(req.query);

    const paginatedResults = await MoviesService.getMovies(page, limit, search);

    res.status(200).json({
        status: 'success',
        ...paginatedResults,
    });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
    const { id } = movieParamsSchema.parse(req.params);
    const movieDto = await MoviesService.getMovieById(id);

    if (!movieDto) throw new AppError('Movie not found', 404);

    res.status(200).json({
        status: 'success',
        data: { movie: movieDto },
    });
});

export const getManyGenres = catchAsync(async (req: Request, res: Response) => {
    const genresDto = await GenresService.getGenres();

    res.status(200).json({
        status: 'success',
        data: { genres: genresDto },
    });
});
