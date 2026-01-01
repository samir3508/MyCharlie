'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DevisStatusChartProps {
  data?: Array<{ name: string; value: number; color: string }>
}

export function DevisStatusChart({ data = [] }: DevisStatusChartProps) {
  // Données de démonstration si aucune donnée réelle
  const demoData = [
    { name: 'Acceptés', value: 8, color: '#27AE60' },
    { name: 'En attente', value: 5, color: '#3498DB' },
    { name: 'Refusés', value: 2, color: '#E74C3C' },
    { name: 'Brouillons', value: 3, color: '#9CA3AF' },
  ]
  
  // Filtrer les données avec valeur > 0 pour n'afficher que les statuts présents
  const chartData = data.length > 0 
    ? data.filter(item => item.value > 0)
    : demoData
  
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

  // Calculer le total pour les pourcentages
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
        <div className="h-[300px] w-full">
          <ResponsiveContainer width={400} height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))', marginBottom: '4px' }}
                itemStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: '600' }}
                formatter={(value: number) => {
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                  return [`${value} (${percentage}%)`, 'Devis']
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
