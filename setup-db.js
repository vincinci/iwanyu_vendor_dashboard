const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createProfilesTable() {
  console.log('🏗️  Creating profiles table and essential schema...');
  
  try {
    // Create profiles table
    const createProfilesSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL CHECK (role IN ('vendor', 'admin')) DEFAULT 'vendor',
        status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'pending')) DEFAULT 'pending',
        avatar_url TEXT,
        phone TEXT,
        address JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Creating profiles table...');
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createProfilesSQL 
    });
    
    if (createError) {
      console.log('❌ Error creating table:', createError.message);
      console.log('');
      console.log('🔗 Manual setup required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql');
      console.log('2. Run the combined_migrations.sql file that was created');
      console.log('');
      return false;
    }
    
    console.log('✅ Profiles table created');
    
    // Enable RLS
    const enableRLSSQL = `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`;
    await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    
    // Create policies
    const policiesSQL = `
      CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles 
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON public.profiles 
        FOR INSERT WITH CHECK (auth.uid() = id);
      
      CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles 
        FOR UPDATE USING (auth.uid() = id);
    `;
    
    await supabase.rpc('exec_sql', { sql: policiesSQL });
    console.log('✅ RLS policies created');
    
    return true;
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    return false;
  }
}

async function createUserProfiles() {
  console.log('👤 Creating profiles for existing users...');
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error listing users:', usersError.message);
      return;
    }
    
    console.log(`Found ${users.users.length} users`);
    
    for (const user of users.users) {
      console.log(`Creating profile for ${user.email}...`);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          role: 'vendor',
          status: 'active'
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        console.error(`❌ Error creating profile for ${user.email}:`, error.message);
      } else {
        console.log(`✅ Profile created for ${user.email}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error creating user profiles:', error.message);
  }
}

async function main() {
  const tableCreated = await createProfilesTable();
  if (tableCreated) {
    await createUserProfiles();
  }
  
  // Verify the setup
  console.log('\n🔍 Verifying setup...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('❌ Verification failed:', error.message);
  } else {
    console.log(`✅ Found ${profiles.length} profiles in database`);
    profiles.forEach(profile => {
      console.log(`  - ${profile.email} (Role: ${profile.role}, Status: ${profile.status})`);
    });
  }
}

main();
