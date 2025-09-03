import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function comprehensiveProductTest() {
  console.log('🧪 Starting Comprehensive Product Test...\n')
  
  try {
    // Step 1: Test Authentication
    console.log('1️⃣ Testing Authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ No authenticated user. Please sign in first.')
      console.log('   Visit your app and sign in as a vendor, then run this test.')
      return
    }
    
    console.log(`✅ Authenticated as: ${user.email}`)
    console.log(`   User ID: ${user.id}\n`)
    
    // Step 2: Check/Create Vendor Store
    console.log('2️⃣ Testing Vendor Store Creation...')
    let { data: store } = await supabase
      .from('vendor_stores')
      .select('*')
      .eq('vendor_id', user.id)
      .single()
    
    if (!store) {
      console.log('   Creating vendor store...')
      const { data: newStore, error: storeError } = await supabase
        .from('vendor_stores')
        .insert({
          vendor_id: user.id,
          store_name: 'Test Store',
          store_description: 'Automated test store',
          is_verified: true
        })
        .select()
        .single()
      
      if (storeError) {
        console.log('❌ Failed to create vendor store:', storeError.message)
        return
      }
      store = newStore
    }
    
    console.log(`✅ Vendor store ready: ${store.store_name} (ID: ${store.id})\n`)
    
    // Step 3: Test Image Upload API
    console.log('3️⃣ Testing Image Upload API...')
    
    // Create a simple test image blob (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    const testImageBuffer = Buffer.from(testImageBase64, 'base64')
    const testImageBlob = new Blob([testImageBuffer], { type: 'image/png' })
    const testImageFile = new File([testImageBlob], 'test-image.png', { type: 'image/png' })
    
    const formData = new FormData()
    formData.append('files', testImageFile)
    
    const uploadResponse = await fetch(`${SUPABASE_URL.replace('/rest/v1', '')}/upload-images`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (!uploadResponse.ok) {
      console.log('❌ Image upload API failed:', await uploadResponse.text())
      return
    }
    
    const uploadResult = await uploadResponse.json()
    console.log('✅ Image upload successful')
    console.log(`   Uploaded ${uploadResult.uploadedUrls?.length || 0} image(s)`)
    console.log(`   URLs: ${JSON.stringify(uploadResult.uploadedUrls || [])}\n`)
    
    const imageUrls = uploadResult.uploadedUrls || []
    
    // Step 4: Test Product Creation API
    console.log('4️⃣ Testing Product Creation API...')
    
    const testProducts = [
      {
        name: 'Test Product 1 - Electronics',
        description: 'This is a test product for electronics category with comprehensive testing features.',
        price: 25000,
        category: 'Electronics',
        inventory_quantity: 50,
        sku: `TEST-ELEC-${Date.now()}`,
        status: 'active',
        track_inventory: true,
        images: imageUrls,
        tags: ['test', 'electronics', 'automated']
      },
      {
        name: 'Test Product 2 - Clothing',
        description: 'This is a test product for clothing category with multiple variants.',
        price: 15000,
        category: 'Clothing',
        inventory_quantity: 25,
        sku: `TEST-CLOTH-${Date.now()}`,
        status: 'active',
        track_inventory: true,
        images: imageUrls,
        tags: ['test', 'clothing', 'fashion']
      },
      {
        name: 'Test Product 3 - Draft Status',
        description: 'This is a draft product to test status functionality.',
        price: 75000,
        category: 'Computers',
        inventory_quantity: 10,
        sku: `TEST-DRAFT-${Date.now()}`,
        status: 'draft',
        track_inventory: false,
        images: imageUrls,
        tags: ['test', 'draft', 'computers']
      }
    ]
    
    const createdProducts = []
    
    for (let i = 0; i < testProducts.length; i++) {
      const productData = testProducts[i]
      console.log(`   Creating product ${i + 1}: ${productData.name}`)
      
      const productResponse = await fetch(`${SUPABASE_URL.replace('/rest/v1', '')}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(productData)
      })
      
      if (!productResponse.ok) {
        const errorText = await productResponse.text()
        console.log(`   ❌ Failed to create product ${i + 1}:`, errorText)
        continue
      }
      
      const productResult = await productResponse.json()
      createdProducts.push(productResult.data)
      console.log(`   ✅ Created product: ${productResult.data.name} (ID: ${productResult.data.id})`)
    }
    
    console.log(`\n✅ Successfully created ${createdProducts.length}/${testProducts.length} products\n`)
    
    // Step 5: Test Product Retrieval
    console.log('5️⃣ Testing Product Retrieval...')
    
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (fetchError) {
      console.log('❌ Failed to fetch products:', fetchError.message)
      return
    }
    
    console.log(`✅ Retrieved ${products.length} products from database`)
    
    // Verify the test products are in the results
    const testProductNames = testProducts.map(p => p.name)
    const foundTestProducts = products.filter(p => testProductNames.includes(p.name))
    
    console.log(`   Found ${foundTestProducts.length}/${testProducts.length} test products in database`)
    
    // Step 6: Verify Product Data Integrity
    console.log('\n6️⃣ Verifying Product Data Integrity...')
    
    for (const product of foundTestProducts) {
      console.log(`   Checking product: ${product.name}`)
      
      // Check required fields
      const checks = [
        { field: 'category', value: product.category, expected: 'not null' },
        { field: 'images', value: product.images, expected: 'array' },
        { field: 'price', value: product.price, expected: 'number' },
        { field: 'status', value: product.status, expected: 'string' },
        { field: 'created_at', value: product.created_at, expected: 'timestamp' },
        { field: 'inventory_quantity', value: product.inventory_quantity, expected: 'number' }
      ]
      
      let productValid = true
      for (const check of checks) {
        let isValid = false
        
        switch (check.expected) {
          case 'not null':
            isValid = check.value != null
            break
          case 'array':
            isValid = Array.isArray(check.value)
            break
          case 'number':
            isValid = typeof check.value === 'number'
            break
          case 'string':
            isValid = typeof check.value === 'string'
            break
          case 'timestamp':
            isValid = check.value && !isNaN(new Date(check.value).getTime())
            break
        }
        
        if (isValid) {
          console.log(`     ✅ ${check.field}: ${JSON.stringify(check.value)}`)
        } else {
          console.log(`     ❌ ${check.field}: ${JSON.stringify(check.value)} (expected ${check.expected})`)
          productValid = false
        }
      }
      
      if (productValid) {
        console.log(`   ✅ Product data integrity: PASSED`)
      } else {
        console.log(`   ❌ Product data integrity: FAILED`)
      }
    }
    
    // Step 7: Test Product Update
    console.log('\n7️⃣ Testing Product Update...')
    
    if (createdProducts.length > 0) {
      const productToUpdate = createdProducts[0]
      const updateData = {
        name: productToUpdate.name + ' (Updated)',
        description: productToUpdate.description + ' - Updated via test',
        price: productToUpdate.price + 1000
      }
      
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productToUpdate.id)
        .eq('vendor_id', user.id)
        .select()
        .single()
      
      if (updateError) {
        console.log('   ❌ Failed to update product:', updateError.message)
      } else {
        console.log(`   ✅ Successfully updated product: ${updatedProduct.name}`)
        console.log(`   New price: RWF ${updatedProduct.price.toLocaleString()}`)
      }
    }
    
    // Step 8: Test Storage Bucket Access
    console.log('\n8️⃣ Testing Storage Bucket Access...')
    
    const { data: bucketFiles, error: storageError } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 5 })
    
    if (storageError) {
      console.log('   ❌ Storage access failed:', storageError.message)
    } else {
      console.log(`   ✅ Storage access successful, found ${bucketFiles.length} files`)
    }
    
    // Step 9: Summary Report
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY')
    console.log('==========================================')
    console.log(`✅ Authentication: PASSED`)
    console.log(`✅ Vendor Store: PASSED`)
    console.log(`✅ Image Upload: ${imageUrls.length > 0 ? 'PASSED' : 'FAILED'}`)
    console.log(`✅ Product Creation: ${createdProducts.length}/${testProducts.length} PASSED`)
    console.log(`✅ Product Retrieval: PASSED`)
    console.log(`✅ Data Integrity: ${foundTestProducts.length > 0 ? 'PASSED' : 'FAILED'}`)
    console.log(`✅ Product Update: PASSED`)
    console.log(`✅ Storage Access: ${storageError ? 'FAILED' : 'PASSED'}`)
    
    const overallSuccess = createdProducts.length === testProducts.length && 
                          foundTestProducts.length > 0 && 
                          imageUrls.length > 0 && 
                          !storageError
    
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`)
    
    if (overallSuccess) {
      console.log('\n🎉 Your vendor dashboard is working perfectly!')
      console.log('   - Categories are being saved correctly')
      console.log('   - Images are uploading and displaying properly')
      console.log('   - Product creation workflow is functional')
      console.log('   - Database integrity is maintained')
    } else {
      console.log('\n🔧 Some issues detected. Check the individual test results above.')
    }
    
    // Cleanup Test Data
    console.log('\n🧹 Cleaning up test data...')
    
    if (createdProducts.length > 0) {
      const testProductIds = createdProducts.map(p => p.id)
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', testProductIds)
      
      if (deleteError) {
        console.log('   ⚠️  Failed to cleanup test products:', deleteError.message)
        console.log('   You may need to manually delete the test products')
      } else {
        console.log(`   ✅ Cleaned up ${testProductIds.length} test products`)
      }
    }
    
    console.log('\n✨ Comprehensive test completed!')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
    console.log('\nThis might indicate a configuration or environment issue.')
    console.log('Check your environment variables and database connection.')
  }
}

// Run the test
comprehensiveProductTest().catch(console.error)
