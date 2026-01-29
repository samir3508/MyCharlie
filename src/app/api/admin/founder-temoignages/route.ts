import { NextRequest, NextResponse } from 'next/server'
import { requireFounderAuth } from '@/lib/founder-auth'

type TemoignageBody = {
  tenant_id: string
  reponse_brute?: string | null
  phrase_forte?: string | null
  chiffre_cle?: string | null
  video?: boolean
  autorisation?: boolean
}

export async function GET(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  const tenantId = request.nextUrl.searchParams.get('tenant_id')

  let q = supabase
    .from('founder_temoignages')
    .select('*, tenants(company_name)')
    .order('created_at', { ascending: false })
  if (tenantId) q = q.eq('tenant_id', tenantId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ temoignages: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  let body: TemoignageBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  if (!body.tenant_id) return NextResponse.json({ error: 'tenant_id requis' }, { status: 400 })

  const row = {
    tenant_id: body.tenant_id,
    reponse_brute: body.reponse_brute ?? null,
    phrase_forte: body.phrase_forte ?? null,
    chiffre_cle: body.chiffre_cle ?? null,
    video: body.video ?? false,
    autorisation: body.autorisation ?? false,
  }
  const { data, error } = await supabase.from('founder_temoignages').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ temoignage: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  let body: { id: string } & Partial<TemoignageBody>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.reponse_brute !== undefined) updates.reponse_brute = body.reponse_brute
  if (body.phrase_forte !== undefined) updates.phrase_forte = body.phrase_forte
  if (body.chiffre_cle !== undefined) updates.chiffre_cle = body.chiffre_cle
  if (body.video !== undefined) updates.video = body.video
  if (body.autorisation !== undefined) updates.autorisation = body.autorisation

  const { data, error } = await supabase
    .from('founder_temoignages')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ temoignage: data })
}
