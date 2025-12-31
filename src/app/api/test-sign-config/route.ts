import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== TEST SIGNATURE CONFIGURATION ===')
  
  const config = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'PRESENT' : 'MISSING',
  }
  
  console.log('Configuration check:', config)
  
  // Test de connexion Supabase
  let supabaseTest = 'NOT_TESTED'
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.from('tenants').select('id').limit(1)
    supabaseTest = error ? `ERROR: ${error.message}` : 'SUCCESS'
  } catch (error: any) {
    supabaseTest = `FAILED: ${error.message}`
  }
  
  console.log('Supabase test result:', supabaseTest)
  
  return NextResponse.json({
    config,
    supabaseTest,
    timestamp: new Date().toISOString()
  })
}
