'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useDevis, useDeleteDevis, useUpdateDevisStatus } from '@/lib/hooks/use-devis'
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
  Check,
  X,
  FileText,
  Copy,
  Download,
  FileDown
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'
import { exportToCSV } from '@/lib/utils/export'

export default function DevisPage() {
  const { tenant } = useAuth()
  const { data: devis, isLoading } = useDevis(tenant?.id)
  const deleteDevis = useDeleteDevis()
  const updateStatus = useUpdateDevisStatus()
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const filteredDevis = devis?.filter(d => {
    const matchesSearch = 
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.titre?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || d.statut === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  // Pagination
  const totalPages = Math.ceil(filteredDevis.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDevis = filteredDevis.slice(startIndex, endIndex)

  // Reset to page 1 when search or filter changes
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

  const handleExportCSV = () => {
    if (!filteredDevis || filteredDevis.length === 0) {
      toast.error('Aucun devis à exporter')
      return
    }

    const exportData = filteredDevis.map(d => ({
      numero: d.numero,
      client: d.client_name || '',
      titre: d.titre || '',
      montant_ht: d.montant_ht,
      montant_tva: d.montant_tva,
      montant_ttc: d.montant_ttc,
      statut: getStatusLabel(d.statut),
      date_creation: formatDate(d.date_creation),
      date_expiration: d.date_expiration ? formatDate(d.date_expiration) : '',
    }))

    exportToCSV(exportData, `devis-${new Date().toISOString().split('T')[0]}`, [
      { key: 'numero', label: 'Numéro' },
      { key: 'client', label: 'Client' },
      { key: 'titre', label: 'Titre' },
      { key: 'montant_ht', label: 'Montant HT' },
      { key: 'montant_tva', label: 'TVA' },
      { key: 'montant_ttc', label: 'Montant TTC' },
      { key: 'statut', label: 'Statut' },
      { key: 'date_creation', label: 'Date de création' },
      { key: 'date_expiration', label: 'Date d\'expiration' },
    ])

    toast.success('Export CSV réussi')
  }

  // Stats
  const stats = {
    total: devis?.length || 0,
    brouillon: devis?.filter(d => d.statut === 'brouillon').length || 0,
    envoye: devis?.filter(d => d.statut === 'envoye').length || 0,
    accepte: devis?.filter(d => d.statut === 'accepte').length || 0,
    totalAmount: devis?.reduce((sum, d) => sum + d.montant_ttc, 0) || 0,
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Devis
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos devis
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-[#262626]"
            onClick={handleExportCSV}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exporter en CSV
          </Button>
          <Link href="/devis/new">
            <Button className="bg-gradient-btp hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau devis
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total devis
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.envoye}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acceptés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepte}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">X</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un devis..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="envoye">Envoyé</SelectItem>
            <SelectItem value="accepte">Accepté</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Devis Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Montant TTC</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
              ) : filteredDevis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {search || statusFilter !== 'all' ? 'Aucun devis trouvé' : 'Aucun devis pour le moment'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDevis.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium font-mono">{d.numero}</TableCell>
                    <TableCell>{d.client_name || 'Client inconnu'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {d.titre || '-'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      X
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(d.date_creation)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(d.statut)}>
                        {getStatusLabel(d.statut)}
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
                          {d.pdf_url && (
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger PDF
                            </DropdownMenuItem>
                          )}
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
          <div className="p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  )
}





















