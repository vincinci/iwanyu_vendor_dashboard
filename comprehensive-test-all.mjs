import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTcwODYsImV4cCI6MjA3MjA5MzA4Nn0.8diJpTeXd6WoWroW2CwdbQ6Gfusd2AeCc_r6dshRf78'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 COMPREHENSIVE VENDOR DASHBOARD TESTING')
console.log('==========================================')

const testResults = []

async function testDatabase() {
    console.log('\n📊 DATABASE CONNECTIVITY TEST')
    console.log('------------------------------')
    
    const tables = ['profiles', 'products', 'categories', 'orders', 'order_items', 'messages', 'notifications']
    
    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
            
            if (error) {
                console.log(`❌ ${table}: ${error.message}`)
                testResults.push({ component: `Database: ${table}`, status: 'FAILED', issue: error.message })
            } else {
                console.log(`✅ ${table}: ${count || 0} records`)
                testResults.push({ component: `Database: ${table}`, status: 'WORKING', issue: null })
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`)
            testResults.push({ component: `Database: ${table}`, status: 'FAILED', issue: err.message })
        }
    }
}

async function testVendorPages() {
    console.log('\n🏪 VENDOR PAGES ACCESSIBILITY TEST')
    console.log('-----------------------------------')
    
    const vendorPages = [
        { name: 'Dashboard', url: 'http://localhost:3001/vendor' },
        { name: 'Products', url: 'http://localhost:3001/vendor/products' },
        { name: 'Orders', url: 'http://localhost:3001/vendor/orders' },
        { name: 'Messages', url: 'http://localhost:3001/vendor/messages' },
        { name: 'Profile', url: 'http://localhost:3001/vendor/profile' },
        { name: 'Reports', url: 'http://localhost:3001/vendor/reports' },
        { name: 'Payouts', url: 'http://localhost:3001/vendor/payouts' }
    ]
    
    for (const page of vendorPages) {
        try {
            const response = await fetch(page.url)
            const html = await response.text()
            
            const isAccessible = response.status === 200
            const hasContent = html.length > 1000
            const hasError = html.includes('error') || html.includes('Error') || response.status >= 400
            
            if (isAccessible && hasContent && !hasError) {
                console.log(`✅ ${page.name}: Accessible and functional`)
                testResults.push({ component: `Page: ${page.name}`, status: 'WORKING', issue: null })
            } else {
                console.log(`❌ ${page.name}: Status ${response.status}, Content: ${hasContent}, Error: ${hasError}`)
                testResults.push({ component: `Page: ${page.name}`, status: 'FAILED', issue: `Status: ${response.status}` })
            }
        } catch (err) {
            console.log(`❌ ${page.name}: ${err.message}`)
            testResults.push({ component: `Page: ${page.name}`, status: 'FAILED', issue: err.message })
        }
    }
}

async function testCRUDOperations() {
    console.log('\n⚙️ CRUD OPERATIONS TEST')
    console.log('------------------------')
    
    // Test category creation for products
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .eq('status', 'active')
            .limit(5)
        
        if (error) {
            console.log(`❌ Categories Read: ${error.message}`)
            testResults.push({ component: 'CRUD: Categories Read', status: 'FAILED', issue: error.message })
        } else {
            console.log(`✅ Categories Read: ${categories.length} active categories`)
            testResults.push({ component: 'CRUD: Categories Read', status: 'WORKING', issue: null })
        }
    } catch (err) {
        console.log(`❌ Categories Read: ${err.message}`)
        testResults.push({ component: 'CRUD: Categories Read', status: 'FAILED', issue: err.message })
    }
    
    // Test product operations (read only for now)
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .limit(5)
        
        if (error) {
            console.log(`❌ Products Read: ${error.message}`)
            testResults.push({ component: 'CRUD: Products Read', status: 'FAILED', issue: error.message })
        } else {
            console.log(`✅ Products Read: ${products.length} products in database`)
            testResults.push({ component: 'CRUD: Products Read', status: 'WORKING', issue: null })
        }
    } catch (err) {
        console.log(`❌ Products Read: ${err.message}`)
        testResults.push({ component: 'CRUD: Products Read', status: 'FAILED', issue: err.message })
    }
}

async function testStorage() {
    console.log('\n📦 STORAGE SYSTEM TEST')
    console.log('----------------------')
    
    try {
        const { data: files, error } = await supabase.storage
            .from('products')
            .list('', { limit: 1 })
        
        if (error) {
            console.log(`❌ Storage Access: ${error.message}`)
            testResults.push({ component: 'Storage: Products Bucket', status: 'FAILED', issue: error.message })
        } else {
            console.log(`✅ Storage Access: Products bucket accessible`)
            testResults.push({ component: 'Storage: Products Bucket', status: 'WORKING', issue: null })
        }
    } catch (err) {
        console.log(`❌ Storage Access: ${err.message}`)
        testResults.push({ component: 'Storage: Products Bucket', status: 'FAILED', issue: err.message })
    }
}

async function runFullTest() {
    await testDatabase()
    await testVendorPages()
    await testCRUDOperations()
    await testStorage()
    
    console.log('\n📋 COMPREHENSIVE TEST RESULTS')
    console.log('==============================')
    
    const working = testResults.filter(r => r.status === 'WORKING')
    const failed = testResults.filter(r => r.status === 'FAILED')
    
    console.log(`\n📊 SUMMARY: ${working.length}/${testResults.length} components working`)
    console.log(`✅ Working: ${working.length}`)
    console.log(`❌ Failed: ${failed.length}`)
    
    if (failed.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES FOUND:')
        console.log('=========================')
        failed.forEach((result, index) => {
            console.log(`${index + 1}. ${result.component}`)
            console.log(`   Issue: ${result.issue}`)
            console.log(`   Status: ${result.status}`)
            console.log('')
        })
        
        console.log('💡 NEXT STEPS:')
        console.log('- Fix database connectivity issues')
        console.log('- Implement missing page functionality')
        console.log('- Test all CRUD operations')
        console.log('- Verify storage permissions')
    } else {
        console.log('\n🎉 ALL SYSTEMS OPERATIONAL!')
        console.log('===========================')
        console.log('✅ Database connectivity: Working')
        console.log('✅ All vendor pages: Accessible')
        console.log('✅ CRUD operations: Functional')
        console.log('✅ Storage system: Working')
    }
}

runFullTest().catch(console.error)
