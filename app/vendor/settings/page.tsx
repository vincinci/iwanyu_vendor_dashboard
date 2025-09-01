import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Settings, 
  Save, 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Store,
  Camera,
  Phone,
  Mail,
  MapPin
} from "lucide-react"

export default async function VendorSettingsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get vendor settings data
  const { data: vendorSettings } = await supabase
    .from("vendor_settings")
    .select("*")
    .eq("vendor_id", user.id)
    .single()

  // Get user profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Parse names from full_name or use fallbacks
  const fullName = profile?.full_name || ""
  const nameParts = fullName.split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""
  
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "U"

  // Parse business address
  const businessAddress = vendorSettings?.business_address
  const address = typeof businessAddress === 'object' && businessAddress !== null 
    ? `${businessAddress.street || ""}, ${businessAddress.city || ""}, ${businessAddress.country || ""}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') 
    : ""

  // Parse bank details
  const bankDetails = vendorSettings?.bank_details
  const bankName = typeof bankDetails === 'object' && bankDetails !== null ? bankDetails.bank_name || "" : ""
  const accountNumber = typeof bankDetails === 'object' && bankDetails !== null ? bankDetails.account_number || "" : ""
  const accountHolderName = typeof bankDetails === 'object' && bankDetails !== null ? bankDetails.account_holder_name || "" : ""
  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" defaultValue={firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" defaultValue={lastName} />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue={profile?.phone || ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <CardTitle>Store Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" defaultValue={vendorSettings?.business_name || ""} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store-description">Store Description</Label>
              <Textarea 
                id="store-description" 
                defaultValue={vendorSettings?.business_description || ""}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store-category">Primary Category</Label>
                <Input id="store-category" defaultValue="" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-location">Store Location</Label>
                <Input id="store-location" defaultValue={address} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business-hours">Business Hours</Label>
              <Input id="business-hours" defaultValue={vendorSettings?.business_hours ? JSON.stringify(vendorSettings.business_hours) : "Monday - Friday: 8:00 AM - 6:00 PM"} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">New Orders</Label>
                <p className="text-sm text-muted-foreground">Get notified when you receive new orders</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Order Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications for order status changes</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert when product inventory is low</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Messages</Label>
                <p className="text-sm text-muted-foreground">Customer messages and inquiries</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Marketing Updates</Label>
                <p className="text-sm text-muted-foreground">Platform updates and promotional opportunities</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Payment & Payout Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input id="bank-name" defaultValue={bankName} />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input 
                  id="account-number" 
                  defaultValue={accountNumber ? `**** **** **** ${accountNumber.slice(-4)}` : ""} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Holder Name</Label>
                <Input id="account-name" defaultValue={accountHolderName || fullName} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile-money">Mobile Money Number</Label>
              <Input id="mobile-money" defaultValue={profile?.phone || ""} />
              <p className="text-sm text-muted-foreground">
                For quick payouts via mobile money
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tax-id">Tax ID Number</Label>
              <Input id="tax-id" defaultValue={vendorSettings?.tax_id || ""} />
              <p className="text-sm text-muted-foreground">
                Required for tax reporting purposes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Phone className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Update Email Verification
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Login Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of account logins</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Deactivate Account</h4>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable your vendor account
                </p>
              </div>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                Deactivate
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
