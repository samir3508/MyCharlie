/**
 * Edge Function: Création facture
 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Crée une facture (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro facture
 * - Génération titre/description si manquants
 * - Date émission (défaut: aujourd'hui)
 * - Date échéance (défaut: aujourd'hui + 30 jours)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { CreateFactureRequestSchema } from './_shared/validation.ts'
import {
  generateFactureTitle,
  generateFactureDescription,
  generateFactureNumero,
  calculateDateEcheance,
} from './_shared/business.ts'

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
    const validatedRequest = CreateFactureRequestSchema.parse(body)

    const { tenant_id, client_id, devis_id, ...factureData } = validatedRequest

    // ÉTAPE 1 : Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (clientError || !client) {
      return errorResponse(
        404,
        'CLIENT_NOT_FOUND',
        'Le client spécifié n\'existe pas',
        { client_id }
      )
    }

    // ÉTAPE 2 : Vérifier que le devis existe si devis_id est fourni
    if (devis_id) {
      const { data: devis } = await supabase
        .from('devis')
        .select('id')
        .eq('id', devis_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!devis) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          'Le devis spécifié n\'existe pas',
          { devis_id }
        )
      }
    }

    // ÉTAPE 3 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 4 : Déterminer les dates
    const today = new Date().toISOString().split('T')[0]
    const dateEmission = factureData.date_emission || today
    const dateEcheance = factureData.date_echeance || calculateDateEcheance(dateEmission, 30)

    // ÉTAPE 5 : Générer titre et description si manquants
    const titre = factureData.titre || generateFactureTitle(client.nom, client.prenom)
    const description = factureData.description || generateFactureDescription(client.nom, client.prenom, dateEmission)

    // ÉTAPE 6 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id,
        client_id,
        devis_id: devis_id || null,
        numero: factureNumero,
        titre,
        description,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        notes: factureData.notes || null,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      })
      .select('id, numero, date_emission, date_echeance')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 7 : Vérifier que la facture a bien été créée
    const { data: verifyFacture } = await supabase
      .from('factures')
      .select('id, numero')
      .eq('id', newFacture.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyFacture) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'La facture a été créée mais n\'a pas pu être vérifiée'
      )
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      'Facture créée avec succès'
    )
  } catch (error) {
    console.error('Error in create-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})