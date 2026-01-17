'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  X, 
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { parseFile, validateImportData, type ColumnMapping, type ImportResult, type ImportError } from '@/lib/utils/export'

// ============================================
// TYPES
// ============================================

export type ImportDataType = 'clients' | 'devis' | 'factures' | 'dossiers' | 'rdv'

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataType: ImportDataType
  onImport: (data: Record<string, unknown>[]) => Promise<void>
  requiredFields: { field: string; label: string }[]
  optionalFields?: { field: string; label: string }[]
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

// ============================================
// COMPONENT
// ============================================

export function ImportWizard({
  open,
  onOpenChange,
  dataType,
  onImport,
  requiredFields,
  optionalFields = []
}: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<ImportResult<Record<string, unknown>> | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Reset state when closing
  const handleClose = () => {
    setStep('upload')
    setFile(null)
    setHeaders([])
    setRawData([])
    setColumnMappings({})
    setValidationResult(null)
    setIsImporting(false)
    setImportProgress(0)
    setError(null)
    onOpenChange(false)
  }

  // File drop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setError(null)

    try {
      const result = await parseFile(uploadedFile)
      setHeaders(result.headers)
      setRawData(result.data)
      
      // Auto-map columns with similar names
      const autoMappings: Record<string, string> = {}
      const allFields = [...requiredFields, ...optionalFields]
      
      allFields.forEach(({ field, label }) => {
        const matchingHeader = result.headers.find(h => {
          const normalizedHeader = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const normalizedField = field.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const normalizedLabel = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          
          return normalizedHeader.includes(normalizedField) || 
                 normalizedField.includes(normalizedHeader) ||
                 normalizedHeader.includes(normalizedLabel) ||
                 normalizedLabel.includes(normalizedHeader)
        })
        
        if (matchingHeader) {
          autoMappings[field] = matchingHeader
        }
      })
      
      setColumnMappings(autoMappings)
      setStep('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier')
    }
  }, [requiredFields, optionalFields])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  })

  // Handle column mapping change
  const handleMappingChange = (field: string, sourceColumn: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: sourceColumn
    }))
  }

  // Validate and preview
  const handlePreview = () => {
    const mappings: ColumnMapping[] = []
    
    requiredFields.forEach(({ field }) => {
      if (columnMappings[field]) {
        mappings.push({
          sourceColumn: columnMappings[field],
          targetField: field,
          required: true
        })
      }
    })

    optionalFields.forEach(({ field }) => {
      if (columnMappings[field]) {
        mappings.push({
          sourceColumn: columnMappings[field],
          targetField: field,
          required: false
        })
      }
    })

    const result = validateImportData(rawData, mappings)
    setValidationResult(result)
    setStep('preview')
  }

  // Check if all required fields are mapped
  const canPreview = requiredFields.every(({ field }) => columnMappings[field])

  // Handle import
  const handleImport = async () => {
    if (!validationResult || validationResult.data.length === 0) return

    setStep('importing')
    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      await onImport(validationResult.data)

      clearInterval(progressInterval)
      setImportProgress(100)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import')
      setStep('preview')
    } finally {
      setIsImporting(false)
    }
  }

  // Get data type label
  const getDataTypeLabel = () => {
    switch (dataType) {
      case 'clients': return 'Clients'
      case 'devis': return 'Devis'
      case 'factures': return 'Factures'
      case 'dossiers': return 'Dossiers'
      case 'rdv': return 'Rendez-vous'
      default: return 'Données'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-500" />
            Importer des {getDataTypeLabel().toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Étape 1/4 : Sélectionnez votre fichier'}
            {step === 'mapping' && 'Étape 2/4 : Associez les colonnes'}
            {step === 'preview' && 'Étape 3/4 : Vérifiez les données'}
            {step === 'importing' && 'Étape 4/4 : Import en cours'}
            {step === 'complete' && 'Import terminé !'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          {['upload', 'mapping', 'preview', 'complete'].map((s, i) => (
            <React.Fragment key={s}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s || ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={`flex-1 h-1 rounded ${
                  ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i
                    ? 'bg-orange-500'
                    : 'bg-gray-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-auto">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-gray-600 hover:border-orange-500/50 hover:bg-gray-800/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier'}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  ou cliquez pour sélectionner
                </p>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline">CSV</Badge>
                  <Badge variant="outline">XLS</Badge>
                  <Badge variant="outline">XLSX</Badge>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  Colonnes attendues
                </h4>
                <div className="flex flex-wrap gap-2">
                  {requiredFields.map(({ label }) => (
                    <Badge key={label} variant="default" className="bg-orange-500/20 text-orange-400">
                      {label} *
                    </Badge>
                  ))}
                  {optionalFields.map(({ label }) => (
                    <Badge key={label} variant="outline" className="text-gray-400">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <FileSpreadsheet className="w-4 h-4" />
                {file?.name} - {rawData.length} lignes détectées
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-4 font-medium text-sm text-gray-400 pb-2 border-b border-gray-700">
                  <div>Champ à importer</div>
                  <div></div>
                  <div>Colonne du fichier</div>
                </div>

                {requiredFields.map(({ field, label }) => (
                  <div key={field} className="grid grid-cols-3 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-orange-500/20 text-orange-400 text-xs">
                        Requis
                      </Badge>
                      <span className="font-medium">{label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 justify-self-center" />
                    <Select
                      value={columnMappings[field] || ''}
                      onValueChange={(value) => handleMappingChange(field, value)}
                    >
                      <SelectTrigger className={!columnMappings[field] ? 'border-red-500/50' : ''}>
                        <SelectValue placeholder="Sélectionner une colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                {optionalFields.length > 0 && (
                  <>
                    <div className="text-sm text-gray-500 pt-2">Champs optionnels</div>
                    {optionalFields.map(({ field, label }) => (
                      <div key={field} className="grid grid-cols-3 gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-gray-400 text-xs">
                            Optionnel
                          </Badge>
                          <span>{label}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 justify-self-center" />
                        <Select
                          value={columnMappings[field] || ''}
                          onValueChange={(value) => handleMappingChange(field, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une colonne" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Ne pas importer</SelectItem>
                            {headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && validationResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{validationResult.totalRows}</div>
                  <div className="text-sm text-gray-400">Lignes totales</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{validationResult.importedRows}</div>
                  <div className="text-sm text-gray-400">À importer</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{validationResult.duplicates.length}</div>
                  <div className="text-sm text-gray-400">Doublons</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{validationResult.errors.length}</div>
                  <div className="text-sm text-gray-400">Erreurs</div>
                </div>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Erreurs détectées ({validationResult.errors.length})
                  </h4>
                  <ScrollArea className="h-32">
                    <ul className="text-sm text-gray-300 space-y-1">
                      {validationResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>
                          Ligne {err.row}: {err.message} 
                          {err.value && <span className="text-gray-500"> (valeur: "{err.value}")</span>}
                        </li>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <li className="text-gray-500">
                          ... et {validationResult.errors.length - 10} autres erreurs
                        </li>
                      )}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              {/* Preview table */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800">
                        <TableHead className="w-10">#</TableHead>
                        {Object.keys(columnMappings).filter(k => columnMappings[k]).map(field => (
                          <TableHead key={field}>{field}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResult.data.slice(0, 20).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-gray-500">{i + 1}</TableCell>
                          {Object.keys(columnMappings).filter(k => columnMappings[k]).map(field => (
                            <TableCell key={field} className="max-w-[200px] truncate">
                              {String(row[field] || '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {validationResult.data.length > 20 && (
                <p className="text-sm text-gray-500 text-center">
                  Affichage des 20 premières lignes sur {validationResult.data.length}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-lg font-medium mb-4">Import en cours...</p>
              <Progress value={importProgress} className="w-64" />
              <p className="text-sm text-gray-400 mt-2">
                {importProgress}% - Veuillez patienter
              </p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && validationResult && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-xl font-medium mb-2">Import réussi !</p>
              <p className="text-gray-400 mb-6">
                {validationResult.importedRows} {getDataTypeLabel().toLowerCase()} importé(s) avec succès
              </p>
              <Button onClick={handleClose} className="bg-orange-500 hover:bg-orange-600">
                Fermer
              </Button>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        {step !== 'complete' && step !== 'importing' && (
          <DialogFooter className="flex justify-between gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'mapping') setStep('upload')
                else if (step === 'preview') setStep('mapping')
              }}
              disabled={step === 'upload'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Annuler
              </Button>

              {step === 'mapping' && (
                <Button 
                  onClick={handlePreview}
                  disabled={!canPreview}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Aperçu
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {step === 'preview' && validationResult && (
                <Button 
                  onClick={handleImport}
                  disabled={validationResult.data.length === 0}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Importer {validationResult.importedRows} lignes
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
