/**
 * Edge Function: Envoi facture
 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une facture par email ou WhatsApp (optionnel)
 * Pour l'instant, met simplement à jour le statut à 'envoyee'
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendFactureRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendFactureRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture est prête à être envoyée
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `La facture ne peut pas être envoyée car son statut est '${facture.statut}'`,
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 4 : Valider les destinataires selon la méthode
    if (method === 'email') {
      const email = recipient_email || client?.email
      if (!email) {
        return errorResponse(
          400,
          'MISSING_EMAIL',
          'Email du destinataire manquant',
          { method }
        )
      }
    } else if (method === 'whatsapp') {
      const phone = recipient_phone || client?.telephone
      if (!phone) {
        return errorResponse(
          400,
          'MISSING_PHONE',
          'Numéro de téléphone du destinataire manquant',
          { method }
        )
      }
    }

    // ÉTAPE 5 : Mettre à jour le statut de la facture
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        statut: 'envoyee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // Pour l'instant, on retourne juste une confirmation

    return successResponse(
      {
        facture_id,
        sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
        statut: 'envoyee',
      },
      `Facture envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-facture:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})