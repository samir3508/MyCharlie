'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Send, CheckCircle2, XCircle, Euro, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export type DevisTimelineItem = {
  id: string
  numero: string
  titre: string | null
  statut: string | null
  montant_ttc: number | null
  date_creation: string | null
  date_envoi: string | null
  date_acceptation: string | null
  client_name?: string
}

type TimelineEvent = {
  type: 'creation' | 'envoi' | 'acceptation' | 'refus'
  label: string
  date: Date
  devis: DevisTimelineItem
  icon: React.ReactNode
  color: string
}

function buildTimelineEvents(devis: DevisTimelineItem[]): TimelineEvent[] {
  const events: TimelineEvent[] = []

  devis.forEach((d) => {
    if (d.date_creation) {
      events.push({
        type: 'creation',
        label: 'Devis créé',
        date: new Date(d.date_creation),
        devis: d,
        icon: <FileText className="w-4 h-4" />,
        color: 'text-gray-400',
      })
    }
    if (d.date_envoi) {
      events.push({
        type: 'envoi',
        label: 'Devis envoyé',
        date: new Date(d.date_envoi),
        devis: d,
        icon: <Send className="w-4 h-4" />,
        color: 'text-blue-400',
      })
    }
    if (d.date_acceptation) {
      events.push({
        type: 'acceptation',
        label: 'Devis accepté',
        date: new Date(d.date_acceptation),
        devis: d,
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: 'text-green-400',
      })
    }
    if (d.statut === 'refuse' || d.statut === 'expire') {
      const dateRef = d.date_acceptation || d.date_envoi || d.date_creation
      if (dateRef) {
        events.push({
          type: 'refus',
          label: d.statut === 'expire' ? 'Devis expiré' : 'Devis refusé',
          date: new Date(dateRef),
          devis: d,
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-400',
        })
      }
    }
  })

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

interface DevisTimelineProps {
  devis: DevisTimelineItem[]
  maxItems?: number
}

export function DevisTimeline({ devis, maxItems = 50 }: DevisTimelineProps) {
  const events = useMemo(() => buildTimelineEvents(devis).slice(0, maxItems), [devis, maxItems])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-0">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Aucun événement</p>
              </div>
            ) : (
              events.map((evt, index) => (
                <motion.div
                  key={`${evt.devis.id}-${evt.type}-${evt.date.getTime()}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative flex gap-4 pl-10 pb-6 last:pb-0"
                >
                  <div
                    className={cn(
                      'absolute left-0 w-10 h-10 rounded-full border-2 border-orange-500/30 flex items-center justify-center bg-card',
                      evt.color
                    )}
                  >
                    {evt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{evt.label}</span>
                      <Badge variant="outline" className={cn('text-xs', getStatusColor(evt.devis.statut || 'brouillon'))}>
                        {evt.devis.numero}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {evt.devis.client_name || 'Client inconnu'}
                      {evt.devis.montant_ttc != null && evt.devis.montant_ttc > 0 && (
                        <span className="ml-2 font-semibold text-orange-400">{formatCurrency(evt.devis.montant_ttc)}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(evt.date)}</p>
                    <Link href={`/devis/${evt.devis.id}`}>
                      <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs text-orange-400 hover:text-orange-300">
                        Voir le devis <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
