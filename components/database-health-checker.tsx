'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Database, Upload, Loader2 } from 'lucide-react'

interface SystemCheck {
  name: string
  status: 'checking' | 'pass' | 'fail' | 'warning'
  message: string
  action?: string
}

export function DatabaseHealthChecker() {
  const [checks, setChecks] = useState<SystemCheck[]>([
    { name: 'Categories Table', status: 'checking', message: 'Checking...' },
    { name: 'Notifications Table', status: 'checking', message: 'Checking...' },
    { name: 'Products Storage Bucket', status: 'checking', message: 'Checking...' },
    { name: 'Profiles Table', status: 'checking', message: 'Checking...' },
  ])
  
  const [isFixing, setIsFixing] = useState(false)

  useEffect(() => {
    runHealthChecks()
  }, [])

  const runHealthChecks = async () => {
    const supabase = createClient()
    const updatedChecks: SystemCheck[] = []

    // Check Categories table
    try {
      const { data, error } = await supabase.from('categories').select('count', { count: 'exact' }).limit(1)
      if (error) {
        updatedChecks.push({
          name: 'Categories Table',
          status: 'fail',
          message: 'Categories table missing - product categorization not available',
          action: 'Run database setup script'
        })
      } else {
        updatedChecks.push({
          name: 'Categories Table',
          status: 'pass',
          message: `Categories table exists with ${data.length} categories`
        })
      }
    } catch (error) {
      updatedChecks.push({
        name: 'Categories Table',
        status: 'fail',
        message: 'Failed to check categories table',
        action: 'Run database setup script'
      })
    }

    // Check Notifications table
    try {
      const { data, error } = await supabase.from('notifications').select('count', { count: 'exact' }).limit(1)
      if (error) {
        updatedChecks.push({
          name: 'Notifications Table',
          status: 'fail',
          message: 'Notifications table missing - user notifications not available',
          action: 'Run database setup script'
        })
      } else {
        updatedChecks.push({
          name: 'Notifications Table',
          status: 'pass',
          message: 'Notifications table exists and accessible'
        })
      }
    } catch (error) {
      updatedChecks.push({
        name: 'Notifications Table',
        status: 'fail',
        message: 'Failed to check notifications table',
        action: 'Run database setup script'
      })
    }

    // Check Storage bucket
    try {
      const { data, error } = await supabase.storage.getBucket('products')
      if (error || !data) {
        updatedChecks.push({
          name: 'Products Storage Bucket',
          status: 'fail',
          message: 'Products storage bucket missing - image uploads will fail',
          action: 'Create storage bucket in Supabase dashboard'
        })
      } else {
        updatedChecks.push({
          name: 'Products Storage Bucket',
          status: 'pass',
          message: `Products bucket exists (${data.public ? 'public' : 'private'})`
        })
      }
    } catch (error) {
      updatedChecks.push({
        name: 'Products Storage Bucket',
        status: 'fail',
        message: 'Failed to check storage bucket',
        action: 'Check storage configuration'
      })
    }

    // Check Profiles table
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' }).limit(1)
      if (error) {
        updatedChecks.push({
          name: 'Profiles Table',
          status: 'warning',
          message: 'Profiles table missing - user management limited',
          action: 'Run database setup script'
        })
      } else {
        updatedChecks.push({
          name: 'Profiles Table',
          status: 'pass',
          message: 'Profiles table exists and accessible'
        })
      }
    } catch (error) {
      updatedChecks.push({
        name: 'Profiles Table',
        status: 'warning',
        message: 'Failed to check profiles table',
        action: 'Run database setup script'
      })
    }

    setChecks(updatedChecks)
  }

  const runQuickFix = async () => {
    setIsFixing(true)
    // Here you could implement an automated fix
    // For now, we'll just provide instructions
    setTimeout(() => {
      setIsFixing(false)
    }, 2000)
  }

  const failedChecks = checks.filter(check => check.status === 'fail')
  const warningChecks = checks.filter(check => check.status === 'warning')
  const overallStatus = failedChecks.length > 0 ? 'fail' : warningChecks.length > 0 ? 'warning' : 'pass'

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Health Check
        </CardTitle>
        <CardDescription>
          System status and configuration validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert className={overallStatus === 'fail' ? 'border-destructive' : overallStatus === 'warning' ? 'border-yellow-500' : 'border-green-500'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {overallStatus === 'fail' && `${failedChecks.length} critical issues found. Database setup required.`}
            {overallStatus === 'warning' && `${warningChecks.length} warnings found. Some features may be limited.`}
            {overallStatus === 'pass' && 'All systems operational. Database is properly configured.'}
          </AlertDescription>
        </Alert>

        {/* Individual Checks */}
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {check.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {check.status === 'pass' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {check.status === 'fail' && <XCircle className="h-4 w-4 text-destructive" />}
                {check.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                <div>
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-muted-foreground">{check.message}</div>
                  {check.action && (
                    <div className="text-xs text-blue-600 mt-1">Action: {check.action}</div>
                  )}
                </div>
              </div>
              <Badge variant={check.status === 'pass' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'}>
                {check.status === 'checking' ? 'Checking' : check.status === 'pass' ? 'OK' : check.status === 'warning' ? 'Warning' : 'Failed'}
              </Badge>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {(failedChecks.length > 0 || warningChecks.length > 0) && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={runHealthChecks} variant="outline" size="sm">
              Recheck
            </Button>
            <Button onClick={runQuickFix} disabled={isFixing} size="sm">
              {isFixing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                'View Fix Instructions'
              )}
            </Button>
          </div>
        )}

        {/* Quick Instructions */}
        {failedChecks.length > 0 && (
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              <strong>Quick Fix:</strong> Run the FIX_MISSING_TABLES_AND_STORAGE.sql script in your Supabase SQL editor to resolve all database issues automatically.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
