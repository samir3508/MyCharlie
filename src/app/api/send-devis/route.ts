/**
 * API Next.js : Envoi devis par email (fallback de l'Edge Function send-devis)
 *
 * Utilisé par le Code Tool n8n quand l'Edge Function Supabase retourne 404.
 * Même logique que supabase/functions/send-devis :
 * - Récupère devis + client
 * - Télécharge le PDF depuis /api/pdf/devis/[id]
 * - Envoie via /api/email/send-gmail
 *
 * Sécurisation : Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getAppUrl(req: NextRequest): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (req ? new URL(req.url).origin : 'https://mycharlie.fr')
  )
}

function buildDevisEmailHtml(
  devis: Record<string, unknown>,
  client: Record<string, unknown> | null
): { subject: string; html: string; text: string } {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'
  const pdfUrl =
    (devis.pdf_url as string) || `${appUrl}/api/pdf/devis/${devis.id}`
  const signUrl = (devis.signature_token as string)
    ? `${appUrl}/sign/${devis.signature_token}`
    : null
  const nomComplet =
    (client?.nom_complet as string) ||
    [client?.prenom, client?.nom].filter(Boolean).join(' ') ||
    'Client'

  const titre = (devis.titre as string) || 'Sans titre'
  const subject = `Devis ${devis.numero} - ${titre}`
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF4D00, #E64600); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">Devis ${devis.numero}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${titre.replace(/</g, '&lt;')}</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Bonjour ${String(nomComplet).replace(/</g, '&lt;')},</p>
    <p>Veuillez trouver ci-dessous votre devis détaillé.</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4D00;">
      <h3 style="margin: 0 0 10px 0; color: #333;">Récapitulatif</h3>
      <p><strong>Montant HT:</strong> ${devis.montant_ht ?? 0} €</p>
      <p><strong>Montant TVA:</strong> ${devis.montant_tva ?? 0} €</p>
      <p><strong>Montant TTC:</strong> <span style="color: #FF4D00; font-size: 18px; font-weight: bold;">${devis.montant_ttc ?? 0} €</span></p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${pdfUrl}" style="background: #FF4D00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">Voir le devis complet</a>
      ${signUrl ? `<a href="${signUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">Signer le devis</a>` : ''}
    </div>
    <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
      Cet email a été envoyé via LÉO – Votre assistant de gestion<br>
      <a href="${appUrl}" style="color: #FF4D00; text-decoration: none;">${appUrl}</a>
    </p>
  </div>
</div>`

  const text = `Bonjour ${nomComplet},\n\nVeuillez trouver ci-dessous votre devis détaillé.\n\nRécapitulatif:\n- Montant HT: ${devis.montant_ht ?? 0} €\n- Montant TVA: ${devis.montant_tva ?? 0} €\n- Montant TTC: ${devis.montant_ttc ?? 0} €\n\nVoir le devis complet: ${pdfUrl}${signUrl ? `\nSigner le devis: ${signUrl}` : ''}\n\nCet email a été envoyé via LÉO – Votre assistant de gestion\n${appUrl}`

  return { subject, html, text }
}

/** GET : diagnostic pour vérifier que la route est déployée (pas d'auth) */
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: 'send-devis',
    method: 'POST',
    hint: 'Utiliser POST avec Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY',
  })
}

export async function POST(request: NextRequest) {
  try {
    // Authentification : Bearer doit correspondre à SUPABASE_SERVICE_ROLE_KEY
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authorization Bearer requis' },
        { status: 401 }
      )
    }
    const token = authHeader.slice(7)
    if (token !== SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Token invalide' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tenant_id, devis_id, method = 'email', recipient_email, recipient_phone } = body

    if (!tenant_id || !devis_id) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'tenant_id et devis_id requis' },
        { status: 400 }
      )
    }
    if (method === 'email' && !recipient_email) {
      return NextResponse.json(
        { success: false, error: 'MISSING_EMAIL', message: 'recipient_email requis pour method=email' },
        { status: 400 }
      )
    }
    if (method === 'whatsapp' && !recipient_phone) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PHONE', message: 'recipient_phone requis pour method=whatsapp' },
        { status: 400 }
      )
    }

    // Seul method=email est implémenté
    if (method !== 'email') {
      return NextResponse.json(
        { success: false, error: 'NOT_IMPLEMENTED', message: 'Seul method=email est supporté' },
        { status: 400 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('id, numero, titre, montant_ht, montant_tva, montant_ttc, pdf_url, signature_token, client_id')
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (devisError || !devis) {
      return NextResponse.json(
        { success: false, error: 'DEVIS_NOT_FOUND', message: 'Devis introuvable ou n\'appartient pas à ce tenant' },
        { status: 404 }
      )
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom, nom_complet, email, telephone')
      .eq('id', devis.client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'CLIENT_NOT_FOUND', message: 'Client introuvable pour ce devis' },
        { status: 404 }
      )
    }

    const appUrl = getAppUrl(request)
    const { subject, html, text } = buildDevisEmailHtml(devis, client)

    // Télécharger le PDF pour pièce jointe
    let pdfAttachment: { filename: string; content: string; mime_type: string } | null = null
    try {
      const pdfUrl = `${appUrl}/api/pdf/devis/${devis_id}`
      const pdfRes = await fetch(pdfUrl)
      if (pdfRes.ok) {
        const buf = await pdfRes.arrayBuffer()
        const b64 = Buffer.from(buf).toString('base64')
        pdfAttachment = {
          filename: `Devis_${devis.numero}.pdf`,
          content: b64,
          mime_type: 'application/pdf',
        }
      }
    } catch {
      // On continue sans pièce jointe
    }

    const emailPayload: Record<string, unknown> = {
      tenant_id,
      to: recipient_email,
      subject,
      body: text,
      html_body: html,
      related_type: 'devis',
      related_id: devis.id,
    }
    if (pdfAttachment) {
      emailPayload.attachments = [pdfAttachment]
    }

    const apiRes = await fetch(`${appUrl}/api/email/send-gmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    })

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          error: err.error || 'API_ERROR',
          message: err.message || 'Erreur lors de l\'envoi de l\'email',
        },
        { status: apiRes.status }
      )
    }

    const sentAt = new Date().toISOString()
    return NextResponse.json({
      success: true,
      data: {
        sent_at: sentAt,
        devis: { id: devis.id, numero: devis.numero, montant_ttc: devis.montant_ttc },
        method,
        recipient: recipient_email,
      },
      message: `Email envoyé à ${recipient_email}`,
    })
  } catch (e) {
    console.error('[api/send-devis]', e)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Erreur inattendue' },
      { status: 500 }
    )
  }
}
