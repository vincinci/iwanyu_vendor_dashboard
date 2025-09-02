import { createClient } from "@/utils/supabase-server"
import { VendorDashboardClient } from "@/components/vendor/vendor-dashboard-client"

export default async function VendorDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dashboardData: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: any[];
    topProducts: any[];
  } = {
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
  };

  try {
    // Get vendor statistics
    const [{ count: totalProducts }, { count: totalOrders }, { data: recentOrders }, { data: topProducts }] =
      await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("vendor_id", user?.id),
        supabase.from("order_items").select("*", { count: "exact", head: true }).eq("vendor_id", user?.id),
        supabase
          .from("order_items")
          .select(`
          *,
          orders!inner(order_number, status, created_at, customer_name, total_amount)
        `)
          .eq("vendor_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("products")
          .select("*")
          .eq("vendor_id", user?.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(4),
      ])

    // Calculate total revenue from order items
    const { data: revenueData } = await supabase.from("order_items").select("total").eq("vendor_id", user?.id)
    const totalRevenue = revenueData?.reduce((sum, item) => sum + Number(item.total), 0) || 0

    dashboardData = {
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      recentOrders: recentOrders || [],
      topProducts: topProducts || [],
    }
  } catch (error) {
    console.log("Database tables not yet set up, using default data");
    // Use default empty data when tables don't exist
  }

  return <VendorDashboardClient />
}
