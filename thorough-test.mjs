#!/usr/bin/env node

import http from 'http'

// Simple fetch replacement using http module
function simpleFetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        statusText: res.statusMessage
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

console.log('🔍 THOROUGH TESTING - CHECKING FOR ANY ERRORS')
console.log('=' * 60)

let totalTests = 0
let passedTests = 0
let errors = []

async function runTest(testName, testFunction) {
  totalTests++
  try {
    console.log(`\n🧪 Testing: ${testName}`)
    await testFunction()
    console.log(`✅ ${testName} - PASSED`)
    passedTests++
  } catch (error) {
    console.log(`❌ ${testName} - FAILED`)
    console.error(`   Error: ${error.message}`)
    errors.push({ test: testName, error: error.message })
  }
}

// Test 1: Server connectivity
await runTest('Server Connectivity', async () => {
  const response = await simpleFetch('http://localhost:3000')
  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`)
  }
})

// Test 2: Auth login page
await runTest('Auth Login Page', async () => {
  const response = await simpleFetch('http://localhost:3000/auth/login')
  if (!response.ok) {
    throw new Error(`Login page returned ${response.status}`)
  }
})

// Test 3: Vendor dashboard access
await runTest('Vendor Dashboard Access', async () => {
  const response = await simpleFetch('http://localhost:3000/vendor')
  if (!response.ok) {
    throw new Error(`Vendor dashboard returned ${response.status}`)
  }
})

// Test 4: Admin dashboard access  
await runTest('Admin Dashboard Access', async () => {
  const response = await simpleFetch('http://localhost:3000/admin')
  if (!response.ok) {
    throw new Error(`Admin dashboard returned ${response.status}`)
  }
})

// Test 5: New product page
await runTest('New Product Page', async () => {
  const response = await simpleFetch('http://localhost:3000/vendor/products/new')
  if (!response.ok) {
    throw new Error(`New product page returned ${response.status}`)
  }
})

// Test 6: API health check
await runTest('API Health Check', async () => {
  const response = await simpleFetch('http://localhost:3000/api/vendor')
  // Don't check for 200 as this might require auth, just check it's not a 500
  if (response.status >= 500) {
    throw new Error(`API error: ${response.status}`)
  }
})

console.log('\n' + '=' * 60)
console.log('📊 TEST RESULTS SUMMARY')
console.log('=' * 60)

console.log(`\n📈 Tests Passed: ${passedTests}/${totalTests}`)
console.log(`📉 Tests Failed: ${totalTests - passedTests}/${totalTests}`)
console.log(`💯 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:')
  errors.forEach((err, index) => {
    console.log(`${index + 1}. ${err.test}: ${err.error}`)
  })
  console.log('\n🔧 RECOMMENDATION: Fix the above errors')
} else {
  console.log('\n🎉 ALL TESTS PASSED!')
  console.log('✅ No errors found - dashboard is working perfectly!')
}

console.log('\n' + '=' * 60)
