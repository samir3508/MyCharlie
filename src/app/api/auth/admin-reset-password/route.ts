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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    
    // Trouver l'utilisateur par email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Erreur lors de la recherche de l\'utilisateur' },
        { status: 500 }
      )
    }

    const user = users?.users?.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cet email' },
        { status: 404 }
      )
    }

    // Générer un lien de réinitialisation
    const { data: recoveryLink, error: recoveryError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (recoveryError) {
      console.error('Error generating recovery link:', recoveryError)
      return NextResponse.json(
        { error: 'Erreur lors de la génération du lien de réinitialisation', details: recoveryError.message },
        { status: 500 }
      )
    }

    const resetUrl = recoveryLink?.properties?.action_link || 
                     `${process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.onrender.com'}/auth/callback?type=recovery`

    return NextResponse.json({
      success: true,
      message: 'Lien de réinitialisation généré avec succès',
      resetUrl: resetUrl,
      email: email,
    })
  } catch (error) {
    console.error('Error in admin-reset-password API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
