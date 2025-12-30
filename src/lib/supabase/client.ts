import { createBrowserClient } from '@supabase/ssr'

// Singleton for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getSupabaseClient(): ReturnType<typeof createBrowserClient> {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}

export { createClient, getSupabaseClient }