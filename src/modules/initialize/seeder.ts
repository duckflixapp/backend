import { count } from 'drizzle-orm';
import { db } from '../../shared/configs/db';
import { genres } from '../../shared/schema';
import { getTMDBGenres } from '../movies/providers/tmdb.provider';

const seedGenres = async () => {
    const data = await getTMDBGenres();
    const values = data.map((g) => ({ name: g }));
    await db.insert(genres).values(values);
};

export const seedDatabase = async () => {
    const [totalGenres] = await db.select({ value: count(genres.id) }).from(genres);
    if (totalGenres?.value === 0) await seedGenres();
};
