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
      if (!tenant?.id) {
        console.warn('[useRdvList] Pas de tenant_id')
        return []
      }
      
      console.log('[useRdvList] Recherche de tous les RDV pour tenant:', tenant.id)

      const { data, error } = await supabase
        .from('rdv')
        .select(`
          *,
          dossiers (id, numero, titre, client_id),
          clients (id, nom_complet, telephone)
        `)
        .eq('tenant_id', tenant.id)
        .order('date_heure', { ascending: true })

      if (error) {
        console.error('[useRdvList] Erreur:', error)
        throw error
      }
      
      console.log(`[useRdvList] ${data?.length || 0} RDV trouvé(s) au total`)
      if (data && data.length > 0) {
        console.log('[useRdvList] Exemples de RDV:', data.slice(0, 3).map((r: any) => ({
          id: r.id,
          date: r.date_heure,
          statut: r.statut,
          titre: r.titre,
          dossier_id: r.dossier_id
        })))
      }
      
      return data as (Rdv & { 
        dossiers: { id: string; numero: string; titre: string; client_id: string } | null;
        clients: { id: string; nom_complet: string; telephone: string | null } | null;
      })[]
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
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
      if (!tenant?.id) {
        console.warn('[useRdvUpcoming] Pas de tenant_id')
        return []
      }
      
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Début de la journée
      const future = new Date()
      future.setDate(future.getDate() + days)
      future.setHours(23, 59, 59, 999) // Fin de la journée

      console.log('[useRdvUpcoming] Recherche RDV entre', now.toISOString(), 'et', future.toISOString())

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
        .in('statut', ['planifie', 'confirme', 'en_cours']) // Ajouter 'en_cours' aussi
        .order('date_heure', { ascending: true })

      if (error) {
        console.error('[useRdvUpcoming] Erreur:', error)
        throw error
      }
      
      console.log(`[useRdvUpcoming] ${data?.length || 0} RDV trouvé(s)`)
      if (data && data.length > 0) {
        console.log('[useRdvUpcoming] RDV trouvés:', data.map((r: any) => ({
          id: r.id,
          date: r.date_heure,
          statut: r.statut,
          titre: r.titre
        })))
      }
      
      return data
    },
    enabled: !!tenant?.id,
  })
}

export function useRdvMonth(year?: number, month?: number) {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['rdv-month', tenant?.id, year, month],
    queryFn: async () => {
      if (!tenant?.id) {
        console.warn('[useRdvMonth] Pas de tenant_id')
        return []
      }
      
      const targetDate = year && month ? new Date(year, month - 1, 1) : new Date()
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      startOfMonth.setHours(0, 0, 0, 0)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      endOfMonth.setHours(23, 59, 59, 999)

      console.log('[useRdvMonth] Recherche RDV entre', startOfMonth.toISOString(), 'et', endOfMonth.toISOString())

      const { data, error } = await supabase
        .from('rdv')
        .select(`
          *,
          dossiers (id, numero, titre),
          clients (id, nom_complet, telephone)
        `)
        .eq('tenant_id', tenant.id)
        .gte('date_heure', startOfMonth.toISOString())
        .lte('date_heure', endOfMonth.toISOString())
        .order('date_heure', { ascending: true })

      if (error) {
        console.error('[useRdvMonth] Erreur:', error)
        throw error
      }
      
      console.log(`[useRdvMonth] ${data?.length || 0} RDV trouvé(s) pour le mois`)
      if (data && data.length > 0) {
        console.log('[useRdvMonth] RDV trouvés:', data.map((r: any) => ({
          id: r.id,
          date: r.date_heure,
          statut: r.statut,
          titre: r.titre
        })))
      }
      
      return data as (Rdv & { 
        dossiers: { id: string; numero: string; titre: string } | null;
        clients: { id: string; nom_complet: string; telephone: string | null } | null;
      })[]
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
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
