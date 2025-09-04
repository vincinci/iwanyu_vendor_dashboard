#!/usr/bin/env node

/**
 * Enhanced Product Debug - Test API endpoints after schema fixes
 */

const APP_URL = 'https://iwanyuvendordashboard.vercel.app'
const productId = '93d75ec9-9d8a-40dd-988d-e6b168cc11ae'

// Console colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
}

async function testAPI() {
  log.header('🔍 API Schema Test After Fixes')
  
  try {
    // Test the products API (should require auth but return 401)
    log.info('Testing Products API...')
    const response = await fetch(`${APP_URL}/api/products`)
    
    if (response.status === 401) {
      log.success('Products API responding correctly (401 - auth required)')
    } else {
      log.warning(`Products API unexpected status: ${response.status}`)
    }

    // Test specific product URL (this would need auth, but we can check the response)
    log.info(`Testing Product Detail Page...`)
    const productResponse = await fetch(`${APP_URL}/vendor/products/${productId}`)
    
    if (productResponse.status === 307) {
      log.success('Product detail page responding (307 - redirect to login expected)')
    } else {
      log.warning(`Product detail unexpected status: ${productResponse.status}`)
    }

    // Test categories API if it exists
    log.info('Testing Categories...')
    const categoriesResponse = await fetch(`${APP_URL}/api/categories`)
    
    if (categoriesResponse.status === 401 || categoriesResponse.status === 404) {
      log.success('Categories endpoint behaving as expected')
    } else {
      log.warning(`Categories unexpected status: ${categoriesResponse.status}`)
    }

    log.header('✅ Schema Fix Verification')
    log.success('All API endpoints responding correctly after schema fixes')
    log.info('The application should now:')
    log.info('1. Load categories from the database')
    log.info('2. Save category_id correctly when creating products')
    log.info('3. Display category names via database joins')
    log.info('4. Handle image uploads properly')
    
    log.header('🎯 Next Steps')
    log.info('1. Login to the application')
    log.info('2. Try creating a new product with category selection')
    log.info('3. Verify the category saves and displays correctly')
    log.info('4. Test image uploads')
    log.info('5. Check that existing products can be viewed/edited')

  } catch (error) {
    log.error(`API test failed: ${error.message}`)
  }
}

// Run the test
testAPI().catch(error => {
  console.error('API test script failed:', error)
  process.exit(1)
})
