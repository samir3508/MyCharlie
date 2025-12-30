/**
 * Edge Function: Création devis
 * 
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * Crée un devis (sans lignes) avec :
 * - Vérification client existe
 * - Génération numéro devis
 * - Génération titre/description si manquants
 * - Sélection template conditions paiement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { CreateDevisRequestSchema } from '../_shared/validation.ts'
import {
  generateDevisTitle,
  generateDevisDescription,
  selectPaymentTemplate,
  generateDevisNumero,
} from '../_shared/business.ts'

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
    const validatedRequest = CreateDevisRequestSchema.parse(body)

    const { tenant_id, client_id, ...devisData } = validatedRequest

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

    // ÉTAPE 2 : Générer le numéro de devis
    let devisNumero: string
    try {
      devisNumero = await generateDevisNumero(tenant_id)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de devis',
        { error: error.message }
      )
    }

    // ÉTAPE 3 : Générer titre et description si manquants
    const titre = devisData.titre || generateDevisTitle(client.nom, client.prenom)
    const description =
      devisData.description ||
      generateDevisDescription(client.nom, client.prenom, devisData.adresse_chantier)

    // ÉTAPE 4 : Sélectionner le template de conditions de paiement
    // Pour l'instant, on utilise un montant par défaut (0) car les lignes n'existent pas encore
    // Le template sera mis à jour lors de la finalisation
    const templateId = await selectPaymentTemplate(tenant_id, 0)

    // ÉTAPE 5 : Créer le devis
    const { data: newDevis, error: createError } = await supabase
      .from('devis')
      .insert({
        tenant_id,
        client_id,
        numero: devisNumero,
        titre,
        description,
        adresse_chantier: devisData.adresse_chantier,
        delai_execution: devisData.delai_execution,
        notes: devisData.notes || null,
        template_condition_paiement_id: templateId,
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: new Date().toISOString().split('T')[0],
      })
      .select('id, numero, titre')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newDevis) {
      return errorResponse(500, 'CREATION_FAILED', 'Le devis n\'a pas pu être créé')
    }

    // ÉTAPE 6 : Vérifier que le devis a bien été créé
    const { data: verifyDevis } = await supabase
      .from('devis')
      .select('id, numero')
      .eq('id', newDevis.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!verifyDevis) {
      return errorResponse(
        500,
        'VERIFICATION_FAILED',
        'Le devis a été créé mais n\'a pas pu être vérifié'
      )
    }

    return successResponse(
      {
        devis_id: newDevis.id,
        numero: newDevis.numero,
        template_paiement_id: templateId,
      },
      'Devis créé avec succès'
    )
  } catch (error) {
    console.error('Error in create-devis:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})