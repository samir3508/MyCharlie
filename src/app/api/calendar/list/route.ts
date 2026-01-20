import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * API pour lister les calendriers Google disponibles
 * 
 * GET /api/calendar/list?connection_id=xxx&tenant_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const connectionId = searchParams.get('connection_id')
    const tenantId = searchParams.get('tenant_id')

    if (!connectionId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'connection_id et tenant_id sont requis' },
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

    // Récupérer la connexion OAuth
    const { data: connection, error: connError } = await supabase
      .from('oauth_connections')
      .select('access_token, refresh_token, expires_at, id')
      .eq('id', connectionId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (connError || !connection?.access_token) {
      return NextResponse.json(
        { success: false, error: 'CONNECTION_NOT_FOUND', message: 'Connexion non trouvée ou inactive' },
        { status: 404 }
      )
    }

    // Rafraîchir le token si nécessaire
    let accessToken = connection.access_token
    const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null
    const now = new Date()

    if (expiresAt && expiresAt < now && connection.refresh_token) {
      try {
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'}/api/auth/google/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connection_id: connection.id })
        })

        if (refreshResponse.ok) {
          const { data: updatedConnection } = await supabase
            .from('oauth_connections')
            .select('access_token')
            .eq('id', connection.id)
            .single()

          if (updatedConnection?.access_token) {
            accessToken = updatedConnection.access_token
          }
        }
      } catch (refreshErr) {
        console.warn('Erreur rafraîchissement token:', refreshErr)
      }
    }

    // Récupérer la liste des calendriers
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
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
    const allCalendars = calendarData.items || []

    // Filtrer pour ne garder que les calendriers accessibles en écriture
    const writableCalendars = allCalendars.filter((cal: any) => {
      const accessRole = cal.accessRole || ''
      return accessRole === 'owner' || accessRole === 'writer'
    })

    return NextResponse.json({
      success: true,
      calendars: writableCalendars.map((cal: any) => ({
        id: cal.id,
        summary: cal.summary || 'Sans nom',
        description: cal.description || null,
        accessRole: cal.accessRole,
        primary: cal.primary || false
      })),
      count: writableCalendars.length
    })

  } catch (error: any) {
    console.error('Erreur récupération calendriers:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
