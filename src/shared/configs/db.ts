import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';
import { env } from '../../env';

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const db = drizzle(pool, { schema });
