'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Tenant, UpdateTables } from '@/types/database'

export function useTenant(userId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['tenant', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data as Tenant
    },
    enabled: !!userId,
  })
}

export function useUpdateTenant() {
  const supabase = getSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      tenantId, 
      updates 
    }: { 
      tenantId: string; 
      updates: UpdateTables<'tenants'> 
    }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
    },
  })
}






















