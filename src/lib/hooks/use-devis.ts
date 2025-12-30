'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Devis, LigneDevis, InsertTables, UpdateTables } from '@/types/database'

export function useDevis(tenantId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['devis', tenantId],
    queryFn: async () => {
      if (!tenantId) return []

      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          clients (nom_complet)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map((d: Devis & { clients?: { nom_complet: string } | null }) => ({
        ...d,
        client_name: d.clients?.nom_complet
      })) as (Devis & { client_name?: string })[]
    },
    enabled: !!tenantId,
  })
}

export function useDevisById(devisId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['devis', devisId],
    queryFn: async () => {
      if (!devisId) return null

      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          clients (id, nom_complet, email, telephone, adresse_facturation),
          lignes_devis (*)
        `)
        .eq('id', devisId)
        .single()

      if (error) throw error
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
      // Generate devis number
      const { data: numero } = await supabase.rpc('generate_devis_numero', {
        p_tenant_id: devis.tenant_id
      })

      // Create devis
      const { data: newDevis, error: devisError } = await supabase
        .from('devis')
        .insert({ ...devis, numero: numero || devis.numero })
        .select()
        .single()

      if (devisError) throw devisError

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

      // Calculate and update totals
      const totals = lignes.reduce(
        (acc, ligne) => ({
          montant_ht: acc.montant_ht + (ligne.quantite * ligne.prix_unitaire_ht),
          montant_tva: acc.montant_tva + (ligne.quantite * ligne.prix_unitaire_ht * (ligne.tva_pct || 10) / 100),
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
        .eq('id', newDevis.id)

      return newDevis
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
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
            ...ligne.data,
            devis_id: devisId
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
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['devis', data.id] })
    },
  })
}






















