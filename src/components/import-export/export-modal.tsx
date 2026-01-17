'use client'

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  File,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2
} from 'lucide-react'
import { 
  exportData, 
  type ExportFormat,
  type ExportOptions,
  CLIENT_COLUMNS,
  DEVIS_COLUMNS,
  FACTURE_COLUMNS,
  DOSSIER_COLUMNS,
  RDV_COLUMNS
} from '@/lib/utils/export'

// ============================================
// TYPES
// ============================================

export type ExportDataType = 'clients' | 'devis' | 'factures' | 'dossiers' | 'rdv' | 'all'

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataType?: ExportDataType
  data?: Record<string, unknown>[]
  onFetchData?: (filters: ExportFilters) => Promise<Record<string, unknown>[]>
  showDataTypeSelector?: boolean
}

interface ExportFilters {
  dataType: ExportDataType
  dateStart?: string
  dateEnd?: string
  status?: string
  clientId?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getColumnsForType(type: ExportDataType) {
  switch (type) {
    case 'clients': return CLIENT_COLUMNS
    case 'devis': return DEVIS_COLUMNS
    case 'factures': return FACTURE_COLUMNS
    case 'dossiers': return DOSSIER_COLUMNS
    case 'rdv': return RDV_COLUMNS
    default: return []
  }
}

function getDataTypeLabel(type: ExportDataType) {
  switch (type) {
    case 'clients': return 'Clients'
    case 'devis': return 'Devis'
    case 'factures': return 'Factures'
    case 'dossiers': return 'Dossiers'
    case 'rdv': return 'Rendez-vous'
    case 'all': return 'Toutes les données'
    default: return 'Données'
  }
}

function getStatusOptions(type: ExportDataType) {
  switch (type) {
    case 'devis':
      return [
        { value: 'brouillon', label: 'Brouillon' },
        { value: 'envoye', label: 'Envoyé' },
        { value: 'accepte', label: 'Accepté' },
        { value: 'refuse', label: 'Refusé' },
        { value: 'signe', label: 'Signé' },
        { value: 'expire', label: 'Expiré' }
      ]
    case 'factures':
      return [
        { value: 'brouillon', label: 'Brouillon' },
        { value: 'envoyee', label: 'Envoyée' },
        { value: 'payee', label: 'Payée' },
        { value: 'en_retard', label: 'En retard' },
        { value: 'annulee', label: 'Annulée' }
      ]
    case 'dossiers':
      return [
        { value: 'nouveau', label: 'Nouveau' },
        { value: 'contact', label: 'Contact établi' },
        { value: 'visite', label: 'Visite planifiée' },
        { value: 'devis', label: 'Devis envoyé' },
        { value: 'negociation', label: 'Négociation' },
        { value: 'gagne', label: 'Gagné' },
        { value: 'perdu', label: 'Perdu' }
      ]
    case 'rdv':
      return [
        { value: 'planifie', label: 'Planifié' },
        { value: 'confirme', label: 'Confirmé' },
        { value: 'termine', label: 'Terminé' },
        { value: 'annule', label: 'Annulé' }
      ]
    default:
      return []
  }
}

// ============================================
// COMPONENT
// ============================================

export function ExportModal({
  open,
  onOpenChange,
  dataType = 'clients',
  data,
  onFetchData,
  showDataTypeSelector = false
}: ExportModalProps) {
  const [selectedType, setSelectedType] = useState<ExportDataType>(dataType)
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [status, setStatus] = useState<string>('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  // Initialize selected columns when type changes
  React.useEffect(() => {
    const columns = getColumnsForType(selectedType)
    setSelectedColumns(columns.map(c => c.key))
  }, [selectedType])

  const columns = getColumnsForType(selectedType)
  const statusOptions = getStatusOptions(selectedType)

  const handleColumnToggle = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const handleSelectAllColumns = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([])
    } else {
      setSelectedColumns(columns.map(c => c.key))
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportComplete(false)

    try {
      let exportData: Record<string, unknown>[] = []

      if (data) {
        exportData = data
      } else if (onFetchData) {
        const filters: ExportFilters = {
          dataType: selectedType,
          dateStart: dateStart || undefined,
          dateEnd: dateEnd || undefined,
          status: status || undefined
        }
        exportData = await onFetchData(filters)
      }

      if (exportData.length === 0) {
        alert('Aucune donnée à exporter')
        setIsExporting(false)
        return
      }

      // Filter columns
      const filteredColumns = columns.filter(c => selectedColumns.includes(c.key))

      const options: ExportOptions = {
        filename: `export_${selectedType}_${new Date().toISOString().split('T')[0]}`,
        title: `Export ${getDataTypeLabel(selectedType)}`,
        subtitle: dateStart || dateEnd 
          ? `Période: ${dateStart || '...'} au ${dateEnd || '...'}`
          : `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
        columns: filteredColumns
      }

      // Perform export
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
      
      // Use the export function from utils
      const { exportData: doExport } = await import('@/lib/utils/export')
      doExport(exportData, format, options)

      setExportComplete(true)
      setTimeout(() => {
        setExportComplete(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    setExportComplete(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-500" />
            Exporter des données
          </DialogTitle>
          <DialogDescription>
            Configurez votre export et téléchargez vos données
          </DialogDescription>
        </DialogHeader>

        {exportComplete ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-xl font-medium mb-2">Export réussi !</p>
            <p className="text-gray-400">
              Votre fichier a été téléchargé
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Data type selector */}
            {showDataTypeSelector && (
              <div className="space-y-2">
                <Label>Type de données</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ExportDataType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="devis">Devis</SelectItem>
                    <SelectItem value="factures">Factures</SelectItem>
                    <SelectItem value="dossiers">Dossiers</SelectItem>
                    <SelectItem value="rdv">Rendez-vous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Format selector */}
            <div className="space-y-3">
              <Label>Format d'export</Label>
              <RadioGroup 
                value={format} 
                onValueChange={(v) => setFormat(v as ExportFormat)}
                className="grid grid-cols-3 gap-4"
              >
                <Label 
                  htmlFor="xlsx" 
                  className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    format === 'xlsx' 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <RadioGroupItem value="xlsx" id="xlsx" className="sr-only" />
                  <FileSpreadsheet className={`w-8 h-8 mb-2 ${format === 'xlsx' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className="font-medium">Excel</span>
                  <span className="text-xs text-gray-500">.xlsx</span>
                </Label>

                <Label 
                  htmlFor="csv" 
                  className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    format === 'csv' 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <RadioGroupItem value="csv" id="csv" className="sr-only" />
                  <FileText className={`w-8 h-8 mb-2 ${format === 'csv' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className="font-medium">CSV</span>
                  <span className="text-xs text-gray-500">.csv</span>
                </Label>

                <Label 
                  htmlFor="pdf" 
                  className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    format === 'pdf' 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                  <File className={`w-8 h-8 mb-2 ${format === 'pdf' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className="font-medium">PDF</span>
                  <span className="text-xs text-gray-500">.pdf</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" />
                <Label>Filtres (optionnel)</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateStart" className="text-sm text-gray-400">Date début</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="dateStart"
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateEnd" className="text-sm text-gray-400">Date fin</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="dateEnd"
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {statusOptions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Statut</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les statuts</SelectItem>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Column selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Colonnes à exporter</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSelectAllColumns}
                  className="text-orange-500 hover:text-orange-400"
                >
                  {selectedColumns.length === columns.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-800/50 rounded-lg max-h-48 overflow-y-auto">
                {columns.map(col => (
                  <Label 
                    key={col.key}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded"
                  >
                    <Checkbox
                      checked={selectedColumns.includes(col.key)}
                      onCheckedChange={() => handleColumnToggle(col.key)}
                    />
                    <span className="text-sm">{col.header}</span>
                  </Label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {selectedColumns.length} colonne(s) sélectionnée(s) sur {columns.length}
              </p>
            </div>

            {/* Data preview info */}
            {data && (
              <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                  {data.length} enregistrement(s)
                </Badge>
                <span className="text-sm text-gray-400">
                  seront exportés
                </span>
              </div>
            )}
          </div>
        )}

        {!exportComplete && (
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter en {format.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
