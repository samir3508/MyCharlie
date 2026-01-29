import { NextRequest, NextResponse } from 'next/server'
import { requireFounderAuth } from '@/lib/founder-auth'

type FicheBody = {
  tenant_id: string
  nom_entreprise?: string
  metier?: string
  solo_equipe?: 'solo' | 'equipe'
  nb_employes?: number
  ca_mensuel_estime?: number
  niveau_informatique?: number
  outils_actuels?: string
  date_debut_mycharlie?: string
  statut?: 'beta' | 'actif'
}

export async function GET(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  const tenantId = request.nextUrl.searchParams.get('tenant_id')

  if (tenantId) {
    const { data, error } = await supabase
      .from('founder_fiche_artisan')
      .select('*, tenants(company_name)')
      .eq('tenant_id', tenantId)
      .single()
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ? { fiche: data } : { fiche: null })
  }

  const { data, error } = await supabase
    .from('founder_fiche_artisan')
    .select('*, tenants(company_name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fiches: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  let body: FicheBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  if (!body.tenant_id) {
    return NextResponse.json({ error: 'tenant_id requis' }, { status: 400 })
  }

  const row = {
    tenant_id: body.tenant_id,
    nom_entreprise: body.nom_entreprise ?? null,
    metier: body.metier ?? null,
    solo_equipe: body.solo_equipe ?? null,
    nb_employes: body.nb_employes ?? 0,
    ca_mensuel_estime: body.ca_mensuel_estime ?? null,
    niveau_informatique: body.niveau_informatique ?? null,
    outils_actuels: body.outils_actuels ?? null,
    date_debut_mycharlie: body.date_debut_mycharlie ?? null,
    statut: body.statut ?? 'beta',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('founder_fiche_artisan')
    .upsert(row, { onConflict: 'tenant_id', ignoreDuplicates: false })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fiche: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  let body: Partial<FicheBody> & { id?: string; tenant_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const id = body.id ?? undefined
  const tenantId = body.tenant_id ?? undefined
  if (!id && !tenantId) {
    return NextResponse.json({ error: 'id ou tenant_id requis' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.nom_entreprise !== undefined) updates.nom_entreprise = body.nom_entreprise
  if (body.metier !== undefined) updates.metier = body.metier
  if (body.solo_equipe !== undefined) updates.solo_equipe = body.solo_equipe
  if (body.nb_employes !== undefined) updates.nb_employes = body.nb_employes
  if (body.ca_mensuel_estime !== undefined) updates.ca_mensuel_estime = body.ca_mensuel_estime
  if (body.niveau_informatique !== undefined) updates.niveau_informatique = body.niveau_informatique
  if (body.outils_actuels !== undefined) updates.outils_actuels = body.outils_actuels
  if (body.date_debut_mycharlie !== undefined) updates.date_debut_mycharlie = body.date_debut_mycharlie
  if (body.statut !== undefined) updates.statut = body.statut

  const q = supabase.from('founder_fiche_artisan').update(updates)
  if (id) q.eq('id', id)
  else q.eq('tenant_id', tenantId!)
  const { data, error } = await q.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fiche: data })
}
