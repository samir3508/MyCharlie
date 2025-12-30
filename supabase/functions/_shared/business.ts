/**
 * Logique métier partagée pour les Edge Functions LÉO
 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

export const __BUSINESS_TS_JUNK__ = `



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}
 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}
 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}
 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}

 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}



 */

import { supabase } from './db.ts'

/**
 * Génère un titre de devis si manquant
 */
export function generateDevisTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Devis - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de devis si manquante
 */
export function generateDevisDescription(
  clientNom: string,
  clientPrenom: string,
  adresseChantier: string
): string {
  return `Devis pour ${clientPrenom} ${clientNom} - ${adresseChantier}`
}

/**
 * Sélectionne le template de conditions de paiement selon le montant TTC
 */
export async function selectPaymentTemplate(
  tenantId: string,
  montantTtc: number
): Promise<string | null> {
  // Si montant est 0, utiliser directement le template par défaut
  if (montantTtc === 0) {
    return await getDefaultPaymentTemplate(tenantId)
  }

  // Chercher le template correspondant au montant
  const { data: templates, error } = await supabase
    .from('templates_conditions_paiement')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('montant_min', montantTtc)
    .order('montant_min', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erreur lors de la sélection du template:', error)
    // En cas d'erreur, chercher le template par défaut
    return await getDefaultPaymentTemplate(tenantId)
  }

  if (templates && templates.length > 0) {
    const template = templates[0]
    // Vérifier que le montant est dans la plage (si montant_max est défini)
    if (template.montant_max === null || montantTtc <= template.montant_max) {
      return template.id
    }
  }

  // Si aucun template ne correspond, utiliser le template par défaut
  return await getDefaultPaymentTemplate(tenantId)
}

/**
 * Récupère le template de paiement par défaut
 */
async function getDefaultPaymentTemplate(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('templates_conditions_paiement')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Aucun template par défaut trouvé:', error)
    return null
  }

  return data.id
}

/**
 * Calcule les montants pour une ligne de devis
 */
export function calculateLigneMontants(
  quantite: number,
  prixUnitaireHt: number,
  tvaPct: number
): { total_ht: number; total_tva: number; total_ttc: number } {
  const total_ht = quantite * prixUnitaireHt
  const total_tva = total_ht * (tvaPct / 100)
  const total_ttc = total_ht + total_tva

  return {
    total_ht: Math.round(total_ht * 100) / 100, // Arrondi à 2 décimales
    total_tva: Math.round(total_tva * 100) / 100,
    total_ttc: Math.round(total_ttc * 100) / 100,
  }
}

/**
 * Calcule les totaux globaux d'un devis à partir de ses lignes
 */
export function calculateDevisTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  const totals = lignes.reduce(
    (acc, ligne) => ({
      montant_ht: acc.montant_ht + ligne.total_ht,
      montant_tva: acc.montant_tva + ligne.total_tva,
      montant_ttc: acc.montant_ttc + ligne.total_ttc,
    }),
    { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  )

  return {
    montant_ht: Math.round(totals.montant_ht * 100) / 100,
    montant_tva: Math.round(totals.montant_tva * 100) / 100,
    montant_ttc: Math.round(totals.montant_ttc * 100) / 100,
  }
}

/**
 * Génère un numéro de devis via RPC
 */
export async function generateDevisNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_devis_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de devis: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Génère un titre de facture si manquant
 */
export function generateFactureTitle(clientNom: string, clientPrenom: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Facture - ${clientPrenom} ${clientNom} - ${date}`
}

/**
 * Génère une description de facture si manquante
 */
export function generateFactureDescription(
  clientNom: string,
  clientPrenom: string,
  dateEmission: string
): string {
  return `Facture pour ${clientPrenom} ${clientNom} - ${dateEmission}`
}

/**
 * Génère un numéro de facture via RPC
 */
export async function generateFactureNumero(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_facture_numero', {
    p_tenant_id: tenantId,
  })

  if (error || !data) {
    throw new Error(`Erreur lors de la génération du numéro de facture: ${error?.message || 'Données manquantes'}`)
  }

  return data
}

/**
 * Calcule la date d'échéance à partir de la date d'émission
 */
export function calculateDateEcheance(dateEmission: string, delaiJours: number = 30): string {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + delaiJours)
  return date.toISOString().split('T')[0]
}

/**
 * Calcule les totaux globaux d'une facture à partir de ses lignes
 */
export function calculateFactureTotals(lignes: Array<{
  total_ht: number
  total_tva: number
  total_ttc: number
}>): { montant_ht: number; montant_tva: number; montant_ttc: number } {
  // Réutilise la même logique que pour les devis
  return calculateDevisTotals(lignes)
}