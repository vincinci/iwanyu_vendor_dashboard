import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Try to get user profile to determine role
    let profile = null
    try {
      const { data: profileData } = await supabase.from("profiles").select("role, status").eq("id", user.id).single()
      profile = profileData
    } catch (error) {
      // If profile doesn't exist, create a default one for now
      console.log("Profile not found, using default vendor role:", error)
      profile = { role: "vendor", status: "active" }
    }

    // Redirect based on role and current path
    if (profile) {
      const currentPath = request.nextUrl.pathname

      // If user is on root path, redirect to appropriate dashboard
      if (currentPath === "/") {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = profile.role === "admin" ? "/admin" : "/vendor"
        return NextResponse.redirect(redirectUrl)
      }

      // Prevent vendors from accessing admin routes
      if (profile.role === "vendor" && currentPath.startsWith("/admin")) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/vendor"
        return NextResponse.redirect(redirectUrl)
      }

      // Prevent non-admins from accessing admin routes
      if (profile.role !== "admin" && currentPath.startsWith("/admin")) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/vendor"
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Redirect unauthenticated users to login for protected routes
  // Allow API routes, auth routes, and root route without authentication
  if (!user && 
      !request.nextUrl.pathname.startsWith("/auth") && 
      !request.nextUrl.pathname.startsWith("/api") && 
      request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
