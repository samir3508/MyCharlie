/**
 * Client Supabase pour Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://lawllirgeisuvanbvkcr.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1NjYzNywiZXhwIjoyMDgzODMyNjM3fQ.3OR8IDsOtr8g854NlVOM_Lp1kuJhuKIuo8zNZGM4Fuo'

/**
 * Client Supabase avec service_role pour accès complet à la base de données
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
