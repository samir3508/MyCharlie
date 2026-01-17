import { NextRequest, NextResponse } from 'next/server'

// Interface pour les messages WhatsApp entrants
interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      field: string
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          text?: {
            body: string
          }
          type: string
        }>
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
    }>
  }>
}

// Vérification du webhook (mode challenge)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Token de vérification (à configurer dans WhatsApp)
  const VERIFY_TOKEN = 'charlie_whatsapp_2024'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
}

// Réception des messages WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppWebhookPayload = await request.json()
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Traiter chaque entrée
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        // Messages entrants
        if (change.value.messages) {
          for (const message of change.value.messages) {
            await handleIncomingMessage(message)
          }
        }

        // Changements de statut de messages
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            await handleMessageStatus(status)
          }
        }
      }
    }

    return NextResponse.json({ status: 'received' })

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// Gérer les messages entrants
async function handleIncomingMessage(message: {
  from: string
  id: string
  timestamp: string
  text?: { body: string }
  type: string
}) {
  const { from, id, timestamp, text, type } = message

  console.log(`Message reçu de ${from}:`, text?.body || 'Type: ' + type)

  if (text?.body) {
    await processTextMessage(from, text.body, id)
  }
}

// Gérer les changements de statut
async function handleMessageStatus(status: {
  id: string
  status: string
  timestamp: string
  recipient_id: string
}) {
  const { id, status: messageStatus } = status
  console.log(`Message ${id} status changed to: ${messageStatus}`)
}

// Traiter les messages texte
async function processTextMessage(from: string, body: string, messageId: string) {
  console.log(`Traitement message de ${from}: "${body}"`)

  const message = body.toLowerCase().trim()
  
  let autoReply = ''
  
  if (message.includes('devis') || message.includes('facture')) {
    autoReply = 'Je vais vérifier vos documents. Un instant svp !'
  } else if (message.includes('paiement') || message.includes('payer')) {
    autoReply = 'Pour le paiement, utilisez le lien envoyé par email.'
  } else if (message.includes('rendez-vous') || message.includes('rdv')) {
    autoReply = 'Pour prendre RDV, contactez directement votre artisan.'
  } else if (message.includes('bonjour') || message.includes('salut')) {
    autoReply = 'Bonjour ! Je suis Charlie, votre assistant BTP. Comment puis-je vous aider ?'
  } else if (message.includes('merci')) {
    autoReply = 'Avec plaisir ! N\'hesitez pas si besoin.'
  } else {
    autoReply = 'Je suis Charlie, assistant BTP. Pour toute question sur vos devis, factures ou paiements, demandez !'
  }

  console.log(`Réponse automatique: ${autoReply}`)
  await saveMessage(from, body, messageId, 'received')
}

// Sauvegarder le message en base de données
async function saveMessage(from: string, body: string, messageId: string, direction: 'sent' | 'received') {
  try {
    console.log(`Message sauvegardé: ${direction} - ${from} - ${body} - ${messageId}`)
  } catch (error) {
    console.error('Erreur sauvegarde message:', error)
  }
}
