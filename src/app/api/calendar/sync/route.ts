import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * API pour synchroniser les événements Google Calendar vers l'agenda de l'application
 * 
 * GET /api/calendar/sync?tenant_id=xxx
 * - Synchronise les événements Google Calendar des 7 prochains jours vers l'agenda de l'app
 * - Crée des RDV dans Supabase pour chaque événement Google Calendar
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

    // Récupérer la connexion Google Calendar
    const { data: calendarConnection, error: connError } = await supabase
      .from('oauth_connections')
      .select('access_token, refresh_token, expires_at, id, metadata')
      .eq('tenant_id', tenantId)
      .eq('provider', 'google')
      .eq('service', 'calendar')
      .eq('is_active', true)
      .single()

    if (connError || !calendarConnection?.access_token) {
      return NextResponse.json(
        { success: false, error: 'CALENDAR_NOT_CONNECTED', message: 'Google Calendar non connecté' },
        { status: 404 }
      )
    }

    // Récupérer le calendar_id depuis metadata (ou utiliser 'primary' par défaut)
    let calendarId = 'primary'
    if (calendarConnection.metadata && typeof calendarConnection.metadata === 'object' && 'calendar_id' in calendarConnection.metadata) {
      calendarId = calendarConnection.metadata.calendar_id as string
    }

    // Rafraîchir le token si nécessaire
    let accessToken = calendarConnection.access_token
    const expiresAt = calendarConnection.expires_at ? new Date(calendarConnection.expires_at) : null
    const now = new Date()

    if (expiresAt && expiresAt < now && calendarConnection.refresh_token) {
      try {
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'}/api/auth/google/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connection_id: calendarConnection.id })
        })

        if (refreshResponse.ok) {
          const { data: updatedConnection } = await supabase
            .from('oauth_connections')
            .select('access_token')
            .eq('id', calendarConnection.id)
            .single()

          if (updatedConnection?.access_token) {
            accessToken = updatedConnection.access_token
          }
        }
      } catch (refreshErr) {
        console.warn('Erreur rafraîchissement token Calendar:', refreshErr)
      }
    }

    // Récupérer les événements Google Calendar (7 prochains jours)
    const timeMin = new Date()
    timeMin.setHours(0, 0, 0, 0)
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + 7)
    timeMax.setHours(23, 59, 59, 999)

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=250`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: 'CALENDAR_API_ERROR', message: errorData.error?.message || 'Erreur Google Calendar API' },
        { status: calendarResponse.status }
      )
    }

    const calendarData = await calendarResponse.json()
    const events = calendarData.items || []

    // Synchroniser chaque événement vers l'agenda de l'app
    let synced = 0
    let updated = 0
    let skipped = 0

    for (const event of events) {
      try {
        // Ignorer les événements annulés
        if (event.status === 'cancelled') {
          skipped++
          continue
        }

        const startDate = event.start?.dateTime || event.start?.date
        const endDate = event.end?.dateTime || event.end?.date

        if (!startDate) {
          skipped++
          continue
        }

        const start = new Date(startDate)
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000) // 1h par défaut

        // Vérifier si un RDV existe déjà avec cet événement Google Calendar
        // (chercher dans les notes car le champ google_calendar_event_id n'existe pas encore)
        const { data: existingRdv } = await supabase
          .from('rdv')
          .select('id')
          .eq('tenant_id', tenantId)
          .like('notes', `%Google Calendar Event ID: ${event.id}%`)
          .single()

        const rdvData = {
          tenant_id: tenantId,
          type_rdv: 'autre' as const,
          date_heure: start.toISOString(),
          duree_minutes: Math.round((end.getTime() - start.getTime()) / (1000 * 60)),
          titre: event.summary || 'Événement Google Calendar',
          notes: event.description || null,
          adresse: event.location || null,
          statut: 'confirme' as const,
          google_calendar_event_id: event.id,
          source: 'google_calendar' as const
        }

        if (existingRdv) {
          // Mettre à jour le RDV existant
          await supabase
            .from('rdv')
            .update(rdvData)
            .eq('id', existingRdv.id)
          updated++
        } else {
          // Créer un nouveau RDV
          await supabase
            .from('rdv')
            .insert(rdvData)
          synced++
        }
      } catch (eventErr: any) {
        console.error(`Erreur synchronisation événement ${event.id}:`, eventErr)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée`,
      stats: {
        total: events.length,
        synced,
        updated,
        skipped
      }
    })

  } catch (error: any) {
    console.error('Erreur synchronisation Google Calendar:', error)
    return NextResponse.json(
      { success: false, error: 'SYNC_ERROR', message: error.message || 'Erreur lors de la synchronisation' },
      { status: 500 }
    )
  }
}
