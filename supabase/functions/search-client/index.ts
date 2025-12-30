/**
 * Edge Function: Recherche de clients
 * 
 * Recherche un client par email, téléphone, ou nom/prénom
 * avec filtrage par tenant_id pour l'isolation multi-tenant
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schéma de validation (inline pour éviter les problèmes d'import)
const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

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
    const validatedRequest = SearchClientRequestSchema.parse(body)

    const { tenant_id, query } = validatedRequest

    console.log(`[search-client] Recherche: "${query}" pour tenant: ${tenant_id}`)

    // Nettoyer la requête de recherche
    const cleanQuery = query.trim().toLowerCase()

    if (cleanQuery.length === 0) {
      return errorResponse(400, 'INVALID_QUERY', 'La requête de recherche ne peut pas être vide')
    }

    // Construction de la requête Supabase avec recherche flexible
    // On cherche dans nom, prenom, nom_complet, email, et telephone
    let searchQuery = supabase
      .from('clients')
      .select('id, nom, prenom, nom_complet, email, telephone, adresse_facturation, adresse_chantier, type, notes, created_at, updated_at')
      .eq('tenant_id', tenant_id)

    // Si la requête ressemble à un email, rechercher par email en priorité
    if (cleanQuery.includes('@')) {
      searchQuery = searchQuery.ilike('email', `%${cleanQuery}%`)
    }
    // Si la requête ressemble à un numéro de téléphone (que des chiffres et espaces)
    else if (/^[\d\s\+\-\(\)]+$/.test(cleanQuery)) {
      // Nettoyer le numéro pour la recherche (supprimer espaces, tirets, parenthèses)
      const cleanPhone = cleanQuery.replace(/[\s\-\+\(\)]/g, '')
      // Recherche par téléphone nettoyé ou tel quel
      searchQuery = searchQuery.or(`telephone.ilike.%${cleanPhone}%,telephone.ilike.%${cleanQuery}%`)
    }
    // Sinon, recherche par nom/prénom/nom_complet
    else {
      // Recherche simple : chercher dans nom_complet d'abord (le plus fiable)
      // Puis dans nom OU prenom pour plus de flexibilité
      searchQuery = searchQuery.or(`nom_complet.ilike.%${cleanQuery}%,nom.ilike.%${cleanQuery}%,prenom.ilike.%${cleanQuery}%`)
    }

    // Limiter à 20 résultats maximum
    const { data: clients, error: searchError } = await searchQuery.limit(20)

    if (searchError) {
      console.error('[search-client] Erreur Supabase:', searchError)
      return handleSupabaseError(searchError)
    }

    const clientsList = clients || []

    console.log(`[search-client] ${clientsList.length} client(s) trouvé(s)`)

    return successResponse(
      {
        clients: clientsList,
        count: clientsList.length,
        query: query,
      },
      `${clientsList.length} client(s) trouvé(s)`
    )
  } catch (error) {
    console.error('Error in search-client:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})


 * 
 * Recherche un client par email, téléphone, ou nom/prénom
 * avec filtrage par tenant_id pour l'isolation multi-tenant
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schéma de validation (inline pour éviter les problèmes d'import)
const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

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
    const validatedRequest = SearchClientRequestSchema.parse(body)

    const { tenant_id, query } = validatedRequest

    console.log(`[search-client] Recherche: "${query}" pour tenant: ${tenant_id}`)

    // Nettoyer la requête de recherche
    const cleanQuery = query.trim().toLowerCase()

    if (cleanQuery.length === 0) {
      return errorResponse(400, 'INVALID_QUERY', 'La requête de recherche ne peut pas être vide')
    }

    // Construction de la requête Supabase avec recherche flexible
    // On cherche dans nom, prenom, nom_complet, email, et telephone
    let searchQuery = supabase
      .from('clients')
      .select('id, nom, prenom, nom_complet, email, telephone, adresse_facturation, adresse_chantier, type, notes, created_at, updated_at')
      .eq('tenant_id', tenant_id)

    // Si la requête ressemble à un email, rechercher par email en priorité
    if (cleanQuery.includes('@')) {
      searchQuery = searchQuery.ilike('email', `%${cleanQuery}%`)
    }
    // Si la requête ressemble à un numéro de téléphone (que des chiffres et espaces)
    else if (/^[\d\s\+\-\(\)]+$/.test(cleanQuery)) {
      // Nettoyer le numéro pour la recherche (supprimer espaces, tirets, parenthèses)
      const cleanPhone = cleanQuery.replace(/[\s\-\+\(\)]/g, '')
      // Recherche par téléphone nettoyé ou tel quel
      searchQuery = searchQuery.or(`telephone.ilike.%${cleanPhone}%,telephone.ilike.%${cleanQuery}%`)
    }
    // Sinon, recherche par nom/prénom/nom_complet
    else {
      // Recherche simple : chercher dans nom_complet d'abord (le plus fiable)
      // Puis dans nom OU prenom pour plus de flexibilité
      searchQuery = searchQuery.or(`nom_complet.ilike.%${cleanQuery}%,nom.ilike.%${cleanQuery}%,prenom.ilike.%${cleanQuery}%`)
    }

    // Limiter à 20 résultats maximum
    const { data: clients, error: searchError } = await searchQuery.limit(20)

    if (searchError) {
      console.error('[search-client] Erreur Supabase:', searchError)
      return handleSupabaseError(searchError)
    }

    const clientsList = clients || []

    console.log(`[search-client] ${clientsList.length} client(s) trouvé(s)`)

    return successResponse(
      {
        clients: clientsList,
        count: clientsList.length,
        query: query,
      },
      `${clientsList.length} client(s) trouvé(s)`
    )
  } catch (error) {
    console.error('Error in search-client:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
