import { createClient } from '@supabase/supabase-js'

// Use service role key for admin access
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addTestImageToProduct() {
  console.log('🖼️ Adding test image to existing product...\n')
  
  try {
    // Get the existing product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('name', "Adidas Campus 00's")
      .single()
    
    if (fetchError || !product) {
      console.error('❌ Error fetching product:', fetchError)
      return
    }
    
    console.log(`📦 Found product: ${product.name}`)
    console.log(`   Current images:`, product.images)
    
    // Use a sample Adidas Campus image URL (from a CDN or sample image)
    const testImageUrl = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop&crop=center'
    
    // Update the product with the test image
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        images: [testImageUrl]
      })
      .eq('id', product.id)
    
    if (updateError) {
      console.error('❌ Error updating product:', updateError)
      return
    }
    
    console.log('✅ Product updated successfully!')
    console.log(`   New image URL: ${testImageUrl}`)
    
    // Verify the update
    const { data: verifyProduct, error: verifyError } = await supabase
      .from('products')
      .select('images')
      .eq('id', product.id)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return
    }
    
    console.log(`   Verified images:`, verifyProduct.images)
    
  } catch (error) {
    console.error('❌ Error in test:', error)
  }
}

addTestImageToProduct()
