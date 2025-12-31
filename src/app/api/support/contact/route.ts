import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, email, telephone, message, timestamp, userAgent, url, urgency } = body as {
      nom?: string
      email?: string
      telephone?: string
      message?: string
      timestamp?: string
      userAgent?: string
      url?: string
      urgency?: 'low' | 'medium' | 'high'
    }

    // Validation
    if (!nom || !email || !message) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Email validation simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Traduire les urgences
    const urgencyLabels = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Urgente'
    }

    // Préparer le message pour l'envoi
    const supportMessage = `
🆕 NOUVELLE DEMANDE DE SUPPORT

👤 CLIENT: ${nom}
📧 EMAIL: ${email}
${telephone ? `📞 TÉLÉPHONE: ${telephone}` : ''}
⏰ DATE: ${timestamp ? new Date(timestamp).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')}
🌐 PAGE: ${url}
💻 NAVIGATEUR: ${userAgent}
🚨 URGENCE: ${urgencyLabels[urgency as keyof typeof urgencyLabels] || 'Moyenne'}

📝 MESSAGE:
${message}

---
Ce message a été envoyé depuis l'application LÉO BTP
    `.trim()

    // Options d'envoi (choisis-en une)
    
    // OPTION 1: Email via Resend (recommandé)
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      console.log('Envoi email avec Resend...')
      console.log('API Key présente:', !!process.env.RESEND_API_KEY)
      
      const result = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'ddvcontact35@gmail.com', // Ton email pour recevoir les notifications
        subject: `🆕 Support LÉO [${urgency?.toUpperCase() || 'MEDIUM'}] - ${nom}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🆕 Nouvelle demande de support</h1>
              <p style="margin: 10px 0; opacity: 0.9;">Application LÉO BTP</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                  <strong style="color: #2563eb;">👤 Client:</strong> ${nom}<br>
                  <strong style="color: #2563eb;">📧 Email:</strong> ${email}<br>
                  ${telephone ? `<strong style="color: #2563eb;">📞 Téléphone:</strong> ${telephone}<br>` : ''}
                  <strong style="color: #2563eb;">⏰ Date:</strong> ${timestamp ? new Date(timestamp).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')}
                </div>
                <div>
                  <strong style="color: #2563eb;">🚨 Urgence:</strong> 
                  <span style="background: ${
                    (urgency as string) === 'high' ? '#fee2e2' : (urgency as string) === 'medium' ? '#fef3c7' : '#dcfce7'
                  }; color: ${
                    (urgency as string) === 'high' ? '#991b1b' : (urgency as string) === 'medium' ? '#92400e' : '#166534'
                  }; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                    ${urgencyLabels[urgency as keyof typeof urgencyLabels] || 'Moyenne'}
                  </span>
                </div>
              </div>
              
              <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <strong style="color: #2563eb;">🌐 Page:</strong> 
                <a href="${url}" style="color: #2563eb; text-decoration: none;">${url}</a>
              </div>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">📝 Message du client:</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; white-space: pre-wrap; margin: 10px 0; border-left: 4px solid #f59e0b;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #475569;">🔍 Informations techniques:</h4>
              <p style="margin: 5px 0; font-size: 12px; color: #64748b;">
                <strong>Navigateur:</strong> ${userAgent}<br>
                <strong>IP:</strong> ${request.headers.get('x-forwarded-for') || 'Non disponible'}<br>
                <strong>User Agent:</strong> ${userAgent}
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="text-align: center; color: #6b7280; font-size: 12px; margin: 0;">
              Ce message a été envoyé depuis l'application LÉO BTP<br>
              <strong>Temps de réponse habituel: moins de 2h</strong>
            </p>
          </div>
        `
      })
      
      console.log('Résultat Resend:', result)
      
    } catch (emailError) {
      console.error('Erreur email Resend:', emailError)
      
      // OPTION 2: Backup vers Slack (si Resend échoue)
      try {
        await fetch('https://hooks.slack.com/services/TON/SLACK/WEBHOOK', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: supportMessage,
            channel: '#support'
          })
        })
      } catch (slackError) {
        console.error('Erreur Slack:', slackError)
        
        // OPTION 3: Backup vers Discord (si Slack échoue)
        try {
          await fetch('https://discord.com/api/webhooks/TON/DISCORD/WEBHOOK', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: supportMessage,
              username: 'Support LÉO'
            })
          })
        } catch (discordError) {
          console.error('Erreur Discord:', discordError)
        }
      }
    }

    // Sauvegarder en base de données (optionnel)
    // await saveSupportRequest({ nom, email, message, timestamp, userAgent, url })

    return NextResponse.json(
      { success: true, message: 'Message envoyé avec succès' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erreur API support:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
