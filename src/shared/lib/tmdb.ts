import axios from 'axios';
import type { TMDBMovieDetails } from '../types/tmdb';
import { AppError } from '../errors';

export class TMDBMovieDetailsError extends AppError {
    constructor(err: unknown) {
        super('Could not fetch TMDB API', { statusCode: 500, cause: err });
    }
}

export class TMDBClient {
    private readonly api;
    constructor(options: { baseUrl: string; apiKey: string }) {
        this.api = axios.create({
            baseURL: options?.baseUrl,
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${options.apiKey}`,
            },
        });
    }

    public async getMovieDetails(movieId: string) {
        const { data } = await this.api.get<TMDBMovieDetails>(`/movie/${movieId}`).catch((err) => {
            throw new TMDBMovieDetailsError(err);
        });
        return data;
    }
}
