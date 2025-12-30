'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number }>
}

export function RevenueChart({ data = [] }: RevenueChartProps) {
  const chartData = data.length > 0 
    ? data 
    : [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
        'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
      ].map((month) => ({ month, revenue: 0 }))

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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#FF4D00" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.35}
              />
              <XAxis 
                dataKey="month" 
                stroke="#FFFFFF"
                fontSize={12}
                tickLine={false}
                tick={{ fill: '#FFFFFF', opacity: 0.85 }}
                axisLine={{ stroke: '#FFFFFF', strokeOpacity: 0.22 }}
              />
              <YAxis 
                stroke="#FFFFFF"
                fontSize={12}
                tickLine={false}
                tick={{ fill: '#FFFFFF', opacity: 0.85 }}
                axisLine={{ stroke: '#FFFFFF', strokeOpacity: 0.22 }}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}k`
                  }
                  return value.toString()
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))', marginBottom: '4px' }}
                itemStyle={{ color: '#FF4D00', fontWeight: '600' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FF4D00"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
