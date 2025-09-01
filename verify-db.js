const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Profiles table:', profilesError.message);
    } else {
      console.log(`✅ Profiles table: ${profiles.length} profiles found`);
      profiles.forEach(p => console.log(`  - ${p.email} (${p.role})`));
    }
    
    // Check vendor_stores table
    const { data: stores, error: storesError } = await supabase
      .from('vendor_stores')
      .select('*');
    
    if (storesError) {
      console.log('❌ Vendor stores table:', storesError.message);
    } else {
      console.log(`✅ Vendor stores table: ${stores.length} stores found`);
    }
    
    // Check products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.log('❌ Products table:', productsError.message);
    } else {
      console.log(`✅ Products table: ${products.length} products found`);
    }
    
    console.log('\n🎉 Database verification complete!');
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
  }
}

verifyDatabaseSetup();
