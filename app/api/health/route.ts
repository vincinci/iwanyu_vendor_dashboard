import { createClient } from "@/utils/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Health check results
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'checking' as 'healthy' | 'unhealthy' | 'checking', latency: 0, error: null as string | null },
        api: { status: 'healthy' as 'healthy' | 'unhealthy', latency: 0 },
        dependencies: { status: 'healthy' as 'healthy' | 'unhealthy' } as { status: 'healthy' | 'unhealthy'; missing_env_vars?: string[] },
        memory: { usage: 0, limit: 0 },
        uptime: process.uptime()
      }
    }

    // Database connectivity check
    try {
      const dbStartTime = Date.now()
      const supabase = await createClient()
      
      // Simple query to test database connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single()
      
      const dbLatency = Date.now() - dbStartTime
      
      if (error) {
        healthChecks.checks.database = {
          status: 'unhealthy',
          latency: dbLatency,
          error: error.message
        }
        healthChecks.status = 'degraded'
      } else {
        healthChecks.checks.database = {
          status: 'healthy',
          latency: dbLatency,
          error: null
        }
      }
    } catch (dbError: any) {
      healthChecks.checks.database = {
        status: 'unhealthy',
        latency: 0,
        error: dbError.message
      }
      healthChecks.status = 'unhealthy'
    }

    // Memory usage check
    const memUsage = process.memoryUsage()
    healthChecks.checks.memory = {
      usage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      limit: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    }

    // API response time
    healthChecks.checks.api.latency = Date.now() - startTime

    // Critical environment variables check
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      healthChecks.checks.dependencies = {
        status: 'unhealthy',
        missing_env_vars: missingEnvVars
      }
      healthChecks.status = 'unhealthy'
    }

    // Determine overall status
    if (healthChecks.status === 'unhealthy') {
      return NextResponse.json(healthChecks, { status: 503 })
    } else if (healthChecks.status === 'degraded') {
      return NextResponse.json(healthChecks, { status: 200 })
    }

    return NextResponse.json(healthChecks, { status: 200 })

  } catch (error: any) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
        checks: {
          database: { status: 'unknown' },
          api: { status: 'unhealthy' }
        }
      },
      { status: 503 }
    )
  }
}

// Simple ping endpoint for load balancers
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
