/**
 * Edge Function: Marquer facture comme payée
 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Met à jour le statut d'une facture à 'payee' et enregistre la date de paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { MarkFacturePaidRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = MarkFacturePaidRequestSchema.parse(body)

    const { tenant_id, facture_id, date_paiement } = validatedRequest

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

    // ÉTAPE 2 : Vérifier que la facture peut être marquée comme payée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'ALREADY_PAID',
        'La facture est déjà marquée comme payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Déterminer la date de paiement
    const datePaiement = date_paiement || new Date().toISOString().split('T')[0]

    // ÉTAPE 4 : Mettre à jour le statut et la date de paiement
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'payee',
        date_paiement: datePaiement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      {
        facture_id,
        statut: 'payee',
        date_paiement: datePaiement,
      },
      'Facture marquée comme payée avec succès'
    )
  } catch (error) {
    console.error('Error in mark-facture-paid:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})