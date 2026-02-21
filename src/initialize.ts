import { count } from 'drizzle-orm';
import { getTMDBGenres } from './modules/movies/providers/tmdb.provider';
import { db } from './shared/configs/db';
import { genres } from './shared/schema';
import { systemSettings } from './shared/services/system.service';

export const initalize = async () => {
    await systemSettings.update({}); // update with default settings

    const [totalGenres] = await db.select({ value: count(genres.id) }).from(genres);
    if (totalGenres?.value === 0) await seedGenres();
};

const seedGenres = async () => {
    const data = await getTMDBGenres();
    const values = data.map((g) => ({ name: g }));
    await db.insert(genres).values(values);
};
