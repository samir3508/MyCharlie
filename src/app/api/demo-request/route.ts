import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ddvcontact35@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { 
      nom, 
      email, 
      telephone, 
      entreprise, 
      metier, 
      autreMetier, 
      situation, 
      automatiser, 
      rappel, 
      consentement, 
      source 
    } = await req.json()

    // Validation basique
    if (!nom || !email || !telephone || !consentement) {
      console.error('Demo request validation: missing required fields', { nom, email, telephone, consentement })
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    console.log('Demo request received:', { 
      nom, 
      email, 
      telephone, 
      entreprise, 
      metier, 
      autreMetier, 
      situation, 
      automatiser, 
      rappel, 
      consentement, 
      source 
    })

    // Vérifier que Resend est configuré
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json({ error: 'Configuration email manquante' }, { status: 500 })
    }

    const subject = source === 'demo' ? '🚀 Nouvelle demande de démo' : '✨ Nouvelle inscription gratuite'

    const metierAffiche = metier === 'autre' ? autreMetier : metier

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; margin: 0;">${subject}</h1>
          <p style="color: #6b7280; margin: 5px 0 0;">Demande reçue depuis le site MyCharlie</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">📋 1️⃣ Informations essentielles</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 40%;">Nom et prénom</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${nom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Nom de l'entreprise</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${entreprise || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Téléphone *</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${telephone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email *</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${email}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">🔍 2️⃣ Qualification rapide</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 40%;">Votre métier</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${metierAffiche || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Votre situation actuelle</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${situation || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Ce que vous aimeriez automatiser</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${automatiser || 'Non renseigné'}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">📞 3️⃣ Prise de contact</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 40%;">Quand être rappelé ?</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${rappel || 'Non renseigné'}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">✅ 4️⃣ Consentement</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 40%;">Accepte d'être contacté</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${consentement ? '✅ Oui' : '❌ Non'}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>Cette demande a été envoyée depuis la page d'accueil de MyCharlie</p>
          <p>Type de demande : <strong>${source === 'demo' ? 'Démo' : 'Essai gratuit'}</strong></p>
          <p>Date : ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'MyCharlie <onboarding@resend.dev>',
      to: ['ddvcontact35@gmail.com', 'onboarding@resend.dev'],
      subject,
      html
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 })
    }

    console.log('Email sent successfully:', data?.id)
    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err) {
    console.error('Demo request error:', err)
    return NextResponse.json({ error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
