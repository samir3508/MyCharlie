/**
 * Edge Function: Recalculer les totaux d'un devis
 * À appeler après ajout/modification/suppression de lignes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Seule la méthode POST est autorisée' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Créer client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parser le body
    const { devis_id, tenant_id } = await req.json()

    if (!devis_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'devis_id et tenant_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[recalculate-devis-totals] Calcul pour devis ${devis_id}`)

    // Récupérer toutes les lignes du devis
    const { data: lignes, error: lignesError } = await supabaseClient
      .from('lignes_devis')
      .select('quantite, prix_unitaire_ht, tva_pct')
      .eq('devis_id', devis_id)

    if (lignesError) {
      console.error('[recalculate-devis-totals] Erreur récupération lignes:', lignesError)
      throw lignesError
    }

    console.log(`[recalculate-devis-totals] ${lignes?.length || 0} lignes trouvées`)

    // Calculer les totaux
    let montant_ht = 0
    let montant_tva = 0

    if (lignes && lignes.length > 0) {
      for (const ligne of lignes) {
        const ligne_ht = ligne.quantite * ligne.prix_unitaire_ht
        const ligne_tva = ligne_ht * (ligne.tva_pct / 100)
        
        montant_ht += ligne_ht
        montant_tva += ligne_tva

        console.log(`[recalculate-devis-totals] Ligne: ${ligne.quantite} × ${ligne.prix_unitaire_ht}€ = ${ligne_ht}€ HT (TVA ${ligne.tva_pct}% = ${ligne_tva}€)`)
      }
    }

    // Arrondir à 2 décimales
    montant_ht = Math.round(montant_ht * 100) / 100
    montant_tva = Math.round(montant_tva * 100) / 100
    const montant_ttc = Math.round((montant_ht + montant_tva) * 100) / 100

    console.log(`[recalculate-devis-totals] Totaux calculés:`)
    console.log(`  HT:  ${montant_ht}€`)
    console.log(`  TVA: ${montant_tva}€`)
    console.log(`  TTC: ${montant_ttc}€`)

    // Mettre à jour le devis
    const { data: updatedDevis, error: updateError } = await supabaseClient
      .from('devis')
      .update({
        montant_ht,
        montant_tva,
        montant_ttc
      })
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .select()
      .single()

    if (updateError) {
      console.error('[recalculate-devis-totals] Erreur mise à jour:', updateError)
      throw updateError
    }

    console.log(`[recalculate-devis-totals] ✅ Devis ${devis_id} mis à jour avec succès`)

    return new Response(
      JSON.stringify({
        success: true,
        devis: updatedDevis,
        montant_ht,
        montant_tva,
        montant_ttc,
        nb_lignes: lignes?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[recalculate-devis-totals] Erreur:', error)
    return new Response(
      JSON.stringify({
        error: 'Erreur lors du recalcul des totaux',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
