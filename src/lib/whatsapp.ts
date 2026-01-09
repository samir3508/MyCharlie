/**
 * WhatsApp Business API Integration pour Charlie
 * Permet d'envoyer des messages WhatsApp automatiquement
 */

interface WhatsAppMessage {
  messaging_product: string
  to: string
  type: 'template' | 'text'
  template?: {
    name: string
    language: { code: string }
    components?: Array<{
      type: 'body'
      parameters: Array<{ type: 'text' | 'currency' | 'date_time'; text?: string }>
    }>
  }
  text?: {
    body: string
  }
}

interface WhatsAppResponse {
  messaging_product: string
  contacts?: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
    status: string
  }>
}

class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  private baseUrl: string

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '965754179945375'
    this.baseUrl = 'https://graph.facebook.com/v22.0'
  }

  /**
   * Envoyer un message template WhatsApp
   */
  async sendTemplate(to: string, templateName: string, parameters?: Array<{ text: string }>): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'fr_FR' }
      }
    }

    // Ajouter les paramètres du template si fournis
    if (parameters && parameters.length > 0) {
      message.template!.components = [{
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text',
          text: param.text
        }))
      }]
    }

    return this.sendMessage(message)
  }

  /**
   * Envoyer un message texte personnalisé WhatsApp
   */
  async sendText(to: string, body: string): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: {
        body: body
      }
    }

    return this.sendMessage(message)
  }

  /**
   * Envoyer une notification de devis prêt à signer
   */
  async sendDevisReadyNotification(clientPhone: string, clientName: string, devisNumero: string, signatureLink: string): Promise<WhatsAppResponse> {
    const message = `📋 *Devis prêt à signer*

Bonjour ${clientName},

Votre devis *${devisNumero}* est prêt.

🔗 *Lien de signature :*
${signatureLink}

Cliquez sur le lien pour voir les détails et signer électroniquement.

Merci de votre confiance ! 🏢
CHARLIE - Votre assistant BTP`

    return this.sendText(clientPhone, message)
  }

  /**
   * Envoyer une notification de rappel de devis
   */
  async sendDevisReminder(clientPhone: string, clientName: string, devisNumero: string, signatureLink: string): Promise<WhatsAppResponse> {
    const message = `⏰ *Rappel devis à signer*

Bonjour ${clientName},

Petit rappel pour votre devis *${devisNumero}*.

🔗 *Lien de signature :*
${signatureLink}

N'hésitez pas à nous contacter si vous avez des questions.

CHARLIE - Votre assistant BTP`

    return this.sendText(clientPhone, message)
  }

  /**
   * Envoyer une confirmation de signature
   */
  async sendSignatureConfirmation(clientPhone: string, clientName: string, devisNumero: string): Promise<WhatsAppResponse> {
    const message = `✅ *Devis signé avec succès !*

Bonjour ${clientName},

Merci d'avoir signé le devis *${devisNumero}*.

📄 Le devis est maintenant accepté et validé.
🚀 Nous vous tiendrons informé du démarrage des travaux.

À très bientôt !

CHARLIE - Votre assistant BTP`

    return this.sendText(clientPhone, message)
  }

  /**
   * Envoyer une notification de facture
   */
  async sendFactureNotification(clientPhone: string, clientName: string, factureNumero: string, montant: string, dueDate: string): Promise<WhatsAppResponse> {
    const message = `🧾 *Nouvelle facture*

Bonjour ${clientName},

Votre facture *${factureNumero}* est disponible.

💰 *Montant :* ${montant}€
📅 *Date d'échéance :* ${dueDate}

La facture a été envoyée par email.

Merci pour votre paiement ! 💳

CHARLIE - Votre assistant BTP`

    return this.sendText(clientPhone, message)
  }

  /**
   * Envoyer une notification de relance
   */
  async sendRelanceNotification(clientPhone: string, clientName: string, factureNumero: string, montant: string): Promise<WhatsAppResponse> {
    const message = `⚠️ *Relance facture*

Bonjour ${clientName},

Rappel concernant votre facture *${factureNumero}*.

💰 *Montant dû :* ${montant}€
📅 *Paiement en attente*

Merci de régler la facture dès que possible.

Contactez-nous si besoin d'aide.

CHARLIE - Votre assistant BTP`

    return this.sendText(clientPhone, message)
  }

  /**
   * Méthode privée pour envoyer le message via l'API
   */
  private async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API Error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const data: WhatsAppResponse = await response.json()
      console.log('WhatsApp message sent successfully:', data)
      return data

    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  /**
   * Formater le numéro de téléphone pour WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Supprimer tous les caractères non numériques
    let cleaned = phone.replace(/\D/g, '')
    
    // Ajouter le préfixe international si absent
    if (!cleaned.startsWith('33') && cleaned.length === 10) {
      cleaned = '33' + cleaned.substring(1)
    }
    
    return cleaned
  }

  /**
   * Vérifier si le service WhatsApp est configuré
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId)
  }
}

// Exporter une instance singleton
export const whatsappService = new WhatsAppService()

// Types pour TypeScript
export type { WhatsAppMessage, WhatsAppResponse }

// Fonctions utilitaires pour faciliter l'utilisation
export const sendDevisWhatsApp = async (clientPhone: string, clientName: string, devisNumero: string, signatureLink: string) => {
  if (!whatsappService.isConfigured()) {
    console.warn('WhatsApp service not configured')
    return null
  }
  
  return whatsappService.sendDevisReadyNotification(clientPhone, clientName, devisNumero, signatureLink)
}

export const sendFactureWhatsApp = async (clientPhone: string, clientName: string, factureNumero: string, montant: string, dueDate: string) => {
  if (!whatsappService.isConfigured()) {
    console.warn('WhatsApp service not configured')
    return null
  }
  
  return whatsappService.sendFactureNotification(clientPhone, clientName, factureNumero, montant, dueDate)
}

export const sendRelanceWhatsApp = async (clientPhone: string, clientName: string, factureNumero: string, montant: string) => {
  if (!whatsappService.isConfigured()) {
    console.warn('WhatsApp service not configured')
    return null
  }
  
  return whatsappService.sendRelanceNotification(clientPhone, clientName, factureNumero, montant)
}
