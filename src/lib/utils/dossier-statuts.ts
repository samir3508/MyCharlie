/**
 * Utilitaires pour gérer les mises à jour automatiques de statuts de dossiers
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Met à jour le statut d'un dossier lors de l'envoi de créneaux
 * @param dossierId - ID du dossier
 * @param tenantId - ID du tenant
 * @returns Promise<boolean> - true si succès, false si échec
 */
export async function updateDossierStatutEnvoiCreneaux(
  dossierId: string, 
  tenantId: string
): Promise<boolean> {
  try {
    console.log(`🔄 Mise à jour statut dossier ${dossierId} → rdv_a_planifier (créneaux envoyés, en attente confirmation client)`)
    
    const { error } = await supabase
      .from('dossiers')
      .update({ 
        statut: 'rdv_a_planifier',
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Erreur mise à jour statut dossier:', error)
      return false
    }

    console.log('✅ Statut dossier mis à jour avec succès')
    return true
  } catch (err) {
    console.error('❌ Exception lors de la mise à jour du statut:', err)
    return false
  }
}

/**
 * Met à jour le statut d'un dossier vers "rdv_a_planifier" quand on commence à planifier
 * @param dossierId - ID du dossier  
 * @param tenantId - ID du tenant
 * @returns Promise<boolean> - true si succès, false si échec
 */
export async function updateDossierStatutPlanification(
  dossierId: string,
  tenantId: string
): Promise<boolean> {
  try {
    console.log(`🔄 Mise à jour statut dossier ${dossierId} → rdv_a_planifier`)
    
    const { error } = await supabase
      .from('dossiers')
      .update({ 
        statut: 'rdv_a_planifier',
        updated_at: new Date().toISOString()
      })
      .eq('id', dossierId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Erreur mise à jour statut dossier:', error)
      return false
    }

    console.log('✅ Statut dossier mis à jour avec succès')
    return true
  } catch (err) {
    console.error('❌ Exception lors de la mise à jour du statut:', err)
    return false
  }
}

/**
 * Vérifie si le statut actuel permet l'envoi de créneaux
 * @param statutActuel - Statut actuel du dossier
 * @returns boolean - true si on peut envoyer les créneaux
 */
export function peutEnvoyerCreneaux(statutActuel: string | null): boolean {
  const statutsAutorises = [
    'contact_recu',
    'qualification', 
    'rdv_a_planifier'
  ]
  
  return statutsAutorises.includes(statutActuel || '')
}
