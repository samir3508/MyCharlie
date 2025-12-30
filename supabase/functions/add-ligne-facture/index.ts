/**
 * Edge Function: Ajout de lignes de facture
 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Ajoute une ou plusieurs lignes à une facture existante avec :
 * - Vérification facture existe et appartient au tenant
 * - Calcul automatique des montants (HT, TVA, TTC)
 * - Insertion en batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { AddLigneFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = AddLigneFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, lignes } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut')
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas ou n\'appartient pas à ce tenant',
        { facture_id }
      )
    }

    // ÉTAPE 2 : Récupérer le dernier ordre pour continuer la numérotation
    const { data: lastLigne } = await supabase
      .from('lignes_factures')
      .select('ordre')
      .eq('facture_id', facture_id)
      .order('ordre', { ascending: false })
      .limit(1)
      .single()

    const startOrdre = lastLigne ? lastLigne.ordre + 1 : 1

    // ÉTAPE 3 : Préparer les lignes (sans total_ht, total_tva, total_ttc car colonnes générées)
    const lignesToInsert = lignes.map((ligne, index) => {
      return {
        facture_id,
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

    // ÉTAPE 4 : Insérer toutes les lignes en batch
    const { error: insertError } = await supabase
      .from('lignes_factures')
      .insert(lignesToInsert)

    if (insertError) {
      return handleSupabaseError(insertError)
    }

    // ÉTAPE 5 : Récupérer les lignes créées pour calculer les totaux
    const { data: lignesCreees } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
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
    console.error('Error in add-ligne-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})