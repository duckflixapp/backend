import { count } from 'drizzle-orm';
import { getTMDBGenres } from './modules/movies/providers/tmdb.provider';
import { db } from './shared/configs/db';
import { genres, users } from './shared/schema';
import { systemSettings } from './shared/services/system.service';
import { logger } from './shared/configs/logger';
import { checkHardwareDecoding } from './shared/video';
import { initializeWatcher } from './modules/movies/workflows/watcher.workflow';
import { fetchSystemUserId, setSystemUserId } from './shared/configs/system';

export const initalize = async () => {
    await systemSettings.update({}); // update with default settings

    // initialize system user
    const systemUserId = await initializeSystemUser();

    // seed genres if needed
    const [totalGenres] = await db.select({ value: count(genres.id) }).from(genres);
    if (totalGenres?.value === 0) await seedGenres();

    // check for hardware decoding
    await checkHardwareDecoding();

    // initialize watcher
    await initializeWatcher(systemUserId);
    logger.info('System initialized successfully.');
};

const initializeSystemUser = async () => {
    const systemUserId = await fetchSystemUserId();
    if (systemUserId) return systemUserId;

    const results = await db.insert(users).values({ name: 'system', email: 'system', password: 'system', system: true }).returning();
    if (!results[0]) throw new Error('Failed creating system user');

    setSystemUserId(results[0].id);
    return results[0].id;
};

const seedGenres = async () => {
    const data = await getTMDBGenres();
    const values = data.map((g) => ({ name: g }));
    await db.insert(genres).values(values);
};
