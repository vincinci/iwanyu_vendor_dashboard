import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Password Reset</span>
            </CardTitle>
            <CardDescription>
              We'll send password reset instructions to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Reset Link
              </Button>
            </form>
            
            <div className="text-center">
              <Link 
                href="/auth/login" 
                className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          <p>
            Need help? Contact{" "}
            <Link href="/support" className="text-primary hover:text-primary/80">
              Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
