"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/utils/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Search, Eye, CheckCircle, XCircle, Clock, Users, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [vendorProductCounts, setVendorProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({})
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = useCallback(async () => {
    const supabase = createClient()
    
    try {
      // Check auth and admin role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        
      if (profile?.role !== "admin") {
        router.push("/auth/login")
        return
      }

      await loadVendors()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/auth/login")
    }
  }, [router])

  const loadVendors = useCallback(async () => {
    try {
      // Use cache-control headers for better performance
      const response = await fetch("/api/admin/analytics?period=30d", {
        headers: {
          'Cache-Control': 'max-age=60' // Cache for 1 minute
        }
      })
      
      if (!response.ok) throw new Error("Failed to fetch data")
      
      const data = await response.json()
      setVendors(data.allVendors || [])
      setVendorProductCounts(data.vendorProductCounts || {})
      console.log('Loaded vendors:', data.allVendors?.length)
      console.log('Product counts:', data.vendorProductCounts)
    } catch (error) {
      console.error("Error loading vendors:", error)
      toast.error("Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleVendorAction = async (vendorId: string, action: string) => {
    setLoadingActions(prev => ({ ...prev, [vendorId]: true }))
    
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error("Failed to update vendor")
      }

      const result = await response.json()
      toast.success(result.message)
      
      // Reload vendors to reflect changes
      await loadVendors()
    } catch (error) {
      console.error("Error updating vendor:", error)
      toast.error("Failed to update vendor")
    } finally {
      setLoadingActions(prev => ({ ...prev, [vendorId]: false }))
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    setLoadingActions(prev => ({ ...prev, [vendorId]: true }))
    
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete vendor")
      }

      const result = await response.json()
      toast.success(result.message)
      
      // Reload vendors to reflect changes
      await loadVendors()
    } catch (error) {
      console.error("Error deleting vendor:", error)
      toast.error("Failed to delete vendor")
    } finally {
      setLoadingActions(prev => ({ ...prev, [vendorId]: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "suspended":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "rejected":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "suspended":
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground">Manage and monitor all vendors on the platform</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Vendor Management</h1>
        <p className="text-muted-foreground">Manage and monitor all vendors on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Vendors ({vendors.length})</span>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vendors..." className="w-64" />
            </div>
          </CardTitle>
          <CardDescription>Overview of all registered vendors and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <div className="space-y-4">
              {vendors.map((vendor: any) => {
                const initials = vendor.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                const productCount = vendorProductCounts[vendor.id] || 0
                const isLoading = loadingActions[vendor.id] || false

                return (
                  <Card key={vendor.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={vendor.avatar_url || "/placeholder.svg"} alt={vendor.full_name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-semibold">{vendor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{vendor.email}</p>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(vendor.status)}>
                              {getStatusIcon(vendor.status)}
                              <span className="ml-1">{vendor.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Phone: {vendor.phone || "Not provided"}</p>
                          <p className="text-sm text-muted-foreground">Products: {productCount}</p>
                          <p className="text-sm text-muted-foreground">Address: {vendor.address || "Not provided"}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(vendor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/vendors/${vendor.id}`}>
                              <Eye className="mr-2 h-3 w-3" />
                              View Details
                            </Link>
                          </Button>
                          
                          {vendor.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleVendorAction(vendor.id, "approve")}
                                disabled={isLoading}
                              >
                                <CheckCircle className="mr-2 h-3 w-3" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleVendorAction(vendor.id, "reject")}
                                disabled={isLoading}
                              >
                                <XCircle className="mr-2 h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {vendor.status === "active" && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleVendorAction(vendor.id, "suspend")}
                              disabled={isLoading}
                            >
                              <XCircle className="mr-2 h-3 w-3" />
                              Suspend
                            </Button>
                          )}
                          
                          {vendor.status === "suspended" && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleVendorAction(vendor.id, "activate")}
                              disabled={isLoading}
                            >
                              <CheckCircle className="mr-2 h-3 w-3" />
                              Activate
                            </Button>
                          )}
                          
                          {/* Delete button - always available but with confirmation */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                disabled={isLoading}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{vendor.full_name}</strong>? 
                                  This action cannot be undone and will also delete all their products and related data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteVendor(vendor.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Vendor
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vendors yet</h3>
              <p className="text-muted-foreground">Vendors will appear here when they register on the platform.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
