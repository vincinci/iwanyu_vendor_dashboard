"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Edit, Eye, MoreVertical, Package } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface ProductCardProps {
  product: Product
  onEdit?: (product: Product) => void
  onView?: (product: Product) => void
  onDelete?: (product: Product) => void
}

export default function ProductCard({ product, onEdit, onView, onDelete }: ProductCardProps) {
  const primaryImage = product.images?.[0]
  const formattedPrice = new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF'
  }).format(product.price)

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
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`backdrop-blur-sm ${getStatusColor(product.status)} shadow-sm`}>
              {product.status}
            </Badge>
          </div>

          {/* Action Menu */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 shadow-sm"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(product)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(product)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Delete Product
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Image Count Indicator */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-3 right-3">
              <Badge className="backdrop-blur-sm bg-black/50 text-white border-0 shadow-sm">
                +{product.images.length - 1} more
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and Category */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-gray-900 dark:text-gray-100">
              {product.name}
            </h3>
            {product.category && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {product.category}
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price and Inventory */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formattedPrice}
              </p>
              {product.track_inventory && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.inventory_quantity || 0} in stock
                </p>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(product)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created {new Date(product.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
