import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { DevisPDF, type DevisPDFData } from './devis-template'
import { FacturePDF, type FacturePDFData } from './facture-template'

/**
 * Génère un PDF de devis
 */
export async function generateDevisPDF(data: DevisPDFData): Promise<Buffer> {
  const pdfDocument = React.createElement(DevisPDF, { data })
  const buffer = await renderToBuffer(pdfDocument as any)
  // renderToBuffer retourne déjà un Buffer ou Uint8Array
  return buffer instanceof Buffer ? buffer : Buffer.from(buffer)
}

/**
 * Génère un PDF de facture
 */
export async function generateFacturePDF(data: FacturePDFData): Promise<Buffer> {
  const pdfDocument = React.createElement(FacturePDF, { data })
  const buffer = await renderToBuffer(pdfDocument as any)
  // renderToBuffer retourne déjà un Buffer ou Uint8Array
  return buffer instanceof Buffer ? buffer : Buffer.from(buffer)
}

// Export des types
export type { DevisPDFData } from './devis-template'
export type { FacturePDFData } from './facture-template'