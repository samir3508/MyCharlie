import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' for password reset
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Callback error:', error)
      // Si c'est un lien de réinitialisation expiré, rediriger vers forgot-password
      if (type === 'recovery' || error.message.includes('recovery') || error.message.includes('expired')) {
        return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
      }
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }
    
    if (!data?.user) {
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    // Vérifier si c'est un lien de réinitialisation
    // Si type=recovery est dans l'URL, c'est une réinitialisation
    if (type === 'recovery') {
      if (data?.session) {
        // Redirect to reset password page with the session
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      return NextResponse.redirect(`${origin}/forgot-password?error=session_expired`)
    }
    
    // Vérifier si l'utilisateur a déjà un tenant (compte existant)
    // Si oui et qu'on arrive ici sans type=recovery, c'est peut-être une réinitialisation mal détectée
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', data.user.id)
      .single()
    
    // Si le tenant existe déjà, vérifier si c'est une réinitialisation
    // en regardant si l'utilisateur vient d'une demande de réinitialisation récente
    if (existingTenant) {
      // Vérifier dans les logs ou metadata si c'est une réinitialisation
      // Pour l'instant, on assume que si le tenant existe, c'est une confirmation normale
      // Les réinitialisations doivent avoir type=recovery dans l'URL
    }
    
    // Sinon, c'est une confirmation d'email (nouvelle inscription)
    if (data.user) {
      // Check if tenant exists, if not create it
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!existingTenant) {
        // Get user metadata
        const metadata = data.user.user_metadata || {}
        const companyName = metadata.company_name || data.user.email?.split('@')[0] || 'Mon entreprise'
        const phone = metadata.phone || ''

        // Create tenant
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            user_id: data.user.id,
            company_name: companyName,
            email: data.user.email,
            phone: phone,
            subscription_status: 'trial',
            subscription_plan: 'starter',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single()

        if (!tenantError && newTenant) {
          // Create default payment templates
          await supabase.from('templates_conditions_paiement').insert([
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
              delai_solde: 30,
            },
          ])

          // Create default LÉO config
          await supabase.from('leo_config').insert({
            tenant_id: newTenant.id,
            nom: 'LÉO',
            ton: 'informel',
            horaire_debut: '08:00',
            horaire_fin: '18:00',
            jours_travail: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
            reponse_auto_hors_horaires: true,
            message_hors_horaires: `Bonjour ! Je suis LÉO, l'assistant de ${companyName}. Nous sommes actuellement en dehors de nos horaires de travail. Je vous répondrai dès que possible !`,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}






















