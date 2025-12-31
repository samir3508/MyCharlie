import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    console.log('Test email - API Key présente:', !!process.env.RESEND_API_KEY)
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ddvcontact35@gmail.com',
      subject: '🧪 Test direct depuis Render API',
      html: '<p><strong>Test réussi !</strong><br>Ceci est un test direct depuis l\'API Render.<br><br>🚀 Si tu reçois cet email, tout fonctionne !</p>'
    })
    
    console.log('Test email - Résultat:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email de test envoyé',
      result 
    })
  } catch (error: any) {
    console.error('Test email - Erreur:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
