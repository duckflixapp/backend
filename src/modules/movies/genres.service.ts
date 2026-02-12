import type { GenreDTO } from '@duckflix/shared';
import { db } from '../../shared/db';
import { genres } from '../../shared/schema';
import { toGenreDTO } from '../../shared/mappers/movies.mapper';

export const getGenres = async (): Promise<GenreDTO[]> => {
    const results = await db.select().from(genres).orderBy(genres.name);
    return results.map(toGenreDTO);
};
