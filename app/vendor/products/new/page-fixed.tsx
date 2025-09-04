"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Upload, ImageIcon, X, Star } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
}

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<{file: File, preview: string}[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    inventory_quantity: "",
    sku: "",
    status: "active" as "active" | "draft",
    track_inventory: true
  })

  useEffect(() => {
    // Load categories from database
    async function loadCategories() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')

        if (error) {
          console.error('Error loading categories:', error)
          toast({
            title: "Error",
            description: "Failed to load categories",
            variant: "destructive"
          })
          return
        }

        setCategories(data || [])
      } catch (error) {
        console.error('Error loading categories:', error)
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive"
        })
      }
    }

    loadCategories()
  }, [toast])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Modern file selection handler with validation
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    // Validate file count (max 5 images)
    const totalFiles = selectedFiles.length + files.length
    if (totalFiles > 5) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 5 images per product",
        variant: "destructive"
      })
      return
    }

    // Validate each file
    const validFiles: File[] = []
    const newPreviews: {file: File, preview: string}[] = []

    for (const file of files) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive"
        })
        continue
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        })
        continue
      }

      validFiles.push(file)
      newPreviews.push({
        file,
        preview: URL.createObjectURL(file)
      })
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
      setSelectedImagePreviews(prev => [...prev, ...newPreviews])
      
      // Set first image as primary if none selected
      if (selectedImagePreviews.length === 0) {
        setPrimaryImageIndex(0)
      }
    }
  }

  // Modern image upload with direct API call
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return []

    setUploadStatus('uploading')
    
    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`image_${index}`, file)
      })

      const response = await fetch('/api/upload-images', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('🔍 Upload response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadStatus('success')
      return result.urls || []
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🚀 Starting product creation...')
      
      // Validate required fields
      if (!formData.name || !formData.price) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      // Upload images first (if any)
      let imageUrls: string[] = []
      if (selectedFiles.length > 0) {
        console.log('📸 Uploading images...', selectedFiles.length)
        imageUrls = await uploadImages(selectedFiles)
        console.log('✅ Images uploaded:', imageUrls)
      }

      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        inventory_quantity: formData.track_inventory ? parseInt(formData.inventory_quantity) || 0 : null,
        sku: formData.sku || null,
        status: formData.status,
        track_inventory: formData.track_inventory,
        image_urls: imageUrls,
        primary_image_url: imageUrls[primaryImageIndex] || imageUrls[0] || null
      }

      console.log('📦 Creating product with data:', productData)

      // Create product
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      const result = await response.json()
      console.log('🔍 API response:', result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to create product")
      }

      toast({
        title: "Success",
        description: "Product created successfully!"
      })

      router.push("/vendor/products")
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/vendor/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product for your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Product Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Basic details about your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your product..."
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (RWF) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU (Optional)</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      placeholder="Product code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>Upload up to 5 images of your product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB each)</p>
                      </div>
                      <input
                        id="images"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>

                  {selectedImagePreviews.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Image Previews:</p>
                        <p className="text-xs text-muted-foreground">
                          Click on an image to set it as the main product image
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedImagePreviews.map((item, index) => (
                          <div 
                            key={index} 
                            className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden ${
                              index === primaryImageIndex 
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setPrimaryImageIndex(index)}
                          >
                            <div className="aspect-square relative">
                              <img
                                src={item.preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === primaryImageIndex && (
                                <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
                                  <Star className="h-3 w-3 fill-current" />
                                </div>
                              )}
                              <button
                                type="button"
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Remove this image
                                  const newPreviews = selectedImagePreviews.filter((_, i) => i !== index)
                                  const newFiles = selectedFiles.filter((_, i) => i !== index)
                                  
                                  // Clean up the removed preview URL
                                  URL.revokeObjectURL(item.preview)
                                  
                                  setSelectedImagePreviews(newPreviews)
                                  setSelectedFiles(newFiles)
                                  
                                  // Adjust primary image index if needed
                                  if (index === primaryImageIndex && newPreviews.length > 0) {
                                    setPrimaryImageIndex(0)
                                  } else if (index < primaryImageIndex) {
                                    setPrimaryImageIndex(primaryImageIndex - 1)
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="p-2 bg-gray-50">
                              <p className="text-xs text-gray-600 truncate">
                                {item.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {primaryImageIndex !== null && selectedImagePreviews.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium">Main Product Image:</span>
                            <span>{selectedImagePreviews[primaryImageIndex]?.file.name}</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            This image will be displayed on the product card and used as the main preview.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Status Indicator */}
                  {uploadStatus !== 'idle' && (
                    <div className={`p-3 rounded-lg border ${
                      uploadStatus === 'uploading' ? 'bg-blue-50 border-blue-200' :
                      uploadStatus === 'success' ? 'bg-green-50 border-green-200' :
                      uploadStatus === 'error' ? 'bg-red-50 border-red-200' : ''
                    }`}>
                      <div className="flex items-center gap-2">
                        {uploadStatus === 'uploading' && (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-sm text-blue-700 font-medium">Uploading images...</span>
                          </>
                        )}
                        {uploadStatus === 'success' && (
                          <>
                            <div className="h-4 w-4 bg-green-600 rounded-full flex items-center justify-center">
                              <div className="h-2 w-2 bg-white rounded-full"></div>
                            </div>
                            <span className="text-sm text-green-700 font-medium">Images uploaded successfully!</span>
                          </>
                        )}
                        {uploadStatus === 'error' && (
                          <>
                            <X className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">Upload failed - please try again</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => handleInputChange("category_id", value)}>
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "active" | "draft") => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="track_inventory"
                    checked={formData.track_inventory}
                    onCheckedChange={(checked) => handleInputChange("track_inventory", checked)}
                  />
                  <Label htmlFor="track_inventory">Track inventory</Label>
                </div>

                {formData.track_inventory && (
                  <div className="space-y-2">
                    <Label htmlFor="inventory_quantity">Quantity *</Label>
                    <Input
                      id="inventory_quantity"
                      type="number"
                      min="0"
                      value={formData.inventory_quantity}
                      onChange={(e) => handleInputChange("inventory_quantity", e.target.value)}
                      placeholder="0"
                      required={formData.track_inventory}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/vendor/products">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
