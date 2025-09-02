'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarDays, DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown, Users, AlertTriangle, Plus, Eye, Edit } from 'lucide-react'
import { createClient } from '@/utils/supabase-client'
import { useToast } from '@/hooks/use-toast'

interface DashboardStats {
  overview: {
    total_revenue: number
    revenue_change: number
    total_orders: number
    orders_change: number
    total_products: number
    products_change: number
    avg_order_value: number
    aov_change: number
  }
  products: Array<{
    id: string
    name: string
    stock_quantity: number
    total_sales: number
    revenue: number
    views: number
  }>
  recentOrders: Array<{
    id: string
    customer_name: string
    total: number
    status: string
    created_at: string
    items_count: number
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    stock_quantity: number
    sku: string
  }>
}

interface VendorProfile {
  id: string
  business_name: string
  first_name: string
  last_name: string
  email: string
}

export function VendorDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
    fetchProfile()
  }, [period])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()
      const response = await fetch(`/api/vendor/analytics?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, business_name, first_name, last_name, email')
          .eq('id', user.id)
          .single()
        
        setProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
          Unable to load dashboard data. Please refresh the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.business_name || profile?.first_name || 'Vendor'}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your store today.
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overview.total_revenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.overview.revenue_change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats.overview.revenue_change).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.total_orders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.overview.orders_change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats.overview.orders_change).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.total_products}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.overview.products_change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats.overview.products_change).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overview.avg_order_value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.overview.aov_change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats.overview.aov_change).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for Low Stock */}
      {stats.lowStockProducts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.lowStockProducts.length} product(s) with low stock. 
            <Button variant="link" className="p-0 h-auto ml-2">
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.customer_name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {order.items_count} item(s)
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

            {/* Top Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>Best performing products</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <div className="text-xs text-muted-foreground">
                          {product.total_sales} sales • {product.views} views
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.stock_quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Track your product sales and inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{product.total_sales} sales</span>
                        <span>{product.views} views</span>
                        <span>Stock: {product.stock_quantity}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">{formatCurrency(product.revenue)}</p>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Manage your customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{order.customer_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {order.items_count} item(s) • {formatDate(order.created_at)}
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

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Monitor your stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.lowStockProducts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Low Stock Alert</h4>
                    <div className="space-y-2">
                      {stats.lowStockProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">{product.stock_quantity} left</p>
                            <Button variant="outline" size="sm">
                              Restock
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">All Products</h4>
                  <div className="space-y-2">
                    {stats.products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock Level
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-medium">{product.stock_quantity} units</p>
                          <Progress 
                            value={Math.min(100, (product.stock_quantity / 100) * 100)} 
                            className="w-20 h-2" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
