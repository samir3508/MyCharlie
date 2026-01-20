import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * API pour sauvegarder le calendar_id sélectionné
 * 
 * POST /api/calendar/save-selection
 * Body: { connection_id, tenant_id, calendar_id, calendar_name }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connection_id, tenant_id, calendar_id, calendar_name } = body

    if (!connection_id || !tenant_id || !calendar_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'connection_id, tenant_id et calendar_id sont requis' },
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

    // Récupérer la connexion existante pour préserver les autres métadonnées
    const { data: existingConnection, error: fetchError } = await supabase
      .from('oauth_connections')
      .select('metadata')
      .eq('id', connection_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (fetchError || !existingConnection) {
      return NextResponse.json(
        { success: false, error: 'CONNECTION_NOT_FOUND', message: 'Connexion non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour les métadonnées avec le calendar_id
    const currentMetadata = existingConnection.metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      calendar_id: calendar_id,
      calendar_name: calendar_name || null,
      calendar_selected_at: new Date().toISOString()
    }

    // Mettre à jour la connexion
    const { error: updateError } = await supabase
      .from('oauth_connections')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      console.error('Erreur mise à jour metadata:', updateError)
      return NextResponse.json(
        { success: false, error: 'UPDATE_ERROR', message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Calendrier sélectionné avec succès',
      calendar_id: calendar_id,
      calendar_name: calendar_name
    })

  } catch (error: any) {
    console.error('Erreur sauvegarde sélection calendrier:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
