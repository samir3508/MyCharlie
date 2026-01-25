import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
// Fallback: Render n'a souvent que NEXT_PUBLIC_GOOGLE_CLIENT_ID ; le refresh token côté serveur en a besoin
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

interface EmailRequest {
  tenant_id: string
  to: string
  subject: string
  body: string
  html_body?: string
  cc?: string
  bcc?: string
  attachments?: Array<{
    filename: string
    content: string // Base64
    mime_type: string
  }>
  // Contexte métier
  related_type?: 'devis' | 'facture' | 'relance'
  related_id?: string
}

// Rafraîchir le token si nécessaire
async function ensureValidToken(supabase: any, connection: any): Promise<string | null> {
  const now = new Date()
  const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null
  
  // Token valide (avec 5 min de marge)
  if (expiresAt && expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    return connection.access_token
  }

  // Besoin de rafraîchir
  if (!connection.refresh_token) {
    console.error('Pas de refresh_token disponible')
    await supabase
      .from('oauth_connections')
      .update({ 
        last_error: 'Pas de refresh_token disponible',
        is_active: false 
      })
      .eq('id', connection.id)
    return null
  }

  // Vérifier que les credentials Google sont configurés
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET non configurés')
    await supabase
      .from('oauth_connections')
      .update({ 
        last_error: 'Credentials Google non configurés (GOOGLE_CLIENT_ID/SECRET manquants)',
        is_active: false 
      })
      .eq('id', connection.id)
    return null
  }

  console.log('Rafraîchissement du token Gmail...')

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
    const error = await tokenResponse.json().catch(() => ({ error: 'Erreur inconnue' }))
    console.error('Erreur refresh token:', error)
    
    const errorMessage = error.error_description || error.error || 'Token invalide'
    await supabase
      .from('oauth_connections')
      .update({ 
        last_error: errorMessage,
        is_active: false 
      })
      .eq('id', connection.id)
    
    return null
  }

  const tokens = await tokenResponse.json()
  const newExpires = new Date()
  newExpires.setSeconds(newExpires.getSeconds() + (tokens.expires_in || 3600))

  await supabase
    .from('oauth_connections')
    .update({
      access_token: tokens.access_token,
      expires_at: newExpires.toISOString(),
      last_error: null
    })
    .eq('id', connection.id)

  return tokens.access_token
}

// Créer le contenu MIME de l'email
function createMimeEmail(
  from: string,
  to: string,
  subject: string,
  body: string,
  htmlBody?: string,
  cc?: string,
  attachments?: EmailRequest['attachments']
): string {
  const boundary = `boundary_${Date.now()}`
  const hasAttachments = attachments && attachments.length > 0
  
  let mimeMessage = ''
  
  // Headers
  mimeMessage += `From: ${from}\r\n`
  mimeMessage += `To: ${to}\r\n`
  if (cc) mimeMessage += `Cc: ${cc}\r\n`
  mimeMessage += `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=\r\n`
  mimeMessage += 'MIME-Version: 1.0\r\n'
  
  if (hasAttachments) {
    mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`
    
    // Partie texte/html
    mimeMessage += `--${boundary}\r\n`
    if (htmlBody) {
      mimeMessage += 'Content-Type: text/html; charset=UTF-8\r\n\r\n'
      mimeMessage += htmlBody + '\r\n'
    } else {
      mimeMessage += 'Content-Type: text/plain; charset=UTF-8\r\n\r\n'
      mimeMessage += body + '\r\n'
    }
    
    // Pièces jointes
    for (const attachment of attachments!) {
      mimeMessage += `--${boundary}\r\n`
      mimeMessage += `Content-Type: ${attachment.mime_type}; name="${attachment.filename}"\r\n`
      mimeMessage += 'Content-Transfer-Encoding: base64\r\n'
      mimeMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`
      mimeMessage += attachment.content + '\r\n'
    }
    
    mimeMessage += `--${boundary}--`
  } else {
    if (htmlBody) {
      mimeMessage += 'Content-Type: text/html; charset=UTF-8\r\n\r\n'
      mimeMessage += htmlBody
    } else {
      mimeMessage += 'Content-Type: text/plain; charset=UTF-8\r\n\r\n'
      mimeMessage += body
    }
  }
  
  return mimeMessage
}

export async function POST(request: NextRequest) {
  try {
    const data: EmailRequest = await request.json()
    
    const { tenant_id, to, subject, body, html_body, cc, bcc, attachments, related_type, related_id } = data

    // Validation
    if (!tenant_id || !to || !subject || !body) {
      return NextResponse.json({ 
        error: 'Champs requis: tenant_id, to, subject, body' 
      }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Récupérer la connexion Gmail du tenant
    const { data: connection, error: connError } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'google')
      .eq('service', 'gmail')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      console.log('Pas de connexion Gmail trouvée pour tenant:', tenant_id)
      return NextResponse.json({ 
        error: 'Gmail non connecté',
        message: 'Connectez votre compte Gmail dans Paramètres > Intégrations'
      }, { status: 400 })
    }

    // S'assurer que le token est valide
    const accessToken = await ensureValidToken(supabase, connection)
    
    if (!accessToken) {
      // Récupérer le dernier message d'erreur pour plus de détails
      const { data: connWithError } = await supabase
        .from('oauth_connections')
        .select('last_error')
        .eq('id', connection.id)
        .single()
      
      const errorMessage = connWithError?.last_error || 'Token Gmail invalide'
      
      return NextResponse.json({ 
        error: 'Token Gmail invalide',
        message: errorMessage || 'Reconnectez votre compte Gmail dans Paramètres > Intégrations',
        details: {
          has_refresh_token: !!connection.refresh_token,
          has_google_credentials: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
          expires_at: connection.expires_at
        }
      }, { status: 401 })
    }

    // Créer l'email au format MIME
    const mimeEmail = createMimeEmail(
      connection.email,
      to,
      subject,
      body,
      html_body,
      cc,
      attachments
    )

    // Encoder en base64 URL-safe
    const encodedEmail = Buffer.from(mimeEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Envoyer via l'API Gmail
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedEmail })
    })

    if (!gmailResponse.ok) {
      const gmailError = await gmailResponse.json()
      console.error('Erreur Gmail API:', gmailError)

      // Logger l'erreur
      await supabase.from('email_logs').insert({
        tenant_id,
        oauth_connection_id: connection.id,
        from_email: connection.email,
        to_email: to,
        subject,
        body_preview: body.substring(0, 200),
        related_type,
        related_id,
        status: 'failed',
        error_message: gmailError.error?.message || 'Erreur Gmail'
      })

      return NextResponse.json({ 
        error: 'Erreur envoi Gmail',
        details: gmailError 
      }, { status: 500 })
    }

    const gmailResult = await gmailResponse.json()

    // Logger le succès
    await supabase.from('email_logs').insert({
      tenant_id,
      oauth_connection_id: connection.id,
      from_email: connection.email,
      to_email: to,
      cc_email: cc ? [cc] : null,
      subject,
      body_preview: body.substring(0, 200),
      attachments: attachments ? attachments.map(a => ({ name: a.filename, type: a.mime_type })) : [],
      related_type,
      related_id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      gmail_message_id: gmailResult.id,
      gmail_thread_id: gmailResult.threadId
    })

    // Mettre à jour last_used_at
    await supabase
      .from('oauth_connections')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', connection.id)

    return NextResponse.json({
      success: true,
      message_id: gmailResult.id,
      thread_id: gmailResult.threadId,
      from: connection.email,
      to
    })

  } catch (error) {
    console.error('Erreur send-gmail:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
