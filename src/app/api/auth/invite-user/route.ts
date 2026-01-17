import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Fonction pour obtenir le client Supabase avec service role
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Générer un mot de passe sécurisé
function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const password = Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => charset[x % charset.length])
    .join('')
  return password
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, companyName, phone, invitedBy } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    
    // Vérifier si l'utilisateur existe déjà en listant les utilisateurs avec cet email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (!listError && users?.users) {
      const existingUser = users.users.find(u => u.email === email)
      if (existingUser) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email' },
          { status: 400 }
        )
      }
    }
    
    // Générer un mot de passe automatique
    const generatedPassword = generatePassword(12)
    
    // Créer l'utilisateur avec l'API Admin
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: false, // L'utilisateur devra confirmer son email
      user_metadata: {
        company_name: companyName || '',
        phone: phone || '',
        invited_by: invitedBy || '',
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'utilisateur' },
        { status: 500 }
      )
    }

    // Générer un lien de réinitialisation de mot de passe
    const { data: recoveryLink, error: recoveryError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    let resetPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.onrender.com'}/forgot-password`
    if (recoveryLink?.properties?.action_link) {
      resetPasswordUrl = recoveryLink.properties.action_link
    }

    // Envoyer un email d'invitation avec le mot de passe temporaire
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      if (process.env.RESEND_API_KEY) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.onrender.com'
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FF4D00, #E64600); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Vous avez été invité sur MyCharlie !</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Rejoignez-nous dès maintenant</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Bonjour,</p>
              <p>Vous avez été invité à rejoindre MyCharlie, la plateforme de gestion pour les professionnels du BTP.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4D00;">
                <h3 style="margin: 0 0 15px 0; color: #333;">🔐 Vos identifiants de connexion</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Mot de passe temporaire:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${generatedPassword}</code></p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez confirmer votre email et définir un nouveau mot de passe lors de votre première connexion.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetPasswordUrl}" style="background: #FF4D00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
                  Définir mon mot de passe et activer mon compte
                </a>
                <a href="${appUrl}/login" style="background: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
                  Se connecter
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.<br>
                <a href="${appUrl}" style="color: #FF4D00; text-decoration: none;">${appUrl}</a>
              </p>
            </div>
          </div>
        `
        
        await resend.emails.send({
          from: 'MyCharlie <onboarding@resend.dev>',
          to: email,
          subject: '🎉 Invitation MyCharlie - Rejoignez-nous !',
          html: emailHtml,
        })
        
        console.log('[Invite User] Email d\'invitation envoyé avec succès à:', email)
      } else {
        console.warn('[Invite User] RESEND_API_KEY non configuré, email non envoyé')
      }
    } catch (emailError) {
      console.error('[Invite User] Erreur lors de l\'envoi de l\'email:', emailError)
      // Ne pas échouer si l'email ne peut pas être envoyé
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
      password: generatedPassword, // À envoyer par email (déjà fait)
      message: 'Utilisateur invité avec succès. Un email avec les identifiants a été envoyé.',
    })
  } catch (error) {
    console.error('Error in invite-user API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
