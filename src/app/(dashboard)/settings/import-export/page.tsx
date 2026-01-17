'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Users,
  FileText,
  Receipt,
  FolderKanban,
  Calendar,
  ArrowRight,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Settings
} from 'lucide-react'
import { ImportWizard, type ImportDataType } from '@/components/import-export/import-wizard'
import { ExportModal, type ExportDataType } from '@/components/import-export/export-modal'
import { useClients, useCreateClient } from '@/lib/hooks/use-clients'
import { useDevis } from '@/lib/hooks/use-devis'
import { useFactures } from '@/lib/hooks/use-factures'
import { useDossiers, useCreateDossier } from '@/lib/hooks/use-dossiers'
import { useRdvList } from '@/lib/hooks/use-rdv'
import { useAuth } from '@/lib/hooks/use-auth'

// ============================================
// TYPES
// ============================================

interface DataTypeConfig {
  id: ImportDataType
  label: string
  icon: React.ReactNode
  description: string
  color: string
  requiredFields: { field: string; label: string }[]
  optionalFields: { field: string; label: string }[]
}

// ============================================
// CONFIG
// ============================================

const dataTypes: DataTypeConfig[] = [
  {
    id: 'clients',
    label: 'Clients',
    icon: <Users className="w-5 h-5" />,
    description: 'Noms, emails, téléphones, adresses',
    color: 'bg-blue-500',
    requiredFields: [
      { field: 'nom_complet', label: 'Nom complet' }
    ],
    optionalFields: [
      { field: 'email', label: 'Email' },
      { field: 'telephone', label: 'Téléphone' },
      { field: 'type', label: 'Type (particulier/professionnel)' },
      { field: 'adresse_facturation', label: 'Adresse facturation' },
      { field: 'adresse_chantier', label: 'Adresse chantier' },
      { field: 'siret', label: 'SIRET' }
    ]
  },
  {
    id: 'devis',
    label: 'Devis',
    icon: <FileText className="w-5 h-5" />,
    description: 'Numéros, montants, dates, statuts',
    color: 'bg-green-500',
    requiredFields: [
      { field: 'numero', label: 'Numéro' },
      { field: 'client_nom', label: 'Nom du client' },
      { field: 'montant_ttc', label: 'Montant TTC' }
    ],
    optionalFields: [
      { field: 'titre', label: 'Titre' },
      { field: 'montant_ht', label: 'Montant HT' },
      { field: 'taux_tva', label: 'Taux TVA' },
      { field: 'statut', label: 'Statut' },
      { field: 'date_creation', label: 'Date création' },
      { field: 'date_validite', label: 'Date validité' }
    ]
  },
  {
    id: 'factures',
    label: 'Factures',
    icon: <Receipt className="w-5 h-5" />,
    description: 'Numéros, montants, échéances',
    color: 'bg-purple-500',
    requiredFields: [
      { field: 'numero', label: 'Numéro' },
      { field: 'client_nom', label: 'Nom du client' },
      { field: 'montant_ttc', label: 'Montant TTC' }
    ],
    optionalFields: [
      { field: 'devis_numero', label: 'N° Devis associé' },
      { field: 'montant_ht', label: 'Montant HT' },
      { field: 'taux_tva', label: 'Taux TVA' },
      { field: 'statut', label: 'Statut' },
      { field: 'date_emission', label: 'Date émission' },
      { field: 'date_echeance', label: 'Date échéance' }
    ]
  },
  {
    id: 'dossiers',
    label: 'Dossiers',
    icon: <FolderKanban className="w-5 h-5" />,
    description: 'Projets, prospects, suivi commercial',
    color: 'bg-orange-500',
    requiredFields: [
      { field: 'titre', label: 'Titre' }
    ],
    optionalFields: [
      { field: 'numero', label: 'Numéro' },
      { field: 'client_nom', label: 'Nom du client' },
      { field: 'description', label: 'Description' },
      { field: 'statut', label: 'Statut' },
      { field: 'priorite', label: 'Priorité' },
      { field: 'montant_estime', label: 'Montant estimé' }
    ]
  },
  {
    id: 'rdv',
    label: 'Rendez-vous',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Agenda, visites, réunions',
    color: 'bg-cyan-500',
    requiredFields: [
      { field: 'titre', label: 'Titre' },
      { field: 'date_heure', label: 'Date et heure' }
    ],
    optionalFields: [
      { field: 'type_rdv', label: 'Type' },
      { field: 'client_nom', label: 'Nom du client' },
      { field: 'dossier_numero', label: 'N° Dossier' },
      { field: 'adresse', label: 'Adresse' },
      { field: 'notes', label: 'Notes' }
    ]
  }
]

// Mock history data (replace with real data from Supabase)
const mockHistory = [
  { id: 1, type: 'import', dataType: 'clients', count: 45, date: '2024-01-10 14:30', status: 'success', user: 'Admin' },
  { id: 2, type: 'export', dataType: 'devis', count: 120, date: '2024-01-09 10:15', status: 'success', user: 'Admin' },
  { id: 3, type: 'import', dataType: 'factures', count: 0, date: '2024-01-08 16:45', status: 'error', user: 'Admin' },
  { id: 4, type: 'export', dataType: 'clients', count: 89, date: '2024-01-07 09:00', status: 'success', user: 'Admin' }
]

// ============================================
// COMPONENT
// ============================================

export default function ImportExportPage() {
  const [mounted, setMounted] = useState(false)
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedDataType, setSelectedDataType] = useState<DataTypeConfig | null>(null)
  const [exportDataType, setExportDataType] = useState<ExportDataType>('clients')

  // Hooks for data
  const { tenant } = useAuth()
  const { data: clients } = useClients(tenant?.id)
  const createClient = useCreateClient()
  const { data: devis } = useDevis(tenant?.id)
  const { data: factures } = useFactures(tenant?.id)
  const { data: dossiers } = useDossiers()
  const createDossier = useCreateDossier()
  const { data: rdvList } = useRdvList()

  // Éviter l'erreur d'hydratation avec Radix UI Tabs
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get data for export
  const getExportData = (type: ExportDataType) => {
    switch (type) {
      case 'clients':
        return clients?.map(c => ({
          ...c,
          created_at: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''
        })) || []
      case 'devis':
        return devis?.map(d => ({
          numero: d.numero,
          client_nom: '',
          titre: d.titre,
          montant_ht: d.montant_ht,
          montant_ttc: d.montant_ttc,
          statut: d.statut,
          date_creation: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '',
          date_validite: d.date_expiration ? new Date(d.date_expiration).toLocaleDateString('fr-FR') : ''
        })) || []
      case 'factures':
        return factures?.map(f => ({
          numero: f.numero,
          client_nom: f.client_name || '',
          montant_ht: f.montant_ht,
          montant_ttc: f.montant_ttc,
          statut: f.statut,
          date_emission: f.date_emission ? new Date(f.date_emission).toLocaleDateString('fr-FR') : '',
          date_echeance: f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : ''
        })) || []
      case 'dossiers':
        return dossiers?.map(d => ({
          numero: d.numero,
          titre: d.titre,
          client_nom: d.clients?.nom_complet || '',
          statut: d.statut,
          priorite: d.priorite,
          montant_estime: d.montant_estime,
          date_creation: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : ''
        })) || []
      case 'rdv':
        return rdvList?.map(r => ({
          titre: r.titre,
          date_heure: r.date_heure ? new Date(r.date_heure).toLocaleString('fr-FR') : '',
          type_rdv: r.type_rdv,
          client_nom: r.clients?.nom_complet || '',
          dossier_numero: r.dossiers?.numero || '',
          adresse: r.adresse || '',
          statut: r.statut
        })) || []
      default:
        return []
    }
  }

  // Handle import
  const handleImport = async (data: Record<string, unknown>[]) => {
    if (!selectedDataType) return

    // Here you would implement the actual import logic
    // For now, we'll just log the data
    console.log(`Importing ${data.length} ${selectedDataType.id}:`, data)

    // Example: Import clients
    if (selectedDataType.id === 'clients' && tenant?.id) {
      for (const item of data) {
        const nomComplet = String(item.nom_complet || '')
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
    }

    // Add similar logic for other data types...
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Import / Export
          </h1>
          <p className="text-muted-foreground">
            Importez et exportez vos données en CSV, Excel ou PDF
          </p>
        </div>
      </div>

      {!mounted ? (
        <div className="space-y-6">
          <div className="flex gap-2 bg-gray-800/50 rounded-lg p-1">
            <div className="flex-1 h-9 bg-gray-700/50 rounded-md animate-pulse" />
            <div className="flex-1 h-9 bg-gray-700/50 rounded-md animate-pulse" />
            <div className="flex-1 h-9 bg-gray-700/50 rounded-md animate-pulse" />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="bg-gray-800/50">
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Importer
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Historique
            </TabsTrigger>
          </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                Importer des données
              </CardTitle>
              <CardDescription>
                Sélectionnez le type de données à importer depuis un fichier CSV ou Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 cursor-pointer transition-all group"
                    onClick={() => {
                      setSelectedDataType(type)
                      setImportWizardOpen(true)
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center text-white`}>
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-orange-500 transition-colors">
                            {type.label}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {type.description}
                          </p>
                          <div className="flex items-center gap-1 mt-3 text-orange-500 text-sm">
                            <span>Importer</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Import tips */}
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="p-6">
              <h4 className="font-medium text-orange-400 mb-3">💡 Conseils pour l'import</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Utilisez la première ligne de votre fichier pour les en-têtes de colonnes</li>
                <li>• Les champs marqués d'un * sont obligatoires</li>
                <li>• Les doublons seront détectés automatiquement</li>
                <li>• Formats supportés : CSV, XLS, XLSX</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-500" />
                Exporter des données
              </CardTitle>
              <CardDescription>
                Téléchargez vos données en CSV, Excel ou PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataTypes.map((type) => {
                  const data = getExportData(type.id)
                  return (
                    <Card 
                      key={type.id}
                      className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 cursor-pointer transition-all group"
                      onClick={() => {
                        setExportDataType(type.id)
                        setExportModalOpen(true)
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center text-white`}>
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg group-hover:text-orange-500 transition-colors">
                              {type.label}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {type.description}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="outline" className="bg-gray-700/50">
                                {data.length} enregistrement(s)
                              </Badge>
                              <div className="flex items-center gap-1 text-orange-500 text-sm">
                                <span>Exporter</span>
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Export all */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Export complet</h3>
                    <p className="text-sm text-gray-400">
                      Exportez toutes vos données en un seul fichier Excel
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    // TODO: Implement full export with multiple sheets
                    alert('Export complet à implémenter')
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Tout exporter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                Historique des opérations
              </CardTitle>
              <CardDescription>
                Consultez l'historique de vos imports et exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Données</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={item.type === 'import' ? 'default' : 'secondary'}>
                          {item.type === 'import' ? (
                            <Upload className="w-3 h-3 mr-1" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
                          {item.type === 'import' ? 'Import' : 'Export'}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{item.dataType}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell className="text-gray-400">{item.date}</TableCell>
                      <TableCell>{item.user}</TableCell>
                      <TableCell>
                        {item.status === 'success' ? (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Réussi
                          </Badge>
                        ) : item.status === 'error' ? (
                          <Badge className="bg-red-500/20 text-red-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Erreur
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            <Clock className="w-3 h-3 mr-1" />
                            En cours
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      {/* Import Wizard Modal */}
      {selectedDataType && (
        <ImportWizard
          open={importWizardOpen}
          onOpenChange={setImportWizardOpen}
          dataType={selectedDataType.id}
          onImport={handleImport}
          requiredFields={selectedDataType.requiredFields}
          optionalFields={selectedDataType.optionalFields}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        dataType={exportDataType}
        data={getExportData(exportDataType)}
      />
    </div>
  )
}
