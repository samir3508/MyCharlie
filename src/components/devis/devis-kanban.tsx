'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Euro,
  ArrowRight,
  Eye,
  Pencil,
  Download,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, getStatusLabel, getStatusColor, formatCurrency, getInitials } from '@/lib/utils'
import Link from 'next/link'

export type DevisKanbanItem = {
  id: string
  numero: string
  titre: string | null
  statut: string | null
  montant_ttc: number | null
  date_creation: string | null
  client_name?: string
  dossier_numero?: string
}

interface KanbanColumn {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  statuts: string[]
}

const columns: KanbanColumn[] = [
  {
    id: 'brouillon',
    title: 'Brouillon',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/30',
    statuts: ['brouillon'],
  },
  {
    id: 'preparation',
    title: 'En préparation',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    statuts: ['en_preparation', 'pret'],
  },
  {
    id: 'envoye',
    title: 'Envoyé',
    icon: <Send className="w-4 h-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    statuts: ['envoye'],
  },
  {
    id: 'accepte',
    title: 'Accepté',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    statuts: ['accepte', 'paye'],
  },
  {
    id: 'refuse',
    title: 'Refusé / Perdu',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    statuts: ['refuse', 'expire'],
  },
]

interface DevisKanbanProps {
  devis: DevisKanbanItem[]
  onUpdateStatut?: (devisId: string, newStatut: string) => void
}

export function DevisKanban({ devis, onUpdateStatut }: DevisKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const getDevisForColumn = (column: KanbanColumn) => {
    return devis.filter(d => column.statuts.includes(d.statut || 'brouillon'))
  }

  const getColumnTotal = (column: KanbanColumn) => {
    return getDevisForColumn(column).reduce((acc, d) => acc + (d.montant_ttc || 0), 0)
  }

  const handleDragStart = (e: React.DragEvent, devisId: string) => {
    setDraggedItem(devisId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault()
    if (draggedItem && onUpdateStatut) {
      onUpdateStatut(draggedItem, column.statuts[0])
    }
    setDraggedItem(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((column) => {
        const columnDevis = getDevisForColumn(column)
        const columnTotal = getColumnTotal(column)

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className={cn('rounded-t-xl p-4 border-t border-l border-r', column.bgColor)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={column.color}>{column.icon}</span>
                  <h3 className={cn('font-semibold', column.color)}>{column.title}</h3>
                  <Badge variant="secondary" className="bg-white/10 text-white border-0">
                    {columnDevis.length}
                  </Badge>
                </div>
              </div>
              {columnTotal > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  {formatCurrency(columnTotal)}
                </p>
              )}
            </div>

            <div
              className={cn(
                'min-h-[400px] rounded-b-xl border-b border-l border-r p-2 space-y-3',
                'bg-card/50 border-border/50'
              )}
            >
              {columnDevis.map((d, index) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  draggable={!!onUpdateStatut}
                  onDragStart={(e) => onUpdateStatut && handleDragStart(e as unknown as React.DragEvent, d.id)}
                  className={cn(
                    onUpdateStatut && 'cursor-grab active:cursor-grabbing',
                    draggedItem === d.id && 'opacity-50'
                  )}
                >
                  <Card className="bg-card hover:bg-card/80 border-border/50 hover:border-orange-500/30 transition-all duration-200 group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-2 ring-orange-500/20">
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-semibold">
                              {d.client_name ? getInitials(d.client_name) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{d.client_name || 'Client inconnu'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{d.numero}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/devis/${d.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/devis/${d.id}/edit`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/api/pdf/devis/${d.id}`} target="_blank">
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="text-sm font-medium line-clamp-2">{d.titre || 'Sans titre'}</p>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getStatusColor(d.statut || 'brouillon'))}>
                          {getStatusLabel(d.statut || 'brouillon')}
                        </Badge>
                        {d.dossier_numero && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/5">
                            {d.dossier_numero}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-sm font-semibold text-orange-400">
                          {formatCurrency(d.montant_ttc)}
                        </span>
                        <Link href={`/devis/${d.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs group-hover:text-orange-400">
                            Ouvrir <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {columnDevis.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <span className={cn('text-2xl mb-2', column.color)}>{column.icon}</span>
                  <p className="text-sm">Aucun devis</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
