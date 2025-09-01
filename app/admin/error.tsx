'use client'

import { useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Shield } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin section error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">Error</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Admin Dashboard Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            An error occurred in the admin dashboard. Please try refreshing or return to the main dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/">
              <Shield className="mr-2 h-4 w-4" />
              Homepage
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            System administrator? <Link href="/admin" className="text-primary hover:underline">Return to admin panel</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
