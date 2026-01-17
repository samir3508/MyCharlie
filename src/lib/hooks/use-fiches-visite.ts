'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import type { FicheVisite, InsertTables, UpdateTables } from '@/types/database'

export function useFichesVisite() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['fiches-visite', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      
      const { data, error } = await supabase
        .from('fiches_visite')
        .select(`
          *,
          dossiers (id, numero, titre, adresse_chantier, clients (nom_complet))
        `)
        .eq('tenant_id', tenant.id)
        .order('date_visite', { ascending: false })

      if (error) throw error
      return data as (FicheVisite & { 
        dossiers: { 
          id: string; 
          numero: string; 
          titre: string; 
          adresse_chantier: string | null;
          clients: { nom_complet: string } | null;
        } | null 
      })[]
    },
    enabled: !!tenant?.id,
  })
}

export function useFicheVisite(id: string) {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['fiche-visite', id],
    queryFn: async () => {
      if (!tenant?.id || !id) return null
      
      const { data, error } = await supabase
        .from('fiches_visite')
        .select(`
          *,
          dossiers (*, clients (*)),
          rdv (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id && !!id,
  })
}

export function useCreateFicheVisite() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fiche: Omit<InsertTables<'fiches_visite'>, 'tenant_id'>) => {
      if (!tenant?.id) throw new Error('Tenant non trouvé')

      const { data, error } = await supabase
        .from('fiches_visite')
        .insert({
          ...fiche,
          tenant_id: tenant.id,
        })
        .select()
        .single()

      if (error) throw error

      // Journal
      if (fiche.dossier_id) {
        await supabase.from('journal_dossier').insert({
          tenant_id: tenant.id,
          dossier_id: fiche.dossier_id,
          type: 'visite',
          titre: 'Fiche de visite créée',
          contenu: fiche.constat?.substring(0, 100) || 'Nouvelle fiche de visite',
          auteur: 'artisan',
        })
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiches-visite'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

export function useUpdateFicheVisite() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'fiches_visite'> & { id: string }) => {
      const { data, error } = await supabase
        .from('fiches_visite')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiches-visite'] })
      queryClient.invalidateQueries({ queryKey: ['fiche-visite', variables.id] })
    },
  })
}

export function useDeleteFicheVisite() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fiches_visite')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiches-visite'] })
    },
  })
}
