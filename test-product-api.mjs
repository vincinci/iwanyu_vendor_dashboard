import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testProductAPI() {
  console.log('🧪 TESTING PRODUCT API')
  console.log('======================')

  try {
    const productData = {
      name: 'Test Product API',
      description: 'Testing if the API works with current schema',
      price: 50000,
      inventory_quantity: 10,
      status: 'active',
      track_inventory: true
    }

    console.log('📝 Sending POST request to /api/products...')
    console.log('Data:', productData)

    const response = await fetch('http://localhost:3002/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}` // This won't work for auth, but let's see what error we get
      },
      body: JSON.stringify(productData)
    })

    const result = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', result)

    if (!response.ok) {
      console.log('❌ API Error:', result.error)
      if (result.details) {
        console.log('Error details:', result.details)
      }
    } else {
      console.log('✅ API Success!')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testProductAPI().catch(console.error)
