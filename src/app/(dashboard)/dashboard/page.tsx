'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { DevisStatusChart } from '@/components/dashboard/devis-status-chart'
import { RecentDevisTable } from '@/components/dashboard/recent-devis-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null

      // Devis en cours
      const { count: devisEnCours } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('statut', ['brouillon', 'envoye'])

      // CA ce mois : somme des montants TTC des factures payées ce mois-ci uniquement
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)
      endOfMonth.setHours(23, 59, 59, 999)

      // Récupérer uniquement les factures payées (statut = 'payee')
      const { data: facturesPaidAll } = await supabase
        .from('factures')
        .select('montant_ttc, date_paiement, updated_at')
        .eq('tenant_id', tenant.id)
        .eq('statut', 'payee') // Seulement les factures payées

      // Filtrer pour ne garder que celles payées ce mois-ci (basé sur date_paiement ou updated_at si date_paiement est null)
      const facturesPaid = facturesPaidAll?.filter((f: any) => {
        const datePaiement = f.date_paiement || f.updated_at
        if (!datePaiement) return false
        const paiementDate = new Date(datePaiement)
        return paiementDate >= startOfMonth && paiementDate <= endOfMonth
      }) || []

      // Calculer la somme des montants TTC des factures payées ce mois
      const caMois = facturesPaid.reduce((sum: number, f: { montant_ttc: number | null }) => sum + Number(f.montant_ttc || 0), 0)

      // Factures impayées
      const { count: facturesImpayees } = await supabase
        .from('factures')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('statut', ['envoyee', 'en_retard'])

      // Taux de conversion
      const { count: devisEnvoyes } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('statut', ['envoye', 'accepte', 'refuse'])

      const { count: devisAcceptes } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('statut', 'accepte')

      const tauxConversion = devisEnvoyes && devisEnvoyes > 0
        ? Math.round((devisAcceptes || 0) / devisEnvoyes * 100)
        : 0

      // Clients actifs
      const { count: clientsActifs } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      // Devis ce mois
      const { count: devisMois } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('date_creation', startOfMonth.toISOString().split('T')[0])

      // CA total (toutes les factures payées)
      const caTotal = facturesPaidAll?.reduce((sum: number, f: { montant_ttc: number | null }) => sum + Number(f.montant_ttc || 0), 0) || 0

      // Factures payées ce mois (count) - on réutilise facturesPaid avec le même filtre de date
      const facturesPayeesMois = facturesPaid.length || 0

      // Calculer les variations pour les tendances
      const lastMonthStart = new Date(startOfMonth)
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
      const lastMonthEnd = new Date(startOfMonth)
      lastMonthEnd.setDate(0)
      lastMonthEnd.setHours(23, 59, 59, 999)

      // Pour le CA du mois dernier, on utilise aussi la même logique (factures payées le mois dernier uniquement)
      const facturesPaidLastMonth = facturesPaidAll?.filter((f: any) => {
        const datePaiement = f.date_paiement || f.updated_at
        if (!datePaiement) return false
        const paiementDate = new Date(datePaiement)
        return paiementDate >= lastMonthStart && paiementDate <= lastMonthEnd
      }) || []

      const caLastMonth = facturesPaidLastMonth.reduce((sum: number, f: { montant_ttc: number | null }) => sum + Number(f.montant_ttc || 0), 0)
      const caVariation = caLastMonth > 0 ? Math.round(((caMois - caLastMonth) / caLastMonth) * 100) : 0

      const { count: devisMoisLast } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('date_creation', lastMonthStart.toISOString().split('T')[0])
        .lt('date_creation', startOfMonth.toISOString().split('T')[0])

      const devisMoisVariation = devisMoisLast ? (devisMois || 0) - devisMoisLast : 0

      return {
        devisEnCours: devisEnCours || 0,
        caMois,
        facturesImpayees: facturesImpayees || 0,
        tauxConversion,
        clientsActifs: clientsActifs || 0,
        devisMois: devisMois || 0,
        caTotal,
        facturesPayeesMois: facturesPayeesMois || 0,
        devisAcceptes: devisAcceptes || 0,
        caVariation,
        devisMoisVariation,
      }
    },
    enabled: !!tenant?.id,
  })

  const { data: recentDevis, isLoading: devisLoading } = useQuery({
    queryKey: ['recent-devis', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []

      const { data } = await supabase
        .from('devis')
        .select(`
          *,
          clients (nom_complet)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5)

      return data?.map((d: any) => ({
        ...d,
        client_name: d.clients?.nom_complet || 'Client inconnu'
      })) || []
    },
    enabled: !!tenant?.id,
  })

  // Récupérer les revenus mensuels de l'année courante
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-monthly', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []

      const now = new Date()
      const yearStart = new Date(now.getFullYear(), 0, 1)
      yearStart.setHours(0, 0, 0, 0)

      // Récupérer toutes les factures payées de l'année
      const { data: factures } = await supabase
        .from('factures')
        .select('montant_ttc, date_paiement, updated_at')
        .eq('tenant_id', tenant.id)
        .eq('statut', 'payee')

      if (!factures) return []

      // Grouper par mois
      const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      const monthlyRevenue = new Array(12).fill(0)

      factures.forEach((f: any) => {
        const datePaiement = f.date_paiement || f.updated_at
        if (!datePaiement) return

        const date = new Date(datePaiement)
        const month = date.getMonth()
        
        if (date.getFullYear() === now.getFullYear() && month >= 0 && month < 12) {
          monthlyRevenue[month] += Number(f.montant_ttc || 0)
        }
      })

      return monthLabels.map((month, index) => ({
        month,
        revenue: monthlyRevenue[index]
      }))
    },
    enabled: !!tenant?.id,
  })

  // Récupérer la répartition des devis par statut pour le trimestre actuel
  const { data: devisStatusData, isLoading: devisStatusLoading } = useQuery({
    queryKey: ['devis-status-quarter', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []

      const now = new Date()
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
      quarterStart.setHours(0, 0, 0, 0)
      const quarterEnd = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0)
      quarterEnd.setHours(23, 59, 59, 999)

      // Récupérer tous les devis du trimestre
      const { data: devis } = await supabase
        .from('devis')
        .select('statut')
        .eq('tenant_id', tenant.id)
        .gte('date_creation', quarterStart.toISOString().split('T')[0])
        .lte('date_creation', quarterEnd.toISOString().split('T')[0])

      if (!devis) return []

      // Compter par statut
      const statusCounts: Record<string, number> = {
        accepte: 0,
        envoye: 0,
        refuse: 0,
        expire: 0,
        brouillon: 0,
      }

      devis.forEach((d: any) => {
        const statut = d.statut || 'brouillon'
        if (statusCounts.hasOwnProperty(statut)) {
          statusCounts[statut]++
        }
      })

      const statusColors: Record<string, string> = {
        accepte: '#27AE60',
        envoye: '#3498DB',
        refuse: '#E74C3C',
        expire: '#F39C12',
        brouillon: '#9CA3AF',
      }

      const statusLabels: Record<string, string> = {
        accepte: 'Acceptés',
        envoye: 'En attente',
        refuse: 'Refusés',
        expire: 'Expirés',
        brouillon: 'Brouillons',
      }

      return Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([statut, value]) => ({
          name: statusLabels[statut] || statut,
          value,
          color: statusColors[statut] || '#9CA3AF',
        }))
    },
    enabled: !!tenant?.id,
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Tableau de bord
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue, voici un aperçu de votre activité
        </p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {revenueLoading ? (
          <Card className="col-span-1 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </Card>
        ) : (
          <RevenueChart data={revenueData || []} />
        )}
        {devisStatusLoading ? (
          <Card className="col-span-1 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </Card>
        ) : (
          <DevisStatusChart data={devisStatusData || []} />
        )}
      </div>

      {/* Recent Devis */}
      {devisLoading ? (
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : (
        <RecentDevisTable devis={recentDevis || []} />
      )}
    </div>
  )
}


