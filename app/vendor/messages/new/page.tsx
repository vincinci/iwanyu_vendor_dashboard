import { createClient } from "@/utils/supabase-server"
import { NewMessageClient } from "@/components/vendor/new-message-client"
import { redirect } from "next/navigation"

export default async function NewMessagePage() {
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

  return <NewMessageClient userId={user.id} />
}
