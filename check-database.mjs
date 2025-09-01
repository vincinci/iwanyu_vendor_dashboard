#!/usr/bin/env node

/**
 * ==============================================
 * DATABASE TABLE CHECKER
 * ==============================================
 * This script checks what tables exist in your database
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
  console.log('🔍 CHECKING CURRENT DATABASE TABLES...')
  console.log('=====================================')

  try {
    // Check what tables exist
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (error) {
      console.log('⚠️  Cannot access information_schema, checking individual tables...')
      await checkIndividualTables()
    } else {
      console.log('📋 EXISTING TABLES:')
      if (data && data.length > 0) {
        data.forEach(table => {
          console.log(`   • ${table.table_name}`)
        })
      } else {
        console.log('   ❌ NO TABLES FOUND!')
      }
    }

  } catch (error) {
    console.log('❌ Error checking database:', error.message)
    await checkIndividualTables()
  }
}

async function checkIndividualTables() {
  console.log('\n🔍 CHECKING INDIVIDUAL TABLES...')
  
  const tablesToCheck = [
    'profiles',
    'categories', 
    'notifications',
    'products',
    'orders',
    'messages',
    'vendors',
    'users'
  ]

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(tableName).select('count').limit(1)
      if (error) {
        console.log(`   ❌ ${tableName} - Missing`)
      } else {
        console.log(`   ✅ ${tableName} - Exists`)
      }
    } catch (err) {
      console.log(`   ❌ ${tableName} - Missing`)
    }
  }
}

checkDatabase()
