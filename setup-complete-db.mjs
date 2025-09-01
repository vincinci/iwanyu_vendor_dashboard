#!/usr/bin/env node

/**
 * ==============================================
 * COMPLETE DATABASE SETUP SCRIPT
 * ==============================================
 * This script creates all missing tables and sets up
 * the complete database schema
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🗄️  Setting up complete database schema...')
  console.log('=============================================')

  try {
    // Read the SQL setup file
    const sqlContent = fs.readFileSync('FIX_MISSING_TABLES_AND_STORAGE.sql', 'utf8')
    
    console.log('📝 Executing database setup SQL...')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    })

    if (error) {
      // Try alternative method by splitting SQL into parts
      console.log('🔄 Trying alternative setup method...')
      await setupDatabaseAlternative()
    } else {
      console.log('✅ Database setup completed successfully!')
      console.log('📊 Setup result:', data)
    }

    // Verify setup
    await verifyDatabaseSetup()

  } catch (error) {
    console.error('❌ Database setup error:', error)
    console.log('📝 Please run the SQL manually in Supabase Dashboard')
  }
}

async function setupDatabaseAlternative() {
  try {
    console.log('📝 Creating tables individually...')

    // Create categories table
    console.log('📋 Creating categories table...')
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          parent_id UUID REFERENCES public.categories(id),
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    // Create notifications table
    console.log('🔔 Creating notifications table...')
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
          read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    // Insert default categories
    console.log('📚 Inserting default categories...')
    await supabase.from('categories').upsert([
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Electronics', description: 'Electronic devices and gadgets', status: 'active' },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Clothing', description: 'Fashion and apparel', status: 'active' },
      { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Home & Garden', description: 'Home improvement and gardening items', status: 'active' },
      { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Sports', description: 'Sports equipment and accessories', status: 'active' },
      { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Books', description: 'Books and educational materials', status: 'active' },
      { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Health & Beauty', description: 'Health and beauty products', status: 'active' },
      { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Automotive', description: 'Car parts and accessories', status: 'active' },
      { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Food & Beverages', description: 'Food and drink products', status: 'active' },
    ], { onConflict: 'id' })

    console.log('✅ Alternative database setup completed!')
  } catch (error) {
    console.error('❌ Alternative setup failed:', error)
  }
}

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database setup...')

  try {
    // Check categories table
    const { data: categories, error: catError } = await supabase.from('categories').select('count').single()
    
    if (!catError) {
      console.log('✅ Categories table: Ready')
    } else {
      console.log('⚠️  Categories table: Needs setup')
    }

    // Check notifications table
    const { data: notifications, error: notError } = await supabase.from('notifications').select('count').single()
    
    if (!notError) {
      console.log('✅ Notifications table: Ready')
    } else {
      console.log('⚠️  Notifications table: Needs setup')
    }

    // Check storage bucket
    const { data: buckets } = await supabase.storage.listBuckets()
    const productsBucket = buckets?.find(b => b.id === 'products')
    
    if (productsBucket) {
      console.log('✅ Storage bucket: Ready')
    } else {
      console.log('⚠️  Storage bucket: Needs setup')
    }

    console.log('')
    console.log('🎉 Database verification complete!')

  } catch (error) {
    console.error('❌ Verification error:', error)
  }
}

// Run the script
setupDatabase().catch(console.error)
