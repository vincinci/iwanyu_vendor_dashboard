import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr"

let clientInstance: ReturnType<typeof createBrowserClientSSR> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side: always create a new instance
    return createBrowserClientSSR(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  // Client-side: use singleton pattern
  if (!clientInstance) {
    clientInstance = createBrowserClientSSR(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  return clientInstance
}

export function createBrowserClient() {
  return createClient()
}
