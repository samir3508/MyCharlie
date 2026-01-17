'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File,
  Upload, 
  Loader2,
  ArrowUpDown
} from 'lucide-react'
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF,
  type ExportOptions 
} from '@/lib/utils/export'
import { toast } from 'sonner'

type ExportFormat = 'csv' | 'xlsx' | 'pdf'

interface ExportDropdownProps<T extends Record<string, unknown>> {
  data: T[] | undefined
  columns: { key: string; header: string; width?: number }[]
  filename: string
  title?: string
  onImport?: () => void
  isLoading?: boolean
  showImport?: boolean
  label?: string
}

export function ExportDropdown<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  title,
  onImport,
  isLoading = false,
  showImport = false,
  label = 'Exporter',
}: ExportDropdownProps<T>) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    if (!data || data.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }

    setExporting(true)
    
    try {
      const options: ExportOptions = {
        filename: `${filename}_${new Date().toISOString().split('T')[0]}`,
        title: title || filename,
        subtitle: `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
        columns
      }

      switch (format) {
        case 'csv':
          exportToCSV(data, options)
          toast.success(`Export CSV réussi (${data.length} lignes)`)
          break
        case 'xlsx':
          exportToExcel(data, options)
          toast.success(`Export Excel réussi (${data.length} lignes)`)
          break
        case 'pdf':
          exportToPDF(data, options)
          toast.success(`Export PDF réussi (${data.length} lignes)`)
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(false)
    }
  }

  const isDisabled = isLoading || exporting || !data || data.length === 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading || exporting} className="gap-2">
          {(isLoading || exporting) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUpDown className="w-4 h-4" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter ({data?.length || 0} lignes)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleExport('csv')} 
          className="cursor-pointer"
          disabled={isDisabled}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
          <div className="flex flex-col">
            <span>CSV</span>
            <span className="text-xs text-muted-foreground">Compatible Excel</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('xlsx')} 
          className="cursor-pointer"
          disabled={isDisabled}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-500" />
          <div className="flex flex-col">
            <span>Excel (.xlsx)</span>
            <span className="text-xs text-muted-foreground">Formaté avec colonnes</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')} 
          className="cursor-pointer"
          disabled={isDisabled}
        >
          <File className="w-4 h-4 mr-2 text-red-500" />
          <div className="flex flex-col">
            <span>PDF</span>
            <span className="text-xs text-muted-foreground">Prêt à imprimer</span>
          </div>
        </DropdownMenuItem>
        
        {showImport && onImport && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Importer
            </DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={onImport}
              className="cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2 text-orange-500" />
              <div className="flex flex-col">
                <span>Importer fichier</span>
                <span className="text-xs text-muted-foreground">CSV, Excel</span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
