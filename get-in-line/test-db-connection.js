// Test database connection
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

console.log('🔍 Testing database connection...\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND');
console.log('Hostname:', process.env.DATABASE_URL?.match(/@([^:]+)/)?.[1] || 'N/A');
console.log('\n⏳ Attempting to connect...\n');

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  connect_timeout: 10,
  prepare: false,
});

sql`SELECT NOW()`
  .then((result) => {
    console.log('✅ SUCCESS! Database is connected!');
    console.log('Server time:', result[0].now);
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ CONNECTION FAILED!');
    console.log('\nError details:');
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Check if your Supabase project is ACTIVE (not paused)');
    console.log('2. Verify DATABASE_URL in .env.local is correct');
    console.log('3. Make sure your password is correct');
    console.log('4. Visit: https://app.supabase.com/ to check project status');
    process.exit(1);
  });

