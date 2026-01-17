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
      console.log('[Callback] Recovery type detected, redirecting to reset-password')
      if (data?.session) {
        // Redirect to reset password page with the session
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      return NextResponse.redirect(`${origin}/forgot-password?error=session_expired`)
    }
    
    // Vérifier si l'utilisateur a déjà un tenant (compte existant)
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id, created_at')
      .eq('user_id', data.user.id)
      .single()
    
    // Si le tenant existe déjà, c'est probablement une réinitialisation
    // Les nouvelles inscriptions créent le tenant dans ce callback, donc si le tenant existe déjà,
    // c'est qu'on arrive ici pour une autre raison (probablement réinitialisation)
    // Exception : si l'utilisateur a été créé il y a moins de 5 minutes, c'est peut-être une confirmation d'email
    if (existingTenant && data?.session) {
      const userAge = data.user.created_at 
        ? new Date().getTime() - new Date(data.user.created_at).getTime()
        : Infinity
      const fiveMinutes = 5 * 60 * 1000
      
      // Si l'utilisateur existe depuis plus de 5 minutes, c'est probablement une réinitialisation
      if (userAge > fiveMinutes) {
        console.log('[Callback] Tenant exists and user is older than 5min, assuming password reset')
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      
      // Si l'utilisateur est très récent (< 5 min) mais le tenant existe, c'est peut-être une confirmation d'email
      // On continue vers la création du tenant (qui sera ignorée car il existe déjà)
      console.log('[Callback] User is very recent, might be email confirmation')
    }
    
    // Sinon, c'est une confirmation d'email (nouvelle inscription)
    if (data.user) {
      // Check if tenant exists, if not create it
      const { data: existingTenantCheck } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!existingTenantCheck) {
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






















