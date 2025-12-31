import { Resend } from 'resend'
import { getAppUrl, getDevisUrl, getFactureUrl } from '@/lib/utils/urls'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    console.log('Envoi email avec Resend...')
    console.log('API Key présente:', !!process.env.RESEND_API_KEY)
    
    const result = await resend.emails.send({
      from: options.from || 'onboarding@resend.dev',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    })

    console.log('Email envoyé avec succès:', result)
    return result
  } catch (error) {
    console.error('Erreur envoi email:', error)
    throw error
  }
}

export function generateDevisEmail(devis: any, client: any) {
  const devisUrl = getDevisUrl(devis.id)
  const signUrl = `${getAppUrl()}/sign/${devis.signature_token}`
  
  return {
    subject: `Devis ${devis.numero} - ${devis.titre || 'Sans titre'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF4D00, #E64600); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Devis ${devis.numero}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${devis.titre || 'Sans titre'}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Bonjour ${client.nom_complet},</p>
          <p>Veuillez trouver ci-dessous votre devis détaillé.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4D00;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Récapitulatif</h3>
            <p><strong>Montant HT:</strong> ${devis.montant_ht} €</p>
            <p><strong>Montant TVA:</strong> ${devis.montant_tva} €</p>
            <p><strong>Montant TTC:</strong> <span style="color: #FF4D00; font-size: 18px; font-weight: bold;">${devis.montant_ttc} €</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${devisUrl}" style="background: #FF4D00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
              Voir le devis complet
            </a>
            ${devis.signature_token ? `
              <a href="${signUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
                Signer le devis
              </a>
            ` : ''}
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Cet email a été envoyé via LÉO - Votre assistant de gestion<br>
            <a href="${getAppUrl()}" style="color: #FF4D00; text-decoration: none;">${getAppUrl()}</a>
          </p>
        </div>
      </div>
    `
  }
}

export function generateFactureEmail(facture: any, client: any) {
  const factureUrl = getFactureUrl(facture.id)
  
  return {
    subject: `Facture ${facture.numero} - ${facture.titre || 'Sans titre'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF4D00, #E64600); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Facture ${facture.numero}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${facture.titre || 'Sans titre'}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Bonjour ${client.nom_complet},</p>
          <p>Veuillez trouver ci-dessous votre facture.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4D00;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Récapitulatif</h3>
            <p><strong>Date d'émission:</strong> ${facture.date_emission}</p>
            <p><strong>Date d'échéance:</strong> ${facture.date_echeance}</p>
            <p><strong>Montant HT:</strong> ${facture.montant_ht} €</p>
            <p><strong>Montant TVA:</strong> ${facture.montant_tva} €</p>
            <p><strong>Montant TTC:</strong> <span style="color: #FF4D00; font-size: 18px; font-weight: bold;">${facture.montant_ttc} €</span></p>
            <p><strong>Statut:</strong> <span style="background: ${facture.statut === 'payee' ? '#28a745' : '#ffc107'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${facture.statut}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${factureUrl}" style="background: #FF4D00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Voir la facture complète
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Cet email a été envoyé via LÉO - Votre assistant de gestion<br>
            <a href="${getAppUrl()}" style="color: #FF4D00; text-decoration: none;">${getAppUrl()}</a>
          </p>
        </div>
      </div>
    `
  }
}
