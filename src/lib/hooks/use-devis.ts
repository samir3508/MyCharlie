'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Devis, LigneDevis, InsertTables, UpdateTables } from '@/types/database'

/**
 * Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
 */
async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  const supabase = getSupabaseClient()
  
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId, supabase)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId, supabase)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId, supabase)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string, supabase: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    // Si aucun template par défaut, prendre le premier template disponible
    const { data: fallback } = await supabase
      .from('templates_conditions_paiement')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle()
    
    return fallback?.id || null
  }

  return data.id
}

export function useDevis(tenantId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['devis', tenantId],
    queryFn: async () => {
      console.log('📊 [useDevis] Requête démarrée pour tenant:', tenantId)
      
      if (!tenantId) {
        console.warn('⚠️ [useDevis] Pas de tenantId fourni')
        return []
      }

      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          clients (nom_complet),
          dossiers (id, numero)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [useDevis] Erreur lors de la récupération:', error)
        throw error
      }
      
      console.log('✅ [useDevis] Devis récupérés:', data?.length || 0)
      
      return data.map((d: Devis & { clients?: { nom_complet: string } | null; dossiers?: { id: string; numero: string } | null }) => ({
        ...d,
        client_name: d.clients?.nom_complet,
        dossier_numero: d.dossiers?.numero
      })) as (Devis & { client_name?: string; dossier_numero?: string })[]
    },
    enabled: !!tenantId,
  })
}

export function useDevisById(devisId: string | undefined, tenantId?: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['devis', devisId, tenantId],
    queryFn: async () => {
      if (!devisId) {
        console.log('⚠️ useDevisById: devisId est undefined')
        return null
      }

      console.log('🔍 Recherche du devis avec ID:', devisId, 'tenantId:', tenantId)

      let query = supabase
        .from('devis')
        .select(`
          *,
          tenant_id,
          clients (id, nom_complet, email, telephone, adresse_facturation),
          lignes_devis (*)
        `)
        .eq('id', devisId)

      // Filtrer par tenant_id si fourni (pour respecter les RLS)
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        console.error('❌ Erreur lors de la récupération du devis:', error)
        throw error
      }
      
      if (!data) {
        console.warn('⚠️ Devis non trouvé avec ID:', devisId, tenantId ? `pour tenant ${tenantId}` : '')
        return null
      }

      console.log('✅ Devis trouvé:', { id: data.id, numero: data.numero, tenant_id: data.tenant_id })
      
      return data as Devis & { 
        clients: { id: string; nom_complet: string; email: string; telephone: string; adresse_facturation: string } | null;
        lignes_devis: LigneDevis[] 
      }
    },
    enabled: !!devisId,
  })
}

export function useCreateDevis() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      devis, 
      lignes 
    }: { 
      devis: InsertTables<'devis'>; 
      lignes: Omit<InsertTables<'lignes_devis'>, 'devis_id'>[] 
    }) => {
      // Calculate totals first to determine template
      const totals = lignes.reduce(
        (acc, ligne) => ({
          montant_ht: acc.montant_ht + (ligne.quantite * ligne.prix_unitaire_ht),
          montant_tva: acc.montant_tva + (ligne.quantite * ligne.prix_unitaire_ht * (ligne.tva_pct || 10) / 100),
        }),
        { montant_ht: 0, montant_tva: 0 }
      )
      const montant_ttc = totals.montant_ht + totals.montant_tva

      // Sélectionner automatiquement le template si non fourni
      let templateId = devis.template_condition_paiement_id
      if (!templateId) {
        templateId = await selectPaymentTemplate(devis.tenant_id, montant_ttc)
      }

      // Generate devis number
      const { data: numero } = await supabase.rpc('generate_devis_numero', {
        p_tenant_id: devis.tenant_id
      })

      // Create devis with template
      console.log('📝 Création du devis avec template:', { templateId, numero: numero || devis.numero })
      
      const devisData = {
        ...devis, 
        numero: numero || devis.numero,
        template_condition_paiement_id: templateId || null,
        // S'assurer que date_creation est définie
        date_creation: devis.date_creation || new Date().toISOString().split('T')[0],
        // Le signature_token sera généré automatiquement par le trigger PostgreSQL si non fourni
      }
      
      console.log('📋 Données du devis à insérer:', devisData)
      
      const { data: newDevis, error: devisError } = await supabase
        .from('devis')
        .insert(devisData)
        .select()
        .single()

      if (devisError) {
        console.error('❌ Erreur lors de la création du devis:', devisError)
        throw devisError
      }

      if (!newDevis) {
        console.error('❌ Le devis n\'a pas été créé (newDevis est null)')
        throw new Error('Le devis n\'a pas pu être créé')
      }

      console.log('✅ Devis créé:', { id: newDevis.id, numero: newDevis.numero })

      // Create lignes
      if (lignes.length > 0) {
        const lignesWithDevisId = lignes.map(ligne => ({
          ...ligne,
          devis_id: newDevis.id
        }))

        const { error: lignesError } = await supabase
          .from('lignes_devis')
          .insert(lignesWithDevisId)

        if (lignesError) throw lignesError
      }

      // Update totals
      await supabase
        .from('devis')
        .update({
          montant_ht: totals.montant_ht,
          montant_tva: totals.montant_tva,
          montant_ttc: montant_ttc
        })
        .eq('id', newDevis.id)

      // ═══════════════════════════════════════════════════════════════════════
      // 🔄 MISE À JOUR AUTOMATIQUE DU STATUT DU DOSSIER → devis_en_cours
      // ═══════════════════════════════════════════════════════════════════════
      if (newDevis.dossier_id) {
        await supabase
          .from('dossiers')
          .update({ 
            statut: 'devis_en_cours',
            devis_cree: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', newDevis.dossier_id)
      }

      return newDevis
    },
    onSuccess: (data) => {
      console.log('🔄 Invalidation des queries pour le devis:', data.id)
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      // Précharger le devis créé dans le cache
      queryClient.setQueryData(['devis', data.id], data)
    },
  })
}

export function useUpdateDevis() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      devisId, 
      updates,
      lignes 
    }: { 
      devisId: string; 
      updates: UpdateTables<'devis'>;
      lignes?: { id?: string; data: Omit<InsertTables<'lignes_devis'>, 'devis_id'> }[]
    }) => {
      // Update devis
      const { data, error } = await supabase
        .from('devis')
        .update(updates)
        .eq('id', devisId)
        .select()
        .single()

      if (error) throw error

      // Update lignes if provided
      if (lignes) {
        // Delete existing lignes
        await supabase
          .from('lignes_devis')
          .delete()
          .eq('devis_id', devisId)

        // Insert new lignes
        if (lignes.length > 0) {
          const lignesWithDevisId = lignes.map(ligne => ({
            devis_id: devisId,
            ordre: ligne.data.ordre,
            designation: ligne.data.designation,
            description_detaillee: ligne.data.description_detaillee,
            quantite: ligne.data.quantite,
            unite: ligne.data.unite,
            prix_unitaire_ht: ligne.data.prix_unitaire_ht,
            tva_pct: ligne.data.tva_pct
          }))

          await supabase
            .from('lignes_devis')
            .insert(lignesWithDevisId)
        }

        // Recalculate totals
        const totals = lignes.reduce(
          (acc, ligne) => ({
            montant_ht: acc.montant_ht + (ligne.data.quantite * ligne.data.prix_unitaire_ht),
            montant_tva: acc.montant_tva + (ligne.data.quantite * ligne.data.prix_unitaire_ht * (ligne.data.tva_pct || 10) / 100),
          }),
          { montant_ht: 0, montant_tva: 0 }
        )

        await supabase
          .from('devis')
          .update({
            montant_ht: totals.montant_ht,
            montant_tva: totals.montant_tva,
            montant_ttc: totals.montant_ht + totals.montant_tva
          })
          .eq('id', devisId)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['devis', data.id] })
    },
  })
}

export function useDeleteDevis() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (devisId: string) => {
      const { error } = await supabase
        .from('devis')
        .delete()
        .eq('id', devisId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
    },
  })
}

export function useUpdateDevisStatus() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      devisId, 
      statut 
    }: { 
      devisId: string; 
      statut: Devis['statut'] 
    }) => {
      const updates: UpdateTables<'devis'> = { statut }

      if (statut === 'envoye') {
        updates.date_envoi = new Date().toISOString().split('T')[0]
      } else if (statut === 'accepte') {
        updates.date_acceptation = new Date().toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('devis')
        .update(updates)
        .eq('id', devisId)
        .select('*, dossier_id')
        .single()

      if (error) throw error

      // ═══════════════════════════════════════════════════════════════════════
      // 🔄 MISE À JOUR AUTOMATIQUE DU STATUT DU DOSSIER selon le statut du devis
      // ═══════════════════════════════════════════════════════════════════════
      if (data.dossier_id) {
        let newDossierStatut: string | null = null
        let additionalUpdates: Record<string, any> = {}

        if (statut === 'envoye') {
          newDossierStatut = 'devis_envoye'
          additionalUpdates = { devis_envoye: true }
        } else if (statut === 'accepte') {
          newDossierStatut = 'signe'
        } else if (statut === 'refuse') {
          newDossierStatut = 'perdu'
        }

        if (newDossierStatut) {
          await supabase
            .from('dossiers')
            .update({ 
              statut: newDossierStatut,
              ...additionalUpdates,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.dossier_id)
        }
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['devis', data.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}






















