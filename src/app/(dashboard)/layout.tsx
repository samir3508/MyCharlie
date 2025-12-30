import { DashboardSidebarWrapper } from '@/components/layout/dashboard-sidebar-wrapper'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardSidebarWrapper>{children}</DashboardSidebarWrapper>
}