"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, Upload, Star, Loader2, Check, Plus, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
}

interface CreateProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
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
    if (isOpen) {
      loadCategories()
      // Reset form when opening
      setCurrentStep(1)
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        inventory_quantity: "",
        sku: "",
        status: "active",
        track_inventory: true
      })
      setSelectedFiles([])
      setSelectedImagePreviews([])
      setPrimaryImageIndex(0)
      setUploadStatus('idle')
    }
  }, [isOpen])

  const loadCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error loading categories:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    const totalFiles = selectedFiles.length + files.length
    if (totalFiles > 5) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 5 images per product",
        variant: "destructive"
      })
      return
    }

    const validFiles: File[] = []
    const newPreviews: {file: File, preview: string}[] = []

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive"
        })
        continue
      }

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
      
      if (selectedImagePreviews.length === 0) {
        setPrimaryImageIndex(0)
      }
    }
  }

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

  const handleSubmit = async () => {
    setLoading(true)

    try {
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
        imageUrls = await uploadImages(selectedFiles)
      }

      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category_id || null,
        inventory_quantity: formData.track_inventory ? parseInt(formData.inventory_quantity) || 0 : null,
        sku: formData.sku || null,
        status: formData.status,
        track_inventory: formData.track_inventory,
        image_urls: imageUrls,
        primary_image_url: imageUrls[primaryImageIndex] || imageUrls[0] || null
      }

      // Create product
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create product")
      }

      toast({
        title: "Success",
        description: "Product created successfully!"
      })

      onSuccess()
      onClose()
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

  const removeImage = (index: number) => {
    const newPreviews = selectedImagePreviews.filter((_, i) => i !== index)
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    
    URL.revokeObjectURL(selectedImagePreviews[index].preview)
    
    setSelectedImagePreviews(newPreviews)
    setSelectedFiles(newFiles)
    
    if (index === primaryImageIndex && newPreviews.length > 0) {
      setPrimaryImageIndex(0)
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glass backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Glass container */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-2xl">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create New Product
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Step {currentStep} of 3
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="px-6 py-4">
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step <= currentStep 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {step < currentStep ? <Check className="h-4 w-4" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                        step < currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
              {/* Step 1: Images */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Product Images</h3>
                    <p className="text-gray-600 dark:text-gray-400">Upload up to 5 high-quality images</p>
                  </div>

                  {/* Upload area */}
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => document.getElementById('images')?.click()}
                  >
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-blue-400 transition-all duration-300 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG or WEBP (MAX. 5MB each)
                          </p>
                        </div>
                      </div>
                    </div>
                    <input
                      id="images"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* Image previews */}
                  {selectedImagePreviews.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          Image Previews ({selectedImagePreviews.length}/5)
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Click to set as main image
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedImagePreviews.map((item, index) => (
                          <div 
                            key={index}
                            className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                              index === primaryImageIndex 
                                ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                                : 'hover:scale-105 hover:shadow-md'
                            }`}
                            onClick={() => setPrimaryImageIndex(index)}
                          >
                            <div className="aspect-square relative backdrop-blur-sm bg-white/20 dark:bg-gray-800/20">
                              <img
                                src={item.preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Primary indicator */}
                              {index === primaryImageIndex && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full p-1.5 shadow-lg">
                                  <Star className="h-3 w-3 fill-current" />
                                </div>
                              )}
                              
                              {/* Remove button */}
                              <button
                                type="button"
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeImage(index)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                              
                              {/* File info */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <p className="text-white text-xs truncate font-medium">
                                  {item.file.name}
                                </p>
                                <p className="text-white/80 text-xs">
                                  {(item.file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Primary image info */}
                      {primaryImageIndex !== null && selectedImagePreviews.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Star className="h-4 w-4 text-white fill-current" />
                            </div>
                            <div>
                              <p className="font-medium text-blue-700 dark:text-blue-300">
                                Main Product Image: {selectedImagePreviews[primaryImageIndex]?.file.name}
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                This will be displayed on product cards and used as the main preview
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload status */}
                  {uploadStatus !== 'idle' && (
                    <div className={`p-4 rounded-xl backdrop-blur-sm ${
                      uploadStatus === 'uploading' ? 'bg-blue-50/80 border border-blue-200' :
                      uploadStatus === 'success' ? 'bg-green-50/80 border border-green-200' :
                      uploadStatus === 'error' ? 'bg-red-50/80 border border-red-200' : ''
                    }`}>
                      <div className="flex items-center gap-3">
                        {uploadStatus === 'uploading' && (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <span className="font-medium text-blue-700">Uploading images...</span>
                          </>
                        )}
                        {uploadStatus === 'success' && (
                          <>
                            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="font-medium text-green-700">Images uploaded successfully!</span>
                          </>
                        )}
                        {uploadStatus === 'error' && (
                          <>
                            <X className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-700">Upload failed - please try again</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Basic Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Product Information</h3>
                    <p className="text-gray-600 dark:text-gray-400">Tell us about your product</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter product name"
                        className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">Price (RWF) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        placeholder="0.00"
                        className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Describe your product..."
                        rows={4}
                        className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                      <Select onValueChange={(value) => handleInputChange("category_id", value)}>
                        <SelectTrigger className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku" className="text-sm font-medium">SKU (Optional)</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        placeholder="Product code"
                        className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Settings */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Product Settings</h3>
                    <p className="text-gray-600 dark:text-gray-400">Configure inventory and visibility</p>
                  </div>

                  <div className="space-y-6">
                    <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 rounded-xl p-6 space-y-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Inventory Management</h4>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="track_inventory" className="text-sm font-medium">Track inventory</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monitor stock levels for this product</p>
                        </div>
                        <Switch
                          id="track_inventory"
                          checked={formData.track_inventory}
                          onCheckedChange={(checked) => handleInputChange("track_inventory", checked)}
                        />
                      </div>

                      {formData.track_inventory && (
                        <div className="space-y-2">
                          <Label htmlFor="inventory_quantity" className="text-sm font-medium">Initial Quantity *</Label>
                          <Input
                            id="inventory_quantity"
                            type="number"
                            min="0"
                            value={formData.inventory_quantity}
                            onChange={(e) => handleInputChange("inventory_quantity", e.target.value)}
                            placeholder="0"
                            className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
                            required={formData.track_inventory}
                          />
                        </div>
                      )}
                    </div>

                    <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 rounded-xl p-6 space-y-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Visibility</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                        <Select value={formData.status} onValueChange={(value: "active" | "draft") => handleInputChange("status", value)}>
                          <SelectTrigger className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active - Visible to customers</SelectItem>
                            <SelectItem value="draft">Draft - Hidden from customers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? onClose : prevStep}
                className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </Button>
              
              <div className="flex gap-2">
                {currentStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Product
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
