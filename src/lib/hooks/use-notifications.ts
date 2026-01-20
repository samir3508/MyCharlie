'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export interface Notification {
  id: string
  tenant_id: string
  type: string
  titre: string
  message: string
  data: any
  lu: boolean
  created_at: string
  updated_at: string
}

export function useNotifications(unreadOnly: boolean = false) {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['notifications', tenant?.id, unreadOnly],
    queryFn: async () => {
      if (!tenant?.id) return { notifications: [], unread_count: 0 }

      const response = await fetch(
        `/api/notifications?unread_only=${unreadOnly}&limit=50`
      )
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notifications')
      }

      const data = await response.json()
      return {
        notifications: data.notifications as Notification[],
        unread_count: data.unread_count as number
      }
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  })
}

export function useUnreadNotificationsCount() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'unread-count', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return 0

      const response = await fetch('/api/notifications?unread_only=true&limit=1')
      
      if (!response.ok) {
        return 0
      }

      const data = await response.json()
      return data.unread_count as number
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la notification')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenant?.id] })
    }
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des notifications')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenant?.id] })
    }
  })
}
