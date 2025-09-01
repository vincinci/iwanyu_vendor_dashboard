import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkOrdersTable() {
    console.log('🔍 CHECKING ORDERS TABLE STRUCTURE')
    console.log('==================================')
    
    const testColumns = [
        'id', 'order_number', 'customer_name', 'customer_email', 'customer_phone',
        'status', 'total_amount', 'shipping_address', 'created_at', 'updated_at'
    ]
    
    for (const col of testColumns) {
        try {
            const { error } = await supabase
                .from('orders')
                .select(col)
                .limit(1)
            
            if (error) {
                console.log(`❌ ${col}: ${error.message}`)
            } else {
                console.log(`✅ ${col}: Column exists`)
            }
        } catch (err) {
            console.log(`❌ ${col}: ${err.message}`)
        }
    }
    
    // Try a minimal order creation to see what's required
    console.log('\n🧪 Testing minimal order creation...')
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert({
                order_number: 'TEST-' + Date.now(),
                status: 'pending',
                total_amount: 100
            })
            .select()
        
        if (error) {
            console.log(`❌ Minimal order failed: ${error.message}`)
        } else {
            console.log(`✅ Minimal order created: ${data[0].id}`)
            // Clean up
            await supabase.from('orders').delete().eq('id', data[0].id)
        }
    } catch (err) {
        console.log(`❌ Error: ${err.message}`)
    }
}

checkOrdersTable().catch(console.error)
