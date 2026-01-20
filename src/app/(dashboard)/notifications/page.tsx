'use client'

import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks/use-notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Bell, Calendar, FileText, CheckCircle2, CheckCheck, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'

export default function NotificationsPage() {
  const { tenant } = useAuth()
  const { data, isLoading, refetch } = useNotifications(false)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.notifications || []
  const unreadCount = data?.unread_count || 0

  const handleNotificationClick = (notificationId: string, type: string) => {
    markRead.mutate(notificationId)
    
    // Rediriger selon le type
    if (type === 'rdv_confirme') {
      window.location.href = '/rdv'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rdv_confirme':
        return <Calendar className="w-5 h-5 text-blue-500" />
      case 'devis_accepte':
        return <FileText className="w-5 h-5 text-green-500" />
      default:
        return <CheckCircle2 className="w-5 h-5 text-purple-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications sont à jour'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Mes notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
              <p className="text-muted-foreground">
                Vous serez notifié ici lorsqu'un client confirme un rendez-vous ou qu'un événement important se produit.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-6 hover:bg-accent/50 transition-colors cursor-pointer",
                      !notification.lu && "bg-blue-500/10 border-l-4 border-l-blue-500"
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.type)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={cn(
                                "text-base font-medium",
                                !notification.lu && "font-semibold"
                              )}>
                                {notification.titre}
                              </h3>
                              {!notification.lu && (
                                <Badge variant="default" className="h-5 text-xs">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                              <span>
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: fr
                                })}
                              </span>
                              <span>
                                {format(new Date(notification.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                              </span>
                            </div>
                          </div>
                          {!notification.lu && (
                            <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
