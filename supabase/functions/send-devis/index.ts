/**
 * Edge Function: Envoi devis par email
 *
 * - Récupère le devis + client
 * - Génère l'email HTML (lien PDF, signature si dispo)
 * - Envoie via Gmail API (OAuth du tenant)
 * - Met à jour date_envoi + statut 'envoye' sur le devis
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SendDevisRequestSchema = z.object({
  tenant_id: z.string().uuid('tenant_id invalide'),
  devis_id: z.string().uuid('devis_id invalide'),
  method: z.enum(['email', 'whatsapp']).default('email'),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

const APP_URL = Deno.env.get('APP_URL') || 'https://mycharlie.fr'
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || ''

function buildDevisEmailHtml(devis: any, client: any): { subject: string; html: string; text: string } {
  const pdfUrl = devis.pdf_url || `${APP_URL}/api/pdf/devis/${devis.id}`
  const signUrl = devis.signature_token
    ? `${APP_URL}/sign/${devis.signature_token}`
    : null
  const nomComplet = client?.nom_complet || [client?.prenom, client?.nom].filter(Boolean).join(' ') || 'Client'

  const subject = `Devis ${devis.numero} - ${devis.titre || 'Sans titre'}`
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF4D00, #E64600); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">Devis ${devis.numero}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${(devis.titre || 'Sans titre').replace(/</g, '&lt;')}</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Bonjour ${nomComplet.replace(/</g, '&lt;')},</p>
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
      <a href="${APP_URL}" style="color: #FF4D00; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</div>`

  const text = `Bonjour ${nomComplet},\n\nVeuillez trouver ci-dessous votre devis détaillé.\n\nRécapitulatif:\n- Montant HT: ${devis.montant_ht ?? 0} €\n- Montant TVA: ${devis.montant_tva ?? 0} €\n- Montant TTC: ${devis.montant_ttc ?? 0} €\n\nVoir le devis complet: ${pdfUrl}${signUrl ? `\nSigner le devis: ${signUrl}` : ''}\n\nCet email a été envoyé via LÉO – Votre assistant de gestion\n${APP_URL}`

  return { subject, html, text }
}

// Pas besoin de fonctions supplémentaires, on appelle l'API Next.js

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Seule la méthode POST est autorisée')
  }

  try {
    const auth = validateAuth(req)
    if (!auth.success) {
      return errorResponse(401, auth.error!.code, auth.error!.message)
    }

    const body = await req.json()
    const parsed = SendDevisRequestSchema.safeParse(body)
    if (!parsed.success) {
      return handleZodError(parsed.error)
    }

    const { tenant_id, devis_id, method, recipient_email, recipient_phone } = parsed.data

    if (method === 'email' && !recipient_email) {
      return errorResponse(400, 'MISSING_EMAIL', 'recipient_email requis pour method=email')
    }
    if (method === 'whatsapp' && !recipient_phone) {
      return errorResponse(400, 'MISSING_PHONE', 'recipient_phone requis pour method=whatsapp')
    }

    // Récupérer le devis avec toutes ses relations
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select(`
        id,
        numero,
        titre,
        montant_ht,
        montant_tva,
        montant_ttc,
        pdf_url,
        signature_token,
        client_id,
        date_creation,
        delai_execution,
        conditions_paiement,
        notes,
        adresse_chantier
      `)
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (devisError || !devis) {
      console.error('❌ Erreur récupération devis:', devisError)
      return errorResponse(404, 'DEVIS_NOT_FOUND', 'Devis introuvable ou n\'appartient pas à ce tenant', { devis_id, error: devisError })
    }

    console.log(`✅ Devis trouvé: ${devis.numero} (${devis.montant_ttc}€ TTC)`)

    // Récupérer le client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom, nom_complet, email, telephone, adresse_facturation')
      .eq('id', devis.client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      console.error('❌ Erreur récupération client:', clientError)
      return errorResponse(404, 'CLIENT_NOT_FOUND', 'Client introuvable pour ce devis', { client_id: devis.client_id, error: clientError })
    }

    console.log(`✅ Client trouvé: ${client.nom_complet} (${client.email})`)

    if (method === 'email') {
      // ═══════════════════════════════════════════════════════════════════════
      // Télécharger le PDF du devis pour l'ajouter en pièce jointe
      // ═══════════════════════════════════════════════════════════════════════
      
      let pdfAttachment = null
      try {
        const pdfUrl = devis.pdf_url || `${APP_URL}/api/pdf/devis/${devis.id}`
        console.log(`📄 Téléchargement du PDF depuis: ${pdfUrl}`)
        
        const pdfResponse = await fetch(pdfUrl)
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer()
          const pdfBytes = new Uint8Array(pdfBuffer)
          
          // Encoder en base64 (compatible Deno)
          let binary = ''
          for (let i = 0; i < pdfBytes.length; i++) {
            binary += String.fromCharCode(pdfBytes[i])
          }
          const pdfBase64 = btoa(binary)
          
          pdfAttachment = {
            filename: `Devis_${devis.numero}.pdf`,
            content: pdfBase64,
            mime_type: 'application/pdf'
          }
          console.log(`✅ PDF téléchargé (${pdfBuffer.byteLength} bytes)`)
        } else {
          console.warn(`⚠️ Impossible de télécharger le PDF: ${pdfResponse.status} ${pdfResponse.statusText}`)
        }
      } catch (pdfError) {
        console.error('❌ Erreur lors du téléchargement du PDF:', pdfError)
        // On continue quand même, l'email sera envoyé avec juste le lien
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // Appeler l'API Next.js qui a accès aux secrets Google OAuth
      // ═══════════════════════════════════════════════════════════════════════
      
      const toEmail = recipient_email!
      const { subject, html, text } = buildDevisEmailHtml(devis, client || {})

      const emailPayload: any = {
        tenant_id,
        to: toEmail,
        subject,
        body: text,
        html_body: html,
        related_type: 'devis',
        related_id: devis.id
      }
      
      // Ajouter le PDF en pièce jointe si disponible
      if (pdfAttachment) {
        emailPayload.attachments = [pdfAttachment]
      }

      const apiResponse = await fetch(`${APP_URL}/api/email/send-gmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      })

      if (!apiResponse.ok) {
        const apiError = await apiResponse.json().catch(() => ({ error: 'Erreur API' }))
        console.error('Erreur API send-gmail:', apiError)

        return errorResponse(
          apiResponse.status,
          apiError.error || 'API_ERROR',
          apiError.message || 'Erreur lors de l\'envoi de l\'email',
          { details: apiError }
        )
      }

      const apiResult = await apiResponse.json()
      console.log('✅ Email envoyé via API Next.js:', apiResult)
    }
    // TODO: method=whatsapp → intégration Twilio/autre

    const today = new Date().toISOString().split('T')[0]
    const { error: updateError } = await supabase
      .from('devis')
      .update({
        statut: 'envoye',
        date_envoi: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    const sentAt = new Date().toISOString()
    const payload = {
      sent_at: sentAt,
      devis: { id: devis.id, numero: devis.numero, montant_ttc: devis.montant_ttc },
      method,
      recipient: method === 'email' ? recipient_email : recipient_phone,
    }

    return successResponse(payload, `Email envoyé à ${method === 'email' ? recipient_email : recipient_phone}`)
  } catch (e) {
    console.error('send-devis error:', e)
    return errorResponse(500, 'INTERNAL_ERROR', e instanceof Error ? e.message : 'Erreur inattendue')
  }
})
