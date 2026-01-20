'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Calendar, User, FileText, CheckCircle2 } from 'lucide-react'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useNotifications(false)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.notifications || []
  const unreadCount = data?.unread_count || 0

  const handleNotificationClick = (notificationId: string, type: string) => {
    markRead.mutate(notificationId)
    
    // Rediriger selon le type
    if (type === 'rdv_confirme') {
      // Rediriger vers l'agenda
      setTimeout(() => {
        window.location.href = '/rdv'
      }, 100)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rdv_confirme':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'devis_accepte':
        return <FileText className="w-4 h-4 text-green-500" />
      default:
        return <CheckCircle2 className="w-4 h-4 text-purple-500" />
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead.mutate()}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent/50 cursor-pointer transition-colors",
                    !notification.lu && "bg-blue-500/10"
                  )}
                  onClick={() => handleNotificationClick(notification.id, notification.type)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        !notification.lu && "font-semibold"
                      )}>
                        {notification.titre}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                    {!notification.lu && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link href="/notifications">
              <Button variant="ghost" className="w-full text-xs">
                Voir toutes les notifications
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
