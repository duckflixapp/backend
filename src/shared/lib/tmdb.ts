import axios from 'axios';
import type { TMDBMovieDetails } from '../types/tmdb';
import { AppError } from '../errors';

const tmdb = axios.create({
    baseURL: 'https://api.themoviedb.org/3',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
});

export const getTmdbMovieDetails = async (id: string) => {
    const { data } = await tmdb.get<TMDBMovieDetails>(`/movie/${id}`).catch(() => {
        throw new AppError('Error while fetching TMDB', 500);
    });
    return data;
};
