import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Helper pour extraire le message d'erreur de manière type-safe
 */
function getErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}

/**
 * API de débogage pour vérifier les RDV dans Supabase
 * GET /api/debug/rdv?tenant_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_TENANT_ID', message: 'tenant_id est requis' },
        { status: 400 }
      )
    }

    if (!SUPABASE_SERVICE_KEY || !SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'MISSING_CONFIG', message: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Récupérer TOUS les RDV pour ce tenant (sans filtre de date)
    const { data: allRdv, error: allError } = await supabase
      .from('rdv')
      .select('id, tenant_id, dossier_id, client_id, titre, date_heure, statut, type_rdv, created_at')
      .eq('tenant_id', tenantId)
      .order('date_heure', { ascending: false })
      .limit(50)

    // Récupérer les RDV d'aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todayRdv, error: todayError } = await supabase
      .from('rdv')
      .select('id, date_heure, statut')
      .eq('tenant_id', tenantId)
      .gte('date_heure', today.toISOString())
      .lt('date_heure', tomorrow.toISOString())

    // Récupérer les RDV des 7 prochains jours
    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + 7)

    const { data: upcomingRdv, error: upcomingError } = await supabase
      .from('rdv')
      .select('id, date_heure, statut')
      .eq('tenant_id', tenantId)
      .gte('date_heure', now.toISOString())
      .lte('date_heure', future.toISOString())
      .in('statut', ['planifie', 'confirme', 'en_cours'])

    // Statistiques
    const stats = {
      total: allRdv?.length || 0,
      today: todayRdv?.length || 0,
      upcoming: upcomingRdv?.length || 0,
      by_statut: {} as Record<string, number>,
      by_type: {} as Record<string, number>
    }

    // Compter par statut
    allRdv?.forEach(rdv => {
      const statut = rdv.statut || 'null'
      stats.by_statut[statut] = (stats.by_statut[statut] || 0) + 1
      
      const type = rdv.type_rdv || 'null'
      stats.by_type[type] = (stats.by_type[type] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      stats,
      all_rdv: allRdv?.map(r => ({
        id: r.id,
        date_heure: r.date_heure,
        statut: r.statut,
        type_rdv: r.type_rdv,
        titre: r.titre,
        dossier_id: r.dossier_id,
        client_id: r.client_id,
        created_at: r.created_at
      })),
      today_rdv: todayRdv,
      upcoming_rdv: upcomingRdv,
      filters: {
        today_range: {
          from: today.toISOString(),
          to: tomorrow.toISOString()
        },
        upcoming_range: {
          from: now.toISOString(),
          to: future.toISOString()
        },
        upcoming_statuts: ['planifie', 'confirme', 'en_cours']
      },
      errors: {
        all: getErrorMessage(allError),
        today: getErrorMessage(todayError),
        upcoming: getErrorMessage(upcomingError)
      }
    })

  } catch (error: any) {
    console.error('Erreur debug RDV:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    )
  }
}
