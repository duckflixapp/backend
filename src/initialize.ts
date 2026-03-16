import { count } from 'drizzle-orm';
import { getTMDBGenres } from './modules/movies/providers/tmdb.provider';
import { db } from './shared/configs/db';
import { genres } from './shared/schema';
import { systemSettings } from './shared/services/system.service';
import { logger } from './shared/configs/logger';
import { checkHardwareDecoding } from './shared/video';

export const initalize = async () => {
    await systemSettings.update({}); // update with default settings

    // seed genres if needed
    const [totalGenres] = await db.select({ value: count(genres.id) }).from(genres);
    if (totalGenres?.value === 0) await seedGenres();

    // check for hardware decoding
    await checkHardwareDecoding();
    logger.info('System initialized successfully.');
};

const seedGenres = async () => {
    const data = await getTMDBGenres();
    const values = data.map((g) => ({ name: g }));
    await db.insert(genres).values(values);
};
