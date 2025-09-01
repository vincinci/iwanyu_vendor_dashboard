import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft, Home, UserPlus } from "lucide-react"

export default function AuthNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">🔐</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            🔐 Authentication not available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The authentication page you're looking for doesn't exist. Try one of these options instead.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              <Lock className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/signup">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Link>
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Homepage
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Looking for help? <Link href="/auth/login" className="text-primary hover:underline">Sign in to your account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
