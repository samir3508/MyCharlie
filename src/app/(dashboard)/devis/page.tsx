'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useDevis, useDeleteDevis, useUpdateDevisStatus } from '@/lib/hooks/use-devis'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  Check,
  X,
  FileText,
  Copy,
  Download,
  LayoutGrid,
  List,
  GitBranch,
  Bot,
  Euro,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { DEVIS_COLUMNS } from '@/lib/utils/export'
import { DevisKanban } from '@/components/devis/devis-kanban'
import { DevisTimeline } from '@/components/devis/devis-timeline'

type ViewMode = 'table' | 'kanban' | 'timeline'
type FilterStatus = 'all' | 'brouillon' | 'en_preparation' | 'pret' | 'envoye' | 'accepte' | 'refuse' | 'expire'

const FILTERS: { key: FilterStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Tous', icon: <FileText className="w-4 h-4" /> },
  { key: 'brouillon', label: 'Brouillons', icon: <FileText className="w-4 h-4" /> },
  { key: 'en_preparation', label: 'En prépa', icon: <FileText className="w-4 h-4" /> },
  { key: 'envoye', label: 'Envoyés', icon: <Send className="w-4 h-4" /> },
  { key: 'accepte', label: 'Acceptés', icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: 'refuse', label: 'Refusés', icon: <X className="w-4 h-4" /> },
  { key: 'expire', label: 'Expirés', icon: <AlertCircle className="w-4 h-4" /> },
]

export default function DevisPage() {
  const { tenant, user } = useAuth()
  const { data: devis, isLoading } = useDevis(tenant?.id)
  const deleteDevis = useDeleteDevis()
  const updateStatus = useUpdateDevisStatus()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user && tenant) {
      console.log('🔍 [Devis Page]', { user: user?.email, tenant: tenant?.company_name, count: devis?.length })
    }
  }, [user, tenant, devis])

  const filteredDevis = useMemo(() => {
    let list = devis ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.numero.toLowerCase().includes(q) ||
          d.client_name?.toLowerCase().includes(q) ||
          d.titre?.toLowerCase().includes(q) ||
          d.dossier_numero?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'en_preparation') {
        list = list.filter((d) => d.statut === 'en_preparation' || d.statut === 'pret')
      } else {
        list = list.filter((d) => d.statut === statusFilter)
      }
    }
    return list
  }, [devis, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredDevis.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDevis = filteredDevis.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const handleDeleteDevis = async (devisId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return
    try {
      await deleteDevis.mutateAsync(devisId)
      toast.success('Devis supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleUpdateStatus = async (devisId: string, statut: 'envoye' | 'accepte' | 'refuse') => {
    try {
      await updateStatus.mutateAsync({ devisId, statut })
      toast.success(`Devis marqué comme ${getStatusLabel(statut).toLowerCase()}`)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleKanbanUpdateStatut = async (devisId: string, newStatut: string) => {
    try {
      await updateStatus.mutateAsync({ devisId, statut: newStatut as any })
      toast.success(`Devis déplacé : ${getStatusLabel(newStatut)}`)
    } catch {
      toast.error('Erreur lors du déplacement')
    }
  }

  const exportData = useMemo(() => {
    return (filteredDevis ?? []).map((d) => ({
      numero: d.numero,
      client_nom: d.client_name || '',
      titre: d.titre || '',
      montant_ht: d.montant_ht,
      montant_ttc: d.montant_ttc,
      statut: getStatusLabel(d.statut || 'brouillon'),
      date_creation: d.date_creation ? formatDate(d.date_creation) : '',
      date_validite: d.date_expiration ? formatDate(d.date_expiration) : '',
    }))
  }, [filteredDevis])

  const stats = useMemo(() => {
    const list = devis ?? []
    return {
      total: list.length,
      brouillon: list.filter((d) => d.statut === 'brouillon').length,
      envoye: list.filter((d) => d.statut === 'envoye').length,
      accepte: list.filter((d) => d.statut === 'accepte' || d.statut === 'paye').length,
      totalAmount: list.reduce((sum, d) => sum + (d.montant_ttc || 0), 0),
    }
  }, [devis])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Devis
              </h1>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                <Bot className="w-3 h-3 mr-1" />
                Léo
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">Créez et gérez vos devis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportDropdown
            data={exportData}
            columns={DEVIS_COLUMNS}
            filename="devis"
            title="Export Devis"
            label="Exporter"
          />
          <Link href="/devis/new">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau devis
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total devis</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.envoye}</p>
              <p className="text-xs text-muted-foreground">Envoyés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.accepte}</p>
              <p className="text-xs text-muted-foreground">Acceptés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Euro className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-muted-foreground">Montant total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, filters, view toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un devis..."
            className="pl-10 bg-background border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={statusFilter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(f.key)}
              className={statusFilter === f.key ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {f.icon}
              <span className="ml-1 hidden sm:inline">{f.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className={viewMode === 'kanban' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className={viewMode === 'timeline' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <GitBranch className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-80 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <DevisKanban
          devis={filteredDevis}
          onUpdateStatut={handleKanbanUpdateStatut}
        />
      ) : viewMode === 'timeline' ? (
        <DevisTimeline devis={filteredDevis} maxItems={80} />
      ) : (
        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      {search || statusFilter !== 'all' ? 'Aucun devis trouvé' : 'Aucun devis pour le moment'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDevis.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium font-mono">{d.numero}</TableCell>
                      <TableCell>{d.client_name || 'Client inconnu'}</TableCell>
                      <TableCell className="text-muted-foreground">{d.dossier_numero || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{d.titre || '-'}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(d.montant_ttc)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.date_creation ? formatDate(d.date_creation) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(d.statut || 'brouillon')}>
                          {getStatusLabel(d.statut || 'brouillon')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/api/pdf/devis/${d.id}`} target="_blank">
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger PDF
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {d.statut === 'brouillon' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(d.id, 'envoye')}>
                                <Send className="w-4 h-4 mr-2" />
                                Marquer envoyé
                              </DropdownMenuItem>
                            )}
                            {d.statut === 'envoye' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(d.id, 'accepte')}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Marquer accepté
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(d.id, 'refuse')}>
                                  <X className="w-4 h-4 mr-2" />
                                  Marquer refusé
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteDevis(d.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
