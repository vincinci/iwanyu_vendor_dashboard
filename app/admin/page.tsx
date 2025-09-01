import { createClient } from "@/lib/supabase/server"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"

export default async function AdminDashboard() {
  // For now, we'll use the client component for the enhanced dashboard
  // The server component can handle auth checks here
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please log in to access the admin dashboard.</div>
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>
  }

  return <AdminDashboardClient />
}
