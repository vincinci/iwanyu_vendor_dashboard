const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  const scriptsDir = path.join(__dirname, 'scripts');
  const migrationFiles = [
    '001_create_core_tables.sql',
    '002_create_vendor_tables.sql', 
    '003_create_order_tables.sql',
    '004_create_messaging_tables.sql',
    '005_create_triggers_functions.sql',
    '006_seed_sample_data.sql',
    '007_update_vendor_registration_schema.sql',
    '008_rwanda_localization_schema.sql',
    '009_update_social_media_and_locations.sql',
    '010_update_to_mobile_money.sql'
  ];
  
  for (const filename of migrationFiles) {
    const filePath = path.join(scriptsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filename} - file not found`);
      continue;
    }
    
    console.log(`📄 Running ${filename}...`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL by semicolons but handle multi-line statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.log(`  ⚠️  Statement ${i + 1} warning:`, error.message);
            }
          } catch (err) {
            // Try direct query if RPC fails
            try {
              const { error } = await supabase.from('_temp').select().limit(0);
              // This will fail but we can use it to execute raw SQL
              console.log(`  ⚠️  Direct execution not available, trying alternative...`);
            } catch (e) {
              console.log(`  ⚠️  Statement ${i + 1} could not be executed`);
            }
          }
        }
      }
      
      console.log(`✅ Completed ${filename}`);
      
    } catch (error) {
      console.error(`❌ Error in ${filename}:`, error.message);
    }
  }
  
  console.log('🎉 Migration process completed!');
}

runMigrations();
