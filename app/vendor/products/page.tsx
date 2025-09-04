"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Grid, List, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CreateProductModal from "@/components/vendor/create-product-modal"
import ProductCard from "@/components/vendor/product-card"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category?: string
  status: 'active' | 'draft' | 'archived'
  images: string[]
  inventory_quantity?: number
  track_inventory: boolean
  created_at: string
}

export default function ProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading products:', error)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive"
        })
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateSuccess = () => {
    loadProducts() // Refresh the products list
    toast({
      title: "Success",
      description: "Product created successfully!",
    })
  }

  const handleEditProduct = (product: Product) => {
    router.push(`/vendor/products/edit/${product.id}`)
  }

  const handleViewProduct = (product: Product) => {
    router.push(`/vendor/products/${product.id}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Products
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your product catalog and inventory
            </p>
          </div>
          
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg lg:px-8"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-white/20 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-lg">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first product"
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onView={handleViewProduct}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && filteredProducts.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-6 justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{products.filter(p => p.status === 'active').length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{products.filter(p => p.status === 'draft').length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Draft Products</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{products.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
