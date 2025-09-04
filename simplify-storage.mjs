#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 Simplifying Image Storage\n')

async function simplifyStorage() {
  try {
    // Update product-images bucket
    console.log('📦 Updating product-images bucket...')
    const { data, error } = await supabase.storage
      .updateBucket('product-images', { 
        public: true,
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      })

    if (error) {
      console.log('❌ Update failed:', error)
    } else {
      console.log('✅ Updated to 10MB limit')
    }

    console.log('\n✅ Simple Storage Setup:')
    console.log('📁 ONE bucket: product-images')
    console.log('💾 URLs stored in: products.images field')
    console.log('🔗 No backup storage needed')
    console.log('📏 Max file size: 10MB')

  } catch (error) {
    console.error('❌ Failed:', error)
  }
}

simplifyStorage()
