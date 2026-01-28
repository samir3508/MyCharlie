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
    const { email, companyName, phone, address } = body

    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Email et nom d\'entreprise requis' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    
    // Générer un mot de passe automatique
    const generatedPassword = generatePassword(12)
    
    // Créer l'utilisateur avec l'API Admin
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        company_name: companyName,
        phone: phone || '',
        address: address || '',
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

    // Envoyer un email avec le mot de passe
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'
    
    // Utiliser l'API Admin pour envoyer un email de réinitialisation
    // Cela permettra à l'utilisateur de définir son propre mot de passe
    const { error: recoveryError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (recoveryError) {
      console.error('Error generating recovery link:', recoveryError)
      // Continuer quand même, on enverra le mot de passe par email personnalisé
    }

    // Créer le tenant
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        user_id: userData.user.id,
        company_name: companyName,
        email: email,
        phone: phone || '',
        address: address || '',
        subscription_status: 'trial',
        subscription_plan: 'starter',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      // Ne pas échouer si le tenant existe déjà
      if (!tenantError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du tenant' },
          { status: 500 }
        )
      }
    }

    // Créer les templates par défaut si le tenant a été créé
    if (newTenant) {
      try {
        const { error: templatesError } = await supabase.from('templates_conditions_paiement').insert([
          {
            tenant_id: newTenant.id,
            nom: 'Paiement comptant',
            description: '100% à la signature',
            montant_min: 0,
            montant_max: 1000,
            pourcentage_acompte: 100,
            delai_acompte: 0,
            is_default: true,
          },
          {
            tenant_id: newTenant.id,
            nom: '30/70',
            description: '30% acompte, 70% livraison',
            montant_min: 1000,
            montant_max: 5000,
            pourcentage_acompte: 30,
            pourcentage_solde: 70,
            delai_acompte: 0,
            delai_solde: 30,
          },
          {
            tenant_id: newTenant.id,
            nom: '3 x 33%',
            description: '33% acompte, 33% mi-parcours, 34% livraison',
            montant_min: 5000,
            pourcentage_acompte: 33,
            pourcentage_intermediaire: 33,
            pourcentage_solde: 34,
            delai_acompte: 0,
            delai_intermediaire: 15,
            delai_solde: 30,
          },
        ])

        if (templatesError) {
          console.error('Error creating payment templates:', templatesError)
          // Ne pas échouer si les templates existent déjà
        }

        // Créer la config LÉO par défaut
        const { error: leoConfigError } = await supabase.from('leo_config').insert({
          tenant_id: newTenant.id,
          nom: 'LÉO',
          ton: 'informel',
          horaire_debut: '08:00',
          horaire_fin: '18:00',
          jours_travail: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
          reponse_auto_hors_horaires: true,
          message_hors_horaires: `Bonjour ! Je suis LÉO, l'assistant de ${companyName}. Nous sommes actuellement en dehors de nos horaires de travail. Je vous répondrai dès que possible !`,
        })

        if (leoConfigError) {
          console.error('Error creating LEO config:', leoConfigError)
          // Ne pas échouer si la config existe déjà
        }
      } catch (configError) {
        console.error('Error creating default config:', configError)
        // Ne pas échouer la création du compte si les configurations échouent
      }
    }

    // Retourner le mot de passe généré (à envoyer par email)
    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
      password: generatedPassword, // À envoyer par email
      message: 'Utilisateur créé avec succès. Un email avec le mot de passe sera envoyé.',
    })
  } catch (error) {
    console.error('Error in create-user API:', error)
    
    // Vérifier si c'est une erreur de configuration Supabase
    if (error instanceof Error && error.message.includes('Supabase configuration missing')) {
      return NextResponse.json(
        { 
          error: 'Configuration Supabase manquante',
          details: 'SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré sur le serveur. Veuillez vérifier les variables d\'environnement sur Render.',
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
