'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useFactures, useDeleteFacture, useUpdateFactureStatus } from '@/lib/hooks/use-factures'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  CheckCircle,
  Receipt,
  Download,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  Mail,
  Filter,
  FileDown
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, isOverdue } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { FACTURE_COLUMNS } from '@/lib/utils/export'

export default function FacturesPage() {
  const router = useRouter()
  const { tenant } = useAuth()
  const { data: factures, isLoading } = useFactures(tenant?.id)
  const deleteFacture = useDeleteFacture()
  const updateStatus = useUpdateFactureStatus()
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const filteredFactures = factures?.filter(f => {
    const matchesSearch = 
      f.numero.toLowerCase().includes(search.toLowerCase()) ||
      f.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.titre?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || f.statut === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  // Pagination
  const totalPages = Math.ceil(filteredFactures.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFactures = filteredFactures.slice(startIndex, endIndex)

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const handleDeleteFacture = async (factureId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return

    try {
      await deleteFacture.mutateAsync(factureId)
      toast.success('Facture supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleUpdateStatus = async (factureId: string, statut: 'envoyee' | 'payee') => {
    try {
      await updateStatus.mutateAsync({ factureId, statut })
      toast.success(`Facture marquée comme ${getStatusLabel(statut).toLowerCase()}`)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  // Stats
  const stats = {
    total: factures?.length || 0,
    envoyee: factures?.filter(f => f.statut === 'envoyee').length || 0,
    enRetard: factures?.filter(f => f.statut === 'en_retard' || (f.statut === 'envoyee' && f.date_echeance && isOverdue(f.date_echeance))).length || 0,
    payee: factures?.filter(f => f.statut === 'payee').length || 0,
    montantTotal: factures?.reduce((sum, f) => sum + (f.montant_ttc || 0), 0) || 0,
    montantPaye: factures?.filter(f => f.statut === 'payee').reduce((sum, f) => sum + (f.montant_ttc || 0), 0) || 0,
    montantEnAttente: factures?.filter(f => f.statut === 'envoyee' || f.statut === 'en_retard').reduce((sum, f) => sum + (f.montant_ttc || 0), 0) || 0,
  }

  const getStatusVariant = (statut: string) => {
    switch (statut) {
      case 'envoyee':
        return 'secondary';
      case 'payee':
        return 'default';
      case 'en_retard':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'envoyee':
        return 'Envoyée';
      case 'payee':
        return 'Payée';
      case 'en_retard':
        return 'En retard';
      default:
        return statut;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'envoyee':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'payee':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'en_retard':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Données préparées pour l'export
  const exportData = useMemo(() => {
    if (!filteredFactures) return []
    return filteredFactures.map(f => ({
      numero: f.numero,
      client_nom: f.client_name || '',
      montant_ht: f.montant_ht,
      montant_ttc: f.montant_ttc,
      statut: getStatusLabel(f.statut || 'brouillon'),
      date_emission: f.date_emission ? formatDate(f.date_emission) : '',
      date_echeance: f.date_echeance ? formatDate(f.date_echeance) : '',
    }))
  }, [filteredFactures])

  return (
    <div className="space-y-6">
      {/* En-tête de la section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Factures</h1>
        <p className="text-gray-400">Gérez et suivez toutes vos factures</p>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une facture..."
              className="w-full rounded-lg bg-background pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="envoyee">Envoyée</SelectItem>
              <SelectItem value="payee">Payée</SelectItem>
            </SelectContent>
          </Select>
          
          <ExportDropdown 
            data={exportData}
            columns={FACTURE_COLUMNS}
            filename="factures"
            title="Export Factures"
            label="Exporter"
          />
          
          <Link href="/factures/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total factures
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.envoyee}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Payées
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.payee}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              En retard
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enRetard}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Montant total
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.montantTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher une facture..."
            className="w-full rounded-lg bg-background pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="envoyee">Envoyée</SelectItem>
              <SelectItem value="payee">Payée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tableau des factures */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-hidden bg-gradient-card-dark">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1A1A1A] border-b border-gray-800 hover:bg-[#1A1A1A]">
                <TableHead className="text-gray-300 font-semibold">Numéro</TableHead>
                <TableHead className="text-gray-300 font-semibold w-[15%] min-w-[150px]">Client</TableHead>
                <TableHead className="text-gray-300 font-semibold w-[25%] min-w-[200px] max-w-[300px]">Titre</TableHead>
                <TableHead className="text-right text-gray-300 font-semibold w-[15%] min-w-[120px]">Montant TTC</TableHead>
                <TableHead className="text-gray-300 font-semibold w-[15%] min-w-[120px]">Date</TableHead>
                <TableHead className="text-gray-300 font-semibold w-[15%] min-w-[120px]">Statut</TableHead>
                <TableHead className="text-right text-gray-300 font-semibold w-[15%] min-w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredFactures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    {search || statusFilter !== 'all' 
                      ? 'Aucune facture trouvée' 
                      : 'Aucune facture pour le moment'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFactures.map((f) => {
                  const isLate = f.statut === 'envoyee' && f.date_echeance && isOverdue(f.date_echeance)
                  
                  // Déterminer le type de facture
                  let factureType = 'standalone'
                  if (f.numero.endsWith('-A')) factureType = 'acompte'
                  else if (f.numero.endsWith('-I')) factureType = 'intermediaire'
                  else if (f.numero.endsWith('-S')) factureType = 'solde'
                  
                  return (
                    <TableRow key={f.id} className="border-b border-gray-800/50 hover:bg-[#1A1A1A]/50 transition-colors cursor-pointer" onClick={() => router.push(`/factures/${f.id}`)}>
                      <TableCell className="font-medium font-mono min-w-[120px] text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="whitespace-nowrap">{f.numero}</span>
                          {factureType !== 'standalone' && (
                            <Badge variant="outline" className="text-xs capitalize shrink-0 border-gray-700 text-gray-300 bg-gray-800/50">
                              {factureType}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 truncate" title={f.client_name || 'Client inconnu'}>
                        {f.client_name || 'Client inconnu'}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="font-medium text-white truncate" title={f.titre || 'Sans titre'}>
                          {f.titre || 'Sans titre'}
                        </div>
                        {f.description && (
                          <div className="text-sm text-gray-400 mt-1 line-clamp-1" title={f.description}>
                            {f.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-right text-[#FF4D00] whitespace-nowrap">
                        {formatCurrency(f.montant_ttc)}
                      </TableCell>
                      <TableCell className="text-gray-400 whitespace-nowrap">
                        {f.date_emission ? formatDate(f.date_emission) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(isLate ? 'en_retard' : (f.statut || 'brouillon'))} 
                          className={getStatusColor(isLate ? 'en_retard' : (f.statut || 'brouillon'))}
                        >
                          {getStatusLabel(isLate ? 'en_retard' : (f.statut || 'brouillon'))}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/factures/${f.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/api/pdf/facture/${f.id}`, '_blank')}>
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {f.statut !== 'payee' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(f.id, 'payee')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marquer comme payée
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFacture(f.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}
