import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportOptions {
  filename: string
  title?: string
  subtitle?: string
  columns?: { key: string; header: string; width?: number }[]
  dateRange?: { start?: Date; end?: Date }
  logo?: string
}

export interface ImportResult<T> {
  success: boolean
  data: T[]
  errors: ImportError[]
  duplicates: T[]
  totalRows: number
  importedRows: number
}

export interface ImportError {
  row: number
  column: string
  value: string
  message: string
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  required: boolean
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const columns = options.columns || Object.keys(data[0]).map(key => ({ key, header: key, width: undefined }))
  
  // Create header row
  const headers = columns.map(col => col.header)
  
  // Create data rows
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key]
      if (value === null || value === undefined) return ''
      if (value instanceof Date) return value.toLocaleDateString('fr-FR')
      return String(value)
    })
  )

  const csvContent = Papa.unparse({
    fields: headers,
    data: rows
  }, {
    delimiter: ';', // Use semicolon for French Excel compatibility
    quotes: true
  })

  // Add BOM for UTF-8 encoding (French characters)
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${options.filename}.csv`)
}

/**
 * Export data to Excel (XLSX) format
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const columns = options.columns || Object.keys(data[0]).map(key => ({ key, header: key, width: undefined }))
  
  // Create worksheet data
  const wsData = [
    // Title row (optional)
    ...(options.title ? [[options.title]] : []),
    ...(options.subtitle ? [[options.subtitle]] : []),
    ...(options.title || options.subtitle ? [[]] : []), // Empty row after title
    // Header row
    columns.map(col => col.header),
    // Data rows
    ...data.map(item => 
      columns.map(col => {
        const value = item[col.key]
        if (value === null || value === undefined) return ''
        if (value instanceof Date) return value.toLocaleDateString('fr-FR')
        return value
      })
    )
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 20 }))
  ws['!cols'] = colWidths

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, options.filename.slice(0, 31)) // Sheet name max 31 chars

  // Generate and download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${options.filename}.xlsx`)
}

/**
 * Export data to PDF format
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const columns = options.columns || Object.keys(data[0]).map(key => ({ key, header: key, width: undefined }))
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: columns.length > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Add title
  if (options.title) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(options.title, 14, 20)
  }

  if (options.subtitle) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(options.subtitle, 14, options.title ? 28 : 20)
  }

  // Add date
  const dateStr = `Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`
  doc.setFontSize(10)
  doc.setTextColor(128)
  doc.text(dateStr, 14, options.title && options.subtitle ? 36 : options.title ? 28 : 20)

  // Prepare table data
  const headers = columns.map(col => col.header)
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key]
      if (value === null || value === undefined) return ''
      if (value instanceof Date) return value.toLocaleDateString('fr-FR')
      if (typeof value === 'number') {
        // Format currency
        if (col.key.includes('montant') || col.key.includes('prix') || col.key.includes('total')) {
          return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
        }
        return value.toString()
      }
      return String(value)
    })
  )

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: options.title && options.subtitle ? 42 : options.title ? 34 : 26,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [255, 77, 0], // Orange BTP
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 14, right: 14 }
  })

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
    doc.text(
      'MY CHARLIE - Gestion BTP',
      14,
      doc.internal.pageSize.height - 10
    )
  }

  // Save
  doc.save(`${options.filename}.pdf`)
}

/**
 * Universal export function
 */
export function exportData<T extends Record<string, unknown>>(
  data: T[],
  format: ExportFormat,
  options: ExportOptions
): void {
  switch (format) {
    case 'csv':
      exportToCSV(data, options)
      break
    case 'xlsx':
      exportToExcel(data, options)
      break
    case 'pdf':
      exportToPDF(data, options)
      break
    default:
      console.error(`Unknown export format: ${format}`)
  }
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

/**
 * Parse CSV file
 */
export function parseCSV<T extends Record<string, unknown>>(
  file: File
): Promise<{ headers: string[]; data: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const headers = results.meta.fields || []
        const data = results.data as Record<string, string>[]
        resolve({ headers, data })
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * Parse Excel file (XLS/XLSX)
 */
export async function parseExcel(
  file: File
): Promise<{ headers: string[]; data: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 })
        
        if (jsonData.length === 0) {
          resolve({ headers: [], data: [] })
          return
        }

        // First row is headers
        const headers = ((jsonData[0] as unknown) as unknown[]).map(h => String(h || ''))
        
        // Rest is data
        const rows = (jsonData as unknown[]).slice(1).map((row: unknown) => {
          const rowArray = (row as unknown) as unknown[]
          const rowData: Record<string, string> = {}
          headers.forEach((header, index) => {
            rowData[header] = String(rowArray[index] || '')
          })
          return rowData
        })

        resolve({ headers, data: rows })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse file based on extension
 */
export async function parseFile(
  file: File
): Promise<{ headers: string[]; data: Record<string, string>[] }> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'csv':
    case 'txt':
      return parseCSV(file)
    case 'xls':
    case 'xlsx':
      return parseExcel(file)
    default:
      throw new Error(`Format de fichier non supporté: ${extension}`)
  }
}

/**
 * Validate imported data
 */
export function validateImportData<T extends Record<string, unknown>>(
  data: Record<string, string>[],
  mapping: ColumnMapping[],
  validators?: Record<string, (value: string) => boolean>
): ImportResult<T> {
  const errors: ImportError[] = []
  const validData: T[] = []
  const duplicates: T[] = []
  const seenKeys = new Set<string>()

  data.forEach((row, index) => {
    const mappedRow: Record<string, unknown> = {}
    let hasError = false

    mapping.forEach(({ sourceColumn, targetField, required }) => {
      const value = row[sourceColumn]?.trim() || ''
      
      // Check required fields
      if (required && !value) {
        errors.push({
          row: index + 2, // +2 for header row and 0-indexing
          column: sourceColumn,
          value: '',
          message: `Le champ "${targetField}" est requis`
        })
        hasError = true
        return
      }

      // Run custom validators
      if (validators && validators[targetField] && value) {
        if (!validators[targetField](value)) {
          errors.push({
            row: index + 2,
            column: sourceColumn,
            value,
            message: `Valeur invalide pour "${targetField}"`
          })
          hasError = true
          return
        }
      }

      mappedRow[targetField] = value
    })

    if (!hasError) {
      // Check for duplicates (based on first required field)
      const keyField = mapping.find(m => m.required)?.targetField || mapping[0].targetField
      const key = String(mappedRow[keyField] || '')
      
      if (seenKeys.has(key)) {
        duplicates.push(mappedRow as T)
      } else {
        seenKeys.add(key)
        validData.push(mappedRow as T)
      }
    }
  })

  return {
    success: errors.length === 0,
    data: validData,
    errors,
    duplicates,
    totalRows: data.length,
    importedRows: validData.length
  }
}

// ============================================
// PREDEFINED COLUMN MAPPINGS
// ============================================

export const CLIENT_COLUMNS = [
  { key: 'nom_complet', header: 'Nom complet', width: 25 },
  { key: 'email', header: 'Email', width: 30 },
  { key: 'telephone', header: 'Téléphone', width: 15 },
  { key: 'type', header: 'Type', width: 15 },
  { key: 'adresse_facturation', header: 'Adresse facturation', width: 40 },
  { key: 'adresse_chantier', header: 'Adresse chantier', width: 40 },
  { key: 'siret', header: 'SIRET', width: 15 },
  { key: 'created_at', header: 'Date création', width: 15 }
]

export const DEVIS_COLUMNS = [
  { key: 'numero', header: 'N° Devis', width: 15 },
  { key: 'client_nom', header: 'Client', width: 25 },
  { key: 'titre', header: 'Titre', width: 30 },
  { key: 'montant_ht', header: 'Montant HT', width: 15 },
  { key: 'taux_tva', header: 'TVA %', width: 10 },
  { key: 'montant_ttc', header: 'Montant TTC', width: 15 },
  { key: 'statut', header: 'Statut', width: 15 },
  { key: 'date_creation', header: 'Date création', width: 15 },
  { key: 'date_validite', header: 'Date validité', width: 15 }
]

export const FACTURE_COLUMNS = [
  { key: 'numero', header: 'N° Facture', width: 15 },
  { key: 'client_nom', header: 'Client', width: 25 },
  { key: 'devis_numero', header: 'N° Devis associé', width: 15 },
  { key: 'montant_ht', header: 'Montant HT', width: 15 },
  { key: 'taux_tva', header: 'TVA %', width: 10 },
  { key: 'montant_ttc', header: 'Montant TTC', width: 15 },
  { key: 'statut', header: 'Statut', width: 15 },
  { key: 'date_emission', header: 'Date émission', width: 15 },
  { key: 'date_echeance', header: 'Date échéance', width: 15 }
]

export const DOSSIER_COLUMNS = [
  { key: 'numero', header: 'N° Dossier', width: 15 },
  { key: 'titre', header: 'Titre', width: 30 },
  { key: 'client_nom', header: 'Client', width: 25 },
  { key: 'statut', header: 'Statut', width: 15 },
  { key: 'priorite', header: 'Priorité', width: 12 },
  { key: 'montant_estime', header: 'Montant estimé', width: 15 },
  { key: 'date_creation', header: 'Date création', width: 15 }
]

export const RDV_COLUMNS = [
  { key: 'titre', header: 'Titre', width: 30 },
  { key: 'date_heure', header: 'Date et heure', width: 20 },
  { key: 'type_rdv', header: 'Type', width: 15 },
  { key: 'client_nom', header: 'Client', width: 25 },
  { key: 'dossier_numero', header: 'N° Dossier', width: 15 },
  { key: 'adresse', header: 'Adresse', width: 40 },
  { key: 'statut', header: 'Statut', width: 12 }
]

// ============================================
// VALIDATORS
// ============================================

export const VALIDATORS = {
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  telephone: (value: string) => /^[\d\s\+\-\.]+$/.test(value),
  siret: (value: string) => /^\d{14}$/.test(value.replace(/\s/g, '')),
  montant: (value: string) => !isNaN(parseFloat(value.replace(',', '.').replace(/\s/g, ''))),
  date: (value: string) => !isNaN(Date.parse(value)),
  tva: (value: string) => {
    const num = parseFloat(value.replace(',', '.'))
    return !isNaN(num) && num >= 0 && num <= 100
  }
}
