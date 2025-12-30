/**
 * Edge Function: Ajout de lignes de devis
 * 
 * Ajoute une ou plusieurs lignes à un devis existant avec :
 * - Vérification devis existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch de TOUTES les lignes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { AddLigneDevisRequestSchema } from '../_shared/validation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Seule la méthode POST est autorisée')
  }

  try {
    // Authentification
    const auth = validateAuth(req)
    if (!auth.success) {
      return errorResponse(401, auth.error!.code, auth.error!.message)
    }

    // Parser et valider le body
    const body = await req.json()
    const validatedRequest = AddLigneDevisRequestSchema.parse(body)

    const { tenant_id, devis_id, lignes } = validatedRequest

    console.log(`[add-ligne-devis] Ajout de ${lignes.length} ligne(s) au devis ${devis_id}`)

    // ÉTAPE 1 : Vérifier que le devis existe et appartient au tenant
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('id, statut')
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (devisError || !devis) {
      return errorResponse(
        404,
        'DEVIS_NOT_FOUND',
        'Le devis spécifié n\'existe pas ou n\'appartient pas à ce tenant',
        { devis_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_devis')
      .select('ordre')
      .eq('devis_id', devis_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer TOUTES les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    // IMPORTANT : On traite TOUTES les lignes reçues, sans exception
    if (!Array.isArray(lignes) || lignes.length === 0) {
      return errorResponse(
        400,
        'INVALID_LIGNES',
        'Le champ lignes doit être un tableau non vide',
        { lignes_received: lignes }
      )
    }

    const lignesToInsert = lignes.map((ligne, index) => {
      // Validation de chaque ligne
      if (!ligne.designation || !ligne.unite || ligne.quantite <= 0) {
        console.error(`[add-ligne-devis] Ligne ${index} invalide:`, ligne)
      }
      
      return {
        devis_id,
        ordre: startOrdre + index,
        designation: ligne.designation,
        description_detaillee: ligne.description_detaillee || null,
        quantite: ligne.quantite,
        unite: ligne.unite,
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        tva_pct: ligne.tva_pct,
        // total_ht, total_tva, total_ttc sont des colonnes générées, ne pas les inclure
      }
    })

    console.log(`[add-ligne-devis] Préparation de ${lignesToInsert.length} ligne(s) à insérer`)
    console.log(`[add-ligne-devis] Détail des lignes:`, lignesToInsert.map(l => ({ designation: l.designation, quantite: l.quantite, unite: l.unite })))

    // ÉTAPE 4 : Insérer TOUTES les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_devis')
      .insert(lignesToInsert)

    if (insertError) {
      console.error('[add-ligne-devis] Erreur lors de l\'insertion:', insertError)
      return handleSupabaseError(insertError)
    }

    console.log(`[add-ligne-devis] ${lignesToInsert.length} ligne(s) insérée(s) avec succès`)

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_devis')
      .select('total_ht, total_tva, total_ttc')
      .eq('devis_id', devis_id)
      .gte('ordre', startOrdre)

    const totals = lignesCreees?.reduce(
      (acc, ligne) => ({
        ht: acc.ht + (ligne.total_ht || 0),
        tva: acc.tva + (ligne.total_tva || 0),
        ttc: acc.ttc + (ligne.total_ttc || 0),
      }),
      { ht: 0, tva: 0, ttc: 0 }
    ) || { ht: 0, tva: 0, ttc: 0 }

    return successResponse(
      {
        lignes_created: lignes.length,
        montants: {
          ht: Math.round(totals.ht * 100) / 100,
          tva: Math.round(totals.tva * 100) / 100,
          ttc: Math.round(totals.ttc * 100) / 100,
        },
      },
      `${lignes.length} ligne(s) ajoutée(s) avec succès`
    )
  } catch (error) {
    console.error('[add-ligne-devis] Erreur:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})


 * 
 * Ajoute une ou plusieurs lignes à un devis existant avec :
 * - Vérification devis existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch de TOUTES les lignes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { AddLigneDevisRequestSchema } from '../_shared/validation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Seule la méthode POST est autorisée')
  }

  try {
    // Authentification
    const auth = validateAuth(req)
    if (!auth.success) {
      return errorResponse(401, auth.error!.code, auth.error!.message)
    }

    // Parser et valider le body
    const body = await req.json()
    const validatedRequest = AddLigneDevisRequestSchema.parse(body)

    const { tenant_id, devis_id, lignes } = validatedRequest

    console.log(`[add-ligne-devis] Ajout de ${lignes.length} ligne(s) au devis ${devis_id}`)

    // ÉTAPE 1 : Vérifier que le devis existe et appartient au tenant
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('id, statut')
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (devisError || !devis) {
      return errorResponse(
        404,
        'DEVIS_NOT_FOUND',
        'Le devis spécifié n\'existe pas ou n\'appartient pas à ce tenant',
        { devis_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_devis')
      .select('ordre')
      .eq('devis_id', devis_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer TOUTES les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    // IMPORTANT : On traite TOUTES les lignes reçues, sans exception
    if (!Array.isArray(lignes) || lignes.length === 0) {
      return errorResponse(
        400,
        'INVALID_LIGNES',
        'Le champ lignes doit être un tableau non vide',
        { lignes_received: lignes }
      )
    }

    const lignesToInsert = lignes.map((ligne, index) => {
      // Validation de chaque ligne
      if (!ligne.designation || !ligne.unite || ligne.quantite <= 0) {
        console.error(`[add-ligne-devis] Ligne ${index} invalide:`, ligne)
      }
      
      return {
        devis_id,
        ordre: startOrdre + index,
        designation: ligne.designation,
        description_detaillee: ligne.description_detaillee || null,
        quantite: ligne.quantite,
        unite: ligne.unite,
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        tva_pct: ligne.tva_pct,
        // total_ht, total_tva, total_ttc sont des colonnes générées, ne pas les inclure
      }
    })

    console.log(`[add-ligne-devis] Préparation de ${lignesToInsert.length} ligne(s) à insérer`)
    console.log(`[add-ligne-devis] Détail des lignes:`, lignesToInsert.map(l => ({ designation: l.designation, quantite: l.quantite, unite: l.unite })))

    // ÉTAPE 4 : Insérer TOUTES les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_devis')
      .insert(lignesToInsert)

    if (insertError) {
      console.error('[add-ligne-devis] Erreur lors de l\'insertion:', insertError)
      return handleSupabaseError(insertError)
    }

    console.log(`[add-ligne-devis] ${lignesToInsert.length} ligne(s) insérée(s) avec succès`)

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_devis')
      .select('total_ht, total_tva, total_ttc')
      .eq('devis_id', devis_id)
      .gte('ordre', startOrdre)

    const totals = lignesCreees?.reduce(
      (acc, ligne) => ({
        ht: acc.ht + (ligne.total_ht || 0),
        tva: acc.tva + (ligne.total_tva || 0),
        ttc: acc.ttc + (ligne.total_ttc || 0),
      }),
      { ht: 0, tva: 0, ttc: 0 }
    ) || { ht: 0, tva: 0, ttc: 0 }

    return successResponse(
      {
        lignes_created: lignes.length,
        montants: {
          ht: Math.round(totals.ht * 100) / 100,
          tva: Math.round(totals.tva * 100) / 100,
          ttc: Math.round(totals.ttc * 100) / 100,
        },
      },
      `${lignes.length} ligne(s) ajoutée(s) avec succès`
    )
  } catch (error) {
    console.error('[add-ligne-devis] Erreur:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
