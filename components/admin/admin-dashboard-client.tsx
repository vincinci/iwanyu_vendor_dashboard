'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase-client'
import { useLanguage } from '@/lib/i18n/context'
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Eye, 
  Plus, 
  Edit, 
  CalendarDays,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'

interface AdminDashboardStats {
  overview: {
    total_revenue: number
    revenue_change: number
    total_orders: number
    orders_change: number
    total_vendors: number
    vendors_change: number
    total_products: number
    products_change: number
    avg_order_value: number
    aov_change: number
    conversion_rate: number
    conversion_change: number
  }
  vendors: Array<{
    id: string
    business_name: string
    email: string
    status: string
    total_sales: number
    product_count: number
    order_count: number
    created_at: string
  }>
  products: Array<{
    id: string
    name: string
    description?: string
    price: number
    image_url?: string
    status: string
    inventory_quantity: number
    vendor_id: string
  vendor_name?: string
    created_at: string
    updated_at: string
  }>
  allProducts: Array<{
    id: string
    name: string
    description?: string
    price: number
    image_url?: string
    status: string
    inventory_quantity: number
    vendor_id: string
    vendor_name?: string
    created_at: string
    updated_at: string
  }>
  recentOrders: Array<{
    id: string
    order_number: string
    customer_name: string
    vendor_name: string
    total: number
    status: string
    created_at: string
    items_count: number
  }>
  pendingApprovals: Array<{
    id: string
    business_name: string
    email: string
    created_at: string
    type: 'vendor' | 'product' | 'payout'
  }>
  systemHealth: {
    uptime: string
    active_sessions: number
    error_rate: number
    avg_response_time: number
  }
}

interface AdminProfile {
  id: string
  full_name: string
  email: string
  role: string
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')
  const { toast } = useToast()
  const { t } = useLanguage()

  // Optimized fetch function with parallel requests
  const fetchDashboardData = useCallback(async () => {
    if (loading) return // Prevent multiple simultaneous requests
    
    setLoading(true)
    setError(null)
    
    try {
      // Parallel fetch for better performance
      const [analyticsResponse, authResponse] = await Promise.all([
        fetch(`/api/admin/analytics?period=${period}`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        (async () => {
          const supabase = createClient()
          return await supabase.auth.getUser()
        })()
      ])
      
      if (!analyticsResponse.ok) {
        throw new Error(`Analytics API error: ${analyticsResponse.status}`)
      }

      const [analyticsData, { data: { user } }] = await Promise.all([
        analyticsResponse.json(),
        Promise.resolve(authResponse)
      ])

      // Fetch profile if user exists
      if (user) {
        const supabase = createClient()
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
      }

      setStats(analyticsData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error fetching dashboard data:', error)
      setError(errorMessage)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [period, toast])

  // Only fetch when period changes
  useEffect(() => {
    fetchDashboardData()
  }, [period])

  // Memoized formatting functions for better performance
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF'
    })
    return (amount: number) => formatter.format(amount)
  }, [])

  const formatDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    return (date: string) => formatter.format(new Date(date))
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'delivered':
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleApproveVendor = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: 'POST',
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Vendor approved successfully",
        })
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve vendor",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load admin dashboard data. Please refresh the page.
        </AlertDescription>
      </Alert>
    )
  }

  // Build a vendor name map for quick lookup
  const vendorNameMap = (stats?.vendors || []).reduce<Record<string, string>>((acc, v) => {
    acc[v.id] = v.business_name
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || 'Admin'}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPeriod('7d')} 
                  className={period === '7d' ? 'bg-primary text-primary-foreground' : ''}>
            7 days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod('30d')}
                  className={period === '30d' ? 'bg-primary text-primary-foreground' : ''}>
            30 days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod('90d')}
                  className={period === '90d' ? 'bg-primary text-primary-foreground' : ''}>
            90 days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.total_revenue ? formatCurrency(stats.overview.total_revenue) : 'RWF 0'}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {(stats?.overview?.revenue_change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats?.overview?.revenue_change || 0).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.total_orders || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {(stats?.overview?.orders_change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats?.overview?.orders_change || 0).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.total_vendors || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {(stats?.overview?.vendors_change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats?.overview?.vendors_change || 0).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.total_products || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {(stats?.overview?.products_change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats?.overview?.products_change || 0).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.avg_order_value ? formatCurrency(stats.overview.avg_order_value) : 'RWF 0'}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {(stats?.overview?.aov_change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats?.overview?.aov_change || 0).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.overview?.conversion_rate || 0).toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {(stats?.overview?.conversion_change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats?.overview?.conversion_change || 0).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for Pending Approvals */}
      {stats.pendingApprovals && stats.pendingApprovals.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.pendingApprovals.length} pending approval(s) requiring your attention.
            <Button variant="link" className="p-0 h-auto ml-2">
              Review Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders across all vendors</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentOrders && stats.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">#{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {order.vendor_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Vendors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Vendors</CardTitle>
                  <CardDescription>Best performing vendors</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Vendor
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.vendors && stats.vendors.slice(0, 5).map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium truncate">{vendor.business_name}</p>
                        <div className="text-xs text-muted-foreground">
                          {vendor.product_count} products • {vendor.order_count} orders
                        </div>
                        <Badge variant="secondary" className={getStatusColor(vendor.status)}>
                          {vendor.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(vendor.total_sales)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(vendor.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>Manage and monitor all platform vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.vendors && stats.vendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{vendor.business_name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{vendor.product_count} products</span>
                        <span>{vendor.order_count} orders</span>
                        <span>Joined {formatDate(vendor.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="secondary" className={getStatusColor(vendor.status)}>
                        {vendor.status}
                      </Badge>
                      <p className="text-sm font-medium">{formatCurrency(vendor.total_sales)}</p>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Monitor all products across the platform ({stats?.allProducts?.length || 0} total products)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {stats?.allProducts && stats.allProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 space-y-3">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{formatCurrency(product.price)}</span>
                        <Badge variant="secondary" className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Vendor: {product.vendor_name || vendorNameMap[product.vendor_id] || 'Unknown Vendor'} • Stock: {product.inventory_quantity}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            window.location.href = `/admin/products/${product.id}`
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(!stats?.allProducts || stats.allProducts.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No products found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Monitor and manage platform orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders && stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {order.vendor_name} • {order.items_count} item(s) • {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.pendingApprovals && stats.pendingApprovals.length > 0 ? (
                  stats.pendingApprovals.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{item.business_name || item.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {item.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Submitted {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => item.type === 'vendor' && handleApproveVendor(item.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">All caught up! No pending approvals.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance and monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">System Uptime</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {stats.systemHealth?.uptime || '99.9%'}
                    </p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Active Sessions</p>
                    <p className="text-xs text-muted-foreground">Current users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {stats.systemHealth?.active_sessions || 0}
                    </p>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Error Rate</p>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {(stats.systemHealth?.error_rate || 0).toFixed(2)}%
                    </p>
                    <Badge variant={stats.systemHealth?.error_rate < 1 ? "default" : "destructive"}>
                      {stats.systemHealth?.error_rate < 1 ? "Good" : "Alert"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Response Time</p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {stats.systemHealth?.avg_response_time || 150}ms
                    </p>
                    <Badge variant="secondary">Fast</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Invite Vendor
            </Button>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Review Products
            </Button>
            <Button variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Monitor Orders
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline">
              <CalendarDays className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
