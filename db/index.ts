import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let cachedSql: ReturnType<typeof neon> | null = null;

const getConnectionString = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL or POSTGRES_URL. Add a Neon connection string to .env.local or Vercel env vars.');
  }

  return connectionString;
};

export const getSql = () => {
  cachedSql ??= neon(getConnectionString());
  return cachedSql;
};

const createDb = () => drizzle(getSql(), { schema });
let cachedDb: ReturnType<typeof createDb> | null = null;

export const getDb = () => {
  cachedDb ??= createDb();
  return cachedDb;
};
