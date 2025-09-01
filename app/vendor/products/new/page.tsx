"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { uploadFile, saveFileMetadata, STORAGE_BUCKETS } from "@/lib/supabase/storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, X, CheckCircle, Loader2, Camera, Package, ImageIcon } from "lucide-react"
import Link from "next/link"

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
}

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: boolean }>({})
  const [categories, setCategories] = useState<Category[]>([])
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
    status: "draft",
    featured: false,
    tags: "",
    seoTitle: "",
    seoDescription: "",
  })

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('status', 'active')
          .order('name')
        
        if (error) {
          console.error('Error loading categories:', error)
          // Use actual database categories with UUIDs
          setCategories([
            { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Electronics' },
            { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Clothing & Fashion' },
            { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Home & Garden' },
            { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Sports & Outdoors' },
            { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Books & Media' },
          ])
        } else {
          setCategories(data || [])
        }
      } catch (err) {
        console.error('Categories load error:', err)
        setCategories([
          { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Electronics' },
          { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Clothing & Fashion' },
          { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Home & Garden' },
          { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Sports & Outdoors' },
        ])
      }
    }
    
    loadCategories()
  }, [])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: UploadedImage[] = []
    
    for (let i = 0; i < files.length && (images.length + newImages.length) < 5; i++) {
      const file = files[i]
      if (file.type.startsWith("image/")) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          uploaded: false,
        })
      }
    }

    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const uploadImages = async () => {
    const uploadPromises = images.map(async (image, index) => {
      if (image.uploaded) return image

      setUploadProgress((prev) => ({ ...prev, [index]: true }))

      try {
        const uploadResult = await uploadFile(image.file, STORAGE_BUCKETS.PRODUCTS, `products`)

        if (uploadResult.success && uploadResult.data) {
          console.log('File uploaded successfully:', uploadResult.data.path)

          setUploadProgress((prev) => ({ ...prev, [index]: false }))

          return {
            ...image,
            uploaded: true,
            url: uploadResult.data.publicUrl,
            path: uploadResult.data.path,
          }
        } else {
          throw new Error(uploadResult.error || "Upload failed")
        }
      } catch (error) {
        setUploadProgress((prev) => ({ ...prev, [index]: false }))
        console.error(`Upload failed for image ${index}:`, error)
        throw error
      }
    })

    try {
      const uploadedImages = await Promise.all(uploadPromises)
      setImages(uploadedImages)
      return uploadedImages
    } catch (error) {
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error("Product name is required")
      }
      if (!formData.price || Number.parseFloat(formData.price) <= 0) {
        throw new Error("Valid price is required")
      }
      if (!formData.category) {
        throw new Error("Category is required")
      }

      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("You must be logged in to create products")
      }

      // Upload images first
      let uploadedImages: UploadedImage[] = []
      if (images.length > 0) {
        uploadedImages = await uploadImages()
      }

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
      }

      // Insert product into database via API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const { data: product } = await response.json()

      setSuccess("Product created successfully! Redirecting...")
      
      // Reset form
      setFormData({
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
        status: "draft",
        featured: false,
        tags: "",
        seoTitle: "",
        seoDescription: "",
      })
      setImages([])

      // Redirect after delay
      setTimeout(() => {
        router.push('/vendor/products')
      }, 2000)

    } catch (error) {
      console.error("Product creation error:", error)
      setError(error instanceof Error ? error.message : "Failed to create product")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30 p-3 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Mobile-First Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/vendor/products">
              <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Add New Product</h1>
              <p className="text-sm text-gray-600 md:text-base">Create a new product for your store</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Total Products: {images.length}/5 images</span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mobile-Optimized Image Upload */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                Product Images
              </CardTitle>
              <CardDescription>
                Upload up to 5 high-quality images. First image will be the main product photo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Grid - Mobile Responsive */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {images.map((image, index) => (
                  <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100">
                    <img
                      src={image.preview}
                      alt={`Product ${index + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {uploadProgress[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    {image.uploaded && (
                      <div className="absolute right-1 top-1">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                        Main
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Upload Button */}
                {images.length < 5 && (
                  <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <ImageIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-600" />
                    <span className="text-xs text-gray-500 group-hover:text-gray-700">
                      Add Image
                    </span>
                  </label>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, WebP. Max size: 5MB per image.
              </p>
            </CardContent>
          </Card>

          {/* Product Details - Mobile-First Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential product details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter product name"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your product..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Price (RWF) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice" className="text-sm font-medium">
                      Compare Price
                    </Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={(e) => handleInputChange("compareAtPrice", e.target.value)}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="h-11">
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
                  <Label htmlFor="brand" className="text-sm font-medium">
                    Brand
                  </Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    placeholder="Brand name"
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory & Settings</CardTitle>
                <CardDescription>Stock management and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Track Inventory</Label>
                    <p className="text-xs text-gray-500">Monitor stock levels</p>
                  </div>
                  <Switch
                    checked={formData.trackInventory}
                    onCheckedChange={(checked) => handleInputChange("trackInventory", checked)}
                  />
                </div>

                {formData.trackInventory && (
                  <div className="space-y-2">
                    <Label htmlFor="inventoryQuantity" className="text-sm font-medium">
                      Stock Quantity
                    </Label>
                    <Input
                      id="inventoryQuantity"
                      type="number"
                      value={formData.inventoryQuantity}
                      onChange={(e) => handleInputChange("inventoryQuantity", e.target.value)}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-medium">
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Product SKU"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    placeholder="0.00"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Featured Product</Label>
                    <p className="text-xs text-gray-500">Show in featured section</p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => handleInputChange("featured", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEO & Tags */}
          <Card>
            <CardHeader>
              <CardTitle>SEO & Tags</CardTitle>
              <CardDescription>Search optimization and categorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle" className="text-sm font-medium">
                    SEO Title
                  </Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                    placeholder="SEO-friendly title"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription" className="text-sm font-medium">
                  SEO Description
                </Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange("seoDescription", e.target.value)}
                  placeholder="Brief description for search engines"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons - Mobile Sticky */}
          <div className="sticky bottom-0 z-10 border-t bg-white p-4 md:relative md:border-0 md:bg-transparent md:p-0">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/vendor/products')}
                className="flex-1 h-11 md:flex-none"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-11 md:flex-none md:min-w-[120px]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
