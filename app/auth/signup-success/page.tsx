import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Building2 } from "lucide-react"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-lg p-3">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Iwanyu</h1>
          <p className="text-muted-foreground mt-2">E-commerce Platform</p>
        </div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-green-700">Account Created Successfully!</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please check your email to verify your account
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <Mail className="h-6 w-6 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                We've sent a verification email to your inbox. Please click the link in the email to activate your
                account.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or contact support.
              </p>

              <Button asChild className="w-full">
                <Link href="/auth/login">Return to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <Link href="/support" className="text-primary hover:text-primary/80">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
