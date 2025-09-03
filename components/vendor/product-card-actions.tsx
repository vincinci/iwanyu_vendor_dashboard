"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Eye, Edit, Trash2, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ProductCardActionsProps {
  productId: string
  productName: string
}

export function ProductCardActions({ productId, productName }: ProductCardActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportImages = async () => {
    setIsExporting(true)
    
    try {
      const response = await fetch(`/api/products/${productId}/export-images`)
      
      if (!response.ok) {
        throw new Error("Failed to export images")
      }
      
      const data = await response.json()
      
      if (data.images.length === 0) {
        toast.error("No images to export for this product")
        return
      }
      
      // Download each image
      for (const image of data.images) {
        const imageResponse = await fetch(image.url)
        const blob = await imageResponse.blob()
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = image.originalName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      toast.success(`Exported ${data.images.length} images successfully`)
    } catch (error) {
      console.error("Error exporting images:", error)
      toast.error("Failed to export images")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Failed to delete product")
      }

      toast.success("Product deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex space-x-1">
      <Button size="sm" variant="outline" asChild>
        <Link href={`/vendor/products/${productId}`}>
          <Eye className="h-3 w-3" />
        </Link>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <Link href={`/vendor/products/edit/${productId}`}>
          <Edit className="h-3 w-3" />
        </Link>
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleExportImages}
        disabled={isExporting}
        title="Export Images"
      >
        {isExporting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
