import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

interface WhatsAppRelanceRequest {
  to: string
  clientName: string
  factureNumero: string
  montant: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppRelanceRequest = await request.json()
    const { to, clientName, factureNumero, montant } = body

    // Validation
    if (!to || !clientName || !factureNumero || !montant) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paramètres manquants: to, clientName, factureNumero, montant sont requis' 
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
    const result = await whatsappService.sendRelanceNotification(
      to,
      clientName,
      factureNumero,
      montant
    )

    return NextResponse.json({
      success: true,
      message: 'Message WhatsApp envoyé avec succès',
      data: {
        messageId: result.messages[0]?.id,
        to: to,
        factureNumero: factureNumero
      }
    })

  } catch (error) {
    console.error('Erreur envoi WhatsApp relance:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de l envoi WhatsApp' 
      },
      { status: 500 }
    )
  }
}
