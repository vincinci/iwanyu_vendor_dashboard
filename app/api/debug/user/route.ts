import { createClient } from "@/lib/supabase/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        user: {
          id: user.id,
          email: user.email
        },
        profile: null,
        profileError: profileError.message
      })
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      status: "User has profile"
    })

  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed' 
    }, { status: 500 })
  }
}
