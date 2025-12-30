/**
 * Edge Function: Envoi relance
 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})

 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})



 * 
 * Envoie une relance pour une facture en retard (optionnel)
 * Vérifie que la facture est 'en_retard' ou 'envoyee' avec date échéance dépassée
 * La génération PDF et l'envoi réel seront implémentés plus tard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { SendRelanceRequestSchema } from './_shared/validation.ts'

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
    const validatedRequest = SendRelanceRequestSchema.parse(body)

    const { tenant_id, facture_id, method, recipient_email, recipient_phone } = validatedRequest

    // ÉTAPE 1 : Vérifier que la facture existe et appartient au tenant
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('id, statut, date_echeance, client_id')
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

    // ÉTAPE 2 : Vérifier que la facture peut recevoir une relance
    if (facture.statut === 'payee') {
      return errorResponse(
        400,
        'INVALID_STATUS',
        'Impossible d\'envoyer une relance pour une facture déjà payée',
        { current_statut: facture.statut }
      )
    }

    // ÉTAPE 3 : Vérifier que la date d'échéance est dépassée (si elle existe)
    if (facture.date_echeance) {
      const today = new Date().toISOString().split('T')[0]
      if (facture.date_echeance >= today) {
        return errorResponse(
          400,
          'NOT_OVERDUE',
          'La date d\'échéance n\'est pas encore dépassée',
          { date_echeance: facture.date_echeance }
        )
      }
    }

    // ÉTAPE 4 : Récupérer les informations du client pour l'envoi
    const { data: client } = await supabase
      .from('clients')
      .select('email, telephone')
      .eq('id', facture.client_id)
      .single()

    // ÉTAPE 5 : Valider les destinataires selon la méthode
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

    // ÉTAPE 6 : Mettre à jour le statut à 'en_retard' si nécessaire
    if (facture.statut === 'envoyee') {
      const { error: updateStatutError } = await supabase
        .from('factures')
        .update({
          statut: 'en_retard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', facture_id)
        .eq('tenant_id', tenant_id)

      if (updateStatutError) {
        console.error('Erreur lors de la mise à jour du statut:', updateStatutError)
        // On continue quand même pour envoyer la relance
      }
    }

    // TODO: Générer le PDF et l'envoyer réellement
    // TODO: Enregistrer la relance dans la table relances

    return successResponse(
      {
        facture_id,
        relance_sent_at: new Date().toISOString(),
        method,
        recipient: method === 'email' ? recipient_email || client?.email : recipient_phone || client?.telephone,
      },
      `Relance envoyée par ${method === 'email' ? 'email' : 'WhatsApp'}`
    )
  } catch (error) {
    console.error('Error in send-relance:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})