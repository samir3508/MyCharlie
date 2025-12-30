'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, FileText, Receipt, Users, Euro, CheckCircle, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    devisEnCours: number
    caMois: number
    facturesImpayees: number
    tauxConversion: number
    clientsActifs: number
    devisMois: number
    caTotal: number
    facturesPayeesMois: number
    devisAcceptes: number
    caVariation: number
    devisMoisVariation: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Devis en cours',
      value: stats.devisEnCours,
      change: stats.devisMoisVariation > 0 ? `+${stats.devisMoisVariation} ce mois` : stats.devisMoisVariation < 0 ? `${stats.devisMoisVariation} ce mois` : 'Stable',
      changeType: stats.devisMoisVariation >= 0 ? 'positive' as const : 'negative' as const,
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'CA ce mois',
      value: formatCurrency(stats.caMois),
      change: stats.caVariation !== 0 ? `${stats.caVariation > 0 ? '+' : ''}${stats.caVariation}% vs mois dernier` : 'Stable',
      changeType: stats.caVariation >= 0 ? 'positive' as const : 'negative' as const,
      icon: Euro,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Factures impayées',
      value: stats.facturesImpayees,
      change: 'À suivre',
      changeType: 'negative' as const,
      icon: Receipt,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Taux de conversion',
      value: `${stats.tauxConversion}%`,
      change: 'Ce trimestre',
      changeType: 'positive' as const,
      icon: TrendingUp,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Clients actifs',
      value: stats.clientsActifs,
      change: 'Total',
      changeType: 'positive' as const,
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Devis ce mois',
      value: stats.devisMois,
      change: stats.devisMoisVariation > 0 ? `+${stats.devisMoisVariation} vs mois dernier` : stats.devisMoisVariation < 0 ? `${stats.devisMoisVariation} vs mois dernier` : 'Stable',
      changeType: stats.devisMoisVariation >= 0 ? 'positive' as const : 'negative' as const,
      icon: Calendar,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Devis acceptés',
      value: stats.devisAcceptes,
      change: 'Total',
      changeType: 'positive' as const,
      icon: CheckCircle,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Factures payées ce mois',
      value: stats.facturesPayeesMois,
      change: 'Ce mois',
      changeType: 'positive' as const,
      icon: DollarSign,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-[#0B0B0C]/70 backdrop-blur supports-[backdrop-filter]:bg-[#0B0B0C]/55 border border-[#FF4D00]/10 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,77,0,0.08)] hover:shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,77,0,0.12),0_0_40px_rgba(255,77,0,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#FF4D00]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg border border-border/50 ${card.iconBg}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {card.changeType === 'positive' ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-500" />
              )}
              <span className={card.changeType === 'positive' ? 'text-emerald-500' : 'text-rose-500'}>
                {card.change}
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}





















