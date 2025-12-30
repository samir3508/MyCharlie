/**
 * Edge Function: Leo Router
 * 
 * Route les actions de LÉO vers les bonnes Edge Functions
 * Format d'entrée : { action: "...", payload: {...}, tenant_id: "..." }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// L'URL de base est disponible via l'environnement ou peut être construite
// Dans Supabase Edge Functions, on peut utiliser req.url pour obtenir l'origine
// ou utiliser Deno.env.get('SUPABASE_URL') si disponible
const getSupabaseUrl = (req: Request): string => {
  // Essayer d'obtenir depuis l'environnement (recommandé)
  const envUrl = Deno.env.get('SUPABASE_URL')
  if (envUrl) {
    // S'assurer que l'URL se termine sans slash
    return envUrl.replace(/\/$/, '')
  }
  
  // URL hardcodée pour ce projet spécifique (fallback fiable)
  const PROJECT_REF = 'zhemkkukhxspakxvrmlr'
  const hardcodedUrl = `https://${PROJECT_REF}.supabase.co`
  
  // Sinon, construire depuis l'URL de la requête
  // Exemple: https://zhemkkukhxspakxvrmlr.supabase.co
  const url = new URL(req.url)
  const host = url.host
  
  // Si c'est une Edge Function Supabase, l'host est du type: project-ref.supabase.co
  // On construit l'URL complète
  if (host.includes('.supabase.co')) {
    return `${url.protocol}//${host}`
  }
  
  // Fallback: utiliser l'URL hardcodée
  console.log(`[leo-router] Using hardcoded URL: ${hardcodedUrl}`)
  return hardcodedUrl
}

// Map des actions vers les Edge Functions
const ACTION_MAP: Record<string, string> = {
  // Clients
  'chercher-client': 'search-client',
  'search-client': 'search-client',
  'creer-client': 'create-client',
  'create-client': 'create-client',
  'obtenir-client': 'get-client',
  'get-client': 'get-client',
  'lister-clients': 'list-clients',
  'list-clients': 'list-clients',
  'modifier-client': 'update-client',
  'update-client': 'update-client',
  'supprimer-client': 'delete-client',
  'delete-client': 'delete-client',
  
  // Devis
  'creer-devis': 'create-devis',
  'create-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'add-ligne-devis': 'add-ligne-devis',
  'modifier-ligne-devis': 'update-ligne-devis',
  'update-ligne-devis': 'update-ligne-devis',
  'supprimer-ligne-devis': 'delete-ligne-devis',
  'delete-ligne-devis': 'delete-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'finalize-devis': 'finalize-devis',
  'envoyer-devis': 'send-devis',
  'send-devis': 'send-devis',
  'obtenir-devis': 'get-devis',
  'get-devis': 'get-devis',
  'lister-devis': 'list-devis',
  'list-devis': 'list-devis',
  'modifier-devis': 'update-devis',
  'update-devis': 'update-devis',
  'supprimer-devis': 'delete-devis',
  'delete-devis': 'delete-devis',
  
  // Factures
  'creer-facture': 'create-facture',
  'create-facture': 'create-facture',
  'creer-facture-depuis-devis': 'create-facture-from-devis',
  'create-facture-from-devis': 'create-facture-from-devis',
  'ajouter-ligne-facture': 'add-ligne-facture',
  'add-ligne-facture': 'add-ligne-facture',
  'modifier-ligne-facture': 'update-ligne-facture',
  'update-ligne-facture': 'update-ligne-facture',
  'supprimer-ligne-facture': 'delete-ligne-facture',
  'delete-ligne-facture': 'delete-ligne-facture',
  'finaliser-facture': 'finalize-facture',
  'finalize-facture': 'finalize-facture',
  'envoyer-facture': 'send-facture',
  'send-facture': 'send-facture',
  'marquer-facture-payee': 'mark-facture-paid',
  'mark-facture-paid': 'mark-facture-paid',
  'envoyer-relance': 'send-relance',
  'send-relance': 'send-relance',
  'obtenir-facture': 'get-facture',
  'get-facture': 'get-facture',
  'lister-factures': 'list-factures',
  'list-factures': 'list-factures',
  'modifier-facture': 'update-facture',
  'update-facture': 'update-facture',
  'supprimer-facture': 'delete-facture',
  'delete-facture': 'delete-facture',
  
  // Analyse
  'stats': 'stats-dashboard',
  'stats-dashboard': 'stats-dashboard',
  'statistiques': 'stats-dashboard',
  'dashboard': 'stats-dashboard',
  'recherche-globale': 'search-global',
  'search-global': 'search-global',
  'recherche': 'search-global',
}

/**
 * Appelle une Edge Function Supabase
 */
async function callEdgeFunction(
  functionName: string,
  body: any,
  authToken: string,
  baseUrl: string
): Promise<Response> {
  const url = `${baseUrl}/functions/v1/${functionName}`
  
  console.log(`[leo-router] Fetching: ${url}`)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(body),
    })
    
    console.log(`[leo-router] Fetch response status: ${response.status}`)
    return response
  } catch (error) {
    console.error(`[leo-router] Fetch error:`, error)
    throw error
  }
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
    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse(401, 'UNAUTHORIZED', 'Token d\'authentification manquant')
    }

    // Parser le body
    const body = await req.json()
    
    // Valider la structure
    if (!body.action) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Le champ "action" est obligatoire')
    }
    
    if (!body.tenant_id) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Le champ "tenant_id" est obligatoire')
    }

    if (!body.payload || typeof body.payload !== 'object') {
      return errorResponse(400, 'VALIDATION_ERROR', 'Le champ "payload" est obligatoire et doit être un objet')
    }

    const { action, payload, tenant_id } = body

    // Mapper l'action vers le nom de la fonction
    const functionName = ACTION_MAP[action]
    
    if (!functionName) {
      return errorResponse(
        404,
        'ACTION_NOT_FOUND',
        `L'action "${action}" n'existe pas. Actions disponibles: ${Object.keys(ACTION_MAP).join(', ')}`,
        { available_actions: Object.keys(ACTION_MAP) }
      )
    }

    // Construire le body de la requête vers l'Edge Function
    // Le payload est fusionné avec tenant_id au niveau racine
    const functionBody = {
      ...payload,
      tenant_id,
    }

    // Obtenir l'URL de base
    const baseUrl = getSupabaseUrl(req)
    console.log(`[leo-router] Calling function: ${functionName}`)
    console.log(`[leo-router] Base URL: ${baseUrl}`)
    console.log(`[leo-router] Full URL: ${baseUrl}/functions/v1/${functionName}`)
    console.log(`[leo-router] Function body:`, JSON.stringify(functionBody, null, 2))
    
    // Appeler l'Edge Function
    const response = await callEdgeFunction(functionName, functionBody, authHeader, baseUrl)
    
    console.log(`[leo-router] Response status: ${response.status}`)
    console.log(`[leo-router] Response ok: ${response.ok}`)

    // Récupérer la réponse
    const responseText = await response.text()
    let responseData: any

    try {
      responseData = JSON.parse(responseText)
    } catch {
      // Si ce n'est pas du JSON, retourner le texte brut
      responseData = { message: responseText }
    }

    // Si la réponse a un statut d'erreur, la retourner tel quel
    if (!response.ok) {
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    // Retourner la réponse de l'Edge Function
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in leo-router:', error)
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Erreur interne du router',
      { error: error.message }
    )
  }
})


 * 
 * Route les actions de LÉO vers les bonnes Edge Functions
 * Format d'entrée : { action: "...", payload: {...}, tenant_id: "..." }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// L'URL de base est disponible via l'environnement ou peut être construite
// Dans Supabase Edge Functions, on peut utiliser req.url pour obtenir l'origine
// ou utiliser Deno.env.get('SUPABASE_URL') si disponible
const getSupabaseUrl = (req: Request): string => {
  // Essayer d'obtenir depuis l'environnement (recommandé)
  const envUrl = Deno.env.get('SUPABASE_URL')
  if (envUrl) {
    // S'assurer que l'URL se termine sans slash
    return envUrl.replace(/\/$/, '')
  }
  
  // URL hardcodée pour ce projet spécifique (fallback fiable)
  const PROJECT_REF = 'zhemkkukhxspakxvrmlr'
  const hardcodedUrl = `https://${PROJECT_REF}.supabase.co`
  
  // Sinon, construire depuis l'URL de la requête
  // Exemple: https://zhemkkukhxspakxvrmlr.supabase.co
  const url = new URL(req.url)
  const host = url.host
  
  // Si c'est une Edge Function Supabase, l'host est du type: project-ref.supabase.co
  // On construit l'URL complète
  if (host.includes('.supabase.co')) {
    return `${url.protocol}//${host}`
  }
  
  // Fallback: utiliser l'URL hardcodée
  console.log(`[leo-router] Using hardcoded URL: ${hardcodedUrl}`)
  return hardcodedUrl
}

// Map des actions vers les Edge Functions
const ACTION_MAP: Record<string, string> = {
  // Clients
  'chercher-client': 'search-client',
  'search-client': 'search-client',
  'creer-client': 'create-client',
  'create-client': 'create-client',
  'obtenir-client': 'get-client',
  'get-client': 'get-client',
  'lister-clients': 'list-clients',
  'list-clients': 'list-clients',
  'modifier-client': 'update-client',
  'update-client': 'update-client',
  'supprimer-client': 'delete-client',
  'delete-client': 'delete-client',
  
  // Devis
  'creer-devis': 'create-devis',
  'create-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'add-ligne-devis': 'add-ligne-devis',
  'modifier-ligne-devis': 'update-ligne-devis',
  'update-ligne-devis': 'update-ligne-devis',
  'supprimer-ligne-devis': 'delete-ligne-devis',
  'delete-ligne-devis': 'delete-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'finalize-devis': 'finalize-devis',
  'envoyer-devis': 'send-devis',
  'send-devis': 'send-devis',
  'obtenir-devis': 'get-devis',
  'get-devis': 'get-devis',
  'lister-devis': 'list-devis',
  'list-devis': 'list-devis',
  'modifier-devis': 'update-devis',
  'update-devis': 'update-devis',
  'supprimer-devis': 'delete-devis',
  'delete-devis': 'delete-devis',
  
  // Factures
  'creer-facture': 'create-facture',
  'create-facture': 'create-facture',
  'creer-facture-depuis-devis': 'create-facture-from-devis',
  'create-facture-from-devis': 'create-facture-from-devis',
  'ajouter-ligne-facture': 'add-ligne-facture',
  'add-ligne-facture': 'add-ligne-facture',
  'modifier-ligne-facture': 'update-ligne-facture',
  'update-ligne-facture': 'update-ligne-facture',
  'supprimer-ligne-facture': 'delete-ligne-facture',
  'delete-ligne-facture': 'delete-ligne-facture',
  'finaliser-facture': 'finalize-facture',
  'finalize-facture': 'finalize-facture',
  'envoyer-facture': 'send-facture',
  'send-facture': 'send-facture',
  'marquer-facture-payee': 'mark-facture-paid',
  'mark-facture-paid': 'mark-facture-paid',
  'envoyer-relance': 'send-relance',
  'send-relance': 'send-relance',
  'obtenir-facture': 'get-facture',
  'get-facture': 'get-facture',
  'lister-factures': 'list-factures',
  'list-factures': 'list-factures',
  'modifier-facture': 'update-facture',
  'update-facture': 'update-facture',
  'supprimer-facture': 'delete-facture',
  'delete-facture': 'delete-facture',
  
  // Analyse
  'stats': 'stats-dashboard',
  'stats-dashboard': 'stats-dashboard',
  'statistiques': 'stats-dashboard',
  'dashboard': 'stats-dashboard',
  'recherche-globale': 'search-global',
  'search-global': 'search-global',
  'recherche': 'search-global',
}

/**
 * Appelle une Edge Function Supabase
 */
async function callEdgeFunction(
  functionName: string,
  body: any,
  authToken: string,
  baseUrl: string
): Promise<Response> {
  const url = `${baseUrl}/functions/v1/${functionName}`
  
  console.log(`[leo-router] Fetching: ${url}`)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(body),
    })
    
    console.log(`[leo-router] Fetch response status: ${response.status}`)
    return response
  } catch (error) {
    console.error(`[leo-router] Fetch error:`, error)
    throw error
  }
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
    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse(401, 'UNAUTHORIZED', 'Token d\'authentification manquant')
    }

    // Parser le body
    const body = await req.json()
    
    // Valider la structure
    if (!body.action) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Le champ "action" est obligatoire')
    }
    
    if (!body.tenant_id) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Le champ "tenant_id" est obligatoire')
    }

    if (!body.payload || typeof body.payload !== 'object') {
      return errorResponse(400, 'VALIDATION_ERROR', 'Le champ "payload" est obligatoire et doit être un objet')
    }

    const { action, payload, tenant_id } = body

    // Mapper l'action vers le nom de la fonction
    const functionName = ACTION_MAP[action]
    
    if (!functionName) {
      return errorResponse(
        404,
        'ACTION_NOT_FOUND',
        `L'action "${action}" n'existe pas. Actions disponibles: ${Object.keys(ACTION_MAP).join(', ')}`,
        { available_actions: Object.keys(ACTION_MAP) }
      )
    }

    // Construire le body de la requête vers l'Edge Function
    // Le payload est fusionné avec tenant_id au niveau racine
    const functionBody = {
      ...payload,
      tenant_id,
    }

    // Obtenir l'URL de base
    const baseUrl = getSupabaseUrl(req)
    console.log(`[leo-router] Calling function: ${functionName}`)
    console.log(`[leo-router] Base URL: ${baseUrl}`)
    console.log(`[leo-router] Full URL: ${baseUrl}/functions/v1/${functionName}`)
    console.log(`[leo-router] Function body:`, JSON.stringify(functionBody, null, 2))
    
    // Appeler l'Edge Function
    const response = await callEdgeFunction(functionName, functionBody, authHeader, baseUrl)
    
    console.log(`[leo-router] Response status: ${response.status}`)
    console.log(`[leo-router] Response ok: ${response.ok}`)

    // Récupérer la réponse
    const responseText = await response.text()
    let responseData: any

    try {
      responseData = JSON.parse(responseText)
    } catch {
      // Si ce n'est pas du JSON, retourner le texte brut
      responseData = { message: responseText }
    }

    // Si la réponse a un statut d'erreur, la retourner tel quel
    if (!response.ok) {
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    // Retourner la réponse de l'Edge Function
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in leo-router:', error)
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Erreur interne du router',
      { error: error.message }
    )
  }
})
