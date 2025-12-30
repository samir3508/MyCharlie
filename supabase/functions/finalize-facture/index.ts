/**
 * Edge Function: Finalisation facture
 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Finalise une facture en :
 * - Récupérant toutes les lignes
 * - Calculant les totaux globaux (HT, TVA, TTC)
 * - Mettant à jour la facture avec les totaux
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { FinalizeFactureRequestSchema } from './_shared/validation.ts'
import { calculateFactureTotals } from './_shared/business.ts'

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
    const validatedRequest = FinalizeFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

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

    // ÉTAPE 2 : Récupérer toutes les lignes de la facture
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_factures')
      .select('total_ht, total_tva, total_ttc')
      .eq('facture_id', facture_id)
      .order('ordre')

    if (lignesError) {
      return handleSupabaseError(lignesError)
    }

    if (!lignes || lignes.length === 0) {
      return errorResponse(
        400,
        'NO_LIGNES',
        'La facture ne contient aucune ligne. Ajoutez des lignes avant de finaliser.',
        { facture_id }
      )
    }

    // ÉTAPE 3 : Calculer les totaux globaux
    const montants = calculateFactureTotals(lignes)

    // ÉTAPE 4 : Mettre à jour la facture avec les totaux
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        montant_ht: montants.montant_ht,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        montants: {
          ht: montants.montant_ht,
          tva: montants.montant_tva,
          ttc: montants.montant_ttc,
        },
        statut: facture.statut,
      },
      'Facture finalisée avec succès'
    )
  } catch (error) {
    console.error('Error in finalize-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})