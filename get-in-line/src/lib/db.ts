import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/drizzle/schema';

// Check if the environment variables are set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL client
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

// Create drizzle database instance
export const db = drizzle(client, { schema });