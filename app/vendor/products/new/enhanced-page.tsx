"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase-client"
import { uploadFile, STORAGE_BUCKETS } from "@/utils/supabase-storage"
import { authenticatedFetch } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Upload, X, CheckCircle, Loader2, Camera, Package, ImageIcon, Plus, Palette, Ruler, Shirt } from "lucide-react"
import Link from "next/link"

// Predefined color options with hex values
const PRESET_COLORS = [
  { name: "Red", value: "red", hex: "#ef4444", rgb: "239, 68, 68" },
  { name: "Pink", value: "pink", hex: "#ec4899", rgb: "236, 72, 153" },
  { name: "Purple", value: "purple", hex: "#a855f7", rgb: "168, 85, 247" },
  { name: "Yellow", value: "yellow", hex: "#eab308", rgb: "234, 179, 8" },
  { name: "Black", value: "black", hex: "#000000", rgb: "0, 0, 0" },
  { name: "White", value: "white", hex: "#ffffff", rgb: "255, 255, 255" },
  { name: "Blue", value: "blue", hex: "#3b82f6", rgb: "59, 130, 246" },
  { name: "Green", value: "green", hex: "#22c55e", rgb: "34, 197, 94" },
]

// Predefined size options
const PRESET_SIZES = {
  general: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  shoes: {
    eu: ["39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5", "45", "45.5", "46", "47", "48"],
    us: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14", "15"],
    uk: ["5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14"]
  },
  clothing: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"],
  numbers: ["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30"]
}

interface ProductVariant {
  id: string
  color?: string
  size?: string
  price?: number
  sku?: string
  inventory?: number
  image?: string
}

interface UploadedImage {
  file: File
  preview: string
  uploaded: boolean
  url?: string
  path?: string
}

interface Category {
  id: string
  name: string
  description?: string
  requires_variants?: boolean
  variant_types?: string[]
}

const ColorSelector: React.FC<{
  selectedColors: string[]
  onColorChange: (colors: string[]) => void
  animated?: boolean
}> = ({ selectedColors, onColorChange, animated = true }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const toggleColor = (colorValue: string) => {
    if (animated) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }

    const newColors = selectedColors.includes(colorValue)
      ? selectedColors.filter(c => c !== colorValue)
      : [...selectedColors, colorValue]
    onColorChange(newColors)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Palette className="h-4 w-4" />
        Available Colors
      </Label>
      <div className={`grid grid-cols-4 md:grid-cols-8 gap-2 transition-all duration-300 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
        {PRESET_COLORS.map((color) => (
          <div
            key={color.value}
            className={`relative cursor-pointer group transition-all duration-200 hover:scale-110 ${
              selectedColors.includes(color.value) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
            onClick={() => toggleColor(color.value)}
          >
            <div
              className={`w-12 h-12 rounded-lg shadow-md transition-all duration-200 ${
                color.value === 'white' ? 'border border-gray-200' : ''
              }`}
              style={{ backgroundColor: color.hex }}
            />
            <div className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${
              selectedColors.includes(color.value) 
                ? 'bg-black bg-opacity-20 opacity-100' 
                : 'bg-black bg-opacity-0 opacity-0 group-hover:opacity-100 group-hover:bg-opacity-10'
            }`}>
              {selectedColors.includes(color.value) && (
                <CheckCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-white animate-pulse" />
              )}
            </div>
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {color.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SizeSelector: React.FC<{
  category: string
  selectedSizes: string[]
  onSizeChange: (sizes: string[]) => void
  sizeSystem?: string
}> = ({ category, selectedSizes, onSizeChange, sizeSystem = "general" }) => {
  const getSizeOptions = () => {
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes('shoe') || lowerCategory.includes('footwear')) {
      return PRESET_SIZES.shoes[sizeSystem as keyof typeof PRESET_SIZES.shoes] || PRESET_SIZES.shoes.eu
    }
    if (lowerCategory.includes('clothing') || lowerCategory.includes('apparel')) {
      return PRESET_SIZES.clothing
    }
    if (lowerCategory.includes('dress') || lowerCategory.includes('pants')) {
      return PRESET_SIZES.numbers
    }
    return PRESET_SIZES.general
  }

  const toggleSize = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size]
    onSizeChange(newSizes)
  }

  const sizeOptions = getSizeOptions()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Available Sizes
        </Label>
        {category.toLowerCase().includes('shoe') && (
          <Select value={sizeSystem} onValueChange={(value) => {}}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eu">EU</SelectItem>
              <SelectItem value="us">US</SelectItem>
              <SelectItem value="uk">UK</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {sizeOptions.map((size) => (
          <Button
            key={size}
            variant={selectedSizes.includes(size) ? "default" : "outline"}
            size="sm"
            className="h-10 transition-all duration-200 hover:scale-105"
            onClick={() => toggleSize(size)}
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  )
}

const VariantManager: React.FC<{
  colors: string[]
  sizes: string[]
  basePrice: number
  onVariantsChange: (variants: ProductVariant[]) => void
}> = ({ colors, sizes, basePrice, onVariantsChange }) => {
  const [variants, setVariants] = useState<ProductVariant[]>([])

  useEffect(() => {
    // Generate variants based on color and size combinations
    const newVariants: ProductVariant[] = []
    
    if (colors.length === 0 && sizes.length === 0) {
      setVariants([])
      onVariantsChange([])
      return
    }

    if (colors.length > 0 && sizes.length > 0) {
      // Color + Size combinations
      colors.forEach(color => {
        sizes.forEach(size => {
          newVariants.push({
            id: `${color}-${size}`,
            color,
            size,
            price: basePrice,
            sku: `PRD-${color.toUpperCase()}-${size}`,
            inventory: 0
          })
        })
      })
    } else if (colors.length > 0) {
      // Only colors
      colors.forEach(color => {
        newVariants.push({
          id: color,
          color,
          price: basePrice,
          sku: `PRD-${color.toUpperCase()}`,
          inventory: 0
        })
      })
    } else if (sizes.length > 0) {
      // Only sizes
      sizes.forEach(size => {
        newVariants.push({
          id: size,
          size,
          price: basePrice,
          sku: `PRD-${size}`,
          inventory: 0
        })
      })
    }

    setVariants(newVariants)
    onVariantsChange(newVariants)
  }, [colors, sizes, basePrice, onVariantsChange])

  const updateVariant = (variantId: string, field: keyof ProductVariant, value: any) => {
    const updatedVariants = variants.map(variant =>
      variant.id === variantId ? { ...variant, [field]: value } : variant
    )
    setVariants(updatedVariants)
    onVariantsChange(updatedVariants)
  }

  const getColorDisplay = (colorValue: string) => {
    const color = PRESET_COLORS.find(c => c.value === colorValue)
    return color ? (
      <div className="flex items-center gap-2">
        <div 
          className="w-4 h-4 rounded-full border border-gray-200" 
          style={{ backgroundColor: color.hex }}
        />
        <span>{color.name}</span>
      </div>
    ) : <span>{colorValue}</span>
  }

  if (variants.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shirt className="h-4 w-4" />
        <Label className="text-sm font-medium">Product Variants ({variants.length})</Label>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {variants.map((variant) => (
          <Card key={variant.id} className="p-4 transition-all duration-200 hover:shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Variant</Label>
                <div className="space-y-1">
                  {variant.color && getColorDisplay(variant.color)}
                  {variant.size && (
                    <Badge variant="outline" className="text-xs">
                      Size: {variant.size}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variant.price !== undefined ? variant.price.toString() : ''}
                  onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">SKU</Label>
                <Input
                  value={variant.sku || ''}
                  onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Inventory</Label>
                <Input
                  type="number"
                  value={variant.inventory !== undefined ? variant.inventory.toString() : ''}
                  onChange={(e) => updateVariant(variant.id, 'inventory', parseInt(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Image</Label>
                <Button variant="outline" size="sm" className="h-8 w-full">
                  <Camera className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function EnhancedNewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: boolean }>({})
  const [categories, setCategories] = useState<Category[]>([])
  
  // Enhanced form data with variants
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    category: "",
    brand: "",
    inventoryQuantity: "",
    trackInventory: true,
    sku: "",
    weight: "",
    status: "active",
    featured: false,
    seoTitle: "",
    seoDescription: "",
    tags: "",
    hasVariants: false,
  })

  // Variant management
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [sizeSystem, setSizeSystem] = useState("eu")

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const selectedCategory = categories.find(cat => cat.id === formData.category)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Upload images first
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          if (img.uploaded) return { url: img.url, path: img.path }
          
          const result = await uploadFile(img.file, STORAGE_BUCKETS.PRODUCTS, "products")
          if (!result.success) {
            throw new Error(result.error)
          }
          return { url: result.data!.publicUrl, path: result.data!.path }
        })
      )

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: Number.parseFloat(formData.price),
        compare_at_price: formData.compareAtPrice ? Number.parseFloat(formData.compareAtPrice) : null,
        sku: formData.sku.trim() || null,
        inventory_quantity: Number.parseInt(formData.inventoryQuantity) || 0,
        track_inventory: formData.trackInventory,
        category_id: formData.category,
        brand: formData.brand.trim() || null,
        weight: formData.weight ? Number.parseFloat(formData.weight) : null,
        status: formData.status,
        featured: formData.featured,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        images: uploadedImages.map(img => ({
          url: img.url,
          path: img.path
        })),
        has_variants: formData.hasVariants,
        variants: formData.hasVariants ? variants : [],
      }

      // Create product via API
      const response = await authenticatedFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const { data: product } = await response.json()

      setSuccess("Product created successfully! Redirecting...")
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/vendor/products/${product.id}`)
      }, 2000)

    } catch (error) {
      console.error("Error creating product:", error)
      setError(error instanceof Error ? error.message : "Failed to create product")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList) => {
    const newImages: UploadedImage[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploaded: false
    }))

    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vendor/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Product</h1>
          <p className="text-gray-600">Add a new product with variants, colors, and sizes</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="seo">SEO & Details</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details of your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">Compare at Price</Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your product..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasVariants"
                    checked={formData.hasVariants}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasVariants: checked }))}
                  />
                  <Label htmlFor="hasVariants">This product has variants (colors, sizes, etc.)</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants" className="space-y-6">
            {formData.hasVariants ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Variants</CardTitle>
                    <CardDescription>
                      Configure colors, sizes, and other variant options for your product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <ColorSelector
                      selectedColors={selectedColors}
                      onColorChange={setSelectedColors}
                      animated={true}
                    />

                    <Separator />

                    <SizeSelector
                      category={selectedCategory?.name || ""}
                      selectedSizes={selectedSizes}
                      onSizeChange={setSelectedSizes}
                      sizeSystem={sizeSystem}
                    />

                    {(selectedColors.length > 0 || selectedSizes.length > 0) && (
                      <>
                        <Separator />
                        <VariantManager
                          colors={selectedColors}
                          sizes={selectedSizes}
                          basePrice={parseFloat(formData.price) || 0}
                          onVariantsChange={setVariants}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shirt className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Variants Enabled</h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    Enable variants in the Basic Info tab to configure colors, sizes, and other options for your product.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload images for your product. The first image will be used as the main image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 text-gray-400">
                        <ImageIcon className="w-full h-full" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">Upload Images</p>
                        <p className="text-gray-500">PNG, JPG, WEBP up to 10MB each</p>
                      </div>
                      <Button type="button" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  </label>
                </div>

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={image.preview}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2">Main</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO & Details Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Additional Details</CardTitle>
                <CardDescription>
                  Optimize your product for search engines and add additional details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="SEO optimized title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="SEO meta description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-sm text-gray-500">Separate tags with commas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    />
                    <Label htmlFor="featured">Featured Product</Label>
                  </div>
                </div>

                {!formData.hasVariants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="inventoryQuantity">Inventory Quantity</Label>
                      <Input
                        id="inventoryQuantity"
                        type="number"
                        value={formData.inventoryQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, inventoryQuantity: e.target.value }))}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="trackInventory"
                        checked={formData.trackInventory}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackInventory: checked }))}
                      />
                      <Label htmlFor="trackInventory">Track Inventory</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
