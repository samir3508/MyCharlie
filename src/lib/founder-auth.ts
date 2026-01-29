import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export type FounderSupabase = ReturnType<typeof createClient>

export async function requireFounderAuth(
  request: NextRequest
): Promise<
  | { ok: true; supabase: FounderSupabase }
  | { ok: false; response: NextResponse }
> {
  const apiKey = process.env.FOUNDER_API_KEY?.trim()
  const authHeader = request.headers.get('Authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  let allowed = false
  if (apiKey && bearer && bearer === apiKey) {
    allowed = true
  } else {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.email) {
      const founderEmails = (process.env.FOUNDER_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
      if (founderEmails.includes(user.email.toLowerCase())) allowed = true
    }
  }

  if (!allowed) {
    if (bearer) {
      return { ok: false, response: NextResponse.json({ error: 'Clé API invalide' }, { status: 401 }) }
    }
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) {
      return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    const founderEmails = (process.env.FOUNDER_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    if (!founderEmails.length) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'FOUNDER_EMAILS non configuré' }, { status: 503 }),
      }
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Accès réservé aux fondateurs', email: user.email },
        { status: 403 }
      ),
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { ok: true, supabase }
}
