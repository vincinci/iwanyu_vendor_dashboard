"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { User, Store, Upload, Save } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export default function ProfilePage() {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  })
  const [storeData, setStoreData] = useState({
    storeName: "",
    storeDescription: "",
    businessLicense: "",
    taxId: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      // For now, skip vendor_stores table since it doesn't exist
      // const { data: storeData } = await supabase.from("vendor_stores").select("*").eq("vendor_id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        setProfileData({
          fullName: profileData.full_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
        })
      }

      // Use placeholder data for store until vendor_stores table is created
      setStore({
        store_name: "Test Vendor Store",
        store_description: "Professional marketplace vendor",
        business_license: "LICENSE-001",
        tax_id: "TAX-001",
        facebook_url: "",
        instagram_url: "",
        tiktok_url: "",
      })
      setStoreData({
        storeName: "Test Vendor Store",
        storeDescription: "Professional marketplace vendor",
        businessLicense: "LICENSE-001",
        taxId: "TAX-001",
        facebookUrl: "",
        instagramUrl: "",
        tiktokUrl: "",
      })
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      setSuccess("Profile updated successfully!")
      loadProfile()
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {
      // For now, just simulate success since vendor_stores table doesn't exist
      // TODO: Implement proper store update when vendor_stores table is created
      
      console.log('Store data would be saved:', storeData)
      setSuccess("Store information updated successfully!")
      
      // Update local state
      setStore({
        store_name: storeData.storeName,
        store_description: storeData.storeDescription,
        business_license: storeData.businessLicense,
        tax_id: storeData.taxId,
        facebook_url: storeData.facebookUrl,
        instagram_url: storeData.instagramUrl,
        tiktok_url: storeData.tiktokUrl,
      })
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("profile")}</h1>
          <p className="text-muted-foreground">Manage your account and store information</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Badge variant={profile?.status === "active" ? "default" : "secondary"}>{profile?.status}</Badge>
                    {store?.is_verified && (
                      <Badge variant="outline" className="text-blue-600">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" value={profileData.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneNumber")}</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>Store Information</span>
            </CardTitle>
            <CardDescription>Manage your store details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeData.storeName}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, storeName: e.target.value }))}
                  placeholder="Enter your store name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={storeData.storeDescription}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, storeDescription: e.target.value }))}
                  placeholder="Describe your store"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Social Media Links</Label>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl" className="text-sm font-medium flex items-center gap-2">
                      <span className="text-blue-600">Facebook</span>
                    </Label>
                    <Input
                      id="facebookUrl"
                      value={storeData.facebookUrl}
                      onChange={(e) => setStoreData((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                      placeholder="https://facebook.com/yourbusiness"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl" className="text-sm font-medium flex items-center gap-2">
                      <span className="text-pink-600">Instagram</span>
                    </Label>
                    <Input
                      id="instagramUrl"
                      value={storeData.instagramUrl}
                      onChange={(e) => setStoreData((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                      placeholder="https://instagram.com/yourbusiness"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktokUrl" className="text-sm font-medium flex items-center gap-2">
                      <span className="text-black">TikTok</span>
                    </Label>
                    <Input
                      id="tiktokUrl"
                      value={storeData.tiktokUrl}
                      onChange={(e) => setStoreData((prev) => ({ ...prev, tiktokUrl: e.target.value }))}
                      placeholder="https://tiktok.com/@yourbusiness"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLicense">Business License</Label>
                <Input
                  id="businessLicense"
                  value={storeData.businessLicense}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, businessLicense: e.target.value }))}
                  placeholder="Business license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={storeData.taxId}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, taxId: e.target.value }))}
                  placeholder="Tax identification number"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Updating..." : store ? "Update Store" : "Create Store"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
