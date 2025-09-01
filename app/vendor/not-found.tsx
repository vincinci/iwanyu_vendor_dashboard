import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, ArrowLeft, Home } from "lucide-react"

export default function VendorNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
            <Package className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">🛍️</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            🛍️ Vendor section not available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The vendor page you're looking for doesn't exist. Let's get you back on track.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/vendor">
              <Package className="mr-2 h-4 w-4" />
              Vendor Dashboard
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/vendor/products">
              <Package className="mr-2 h-4 w-4" />
              My Products
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
            Need help navigating? <Link href="/vendor" className="text-primary hover:underline">Return to Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
