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

async function resetProductImages() {
  console.log('🧹 Removing placeholder images and resetting to show only real uploads...\n')
  
  try {
    // Remove the test image from the product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        images: []
      })
      .eq('name', "Adidas Campus 00's")
    
    if (updateError) {
      console.error('❌ Error updating product:', updateError)
      return
    }
    
    console.log('✅ Removed placeholder image from product')
    console.log('📦 Product now shows package icon until real images are uploaded')
    
    // Show current storage files to verify what real uploads exist
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 20 })
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError)
      return
    }
    
    console.log(`\n📁 Real uploaded files in storage: ${files.length}`)
    if (files.length > 0) {
      files.forEach(file => {
        const { data: publicUrl } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${file.name}`)
        console.log(`   - ${file.name} → ${publicUrl.publicUrl}`)
      })
    } else {
      console.log('   No real uploaded files found')
    }
    
  } catch (error) {
    console.error('❌ Error in reset:', error)
  }
}

resetProductImages()
