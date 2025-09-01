#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Hardcode the values for now
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQL() {
  try {
    console.log('📝 Reading SQL file...')
    const sql = readFileSync('./create-vendor-stores.sql', 'utf8')
    
    console.log('🔧 Executing SQL...')
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ SQL Error:', error)
    } else {
      console.log('✅ SQL executed successfully')
    }

    // Verify the table was created
    console.log('🔍 Verifying vendor_stores table...')
    const { data: stores, error: storeError } = await supabase
      .from('vendor_stores')
      .select('*')
      .limit(1)

    if (storeError) {
      console.log('❌ Table verification error:', storeError.message)
    } else {
      console.log('✅ vendor_stores table is working!')
      console.log('📊 Store count:', stores?.length || 0)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

runSQL().catch(console.error)
