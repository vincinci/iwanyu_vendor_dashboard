import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export a singleton instance for client-side usage
let clientInstance: ReturnType<typeof createClient> | null = null

export function getBrowserClient() {
  if (typeof window === 'undefined') {
    return createClient()
  }
  
  if (!clientInstance) {
    clientInstance = createClient()
  }
  
  return clientInstance
}

// For backwards compatibility, export as createBrowserClient
export const createBrowserClient = getBrowserClient
