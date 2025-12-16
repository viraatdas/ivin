// Quick migration script - run with: node run-migration.mjs
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test if columns exist by trying to select them
async function checkAndMigrate() {
  console.log('Checking database schema...');
  
  // Try to query with the new columns
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, entry_type, chat_history')
    .limit(1);
  
  if (error && error.message.includes('column')) {
    console.log('New columns not found. Please run this SQL in Supabase SQL Editor:');
    console.log(`
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'regular';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS chat_history JSONB;
CREATE INDEX IF NOT EXISTS idx_entries_entry_type ON journal_entries(entry_type);
    `);
    process.exit(1);
  } else if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Schema is up to date! Columns entry_type and chat_history exist.');
    if (data && data.length > 0) {
      console.log('Sample entry:', data[0]);
    }
  }
}

checkAndMigrate();
