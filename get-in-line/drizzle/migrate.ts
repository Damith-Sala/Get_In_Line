import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const connection = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Running migrations...');
  
  await migrate(db, { migrationsFolder: 'drizzle' });
  
  console.log('✅ Migrations completed!');
  
  await connection.end();
  process.exit(0);
};

runMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});