import { NextRequest, NextResponse } from 'next/server'
import { requireFounderAuth } from '@/lib/founder-auth'

type VisioBody = {
  tenant_id: string
  type: 'AVANT' | 'APRES'
  planifiee_le: string
  faite_le?: string | null
  statut?: 'a_faire' | 'faite' | 'reportee'
  notes?: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  const tenantId = request.nextUrl.searchParams.get('tenant_id')
  const statut = request.nextUrl.searchParams.get('statut')

  let q = supabase
    .from('founder_visios')
    .select('*, tenants(company_name)')
    .order('planifiee_le', { ascending: true })
  if (tenantId) q = q.eq('tenant_id', tenantId)
  if (statut) q = q.eq('statut', statut)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visios: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  let body: VisioBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  if (!body.tenant_id || !body.type || !body.planifiee_le) {
    return NextResponse.json({ error: 'tenant_id, type (AVANT|APRES) et planifiee_le requis' }, { status: 400 })
  }

  const row = {
    tenant_id: body.tenant_id,
    type: body.type,
    planifiee_le: body.planifiee_le,
    faite_le: body.faite_le ?? null,
    statut: body.statut ?? 'a_faire',
    notes: body.notes ?? null,
  }
  const { data, error } = await supabase.from('founder_visios').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visio: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  let body: { id: string; faite_le?: string | null; statut?: string; notes?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.faite_le !== undefined) updates.faite_le = body.faite_le
  if (body.statut !== undefined) updates.statut = body.statut
  if (body.notes !== undefined) updates.notes = body.notes

  const { data, error } = await supabase
    .from('founder_visios')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visio: data })
}
