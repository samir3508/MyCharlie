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
    const { email, newPassword = 'Test123!' } = body

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
        { error: 'Erreur lors de la recherche de l\'utilisateur', details: listError.message },
        { status: 500 }
      )
    }

    const user = users?.users?.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Aucun compte trouvé avec cet email',
          availableEmails: users?.users?.map(u => u.email) || []
        },
        { status: 404 }
      )
    }

    // Mettre à jour le mot de passe directement
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      email: email,
      password: newPassword,
      userId: user.id,
      instructions: 'Vous pouvez maintenant vous connecter avec cet email et ce mot de passe.'
    })
  } catch (error) {
    console.error('Error in test-login API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    
    // Lister tous les utilisateurs
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs', details: listError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users?.users?.map(u => ({
        id: u.id,
        email: u.email,
        email_confirmed_at: u.email_confirmed_at,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      })) || []
    })
  } catch (error) {
    console.error('Error in test-login API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
