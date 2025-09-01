import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"
import { VendorHeader } from "@/components/vendor/vendor-header"
import { Toaster } from "sonner"

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Try to get user profile, but don't fail if table doesn't exist
  let profile = null
  try {
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = profileData
  } catch (error) {
    // Create a temporary profile object if table doesn't exist
    profile = {
      id: user.id,
      email: user.email,
      role: "vendor",
      status: "active",
      full_name: user.user_metadata?.full_name || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // For now, allow access as long as user is authenticated
  // Later when database is set up, we can add role checking back

  return (
    <div className="flex h-screen bg-background">
      <VendorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <VendorHeader user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
