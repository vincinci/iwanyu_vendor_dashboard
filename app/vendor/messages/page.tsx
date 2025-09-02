import { createClient } from "@/utils/supabase-server"
import { MessagesClient } from "@/components/vendor/messages-client"
import { redirect } from "next/navigation"

export default async function MessagesPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Fetch vendor profile to ensure proper access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'vendor') {
    redirect('/auth/login')
  }

  // Fetch message threads for this vendor
  const { data: messageThreads } = await supabase
    .from("message_threads")
    .select(`
      *,
      messages (
        id,
        content,
        created_at,
        sender_id,
        is_read,
        profiles (
          full_name,
          avatar_url
        )
      )
    `)
    .eq("vendor_id", user.id)
    .order("updated_at", { ascending: false })

  return <MessagesClient messageThreads={messageThreads || []} userId={user.id} />
}