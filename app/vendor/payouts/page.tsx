import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, TrendingUp } from "lucide-react"

export default async function PayoutsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: payouts } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("vendor_id", user?.id)
    .order("created_at", { ascending: false })

  // Calculate pending earnings
  const { data: pendingOrders } = await supabase.from("order_items").select("total").eq("vendor_id", user?.id)

  const pendingEarnings = pendingOrders?.reduce((sum, item) => sum + Number(item.total), 0) || 0
  const totalPaidOut =
    payouts?.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground">Track your earnings and payout history</p>
        </div>
      </div>

      {/* Payout Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF {Math.round(pendingEarnings).toLocaleString('en-US')}</div>
            <p className="text-xs text-muted-foreground">Available for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF {Math.round(totalPaidOut).toLocaleString('en-US')}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">Automatic weekly payouts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your recent payout transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts?.length ? (
            <div className="space-y-4">
              {payouts.map((payout: any) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Payout #{payout.reference_number || payout.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payout.period_start).toLocaleDateString()} -{" "}
                      {new Date(payout.period_end).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payout.processed_at
                        ? `Processed: ${new Date(payout.processed_at).toLocaleDateString()}`
                        : "Processing..."}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={getStatusColor(payout.status)}>{payout.status}</Badge>
                    <p className="text-lg font-semibold">RWF {Math.round(Number(payout.amount)).toLocaleString('en-US')}</p>
                    <p className="text-xs text-muted-foreground">{payout.payout_method || "Bank Transfer"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
              <p className="text-muted-foreground mb-4">Payouts will appear here once you start making sales.</p>
              <Button disabled>Request Payout</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
