import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProducts() {
  console.log('=== CHECKING PRODUCT IMAGES ===')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, images')
    .limit(5)
    
  if (error) {
    console.error('Error fetching products:', error)
    return
  }
  
  console.log('Products found:', products?.length || 0)
  
  products?.forEach((product, index) => {
    console.log(`\nProduct ${index + 1}:`)
    console.log('- ID:', product.id)
    console.log('- Name:', product.name)
    console.log('- Images:', JSON.stringify(product.images, null, 2))
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0]
      console.log('- First Image Type:', typeof firstImage)
      console.log('- First Image:', firstImage)
      
      if (typeof firstImage === 'object' && firstImage.url) {
        console.log('- Image URL:', firstImage.url)
      } else if (typeof firstImage === 'string') {
        console.log('- Image String:', firstImage)
      }
    }
  })
}

checkProducts().catch(console.error)
