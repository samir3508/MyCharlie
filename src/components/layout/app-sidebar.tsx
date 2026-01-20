'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  Bell, 
  Settings,
  LogOut,
  ChevronUp,
  Sparkles,
  Building2,
  FolderKanban,
  Calendar,
  ClipboardList,
  Bot,
  ArrowUpDown,
  Mail,
  Plug
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getInitials } from '@/lib/utils'
import { useUnreadNotificationsCount } from '@/lib/hooks/use-notifications'
import { Badge } from '@/components/ui/badge'

type SidebarNavItem = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  highlight?: boolean
  badge?: string
}

type SidebarNavGroup = {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  items: SidebarNavItem[]
}

const menuItems: SidebarNavGroup[] = [
  {
    title: 'Général',
    items: [
      { title: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
      { title: 'Clients', icon: Users, href: '/clients' },
    ],
  },
  {
    title: 'Charlie — Devis & Factures',
    icon: Bot,
    items: [
      { title: 'Devis', icon: FileText, href: '/devis' },
      { title: 'Factures', icon: Receipt, href: '/factures' },
      { title: 'Relances', icon: Bell, href: '/relances' },
    ],
  },
  {
    title: 'Léo — Suivi Commercial',
    icon: Bot,
    items: [
      { title: 'Dossiers', icon: FolderKanban, href: '/dossiers', highlight: true, badge: 'NEW' },
      { title: 'Agenda RDV', icon: Calendar, href: '/rdv', highlight: true, badge: 'NEW' },
      { title: 'Fiches visite', icon: ClipboardList, href: '/fiches-visite', highlight: true, badge: 'NEW' },
    ],
  },
  {
    title: 'Outils',
    items: [
      { title: 'Import / Export', icon: ArrowUpDown, href: '/settings/import-export' },
      { title: 'Intégrations Gmail', icon: Mail, href: '/settings/integrations', highlight: true, badge: 'NEW' },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { title: 'Paramètres', icon: Settings, href: '/settings' },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { tenant, user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const { data: unreadCount = 0 } = useUnreadNotificationsCount()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FF4D00] to-[#E64600] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
              MY <span className="text-[#FF4D00]">CHARLIE</span>
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60">Gestion BTP Intelligente</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 overflow-y-auto">
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-1 flex items-center gap-1.5 px-2">
              {group.icon && <group.icon className="w-3 h-3 text-[#FF4D00]" />}
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = mounted && (pathname === item.href || pathname.startsWith(`${item.href}/`))
                  const isHighlight = !!item.highlight
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`h-9 gap-2 transition-all duration-200 text-sm ${
                          isHighlight && !isActive 
                            ? 'bg-gradient-to-r from-orange-500/10 to-orange-600/5 text-orange-400 hover:from-orange-500/20 hover:to-orange-600/10 border border-orange-500/20' 
                            : ''
                        } ${isActive ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-l-2 border-l-orange-500' : ''}`}
                      >
                        <Link href={item.href}>
                          <item.icon className={`w-4 h-4 ${isHighlight || isActive ? 'text-[#FF4D00]' : ''}`} />
                          <span className="font-medium text-sm">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto text-[9px] bg-gradient-to-r from-orange-500 to-orange-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-12 gap-2 hover:bg-sidebar-accent/50 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                      <AvatarImage src={tenant?.logo_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white font-semibold text-xs">
                        {tenant?.company_name ? getInitials(tenant.company_name) : 'MC'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-medium truncate">
                        {tenant?.company_name || 'Mon entreprise'}
                      </p>
                      <p className="text-[10px] text-sidebar-foreground/60 truncate">
                        {tenant?.email || user?.email || 'Email non défini'}
                      </p>
                    </div>
                    <ChevronUp className="w-3 h-3 text-sidebar-foreground/60 flex-shrink-0" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        await signOut()
                        router.push('/login')
                        router.refresh()
                      } catch (err) {
                        console.error('Erreur déconnexion:', err)
                      }
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton className="h-12 gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white font-semibold text-xs">
                    MC
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-medium truncate">Mon entreprise</p>
                  <p className="text-[10px] text-sidebar-foreground/60 truncate">
                    {user?.email || 'Email non défini'}
                  </p>
                </div>
                <ChevronUp className="w-3 h-3 text-sidebar-foreground/60 flex-shrink-0" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
