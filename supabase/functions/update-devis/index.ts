/**
 * Edge Function: Changer le statut d'un devis
 * 
 * Permet de modifier le statut d'un devis (envoye, accepte, refuse)
 * Peut être utilisé même si le devis n'est plus en "brouillon"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from './_shared/auth.ts'
import { supabase } from './_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from './_shared/errors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schéma de validation pour le changement de statut
const UpdateStatutRequestSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse'], {
    errorMap: () => ({ message: 'Le statut doit être l\'un de: brouillon, envoye, accepte, refuse' })
  }),
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
    const validatedRequest = UpdateStatutRequestSchema.parse(body)

    const { tenant_id, devis_id, statut } = validatedRequest

    // Vérifier que le devis existe
    const { data: existingDevis, error: checkError } = await supabase
      .from('devis')
      .select('id, statut, numero')
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (checkError || !existingDevis) {
      return errorResponse(
        404,
        'DEVIS_NOT_FOUND',
        'Le devis spécifié n\'existe pas ou n\'appartient pas à ce tenant',
        { devis_id }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = { statut }
    
    // Ajouter les dates automatiques selon le statut
    if (statut === 'envoye') {
      updateData.date_envoi = new Date().toISOString().split('T')[0]
    } else if (statut === 'accepte') {
      updateData.date_acceptation = new Date().toISOString().split('T')[0]
    }
    
    updateData.updated_at = new Date().toISOString()

    // Mettre à jour le statut du devis
    const { data: updatedDevis, error: updateError } = await supabase
      .from('devis')
      .update(updateData)
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .select()
      .single()

    if (updateError) {
      return handleSupabaseError(updateError)
    }

    return successResponse(
      { 
        devis: updatedDevis,
        message: `Statut du devis ${existingDevis.numero} changé en "${statut}"`
      },
      'Statut du devis mis à jour avec succès'
    )
  } catch (error) {
    console.error('Error in update-devis-statut:', error)
    if (error.name === 'ZodError') {
      return handleZodError(error)
    }
    return handleSupabaseError(error)
  }
})
