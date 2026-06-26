import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';


const getConnectionString = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL or POSTGRES_URL. Add a Neon connection string to .env.local or Vercel env vars.');
  }

  return connectionString;
};

let cachedPool: Pool | null = null;



const createDb = () => {
  cachedPool ??= new Pool({ connectionString: getConnectionString() });
  return drizzle(cachedPool, { schema });
};

let cachedDb: ReturnType<typeof createDb> | null = null;

export const getDb = () => {
  cachedDb ??= createDb();
  return cachedDb;
};
