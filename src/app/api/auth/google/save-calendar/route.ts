import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * API pour sauvegarder le calendar_id sélectionné
 * 
 * POST /api/auth/google/save-calendar
 * Body: { connection_id, calendar_id, calendar_name }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connection_id, calendar_id, calendar_name } = body

    if (!connection_id || !calendar_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'connection_id et calendar_id sont requis' },
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

    // Récupérer la connexion existante
    const { data: connection, error: fetchError } = await supabase
      .from('oauth_connections')
      .select('id, metadata')
      .eq('id', connection_id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { success: false, error: 'CONNECTION_NOT_FOUND', message: 'Connexion non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour le metadata avec le calendar_id
    const currentMetadata = (connection.metadata && typeof connection.metadata === 'object') 
      ? connection.metadata 
      : {}
    
    const updatedMetadata = {
      ...currentMetadata,
      calendar_id: calendar_id,
      calendar_name: calendar_name || 'Calendrier',
      calendar_selected_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('oauth_connections')
      .update({ 
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection_id)

    if (updateError) {
      console.error('Erreur mise à jour metadata:', updateError)
      return NextResponse.json(
        { success: false, error: 'UPDATE_ERROR', message: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Calendrier sélectionné avec succès',
      calendar_id,
      calendar_name
    })

  } catch (error: any) {
    console.error('Erreur sauvegarde calendar_id:', error)
    return NextResponse.json(
      { success: false, error: 'SAVE_ERROR', message: error.message || 'Erreur lors de la sauvegarde' },
      { status: 500 }
    )
  }
}
