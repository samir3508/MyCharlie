import { NextRequest, NextResponse } from 'next/server'
import { requireFounderAuth } from '@/lib/founder-auth'

type QuestionnaireBody = {
  tenant_id: string
  type: 'AVANT' | 'APRES'
  devis_semaine?: number
  temps_devis_min?: number
  devis_non_relances?: number
  factures_semaine?: number
  temps_facture_min?: number
  factures_retard?: number
  relances_devis_semaine?: number
  relances_factures_semaine?: number
  temps_relances_min_semaine?: number
  temps_reponse_clients_min_jour?: number
  nb_messages_jour?: number
  rdv_semaine?: number
  temps_org_rdv_min?: number
  rdv_oublies_mois?: number
  temps_admin_heures_semaine?: number
  deteste_plus?: string
  stress_note?: string
  date_saisie?: string
}

const KEYS: (keyof QuestionnaireBody)[] = [
  'tenant_id', 'type', 'devis_semaine', 'temps_devis_min', 'devis_non_relances',
  'factures_semaine', 'temps_facture_min', 'factures_retard',
  'relances_devis_semaine', 'relances_factures_semaine', 'temps_relances_min_semaine',
  'temps_reponse_clients_min_jour', 'nb_messages_jour',
  'rdv_semaine', 'temps_org_rdv_min', 'rdv_oublies_mois',
  'temps_admin_heures_semaine', 'deteste_plus', 'stress_note', 'date_saisie',
]

export async function GET(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  const tenantId = request.nextUrl.searchParams.get('tenant_id')
  const type = request.nextUrl.searchParams.get('type') as 'AVANT' | 'APRES' | null

  let q = supabase
    .from('founder_questionnaire_avant_apres')
    .select('*, tenants(company_name)')
    .order('date_saisie', { ascending: false })
  if (tenantId) q = q.eq('tenant_id', tenantId)
  if (type && (type === 'AVANT' || type === 'APRES')) q = q.eq('type', type)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tenantId && type) {
    const one = (data ?? []).find((r) => r.tenant_id === tenantId && r.type === type)
    return NextResponse.json({ questionnaire: one ?? null })
  }
  return NextResponse.json({ questionnaires: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireFounderAuth(request)
  if (!auth.ok) return auth.response
  const { supabase } = auth
  let body: QuestionnaireBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  if (!body.tenant_id || !body.type || (body.type !== 'AVANT' && body.type !== 'APRES')) {
    return NextResponse.json({ error: 'tenant_id et type (AVANT|APRES) requis' }, { status: 400 })
  }

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of KEYS) {
    const v = body[k]
    if (v !== undefined && v !== null) row[k] = v
  }
  if (!row.date_saisie) row.date_saisie = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('founder_questionnaire_avant_apres')
    .upsert(row, { onConflict: 'tenant_id,type', ignoreDuplicates: false })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questionnaire: data })
}
