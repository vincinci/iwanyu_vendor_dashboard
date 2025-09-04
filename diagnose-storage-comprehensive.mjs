#!/usr/bin/env node

/**
 * Diagnose Supabase Storage Issues
 */

import { createClient } from '@supabase/supabase-js'

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

async function diagnoseStorage() {
  log.header('🔍 Supabase Storage Diagnosis')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log.error('Missing Supabase environment variables')
    return
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Check if buckets exist
    log.info('Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      log.error(`Failed to list buckets: ${bucketsError.message}`)
      return
    }

    const requiredBuckets = ['product-images', 'vendor-uploads']
    const existingBuckets = buckets.map(b => b.name)
    
    log.info('Existing buckets:')
    existingBuckets.forEach(bucket => {
      console.log(`  - ${bucket}`)
    })

    // Check required buckets
    for (const bucketName of requiredBuckets) {
      if (existingBuckets.includes(bucketName)) {
        log.success(`Bucket '${bucketName}' exists`)
        
        // Test upload to this bucket
        try {
          const testFileName = `test-${Date.now()}.txt`
          const testFile = new Blob(['test content'], { type: 'text/plain' })
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`test/${testFileName}`, testFile)
            
          if (error) {
            log.error(`Upload test failed for '${bucketName}': ${error.message}`)
          } else {
            log.success(`Upload test passed for '${bucketName}'`)
            
            // Clean up test file
            await supabase.storage
              .from(bucketName)
              .remove([`test/${testFileName}`])
          }
        } catch (uploadError) {
          log.error(`Upload test exception for '${bucketName}': ${uploadError.message}`)
        }
      } else {
        log.warning(`Bucket '${bucketName}' missing - will try to create`)
        
        // Try to create bucket
        try {
          const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 10485760 // 10MB
          })
          
          if (error) {
            log.error(`Failed to create bucket '${bucketName}': ${error.message}`)
          } else {
            log.success(`Created bucket '${bucketName}'`)
          }
        } catch (createError) {
          log.error(`Exception creating bucket '${bucketName}': ${createError.message}`)
        }
      }
    }

    log.header('💡 Recommendations')
    log.info('If upload tests failed, check:')
    log.info('1. Supabase RLS policies for storage buckets')
    log.info('2. Bucket permissions (should be public for product images)')
    log.info('3. User authentication and role permissions')
    log.info('4. File size limits in bucket settings')

  } catch (error) {
    log.error(`Storage diagnosis failed: ${error.message}`)
  }
}

// Run the diagnosis
diagnoseStorage().catch(error => {
  console.error('Diagnosis script failed:', error)
  process.exit(1)
})
