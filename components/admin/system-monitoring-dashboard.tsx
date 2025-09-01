"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Shield, 
  Activity, 
  Server, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  Users,
  TrendingUp,
  RefreshCw
} from "lucide-react"

interface HealthStatus {
  timestamp: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  environment: string
  checks: {
    database: { status: string; latency: number; error: string | null }
    api: { status: string; latency: number }
    dependencies: { status: string; missing_env_vars?: string[] }
    memory: { usage: number; limit: number }
    uptime: number
  }
}

interface SecurityAudit {
  timestamp: string
  security_score: number
  overall_status: 'secure' | 'moderate' | 'insecure'
  total_checks: number
  passed: number
  warnings: number
  failures: number
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
    details?: any
  }>
  recommendations: string[]
}

interface PerformanceMetrics {
  response_times: {
    api_average: number
    database_average: number
    p95: number
    p99: number
  }
  throughput: {
    requests_per_minute: number
    peak_requests: number
  }
  errors: {
    error_rate: number
    total_errors: number
  }
}

export default function SystemMonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [securityAudit, setSecurityAudit] = useState<SecurityAudit | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health')
      if (!response.ok) throw new Error('Failed to fetch health status')
      const data = await response.json()
      setHealthStatus(data)
    } catch (err: any) {
      console.error('Health check failed:', err)
    }
  }

  const fetchSecurityAudit = async () => {
    try {
      const response = await fetch('/api/admin/security-audit')
      if (!response.ok) throw new Error('Failed to fetch security audit')
      const data = await response.json()
      setSecurityAudit(data)
    } catch (err: any) {
      console.error('Security audit failed:', err)
    }
  }

  const fetchPerformanceMetrics = async () => {
    try {
      // Mock performance data for now
      setPerformanceMetrics({
        response_times: {
          api_average: 125,
          database_average: 45,
          p95: 250,
          p99: 500
        },
        throughput: {
          requests_per_minute: 342,
          peak_requests: 1250
        },
        errors: {
          error_rate: 0.8,
          total_errors: 12
        }
      })
    } catch (err: any) {
      console.error('Performance metrics failed:', err)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchHealthStatus(),
        fetchSecurityAudit(),
        fetchPerformanceMetrics()
      ])
      setLastUpdated(new Date())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadAllData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
      case 'secure':
        return 'text-green-600'
      case 'degraded':
      case 'warning':
      case 'moderate':
        return 'text-yellow-600'
      case 'unhealthy':
      case 'fail':
      case 'insecure':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
      case 'secure':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded':
      case 'warning':
      case 'moderate':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy':
      case 'fail':
      case 'insecure':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading && !healthStatus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <div className="animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button onClick={loadAllData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {healthStatus && getStatusIcon(healthStatus.status)}
              <div className={`text-2xl font-bold ${healthStatus ? getStatusColor(healthStatus.status) : ''}`}>
                {healthStatus?.status || 'Unknown'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {healthStatus ? formatUptime(healthStatus.checks.uptime) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityAudit?.security_score || 0}%
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {securityAudit && getStatusIcon(securityAudit.overall_status)}
              <span className={`text-sm ${securityAudit ? getStatusColor(securityAudit.overall_status) : ''}`}>
                {securityAudit?.overall_status || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics?.response_times.api_average || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              P95: {performanceMetrics?.response_times.p95 || 0}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics?.errors.error_rate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics?.errors.total_errors || 0} total errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="security">Security Audit</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Details</CardTitle>
              <CardDescription>
                Detailed health status of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthStatus ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Database</span>
                        <Badge variant={healthStatus.checks.database.status === 'healthy' ? 'default' : 'destructive'}>
                          {healthStatus.checks.database.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Latency: {healthStatus.checks.database.latency}ms
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">API</span>
                        <Badge variant={healthStatus.checks.api.status === 'healthy' ? 'default' : 'destructive'}>
                          {healthStatus.checks.api.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Latency: {healthStatus.checks.api.latency}ms
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Memory Usage</span>
                        <span className="text-sm">
                          {healthStatus.checks.memory.usage}MB / {healthStatus.checks.memory.limit}MB
                        </span>
                      </div>
                      <Progress 
                        value={(healthStatus.checks.memory.usage / healthStatus.checks.memory.limit) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Dependencies</span>
                        <Badge variant={healthStatus.checks.dependencies.status === 'healthy' ? 'default' : 'destructive'}>
                          {healthStatus.checks.dependencies.status}
                        </Badge>
                      </div>
                      {healthStatus.checks.dependencies.missing_env_vars && (
                        <div className="text-sm text-red-600">
                          Missing: {healthStatus.checks.dependencies.missing_env_vars.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No health data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Results</CardTitle>
              <CardDescription>
                Comprehensive security assessment of the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityAudit ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{securityAudit.passed}</div>
                      <div className="text-sm text-muted-foreground">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{securityAudit.warnings}</div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{securityAudit.failures}</div>
                      <div className="text-sm text-muted-foreground">Failures</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Security Checks</h4>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {securityAudit.checks.map((check, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(check.status)}
                              <div>
                                <div className="font-medium">{check.name}</div>
                                <div className="text-sm text-muted-foreground">{check.message}</div>
                              </div>
                            </div>
                            <Badge variant={
                              check.status === 'pass' ? 'default' : 
                              check.status === 'warning' ? 'secondary' : 'destructive'
                            }>
                              {check.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {securityAudit.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No security audit data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                System performance and throughput statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceMetrics ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">Response Times</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>API Average</span>
                        <span className="font-mono">{performanceMetrics.response_times.api_average}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Database Average</span>
                        <span className="font-mono">{performanceMetrics.response_times.database_average}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>95th Percentile</span>
                        <span className="font-mono">{performanceMetrics.response_times.p95}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>99th Percentile</span>
                        <span className="font-mono">{performanceMetrics.response_times.p99}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Throughput & Errors</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Requests/Minute</span>
                        <span className="font-mono">{performanceMetrics.throughput.requests_per_minute}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peak Requests</span>
                        <span className="font-mono">{performanceMetrics.throughput.peak_requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate</span>
                        <span className={`font-mono ${performanceMetrics.errors.error_rate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                          {performanceMetrics.errors.error_rate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Errors</span>
                        <span className="font-mono">{performanceMetrics.errors.total_errors}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
