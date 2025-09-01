const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking database tables...');
  
  try {
    // Check if profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table exists');
    }
    
    // Check if vendor_stores table exists
    const { data: stores, error: storesError } = await supabase
      .from('vendor_stores')
      .select('*')
      .limit(1);
    
    if (storesError) {
      console.log('❌ Vendor_stores table error:', storesError.message);
    } else {
      console.log('✅ Vendor_stores table exists');
    }
    
    // List all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.log('❌ Error listing users:', usersError.message);
    } else {
      console.log(`👥 Found ${users.users.length} users`);
      users.users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      });
    }
    
    // Check profiles for existing users
    if (users && users.users.length > 0) {
      const userIds = users.users.map(u => u.id);
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (userProfilesError) {
        console.log('❌ Error checking user profiles:', userProfilesError.message);
      } else {
        console.log(`📋 Found ${userProfiles.length} profiles for ${users.users.length} users`);
        userProfiles.forEach(profile => {
          console.log(`  - ${profile.email} (Role: ${profile.role}, Status: ${profile.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Database check failed:', error.message);
  }
}

checkDatabase();
