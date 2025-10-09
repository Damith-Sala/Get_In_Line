// Check if tables exist
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

console.log('🔍 Checking database tables...\n');

sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  ORDER BY table_name
`
  .then((result) => {
    console.log('✅ Tables found in database:');
    result.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (result.length === 0) {
      console.log('\n❌ No tables found! Need to run migrations.');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Error:', error.message);
    process.exit(1);
  });

