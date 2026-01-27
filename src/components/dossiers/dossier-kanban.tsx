'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FolderKanban, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Home, 
  FileText, 
  Send, 
  MessageSquare,
  Trophy,
  XCircle,
  MoreHorizontal,
  Clock,
  MapPin,
  Euro,
  ArrowRight,
  Eye
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
import { cn } from '@/lib/utils'
import { getPrioriteColor } from '@/lib/utils/dossiers'
import type { Dossier } from '@/types/database'
import { LABELS_STATUT_DOSSIER, LABELS_PRIORITE } from '@/types/database'
import Link from 'next/link'

type DossierWithClient = Dossier & { 
  clients: { 
    id: string; 
    nom_complet: string; 
    telephone: string | null; 
    email: string | null 
  } | null 
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
    id: 'nouveau',
    title: 'Nouveaux',
    icon: <FolderKanban className="w-4 h-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    statuts: ['contact_recu', 'qualification'],
  },
  {
    id: 'rdv',
    title: 'RDV',
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    statuts: ['rdv_a_planifier', 'rdv_planifie', 'rdv_confirme'],
  },
  {
    id: 'visite',
    title: 'Visite faite',
    icon: <Home className="w-4 h-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    statuts: ['visite_realisee'],
  },
  {
    id: 'devis',
    title: 'Devis',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    statuts: ['devis_en_cours', 'devis_pret', 'devis_envoye', 'en_negociation'],
  },
  {
    id: 'gagne',
    title: 'Gagnés',
    icon: <Trophy className="w-4 h-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    statuts: ['signe'],
  },
  {
    id: 'chantier',
    title: 'Chantiers',
    icon: <Home className="w-4 h-4" />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
    statuts: ['chantier_en_cours', 'chantier_termine'],
  },
  {
    id: 'perdu',
    title: 'Perdus',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    statuts: ['perdu', 'annule'],
  },
]

interface DossierKanbanProps {
  dossiers: DossierWithClient[]
  onUpdateStatut?: (dossierId: string, newStatut: string) => void
}

export function DossierKanban({ dossiers, onUpdateStatut }: DossierKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const getDossiersForColumn = (column: KanbanColumn) => {
    return dossiers.filter(d => column.statuts.includes(d.statut || 'contact_recu'))
  }

  const getColumnTotal = (column: KanbanColumn) => {
    return getDossiersForColumn(column).reduce((acc, d) => acc + (d.montant_estime || 0), 0)
  }

  const handleDragStart = (e: React.DragEvent, dossierId: string) => {
    setDraggedItem(dossierId)
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

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(montant)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((column) => {
        const columnDossiers = getDossiersForColumn(column)
        const columnTotal = getColumnTotal(column)

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
          >
            {/* Column Header */}
            <div className={cn(
              "rounded-t-xl p-4 border-t border-l border-r",
              column.bgColor
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={column.color}>{column.icon}</span>
                  <h3 className={cn("font-semibold", column.color)}>{column.title}</h3>
                  <Badge variant="secondary" className="bg-white/10 text-white border-0">
                    {columnDossiers.length}
                  </Badge>
                </div>
              </div>
              {columnTotal > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  {formatMontant(columnTotal)}
                </p>
              )}
            </div>

            {/* Column Content */}
            <div className={cn(
              "min-h-[500px] rounded-b-xl border-b border-l border-r p-2 space-y-3",
              "bg-card/50 border-border/50"
            )}>
              {columnDossiers.map((dossier, index) => (
                <motion.div
                  key={dossier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  draggable={false}
                  onDragStart={(e) => {
                    e.preventDefault()
                    handleDragStart(e as unknown as React.DragEvent, dossier.id)
                  }}
                  className={cn(
                    "cursor-pointer",
                    draggedItem === dossier.id && "opacity-50"
                  )}
                >
                  <Link href={`/dossiers/${dossier.id}`} className="block">
                    <Card className="bg-card hover:bg-card/80 border-border/50 hover:border-orange-500/30 transition-all duration-200 group cursor-pointer">
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-9 w-9 ring-2 ring-orange-500/20 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-semibold">
                                {dossier.clients?.nom_complet ? getInitials(dossier.clients.nom_complet) : '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm line-clamp-1">
                                {dossier.clients?.nom_complet || 'Client inconnu'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{dossier.numero}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem asChild>
                                <Link href={`/dossiers/${dossier.id}`} onClick={(e) => e.stopPropagation()}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir le dossier
                                </Link>
                              </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="w-4 h-4 mr-2" />
                              Appeler
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              Planifier RDV
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                        {/* Titre du dossier */}
                        <p className="text-sm font-medium line-clamp-2">{dossier.titre}</p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {dossier.priorite && dossier.priorite !== 'normale' && (
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getPrioriteColor(dossier.priorite))}>
                            {dossier.priorite === 'urgente' ? '🔥' : dossier.priorite === 'haute' ? '⚡' : ''}
                            {dossier.priorite.charAt(0).toUpperCase() + dossier.priorite.slice(1)}
                          </Badge>
                        )}
                        {dossier.source && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/5">
                            {dossier.source === 'whatsapp' ? '💬' : dossier.source === 'instagram' ? '📸' : '📞'}
                          </Badge>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        {dossier.adresse_chantier && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="line-clamp-1">{dossier.adresse_chantier}</span>
                          </div>
                        )}
                        {dossier.date_contact && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(dossier.date_contact).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>

                        {/* Footer */}
                        {dossier.montant_estime && dossier.montant_estime > 0 && (
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                            <span className="text-sm font-semibold text-orange-400">
                              {formatMontant(dossier.montant_estime)}
                            </span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs group-hover:text-orange-400" onClick={(e) => e.stopPropagation()}>
                              Voir <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}

              {columnDossiers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <span className={cn("text-2xl mb-2", column.color)}>{column.icon}</span>
                  <p className="text-sm">Aucun dossier</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
