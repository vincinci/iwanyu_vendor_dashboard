import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, Plus, ArrowLeft } from "lucide-react"

export default function ProductsNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-6">
            <Package className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">📦</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            📦 Product not available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The product page you're looking for doesn't exist. It may have been removed or the URL is incorrect.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/vendor/products">
              <Package className="mr-2 h-4 w-4" />
              View All Products
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/vendor/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Link>
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/vendor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Can't find your product? <Link href="/vendor/products" className="text-primary hover:underline">Browse all products</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
