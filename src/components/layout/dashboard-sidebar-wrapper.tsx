'use client'

import React from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export function DashboardSidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gradient-to-br from-black via-[#0A0A0A] to-[#1A0A00]">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-800 bg-black/50 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1 text-white hover:bg-[#FF4D00]/20 hover:text-[#FF4D00]" />
        </header>
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-black via-[#0A0A0A] to-[#1A0A00] min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}