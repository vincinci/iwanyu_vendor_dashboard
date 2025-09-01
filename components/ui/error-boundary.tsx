"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryProps {
  error?: Error
  reset?: () => void
  title?: string
  description?: string
}

export function ErrorBoundary({
  error,
  reset,
  title = "Something went wrong",
  description = "An error occurred while loading this content. Please try again.",
}: ErrorBoundaryProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-red-900">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">Error details</summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">{error.message}</pre>
          </details>
        )}
      </CardHeader>
      {reset && (
        <CardContent className="text-center">
          <Button onClick={reset} variant="outline" className="w-full bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
