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
  Building2
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getInitials } from '@/lib/utils'

type SidebarNavItem = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  highlight?: boolean
}

type SidebarNavGroup = {
  title: string
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
    title: 'Documents',
    items: [
      { title: 'Devis', icon: FileText, href: '/devis' },
      { title: 'Factures', icon: Receipt, href: '/factures' },
      { title: 'Relances', icon: Bell, href: '/relances' },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { tenant, user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF4D00] rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
              MY <span className="text-[#FF4D00]">CHARLIE</span>
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Gestion BTP</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  // Only calculate isActive after mount to avoid hydration mismatch
                  const isActive = mounted && (pathname === item.href || pathname.startsWith(`${item.href}/`))
                  const isHighlight = !!item.highlight
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`h-11 gap-3 ${isHighlight && !isActive ? 'bg-primary/5 text-primary hover:bg-primary/10' : ''}`}
                      >
                        <Link href={item.href}>
                          <item.icon className={`w-5 h-5 ${isHighlight ? 'text-primary' : ''}`} />
                          <span className="font-medium">{item.title}</span>
                          {isHighlight && (
                            <span className="ml-auto text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold">
                              NEW
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

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-14 gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={tenant?.logo_url || ''} />
                      <AvatarFallback className="bg-[#FF4D00] text-white font-semibold">
                        {tenant?.company_name ? getInitials(tenant.company_name) : 'ML'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate">
                        {tenant?.company_name || 'Mon entreprise'}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {tenant?.email || user?.email || 'Email non défini'}
                      </p>
                    </div>
                    <ChevronUp className="w-4 h-4 text-sidebar-foreground/60" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Mon entreprise
                    </Link>
                  </DropdownMenuItem>
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
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-sidebar.tsx:171',message:'signOut button clicked',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                      // #endregion
                      try {
                        await signOut()
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-sidebar.tsx:177',message:'signOut completed, redirecting',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        router.push('/login')
                        router.refresh()
                      } catch (err) {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-sidebar.tsx:182',message:'signOut error in button',data:{errorMessage:err instanceof Error ? err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
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
              <SidebarMenuButton className="h-14 gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#FF4D00] text-white font-semibold">
                    ML
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">Mon entreprise</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email || 'Email non défini'}
                  </p>
                </div>
                <ChevronUp className="w-4 h-4 text-sidebar-foreground/60" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
