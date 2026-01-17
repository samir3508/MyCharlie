import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { connection_id } = await request.json()

    if (!connection_id) {
      return NextResponse.json({ error: 'connection_id requis' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Récupérer la connexion
    const { data: connection, error: fetchError } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('id', connection_id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connexion non trouvée' }, { status: 404 })
    }

    if (!connection.refresh_token) {
      return NextResponse.json({ error: 'Pas de refresh_token disponible' }, { status: 400 })
    }

    // Rafraîchir le token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Erreur refresh token:', errorData)
      
      // Marquer la connexion comme en erreur
      await supabase
        .from('oauth_connections')
        .update({ 
          last_error: errorData.error_description || 'Erreur de rafraîchissement',
          is_active: false
        })
        .eq('id', connection_id)

      return NextResponse.json({ 
        error: 'Impossible de rafraîchir le token',
        details: errorData 
      }, { status: 400 })
    }

    const tokens = await tokenResponse.json()
    const { access_token, expires_in } = tokens

    // Calculer nouvelle expiration
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600))

    // Mettre à jour en DB
    const { error: updateError } = await supabase
      .from('oauth_connections')
      .update({
        access_token,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        last_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection_id)

    if (updateError) {
      console.error('Erreur mise à jour DB:', updateError)
      return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      expires_at: expiresAt.toISOString() 
    })

  } catch (error) {
    console.error('Erreur refresh:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
