import type { GenreDTO } from '@duckflix/shared';
import { genres } from '../../../shared/schema';
import { db } from '../../../shared/db';
import { toGenreDTO } from '../../../shared/mappers/movies.mapper';
import { inArray } from 'drizzle-orm';

export const getGenres = async (): Promise<GenreDTO[]> => {
    const results = await db.select().from(genres).orderBy(genres.name);
    return results.map(toGenreDTO);
};

export const getGenreIds = async (genreNames: string[]): Promise<string[]> => {
    const results = await db.select({ id: genres.id }).from(genres).where(inArray(genres.name, genreNames)).orderBy(genres.name);
    return results.map(({ id }) => id);
};
