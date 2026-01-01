'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DevisStatusChartProps {
  data?: Array<{ name: string; value: number; color: string }>
}

export function DevisStatusChartSimple({ data = [] }: DevisStatusChartProps) {
  // Données de démonstration si aucune donnée réelle
  const demoData = [
    { name: 'Acceptés', value: 8, color: '#27AE60' },
    { name: 'En attente', value: 5, color: '#3498DB' },
    { name: 'Refusés', value: 2, color: '#E74C3C' },
    { name: 'Brouillons', value: 3, color: '#9CA3AF' },
  ]
  
  const chartData = data.length > 0 ? data.filter(item => item.value > 0) : demoData
  
  // Si pas de données, afficher un message
  if (chartData.length === 0) {
    return (
      <Card className="col-span-1 overflow-hidden border border-[#FF4D00]/15 bg-[#0B0B0C]/70 shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,77,0,0.10),0_0_40px_rgba(255,77,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-[#0B0B0C]/55 transition-all hover:-translate-y-0.5 hover:border-[#FF4D00]/25 hover:shadow-[0_26px_90px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,77,0,0.14),0_0_55px_rgba(255,77,0,0.09)]">
        <CardHeader className="px-6 py-4 border-b border-white/5">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Statut des devis
          </CardTitle>
          <CardDescription className="text-sm">
            Répartition par statut ce trimestre
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-transparent via-transparent to-[#FF4D00]/5 flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Aucun devis ce trimestre</p>
        </CardContent>
      </Card>
    )
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="col-span-1 overflow-hidden border border-[#FF4D00]/15 bg-[#0B0B0C]/70 shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,77,0,0.10),0_0_40px_rgba(255,77,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-[#0B0B0C]/55 transition-all hover:-translate-y-0.5 hover:border-[#FF4D00]/25 hover:shadow-[0_26px_90px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,77,0,0.14),0_0_55px_rgba(255,77,0,0.09)]">
      <CardHeader className="px-6 py-4 border-b border-white/5">
        <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Statut des devis
        </CardTitle>
        <CardDescription className="text-sm">
          Répartition par statut ce trimestre
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-b from-transparent via-transparent to-[#FF4D00]/5">
        <div className="h-[300px] w-full flex items-center justify-center">
          {/* Version simple avec barres horizontales */}
          <div className="w-full space-y-3">
            {chartData.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-300 text-right">
                    {item.name}
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {item.value} ({Math.round(percentage)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Total: {total} devis ce trimestre
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
