import { createClient } from '@supabase/supabase-js'

// Use direct values for debugging
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTcwODYsImV4cCI6MjA3MjA5MzA4Nn0.8diJpTeXd6WoWroW2CwdbQ6Gfusd2AeCc_r6dshRf78'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProductImages() {
  console.log('🔍 Debugging product image data structure...\n')
  
  try {
    // Get all products with their images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .limit(5)
    
    if (error) {
      console.error('❌ Error fetching products:', error)
      return
    }
    
    if (!products || products.length === 0) {
      console.log('📦 No products found in database')
      return
    }
    
    console.log(`📊 Found ${products.length} products:\n`)
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. Product: ${product.name}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Images type: ${typeof product.images}`)
      console.log(`   Images value:`, product.images)
      
      if (Array.isArray(product.images)) {
        console.log(`   Images array length: ${product.images.length}`)
        if (product.images.length > 0) {
          console.log(`   First image:`, product.images[0])
          console.log(`   First image type:`, typeof product.images[0])
        }
      }
      console.log('   ---')
    })
    
  } catch (error) {
    console.error('❌ Error in debug script:', error)
  }
}

debugProductImages()
