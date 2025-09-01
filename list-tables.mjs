#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Hardcode the values for now
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listTables() {
  try {
    console.log('🔍 Listing current database tables...')
    
    // Try direct query to get tables
    const { data, error } = await supabase
      .rpc('get_schema', {})
      .select()

    if (error) {
      console.log('❌ RPC Error:', error.message)
      
      // Try alternative approach
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public')

      if (tablesError) {
        console.log('❌ Alternative query error:', tablesError.message)
        
        // Let's try listing what we can access
        const testTables = ['profiles', 'products', 'orders', 'categories', 'vendor_stores']
        
        for (const table of testTables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .limit(1)
            
            if (error) {
              console.log(`❌ ${table}: ${error.message}`)
            } else {
              console.log(`✅ ${table}: exists (${data?.length || 0} records sampled)`)
            }
          } catch (e) {
            console.log(`❌ ${table}: ${e.message}`)
          }
        }
      } else {
        console.log('✅ Available tables:', tables)
      }
    } else {
      console.log('✅ Schema data:', data)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

listTables().catch(console.error)
