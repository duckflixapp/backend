import { AppError } from '../../shared/errors';

export class MovieNotCreatedError extends AppError {
    constructor() {
        super('Error while creating movie', 500);
    }
}

export class InvalidVideoFileError extends AppError {
    constructor() {
        super('The uploaded file is not a valid video or is corrupted.', 400);
    }
}

export class MovieVersionNotFoundError extends AppError {
    constructor() {
        super('The requested movie version was not found.', 404);
    }
}

export class VideoProcessingError extends AppError {
    constructor(detail?: string) {
        super(`Failed to process video: ${detail ?? 'Unknown error'}`, 500);
    }
}

export class MovieNotFoundError extends AppError {
    constructor() {
        super('Movie not found', 404);
    }
}
