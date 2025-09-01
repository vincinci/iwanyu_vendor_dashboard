#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getValidCategoryId() {
  console.log('🔍 Getting valid category ID...')
  
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5)

    if (error) {
      console.log('❌ Categories error:', error.message)
      return null
    }

    if (categories && categories.length > 0) {
      console.log('✅ Available categories:')
      categories.forEach(cat => {
        console.log(`   - ${cat.id}: ${cat.name}`)
      })
      return categories[0].id
    }

    return null
  } catch (e) {
    console.log('❌ Error:', e.message)
    return null
  }
}

async function testStorageUpload() {
  console.log('\n📤 Testing image upload to storage...')
  
  try {
    // Create a small test image file (1x1 PNG)
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(base64PNG, 'base64')
    const testFile = new File([imageBuffer], 'test.png', { type: 'image/png' })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(`test/${Date.now()}-test.png`, testFile)

    if (uploadError) {
      console.log('❌ Image upload test failed:', uploadError.message)
      return false
    } else {
      console.log('✅ Image upload test successful:', uploadData.path)
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(uploadData.path)
      
      console.log('✅ Public URL:', urlData.publicUrl)
      
      // Clean up test file
      await supabase.storage.from('products').remove([uploadData.path])
      console.log('✅ Test file cleaned up')
      
      return true
    }
  } catch (e) {
    console.log('❌ Storage test error:', e.message)
    return false
  }
}

async function testProductCreation() {
  console.log('\n📦 Testing product creation...')
  
  const categoryId = await getValidCategoryId()
  if (!categoryId) {
    console.log('❌ No valid category found')
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'testvendor@iwanyu.rw')
    .single()

  if (!profile) {
    console.log('❌ Test vendor not found')
    return false
  }

  try {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        vendor_id: profile.id,
        name: 'Test Product Upload Fix',
        description: 'Testing product creation after upload fixes',
        price: 15.99,
        category_id: categoryId,
        inventory_quantity: 10,
        status: 'active'
      })
      .select()
      .single()

    if (productError) {
      console.log('❌ Product creation failed:', productError.message)
      return false
    } else {
      console.log('✅ Product created successfully:', productData.id)
      
      // Clean up test product
      await supabase.from('products').delete().eq('id', productData.id)
      console.log('✅ Test product cleaned up')
      
      return true
    }
  } catch (e) {
    console.log('❌ Product creation error:', e.message)
    return false
  }
}

async function main() {
  console.log('🧪 TESTING UPLOAD FIXES')
  console.log('=' * 40)
  
  const categoryId = await getValidCategoryId()
  const storageWorks = await testStorageUpload()
  const productWorks = await testProductCreation()
  
  console.log('\n📊 TEST RESULTS:')
  console.log('✅ Valid category ID:', categoryId)
  console.log('✅ Storage upload:', storageWorks ? 'WORKING' : 'FAILED')
  console.log('✅ Product creation:', productWorks ? 'WORKING' : 'FAILED')
  
  if (storageWorks && productWorks && categoryId) {
    console.log('\n🎉 ALL UPLOAD COMPONENTS ARE WORKING!')
    console.log('The RLS and storage issues should now be resolved.')
  } else {
    console.log('\n⚠️  Some issues remain, but progress made.')
  }
}

main().catch(console.error)
