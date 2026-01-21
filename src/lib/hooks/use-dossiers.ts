'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import type { Dossier, InsertTables, UpdateTables } from '@/types/database'

export function useDossiers() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['dossiers', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          clients (id, nom_complet, telephone, email),
          rdv (id, date_heure, statut),
          devis (id, statut, date_envoi),
          factures (id, statut, date_echeance)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Dossier & { clients: { id: string; nom_complet: string; telephone: string | null; email: string | null } })[]
    },
    enabled: !!tenant?.id,
  })
}

export function useDossier(id: string) {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['dossier', id],
    queryFn: async () => {
      if (!tenant?.id || !id) return null
      
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          clients (id, nom_complet, telephone, email, adresse_chantier, adresse_facturation),
          rdv (*),
          fiches_visite (*),
          devis (id, numero, statut, montant_ttc, date_creation, date_envoi),
          factures (id, numero, statut, montant_ttc, date_emission, date_echeance, date_paiement),
          journal_dossier (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id && !!id,
  })
}

export function useCreateDossier() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dossier: Omit<InsertTables<'dossiers'>, 'tenant_id' | 'numero'>) => {
      if (!tenant?.id) throw new Error('Tenant non trouvé')

      // Générer le numéro de dossier
      const { data: numero } = await supabase.rpc('generate_dossier_numero', { p_tenant_id: tenant.id })

      const { data, error } = await supabase
        .from('dossiers')
        .insert({
          ...dossier,
          tenant_id: tenant.id,
          numero: numero || `DOS-${Date.now()}`,
        })
        .select()
        .single()

      if (error) throw error

      // Créer une entrée dans le journal
      await supabase.from('journal_dossier').insert({
        tenant_id: tenant.id,
        dossier_id: data.id,
        type: 'creation',
        titre: 'Dossier créé',
        contenu: `Dossier "${data.titre}" créé`,
        auteur: 'artisan',
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

export function useUpdateDossier() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'dossiers'> & { id: string }) => {
      if (!tenant?.id) throw new Error('Tenant non trouvé')

      // Récupérer l'ancien statut pour le journal
      const { data: oldDossier } = await supabase
        .from('dossiers')
        .select('statut')
        .eq('id', id)
        .single()

      const { data, error } = await supabase
        .from('dossiers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Si le statut a changé, créer une entrée dans le journal
      if (oldDossier?.statut !== updates.statut && updates.statut) {
        await supabase.from('journal_dossier').insert({
          tenant_id: tenant.id,
          dossier_id: id,
          type: 'changement_statut',
          titre: 'Statut modifié',
          ancien_statut: oldDossier?.statut,
          nouveau_statut: updates.statut,
          auteur: 'artisan',
        })
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossier', variables.id] })
    },
  })
}

export function useDeleteDossier() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dossiers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

// Stats pour le dashboard
export function useDossiersStats() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['dossiers-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null

      const { data: dossiers } = await supabase
        .from('dossiers')
        .select('statut, montant_estime')
        .eq('tenant_id', tenant.id)

      if (!dossiers) return null

      type DossierRow = { statut: string | null; montant_estime: number | null }
      
      const stats = {
        total: dossiers.length,
        enCours: dossiers.filter((d: DossierRow) => !['signe', 'perdu', 'annule'].includes(d.statut || '')).length,
        signes: dossiers.filter((d: DossierRow) => d.statut === 'signe').length,
        perdus: dossiers.filter((d: DossierRow) => d.statut === 'perdu').length,
        montantTotal: dossiers.reduce((acc: number, d: DossierRow) => acc + (d.montant_estime || 0), 0),
        montantGagne: dossiers.filter((d: DossierRow) => d.statut === 'signe').reduce((acc: number, d: DossierRow) => acc + (d.montant_estime || 0), 0),
        parStatut: {} as Record<string, number>,
      }

      dossiers.forEach((d: DossierRow) => {
        const statut = d.statut || 'contact_recu'
        stats.parStatut[statut] = (stats.parStatut[statut] || 0) + 1
      })

      return stats
    },
    enabled: !!tenant?.id,
  })
}
