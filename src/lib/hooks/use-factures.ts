'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Facture, InsertTables, UpdateTables } from '@/types/database'

export function useFactures(tenantId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['factures', tenantId],
    queryFn: async () => {
      if (!tenantId) return []

      const { data, error } = await supabase
        .from('factures')
        .select(`
          *,
          clients (nom_complet)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map((f: Facture & { clients?: { nom_complet?: string } }) => ({
        ...f,
        client_name: f.clients?.nom_complet
      })) as (Facture & { client_name?: string })[]
    },
    enabled: !!tenantId,
  })
}

export function useFactureById(factureId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['facture', factureId],
    queryFn: async () => {
      if (!factureId) return null

      const { data, error } = await supabase
        .from('factures')
        .select(`
          *,
          clients (id, nom_complet, email, telephone, adresse_facturation),
          lignes_factures (*),
          relances (*)
        `)
        .eq('id', factureId)
        .single()

      if (error) throw error
      
      // Si les lignes ne sont pas dans la relation, les récupérer séparément
      if (data && (!data.lignes_factures || !Array.isArray(data.lignes_factures))) {
        const { data: lignes, error: lignesError } = await supabase
          .from('lignes_factures')
          .select('*')
          .eq('facture_id', data.id)
          .order('ordre')
        
        if (!lignesError && lignes) {
          data.lignes_factures = lignes
        }
      }
      
      return data
    },
    enabled: !!factureId,
  })
}

export function useCreateFacture() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      facture, 
      lignes 
    }: { 
      facture: InsertTables<'factures'>; 
      lignes: Omit<InsertTables<'lignes_factures'>, 'facture_id'>[] 
    }) => {
      // Generate facture number
      const { data: numero } = await supabase.rpc('generate_facture_numero', {
        p_tenant_id: facture.tenant_id
      })

      // Create facture
      const { data: newFacture, error: factureError } = await supabase
        .from('factures')
        .insert({ ...facture, numero: numero || facture.numero })
        .select()
        .single()

      if (factureError) throw factureError

      // Create lignes
      if (lignes.length > 0) {
        const lignesWithFactureId = lignes.map(ligne => ({
          ...ligne,
          facture_id: newFacture.id
        }))

        const { error: lignesError } = await supabase
          .from('lignes_factures')
          .insert(lignesWithFactureId)

        if (lignesError) throw lignesError
      }

      // Calculate totals
      const totals = lignes.reduce(
        (acc, ligne) => ({
          montant_ht: acc.montant_ht + (ligne.quantite * ligne.prix_unitaire_ht),
          montant_tva: acc.montant_tva + (ligne.quantite * ligne.prix_unitaire_ht * (ligne.tva_pct || 10) / 100),
        }),
        { montant_ht: 0, montant_tva: 0 }
      )

      await supabase
        .from('factures')
        .update({
          montant_ht: totals.montant_ht,
          montant_tva: totals.montant_tva,
          montant_ttc: totals.montant_ht + totals.montant_tva
        })
        .eq('id', newFacture.id)

      return newFacture
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    },
  })
}

export function useUpdateFactureStatus() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      factureId, 
      statut 
    }: { 
      factureId: string; 
      statut: Facture['statut'] 
    }) => {
      const updates: UpdateTables<'factures'> = { statut }

      if (statut === 'payee') {
        updates.date_paiement = new Date().toISOString().split('T')[0]
      }

      const { data: facture, error } = await supabase
        .from('factures')
        .update(updates)
        .eq('id', factureId)
        .select('*, devis_id')
        .single()

      if (error) throw error

      // Si la facture est marquée comme payée et qu'elle est liée à un devis,
      // vérifier si toutes les factures du devis sont payées
      if (statut === 'payee' && facture.devis_id) {
        const { data: allFactures } = await supabase
          .from('factures')
          .select('statut')
          .eq('devis_id', facture.devis_id)

        const allPaid = allFactures?.every((f: any) => f.statut === 'payee') || false

        if (allPaid) {
          // Mettre à jour le statut du devis à "paye"
          await supabase
            .from('devis')
            .update({
              statut: 'paye' as any,
              updated_at: new Date().toISOString(),
            })
            .eq('id', facture.devis_id)
        }
      }

      return facture
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['facture', data.id] })
      // Invalider aussi les queries du devis si la facture est liée à un devis
      if (data.devis_id) {
        queryClient.invalidateQueries({ queryKey: ['devis', data.devis_id] })
        queryClient.invalidateQueries({ queryKey: ['devis-factures', data.devis_id] })
      }
    },
  })
}

export function useDeleteFacture() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (factureId: string) => {
      const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', factureId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    },
  })
}

// Create facture from devis
export function useCreateFactureFromDevis() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (devisId: string) => {
      // Get devis with lignes
      const { data: devis, error: devisError } = await supabase
        .from('devis')
        .select(`
          *,
          lignes_devis (*)
        `)
        .eq('id', devisId)
        .single()

      if (devisError) throw devisError

      // Generate facture number
      const { data: numero } = await supabase.rpc('generate_facture_numero', {
        p_tenant_id: devis.tenant_id
      })

      // Create facture
      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .insert({
          tenant_id: devis.tenant_id,
          client_id: devis.client_id,
          devis_id: devis.id,
          numero: numero,
          titre: devis.titre,
          description: devis.description,
          montant_ht: devis.montant_ht,
          montant_tva: devis.montant_tva,
          montant_ttc: devis.montant_ttc,
          statut: 'brouillon',
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single()

      if (factureError) throw factureError

      // Copy lignes
      if (devis.lignes_devis && devis.lignes_devis.length > 0) {
        const lignes = devis.lignes_devis.map((ligne: { ordre: number; designation: string; description_detaillee: string; quantite: number; unite: string; prix_unitaire_ht: number; tva_pct: number }) => ({
          facture_id: facture.id,
          ordre: ligne.ordre,
          designation: ligne.designation,
          description_detaillee: ligne.description_detaillee,
          quantite: ligne.quantite,
          unite: ligne.unite,
          prix_unitaire_ht: ligne.prix_unitaire_ht,
          tva_pct: ligne.tva_pct,
        }))

        await supabase.from('lignes_factures').insert(lignes)
      }

      return facture
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['devis'] })
    },
  })
}