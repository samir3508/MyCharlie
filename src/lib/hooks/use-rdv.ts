'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import type { Rdv, InsertTables, UpdateTables } from '@/types/database'

export function useRdvList() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['rdv-list', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      
      const { data, error } = await supabase
        .from('rdv')
        .select(`
          *,
          dossiers (id, numero, titre, client_id),
          clients (id, nom_complet, telephone)
        `)
        .eq('tenant_id', tenant.id)
        .order('date_heure', { ascending: true })

      if (error) throw error
      return data as (Rdv & { 
        dossiers: { id: string; numero: string; titre: string; client_id: string } | null;
        clients: { id: string; nom_complet: string; telephone: string | null } | null;
      })[]
    },
    enabled: !!tenant?.id,
  })
}

export function useRdvToday() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['rdv-today', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase
        .from('rdv')
        .select(`
          *,
          dossiers (id, numero, titre),
          clients (id, nom_complet, telephone)
        `)
        .eq('tenant_id', tenant.id)
        .gte('date_heure', today.toISOString())
        .lt('date_heure', tomorrow.toISOString())
        .order('date_heure', { ascending: true })

      if (error) throw error
      return data as (Rdv & { 
        dossiers: { id: string; numero: string; titre: string } | null;
        clients: { id: string; nom_complet: string; telephone: string | null } | null;
      })[]
    },
    enabled: !!tenant?.id,
  })
}

export function useRdvUpcoming(days: number = 7) {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['rdv-upcoming', tenant?.id, days],
    queryFn: async () => {
      if (!tenant?.id) return []
      
      const now = new Date()
      const future = new Date()
      future.setDate(future.getDate() + days)

      const { data, error } = await supabase
        .from('rdv')
        .select(`
          *,
          dossiers (id, numero, titre),
          clients (id, nom_complet, telephone)
        `)
        .eq('tenant_id', tenant.id)
        .gte('date_heure', now.toISOString())
        .lte('date_heure', future.toISOString())
        .in('statut', ['planifie', 'confirme'])
        .order('date_heure', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id,
  })
}

export function useCreateRdv() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rdv: Omit<InsertTables<'rdv'>, 'tenant_id'>) => {
      if (!tenant?.id) throw new Error('Tenant non trouvé')

      const { data, error } = await supabase
        .from('rdv')
        .insert({
          ...rdv,
          tenant_id: tenant.id,
        })
        .select()
        .single()

      if (error) throw error

      // Mettre à jour le statut du dossier
      if (rdv.dossier_id) {
        await supabase
          .from('dossiers')
          .update({ statut: 'rdv_planifie' })
          .eq('id', rdv.dossier_id)

        // Journal
        await supabase.from('journal_dossier').insert({
          tenant_id: tenant.id,
          dossier_id: rdv.dossier_id,
          type: 'rdv_cree',
          titre: 'RDV planifié',
          contenu: `RDV ${rdv.type_rdv} prévu le ${new Date(rdv.date_heure).toLocaleDateString('fr-FR')}`,
          auteur: 'artisan',
        })
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-list'] })
      queryClient.invalidateQueries({ queryKey: ['rdv-today'] })
      queryClient.invalidateQueries({ queryKey: ['rdv-upcoming'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

export function useUpdateRdv() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'rdv'> & { id: string }) => {
      if (!tenant?.id) throw new Error('Tenant non trouvé')

      const { data, error } = await supabase
        .from('rdv')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Si le RDV est marqué comme réalisé, mettre à jour le dossier
      if (updates.statut === 'realise' && data.dossier_id) {
        await supabase
          .from('dossiers')
          .update({ statut: 'visite_realisee' })
          .eq('id', data.dossier_id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-list'] })
      queryClient.invalidateQueries({ queryKey: ['rdv-today'] })
      queryClient.invalidateQueries({ queryKey: ['rdv-upcoming'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

export function useDeleteRdv() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rdv')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-list'] })
      queryClient.invalidateQueries({ queryKey: ['rdv-today'] })
      queryClient.invalidateQueries({ queryKey: ['rdv-upcoming'] })
    },
  })
}
