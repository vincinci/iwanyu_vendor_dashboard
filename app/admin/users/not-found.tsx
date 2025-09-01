import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft, UserPlus } from "lucide-react"

export default function UsersNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">👥</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            👥 User not available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The user page you're looking for doesn't exist. The user may have been removed or the URL is incorrect.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              View All Users
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/admin/vendors">
              <UserPlus className="mr-2 h-4 w-4" />
              Manage Vendors
            </Link>
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Looking for a specific user? <Link href="/admin/users" className="text-primary hover:underline">Browse user directory</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
