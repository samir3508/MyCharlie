'use client'

import { useState, useEffect, useMemo } from 'react'
import * as React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useClients, useCreateClient, useDeleteClient } from '@/lib/hooks/use-clients'
import { useDevis } from '@/lib/hooks/use-devis'
import { useFactures } from '@/lib/hooks/use-factures'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientForm } from '@/components/clients/client-form'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2, 
  Mail, 
  Phone,
  Users
} from 'lucide-react'
import { formatCurrency, formatDate, getInitials, formatPhone } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { CLIENT_COLUMNS } from '@/lib/utils/export'
import { ImportWizard } from '@/components/import-export/import-wizard'

export default function ClientsPage() {
  const { tenant } = useAuth()
  const { data: clients, isLoading } = useClients(tenant?.id)
  const { data: devis } = useDevis(tenant?.id)
  const { data: factures } = useFactures(tenant?.id)
  const createClient = useCreateClient()
  const deleteClient = useDeleteClient()
  
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculer les stats pour chaque client à partir des devis et factures
  const clientStats = React.useMemo(() => {
    const stats: Record<string, { nb_devis: number; nb_factures: number; ca_total: number }> = {}
    
    if (!clients) return stats

    for (const client of clients) {
      const clientDevis = devis?.filter(d => d.client_id === client.id) || []
      const clientFactures = factures?.filter(f => f.client_id === client.id) || []
      // CA Total = seulement les factures payées
      const caTotal = clientFactures
        .filter(f => f.statut === 'payee')
        .reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

      stats[client.id] = {
        nb_devis: clientDevis.length,
        nb_factures: clientFactures.length,
        ca_total: caTotal,
      }
    }

    return stats
  }, [clients, devis, factures])

  const filteredClients = clients?.filter(client => 
    client.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.telephone?.includes(search)
  ) || []

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const handleCreateClient = async (data: {
    prenom: string
    nom: string
    type: 'particulier' | 'professionnel'
    email?: string
    telephone?: string
    adresse_facturation?: string
    adresse_chantier?: string
    notes?: string
  }) => {
    if (!tenant?.id) return

    try {
      await createClient.mutateAsync({
        ...data,
        tenant_id: tenant.id,
      })
      toast.success('Client créé avec succès')
      setIsCreateOpen(false)
    } catch (error) {
      toast.error('Erreur lors de la création du client')
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return

    try {
      await deleteClient.mutateAsync(clientId)
      toast.success('Client supprimé')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  // État pour l'import
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Données préparées pour l'export
  const exportData = useMemo(() => {
    if (!clients) return []
    return clients.map(client => ({
      nom_complet: client.nom_complet || '',
      email: client.email || '',
      telephone: client.telephone || '',
      type: client.type || '',
      adresse_facturation: client.adresse_facturation || '',
      adresse_chantier: client.adresse_chantier || '',
      created_at: client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '',
    }))
  }, [clients])

  // Gestion de l'import
  const handleImport = async (data: Record<string, unknown>[]) => {
    if (!tenant?.id) return
    
    for (const item of data) {
      const nomComplet = String(item.nom_complet || '')
      // Séparer nom_complet en nom et prenom
      const parts = nomComplet.trim().split(/\s+/)
      const prenom = parts[0] || ''
      const nom = parts.slice(1).join(' ') || parts[0] || ''
      
      await createClient.mutateAsync({
        tenant_id: tenant.id,
        nom: nom,
        prenom: prenom,
        email: String(item.email || '') || null,
        telephone: String(item.telephone || '') || null,
        type: (item.type as 'particulier' | 'professionnel') || 'particulier',
        adresse_facturation: String(item.adresse_facturation || '') || null,
        adresse_chantier: String(item.adresse_chantier || '') || null,
      })
    }
    toast.success(`${data.length} client(s) importé(s) avec succès`)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre base de clients
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportDropdown 
            data={exportData}
            columns={CLIENT_COLUMNS}
            filename="clients"
            title="Export Clients"
            showImport={true}
            onImport={() => setIsImportOpen(true)}
            label="Import/Export"
          />
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-btp hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau client
              </Button>
            </DialogTrigger>
          {mounted && (
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>
                  Ajouter un client
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations du nouveau client
                </DialogDescription>
              </DialogHeader>
              <ClientForm 
                onSubmit={handleCreateClient} 
                isLoading={createClient.isPending}
              />
            </DialogContent>
          )}
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total clients
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Particuliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients?.filter(c => c.type === 'particulier').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Professionnels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients?.filter(c => c.type === 'professionnel').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Devis</TableHead>
                <TableHead>Factures</TableHead>
                <TableHead>CA Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {search ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(client.nom_complet)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.nom_complet}</p>
                          <p className="text-xs text-muted-foreground">
                            Depuis {formatDate(client.created_at)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            {client.email}
                          </div>
                        )}
                        {client.telephone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {formatPhone(client.telephone)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.type === 'particulier' ? 'secondary' : 'default'}>
                        {client.type === 'particulier' ? 'Particulier' : 'Pro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{clientStats[client.id]?.nb_devis ?? client.nb_devis ?? 0}</TableCell>
                    <TableCell className="font-medium">{clientStats[client.id]?.nb_factures ?? client.nb_factures ?? 0}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(clientStats[client.id]?.ca_total ?? client.ca_total ?? 0)}
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
                            <Link href={`/clients/${client.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}/edit`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClient(client.id)}
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

      {/* Import Wizard */}
      <ImportWizard
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        dataType="clients"
        onImport={handleImport}
        requiredFields={[
          { field: 'nom_complet', label: 'Nom complet' }
        ]}
        optionalFields={[
          { field: 'email', label: 'Email' },
          { field: 'telephone', label: 'Téléphone' },
          { field: 'type', label: 'Type (particulier/professionnel)' },
          { field: 'adresse_facturation', label: 'Adresse facturation' },
          { field: 'adresse_chantier', label: 'Adresse chantier' },
          { field: 'siret', label: 'SIRET' }
        ]}
      />
    </div>
  )
}