'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number }>
}

export function RevenueChartSimple({ data = [] }: RevenueChartProps) {
  // Données de démonstration si aucune donnée réelle
  const demoData = [
    { month: 'Jan', revenue: 4500 },
    { month: 'Fév', revenue: 5200 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Avr', revenue: 6100 },
    { month: 'Mai', revenue: 5500 },
    { month: 'Jun', revenue: 7200 },
    { month: 'Jul', revenue: 6800 },
    { month: 'Aoû', revenue: 5900 },
    { month: 'Sep', revenue: 6300 },
    { month: 'Oct', revenue: 7100 },
    { month: 'Nov', revenue: 6500 },
    { month: 'Déc', revenue: 8000 },
  ]

  const chartData = data.length > 0 ? data : demoData

  return (
    <Card className="col-span-1 overflow-hidden border border-[#FF4D00]/15 bg-[#0B0B0C]/70 shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,77,0,0.10),0_0_40px_rgba(255,77,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-[#0B0B0C]/55 transition-all hover:-translate-y-0.5 hover:border-[#FF4D00]/25 hover:shadow-[0_26px_90px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,77,0,0.14),0_0_55px_rgba(255,77,0,0.09)]">
      <CardHeader className="px-6 py-4 border-b border-white/5">
        <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Évolution du CA
        </CardTitle>
        <CardDescription className="text-sm">
          Revenus mensuels sur l'année
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-b from-transparent via-transparent to-[#FF4D00]/5">
        <div className="h-[300px] w-full flex items-center justify-center">
          {/* Version simple avec barres CSS */}
          <div className="w-full h-full flex items-end justify-between gap-2 px-2">
            {chartData.map((item, index) => {
              const maxRevenue = Math.max(...chartData.map(d => d.revenue))
              const height = (item.revenue / maxRevenue) * 100
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm transition-all hover:opacity-80"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-gray-400 mt-1 text-center">
                    {item.month.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Total annuel: {chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('fr-FR')} €
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
