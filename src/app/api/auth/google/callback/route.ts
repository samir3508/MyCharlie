import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Redirection de base - utiliser NEXT_PUBLIC_APP_URL si disponible
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  const redirectUrl = `${appUrl}/settings/integrations`

  // Gestion des erreurs OAuth
  if (error) {
    console.error('Erreur OAuth Google:', error)
    return NextResponse.redirect(`${redirectUrl}?error=oauth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectUrl}?error=missing_params`)
  }

  // Parser le state
  let stateData: { tenant_id: string; service: string }
  try {
    stateData = JSON.parse(state)
  } catch {
    return NextResponse.redirect(`${redirectUrl}?error=invalid_state`)
  }

  const { tenant_id, service } = stateData

  if (!tenant_id || !service) {
    return NextResponse.redirect(`${redirectUrl}?error=invalid_state`)
  }

  try {
    // Échanger le code contre des tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/auth/google/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Erreur échange token:', errorData)
      return NextResponse.redirect(`${redirectUrl}?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, scope } = tokens

    // Récupérer les infos du profil Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    })

    let profile = { email: '', name: '', picture: '' }
    if (profileResponse.ok) {
      profile = await profileResponse.json()
    }

    // Calculer la date d'expiration
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600))

    // Enregistrer dans Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Vérifier si une connexion existe déjà pour ce tenant/provider/service
    const { data: existing } = await supabase
      .from('oauth_connections')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'google')
      .eq('service', service)
      .eq('is_active', true)
      .limit(1)
      .single()

    const connectionData = {
      tenant_id,
      provider: 'google',
      service,
      access_token,
      refresh_token: refresh_token || null,
      token_type: 'Bearer',
      expires_at: expiresAt.toISOString(),
      email: profile.email || '',
      account_name: profile.name || null,
      profile_picture: profile.picture || null,
      scope: scope || null,
      is_active: true,
      last_error: null,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Stocker les scopes dans metadata aussi pour référence
      metadata: {
        scopes: scope ? scope.split(' ') : [],
        connected_at: new Date().toISOString()
      }
    }

    let dbError
    if (existing) {
      // Mettre à jour la connexion existante
      const { error } = await supabase
        .from('oauth_connections')
        .update(connectionData)
        .eq('id', existing.id)
      dbError = error
    } else {
      // Désactiver les autres connexions actives pour ce tenant/provider/service
      await supabase
        .from('oauth_connections')
        .update({ is_active: false })
        .eq('tenant_id', tenant_id)
        .eq('provider', 'google')
        .eq('service', service)
        .eq('is_active', true)

      // Créer une nouvelle connexion
      const { error } = await supabase
        .from('oauth_connections')
        .insert(connectionData)
      dbError = error
    }

    if (dbError) {
      console.error('Erreur sauvegarde DB:', dbError)
      return NextResponse.redirect(`${redirectUrl}?error=db_error`)
    }

    // Succès !
    return NextResponse.redirect(`${redirectUrl}?success=connected&service=${service}`)

  } catch (error) {
    console.error('Erreur callback OAuth:', error)
    return NextResponse.redirect(`${redirectUrl}?error=unknown`)
  }
}
