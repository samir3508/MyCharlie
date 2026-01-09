import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

interface WhatsAppDevisRequest {
  to: string
  clientName: string
  devisNumero: string
  signatureLink: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppDevisRequest = await request.json()
    const { to, clientName, devisNumero, signatureLink } = body

    // Validation
    if (!to || !clientName || !devisNumero || !signatureLink) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paramètres manquants: to, clientName, devisNumero, signatureLink sont requis' 
        },
        { status: 400 }
      )
    }

    // Vérifier si WhatsApp est configuré
    if (!whatsappService.isConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service WhatsApp non configuré. Vérifiez les variables d environnement.' 
        },
        { status: 500 }
      )
    }

    // Envoyer le message WhatsApp
    const result = await whatsappService.sendDevisReadyNotification(
      to,
      clientName,
      devisNumero,
      signatureLink
    )

    return NextResponse.json({
      success: true,
      message: 'Message WhatsApp envoyé avec succès',
      data: {
        messageId: result.messages[0]?.id,
        to: to,
        devisNumero: devisNumero
      }
    })

  } catch (error) {
    console.error('Erreur envoi WhatsApp devis:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de l envoi WhatsApp' 
      },
      { status: 500 }
    )
  }
}
