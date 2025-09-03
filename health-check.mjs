#!/usr/bin/env node

/**
 * Application Health Check & API Testing
 * Tests critical functionality and database connectivity
 */

import { createClient } from '@supabase/supabase-js'

const APP_URL = 'https://iwanyuvendordashboard.vercel.app'

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

async function healthCheck() {
  log.header('🏥 Application Health Check')
  
  try {
    // Test 1: Application Accessibility
    log.info('Testing application accessibility...')
    const response = await fetch(APP_URL)
    if (response.ok) {
      log.success(`Application accessible (${response.status})`)
    } else {
      log.error(`Application not accessible (${response.status})`)
      return false
    }

    // Test 2: Critical API Endpoints
    log.info('Testing API endpoints...')
    
    const apiTests = [
      { endpoint: '/api/products', expectedStatuses: [401, 405] }, // Unauthorized or method not allowed
      { endpoint: '/api/upload-images', expectedStatuses: [401, 405] },
      { endpoint: '/api/health', expectedStatuses: [200, 404] } // Health endpoint might not exist
    ]

    for (const test of apiTests) {
      try {
        const apiResponse = await fetch(`${APP_URL}${test.endpoint}`)
        if (test.expectedStatuses.includes(apiResponse.status)) {
          log.success(`${test.endpoint} responding correctly (${apiResponse.status})`)
        } else {
          log.warning(`${test.endpoint} unexpected status (${apiResponse.status})`)
        }
      } catch (error) {
        log.error(`${test.endpoint} failed: ${error.message}`)
      }
    }

    // Test 3: Static Assets
    log.info('Testing static assets...')
    const assets = ['/icon.png', '/logo.png', '/placeholder.svg']
    
    for (const asset of assets) {
      try {
        const assetResponse = await fetch(`${APP_URL}${asset}`)
        if (assetResponse.ok) {
          log.success(`${asset} loads correctly`)
        } else {
          log.warning(`${asset} failed to load (${assetResponse.status})`)
        }
      } catch (error) {
        log.error(`${asset} failed: ${error.message}`)
      }
    }

    // Test 4: Database Connectivity (if env vars available)
    log.info('Testing database connectivity...')
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        
        // Test basic query
        const { data, error } = await supabase
          .from('products')
          .select('count')
          .limit(1)
        
        if (error) {
          log.warning(`Database query failed: ${error.message}`)
        } else {
          log.success('Database connectivity verified')
        }
      } catch (error) {
        log.error(`Database connection failed: ${error.message}`)
      }
    } else {
      log.warning('Supabase credentials not found in environment - skipping DB test')
    }

    log.header('🎯 Health Check Summary')
    log.success('Basic health check completed')
    log.info('For comprehensive testing, run: ./comprehensive-test.sh')
    
    return true
    
  } catch (error) {
    log.error(`Health check failed: ${error.message}`)
    return false
  }
}

// Generate test report
async function generateTestReport() {
  log.header('📋 Test Report Generator')
  
  const report = {
    timestamp: new Date().toISOString(),
    application_url: APP_URL,
    tests_run: [],
    recommendations: []
  }

  log.info('Generating comprehensive test report...')
  
  // Check for common issues
  log.info('Checking for common issues...')
  
  const commonChecks = [
    {
      name: 'Environment Variables',
      check: () => process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      recommendation: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
    },
    {
      name: 'Package Dependencies',
      check: async () => {
        try {
          await import('next')
          await import('@supabase/supabase-js')
          return true
        } catch {
          return false
        }
      },
      recommendation: 'Run: npm install or pnpm install to install dependencies'
    }
  ]

  for (const check of commonChecks) {
    try {
      const result = typeof check.check === 'function' ? await check.check() : check.check
      if (result) {
        log.success(`${check.name} - OK`)
      } else {
        log.warning(`${check.name} - Issue detected`)
        report.recommendations.push(check.recommendation)
      }
    } catch (error) {
      log.error(`${check.name} - Check failed: ${error.message}`)
      report.recommendations.push(check.recommendation)
    }
  }

  // Output recommendations
  if (report.recommendations.length > 0) {
    log.header('💡 Recommendations')
    report.recommendations.forEach((rec, index) => {
      log.info(`${index + 1}. ${rec}`)
    })
  }

  return report
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.blue}🧪 Application Health Check & Testing Suite${colors.reset}`)
  console.log(`${colors.blue}================================================${colors.reset}\n`)
  
  const healthOk = await healthCheck()
  console.log('')
  
  await generateTestReport()
  
  console.log(`\n${colors.bold}🎯 Next Steps:${colors.reset}`)
  console.log(`${colors.blue}1. Run comprehensive tests: ./comprehensive-test.sh${colors.reset}`)
  console.log(`${colors.blue}2. Manual testing via browser: ${APP_URL}${colors.reset}`)
  console.log(`${colors.blue}3. Monitor application logs for issues${colors.reset}`)
  
  process.exit(healthOk ? 0 : 1)
}

main().catch(error => {
  log.error(`Health check failed: ${error.message}`)
  process.exit(1)
})
