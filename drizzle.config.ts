import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });
config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isGenerateCommand = process.env.npm_lifecycle_event === 'db:generate';

if (!connectionString && !isGenerateCommand) {
  throw new Error('Missing DATABASE_URL or POSTGRES_URL. Run `vercel env pull .env.local --yes` or add DATABASE_URL locally.');
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString || 'postgres://placeholder:placeholder@localhost:5432/placeholder',
  },
});
