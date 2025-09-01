#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Hardcode the values for now
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('Key:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndFixDatabase() {
  console.log('🔍 Checking database schema...')

  try {
    // Check if vendor_stores table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'vendor_stores')

    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message)
    } else if (!tables || tables.length === 0) {
      console.log('❌ vendor_stores table does not exist')
      console.log('📝 Creating vendor_stores table...')
      
      // Create vendor_stores table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS public.vendor_stores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          store_name TEXT NOT NULL,
          store_description TEXT,
          business_license TEXT,
          tax_id TEXT,
          phone_number TEXT,
          email TEXT,
          address TEXT,
          city TEXT,
          state_province TEXT,
          postal_code TEXT,
          country TEXT DEFAULT 'Rwanda',
          facebook_url TEXT,
          instagram_url TEXT,
          tiktok_url TEXT,
          mobile_money_info JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          UNIQUE(vendor_id)
        );

        -- Enable RLS
        ALTER TABLE public.vendor_stores ENABLE ROW LEVEL SECURITY;

        -- RLS policies for vendor_stores
        CREATE POLICY "vendor_stores_select_own" ON public.vendor_stores 
          FOR SELECT USING (auth.uid() = vendor_id);

        CREATE POLICY "vendor_stores_insert_own" ON public.vendor_stores 
          FOR INSERT WITH CHECK (auth.uid() = vendor_id);

        CREATE POLICY "vendor_stores_update_own" ON public.vendor_stores 
          FOR UPDATE USING (auth.uid() = vendor_id);

        CREATE POLICY "admin_vendor_stores_select_all" ON public.vendor_stores 
          FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );

        -- Create trigger for updated_at
        CREATE TRIGGER update_vendor_stores_updated_at
          BEFORE UPDATE ON public.vendor_stores
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      })

      if (createError) {
        console.log('❌ Error creating vendor_stores table:', createError.message)
      } else {
        console.log('✅ vendor_stores table created successfully')
      }
    } else {
      console.log('✅ vendor_stores table exists')
    }

    // Check if our test vendor has a store record
    console.log('🔍 Checking test vendor store data...')
    
    const { data: testVendorProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'testvendor@iwanyu.rw')
      .single()

    if (testVendorProfile) {
      const { data: existingStore } = await supabase
        .from('vendor_stores')
        .select('*')
        .eq('vendor_id', testVendorProfile.id)
        .single()

      if (!existingStore) {
        console.log('📝 Creating store record for test vendor...')
        
        const { error: storeError } = await supabase
          .from('vendor_stores')
          .insert({
            vendor_id: testVendorProfile.id,
            store_name: 'Test Vendor Store',
            store_description: 'A test store for development and testing purposes',
            business_license: 'TEST-LICENSE-001',
            tax_id: 'TAX-001',
            phone_number: '+250788123456',
            email: 'testvendor@iwanyu.rw',
            address: 'KG 123 St, Kigali',
            city: 'Kigali',
            state_province: 'Kigali City',
            postal_code: '00000',
            country: 'Rwanda',
            facebook_url: 'https://facebook.com/testvendor',
            instagram_url: 'https://instagram.com/testvendor',
            tiktok_url: 'https://tiktok.com/@testvendor',
            mobile_money_info: {
              provider: 'MTN MoMo',
              phone_number: '+250788123456',
              account_name: 'Test Vendor'
            }
          })

        if (storeError) {
          console.log('❌ Error creating store record:', storeError.message)
        } else {
          console.log('✅ Store record created for test vendor')
        }
      } else {
        console.log('✅ Test vendor store record exists')
      }
    }

    // Check profiles table structure
    console.log('🔍 Checking profiles table...')
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'testvendor@iwanyu.rw')
      .single()

    if (!profileData) {
      console.log('❌ Test vendor profile not found')
    } else {
      console.log('✅ Test vendor profile exists:', {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role
      })
    }

  } catch (error) {
    console.error('❌ Database check failed:', error)
  }
}

async function main() {
  console.log('🚀 Starting dashboard fixes...')
  await checkAndFixDatabase()
  console.log('✅ Dashboard fixes completed!')
}

main().catch(console.error)
