import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Récupérer les credentials Google (essayer NEXT_PUBLIC_GOOGLE_CLIENT_ID en premier, puis GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  let connection_id: string | undefined
  let connection: any = null
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  try {
    // Vérifier que les credentials Google sont configurés
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('❌ GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET non configuré dans l\'application')
      return NextResponse.json({ 
        error: 'Credentials Google non configurés',
        details: 'GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET doivent être configurés dans les variables d\'environnement de l\'application'
      }, { status: 500 })
    }
    
    const body = await request.json()
    connection_id = body.connection_id

    if (!connection_id) {
      return NextResponse.json({ error: 'connection_id requis' }, { status: 400 })
    }

    // Récupérer la connexion
    const { data: connectionData, error: fetchError } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('id', connection_id)
      .single()
    
    connection = connectionData

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connexion non trouvée' }, { status: 404 })
    }

    if (!connection.refresh_token) {
      return NextResponse.json({ error: 'Pas de refresh_token disponible' }, { status: 400 })
    }

    // Les tokens Google OAuth expirent après 1 heure (3600 secondes)
    // On ne rafraîchit que si le token est expiré ou expire bientôt (dans les 15 prochaines minutes)
    const now = new Date()
    const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null
    const bufferTime = 15 * 60 * 1000 // 15 minutes de buffer
    const isExpired = expiresAt && expiresAt < now
    const isExpiringSoon = expiresAt && expiresAt <= new Date(now.getTime() + bufferTime)
    
    // Si le token n'est pas expiré et n'expire pas bientôt, on retourne le token actuel
    // (pas besoin de rafraîchir si encore valide pour plus de 15 minutes)
    if (expiresAt && !isExpired && !isExpiringSoon) {
      const timeRemaining = expiresAt.getTime() - now.getTime()
      const minutesRemaining = Math.floor(timeRemaining / (60 * 1000))
      console.log(`ℹ️ Token encore valide pour ${minutesRemaining} minutes, pas de rafraîchissement nécessaire`)
      
      return NextResponse.json({
        success: true,
        access_token: connection.access_token,
        expires_at: connection.expires_at,
        message: `Token encore valide pour ${minutesRemaining} minutes`
      })
    }

    // Rafraîchir le token seulement si nécessaire
    console.log('🔄 Rafraîchissement du token pour connection_id:', connection_id)
    console.log('   Token expiré:', isExpired)
    console.log('   Token expire bientôt:', isExpiringSoon)
    console.log('   GOOGLE_CLIENT_ID configuré:', !!GOOGLE_CLIENT_ID)
    console.log('   GOOGLE_CLIENT_ID valeur:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'MANQUANT')
    console.log('   GOOGLE_CLIENT_SECRET configuré:', !!GOOGLE_CLIENT_SECRET)
    
    // Fonction pour faire l'appel avec retry et timeout
    async function refreshTokenWithRetry(retries = 3, timeout = 10000) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeout)
          
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              refresh_token: connection.refresh_token,
              grant_type: 'refresh_token'
            }),
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          return tokenResponse
        } catch (error: any) {
          if (error.name === 'AbortError' || error.cause?.code === 'ETIMEDOUT') {
            console.warn(`⚠️ Tentative ${attempt}/${retries} : Timeout lors du rafraîchissement`)
            if (attempt < retries) {
              // Attendre avant de réessayer (backoff exponentiel)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
              continue
            } else {
              throw new Error(`Timeout après ${retries} tentatives`)
            }
          } else {
            throw error
          }
        }
      }
      throw new Error('Échec après toutes les tentatives')
    }
    
    let tokenResponse
    try {
      tokenResponse = await refreshTokenWithRetry()
    } catch (error: any) {
      // Si toutes les tentatives ont échoué avec timeout
      if (error.message?.includes('Timeout')) {
        const now = new Date()
        const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null
        const isExpired = expiresAt && expiresAt < now
        
        if (!isExpired && connection.access_token) {
          console.log('⚠️ Timeout après toutes les tentatives mais token encore valide, utilisation du token existant')
          return NextResponse.json({
            success: true,
            access_token: connection.access_token,
            expires_at: connection.expires_at,
            message: 'Timeout lors du rafraîchissement, utilisation du token existant'
          })
        }
        
        await supabase
          .from('oauth_connections')
          .update({
            last_error: 'Timeout lors du rafraîchissement du token après plusieurs tentatives',
            is_active: isExpired ? false : true
          })
          .eq('id', connection_id)
        
        return NextResponse.json({
          error: 'Timeout lors du rafraîchissement',
          details: 'Le serveur Google n\'a pas répondu à temps après plusieurs tentatives',
          retry: true
        }, { status: 504 })
      }
      
      throw error // Relancer l'erreur pour qu'elle soit gérée par le catch global
    }

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({ error: 'Erreur inconnue' }))
      const errorText = await tokenResponse.text().catch(() => '')
      console.error('❌ Erreur refresh token:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
        errorText: errorText.substring(0, 200),
        clientId: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'MANQUANT',
        hasClientSecret: !!GOOGLE_CLIENT_SECRET,
        refreshTokenLength: connection.refresh_token?.length || 0
      })
      
      // Erreur spécifique : "Could not determine client ID from request" ou "invalid_client"
      if (errorData.error === 'invalid_client' || errorText.includes('client ID') || errorText.includes('client_id') || errorData.error_description?.includes('client ID')) {
        console.error('🚨 ERREUR CLIENT ID / REFRESH TOKEN :')
        console.error('   Client ID utilisé:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 30)}...` : 'MANQUANT')
        console.error('   Erreur Google:', errorData.error_description || errorData.error)
        console.error('   Solution possible : Le refresh_token a peut-être été obtenu avec un autre Client ID')
        console.error('   → Il faut reconnecter Google Calendar/Gmail pour obtenir un nouveau refresh_token')
        
        await supabase
          .from('oauth_connections')
          .update({ 
            last_error: `Erreur Client ID/Refresh Token: ${errorData.error_description || errorData.error || 'Could not determine client ID'}. Le refresh_token ne correspond peut-être pas au Client ID actuel. Reconnectez Google Calendar/Gmail.`,
            is_active: false
          })
          .eq('id', connection_id)

        return NextResponse.json({ 
          error: 'Erreur de configuration Google OAuth',
          details: {
            ...errorData,
            message: errorData.error_description || 'Could not determine client ID from request',
            solution: 'Le refresh_token ne correspond peut-être pas au Client ID actuel. Veuillez reconnecter Google Calendar/Gmail dans les paramètres pour obtenir un nouveau refresh_token.'
          }
        }, { status: 400 })
      }
      
      // Erreur "invalid_grant" : refresh_token invalide ou révoqué
      if (errorData.error === 'invalid_grant' || errorData.error_description?.includes('Token has been expired or revoked')) {
        console.error('🚨 REFRESH TOKEN INVALIDE OU RÉVOQUÉ :')
        console.error('   Le refresh_token a été révoqué ou est invalide')
        console.error('   → Il faut reconnecter Google Calendar/Gmail')
        
        await supabase
          .from('oauth_connections')
          .update({ 
            last_error: `Refresh token invalide ou révoqué: ${errorData.error_description || errorData.error}. Reconnectez Google Calendar/Gmail.`,
            is_active: false,
            refresh_token: null // Supprimer le refresh_token invalide
          })
          .eq('id', connection_id)

        return NextResponse.json({ 
          error: 'Refresh token invalide ou révoqué',
          details: {
            ...errorData,
            message: 'Le refresh_token a été révoqué ou est invalide',
            solution: 'Veuillez reconnecter Google Calendar/Gmail dans les paramètres pour obtenir un nouveau refresh_token.'
          }
        }, { status: 400 })
      }
      
      // Si le token n'est pas encore expiré et que le refresh échoue,
      // ne pas marquer comme inactif (le token pourrait encore fonctionner)
      if (!isExpired) {
        console.log('⚠️ Rafraîchissement échoué mais token pas encore expiré, on continue avec le token existant')
        await supabase
          .from('oauth_connections')
          .update({ 
            last_error: `Rafraîchissement échoué: ${errorData.error_description || errorData.error || 'Erreur inconnue'}`,
            // Ne pas désactiver si le token n'est pas encore expiré
          })
          .eq('id', connection_id)
        
        return NextResponse.json({ 
          error: 'Impossible de rafraîchir le token',
          details: errorData,
          message: 'Le token existant sera utilisé car il n\'est pas encore expiré'
        }, { status: 400 })
      }
      
      // Si le token est expiré et que le refresh échoue, marquer comme inactif
      await supabase
        .from('oauth_connections')
        .update({ 
          last_error: errorData.error_description || errorData.error || 'Erreur de rafraîchissement',
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
    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (expires_in || 3600))

    // Mettre à jour en DB
    const { error: updateError } = await supabase
      .from('oauth_connections')
      .update({
        access_token,
        expires_at: newExpiresAt.toISOString(),
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
      expires_at: newExpiresAt.toISOString() 
    })

  } catch (error: any) {
    console.error('Erreur refresh:', error)
    
    // Gérer les erreurs de timeout spécifiquement
    if (error.name === 'AbortError' || error.cause?.code === 'ETIMEDOUT' || error.message?.includes('Timeout')) {
      console.error('⏱️ Timeout lors du rafraîchissement du token')
      
      // Si on n'a pas la connexion, essayer de la récupérer
      if (!connection && connection_id) {
        const { data: connectionData } = await supabase
          .from('oauth_connections')
          .select('*')
          .eq('id', connection_id)
          .single()
        connection = connectionData
      }
      
      // Si le token n'est pas encore expiré, retourner le token actuel
      if (connection) {
        const now = new Date()
        const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null
        const isExpired = expiresAt && expiresAt < now
        
        if (!isExpired && connection.access_token) {
          console.log('⚠️ Timeout mais token encore valide, utilisation du token existant')
          return NextResponse.json({
            success: true,
            access_token: connection.access_token,
            expires_at: connection.expires_at,
            message: 'Timeout lors du rafraîchissement, utilisation du token existant'
          })
        }
        
        // Si le token est expiré et timeout, marquer comme erreur
        if (connection_id) {
          await supabase
            .from('oauth_connections')
            .update({
              last_error: 'Timeout lors du rafraîchissement du token',
              is_active: isExpired ? false : true
            })
            .eq('id', connection_id)
        }
      }
      
      return NextResponse.json({
        error: 'Timeout lors du rafraîchissement',
        details: 'Le serveur Google n\'a pas répondu à temps. Veuillez réessayer.',
        retry: true
      }, { status: 504 })
    }
    
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error.message || 'Erreur inconnue lors du rafraîchissement'
    }, { status: 500 })
  }
}
