import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Get user profile to determine redirect
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role === "admin") {
      redirect("/admin")
    } else {
      redirect("/vendor")
    }
  } else {
    return (
      <div>
        {/* Redirect to login directly */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.location.href = '/auth/login';
            `,
          }}
        />
      </div>
    )
  }
}
