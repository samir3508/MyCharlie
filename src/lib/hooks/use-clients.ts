'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Client, InsertTables, UpdateTables } from '@/types/database'

export function useClients(tenantId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['clients', tenantId],
    queryFn: async () => {
      if (!tenantId) return []

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Client[]
    },
    enabled: !!tenantId,
  })
}

export function useClient(clientId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error
      return data as Client
    },
    enabled: !!clientId,
  })
}

export function useCreateClient() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client: InsertTables<'clients'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      updates 
    }: { 
      clientId: string; 
      updates: UpdateTables<'clients'> 
    }) => {
      console.log('useUpdateClient - Début modification:', { clientId, updates })
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single()

      console.log('useUpdateClient - Résultat Supabase:', { data, error })

      if (error) {
        console.error('useUpdateClient - Erreur Supabase:', error)
        throw error
      }
      
      console.log('useUpdateClient - Succès:', data)
      return data
    },
    onSuccess: (data) => {
      console.log('useUpdateClient - onSuccess:', data)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client', data.id] })
    },
    onError: (error) => {
      console.error('useUpdateClient - onError:', error)
    }
  })
}

export function useDeleteClient() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}






















