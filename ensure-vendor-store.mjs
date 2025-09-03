import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function ensureVendorStore() {
  console.log('🏪 ENSURING VENDOR STORE EXISTS')
  console.log('==============================')

  try {
    // Get the existing vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .single()

    if (vendorError || !vendor) {
      console.error('No vendor found. Please ensure you have a vendor account.')
      return
    }

    console.log(`✅ Found vendor: ${vendor.full_name} (${vendor.email})`)

    // Check if vendor store exists
    let { data: store } = await supabase
      .from('vendor_stores')
      .select('*')
      .eq('vendor_id', vendor.id)
      .single()

    if (!store) {
      console.log('🏪 Creating vendor store...')
      const { data: newStore, error: storeError } = await supabase
        .from('vendor_stores')
        .insert({
          vendor_id: vendor.id,
          store_name: `${vendor.full_name}'s Store`,
          store_description: 'Your premium online store',
          is_verified: true
        })
        .select()
        .single()

      if (storeError) {
        console.error('Error creating store:', storeError)
        return
      }
      store = newStore
      console.log('✅ Created vendor store successfully!')
    } else {
      console.log('✅ Vendor store already exists')
    }

    console.log('\n🎉 VENDOR STORE READY!')
    console.log('=====================')
    console.log(`Store ID: ${store.id}`)
    console.log(`Store Name: ${store.store_name}`)
    console.log('\n📝 Product creation should now work properly!')

  } catch (error) {
    console.error('❌ Error ensuring vendor store:', error)
  }
}

ensureVendorStore().catch(console.error)
