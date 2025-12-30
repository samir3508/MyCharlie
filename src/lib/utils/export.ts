/**
 * Fonction utilitaire pour exporter des données en CSV
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers: { key: keyof T; label: string }[]
) {
  if (!data || data.length === 0) {
    return
  }

  // Créer la ligne d'en-tête
  const headerRow = headers.map(h => h.label).join(',')

  // Créer les lignes de données
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key]
      
      // Gérer les valeurs null/undefined
      if (value === null || value === undefined) {
        return ''
      }
      
      // Convertir en string et échapper les virgules et guillemets
      const stringValue = String(value)
      // Si la valeur contient des virgules, des guillemets ou des sauts de ligne, l'entourer de guillemets
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      
      return stringValue
    }).join(',')
  })

  // Combiner toutes les lignes
  const csvContent = [headerRow, ...dataRows].join('\n')

  // Ajouter le BOM pour UTF-8 (pour Excel)
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csvContent

  // Créer le blob et télécharger
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
