import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { GetFactureRequestSchema } from '../_shared/validation.ts'

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
    const validatedRequest = GetFactureRequestSchema.parse(body)

    const { tenant_id, facture_id } = validatedRequest

    // Récupérer la facture avec toutes les relations
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select(`
        *,
        clients (*),
        devis:devis (
          id,
          numero,
          montant_ttc,
          statut
        ),
        lignes_factures (*)
      `)
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return errorResponse(
        404,
        'FACTURE_NOT_FOUND',
        'La facture spécifiée n\'existe pas',
        { facture_id }
      )
    }

    // Retourner la facture avec toutes ses relations
    return successResponse({
      facture: {
        ...facture,
        // Organiser les lignes par ordre
        lignes: (facture.lignes_factures || []).sort((a: any, b: any) => 
          (a.ordre || 0) - (b.ordre || 0)
        ),
      },
    })

  } catch (error: any) {
    // Gérer les erreurs de validation Zod
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }

    // Gérer les erreurs Supabase
    if (error.code && error.message) {
      return handleSupabaseError(error)
    }

    // Erreur générique
    console.error('[get-facture] Erreur:', error)
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Erreur lors de la récupération de la facture',
      { error: error.message }
    )
  }
})
