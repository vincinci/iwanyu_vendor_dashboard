import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testImageUpload() {
  console.log('🧪 TESTING IMAGE UPLOAD WITH PROPER FORMAT')
  console.log('==========================================')

  try {
    // Create a simple PNG buffer (1x1 pixel transparent PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])

    const testFile = new File([pngBuffer], 'test-image.png', { type: 'image/png' })
    const testFileName = `test/test-image-${Date.now()}.png`
    
    console.log('📝 Uploading test PNG file...')
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testFileName, testFile)

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError)
      return false
    } else {
      console.log('✅ Test upload successful!')
      console.log('Upload data:', uploadData)
      
      // Test public URL access
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(testFileName)
      
      console.log('📋 Public URL:', publicUrl)
      
      // Clean up test file
      await supabase.storage
        .from('product-images')
        .remove([testFileName])
      
      console.log('🧹 Cleaned up test file')
      return true
    }

  } catch (error) {
    console.error('❌ Error testing upload:', error)
    return false
  }
}

async function enableImageUploads() {
  console.log('\n🔓 ENABLING IMAGE UPLOADS IN FORM')
  console.log('=================================')
  
  const success = await testImageUpload()
  
  if (success) {
    console.log('\n✅ IMAGE UPLOADS ARE WORKING!')
    console.log('You can now re-enable image uploads in the form.')
    console.log('Edit: app/vendor/products/new/page.tsx')
    console.log('Uncomment the image upload code in uploadImages function')
  } else {
    console.log('\n❌ IMAGE UPLOADS STILL NOT WORKING')
    console.log('Storage bucket may need manual configuration in Supabase Dashboard')
  }
}

enableImageUploads().catch(console.error)
