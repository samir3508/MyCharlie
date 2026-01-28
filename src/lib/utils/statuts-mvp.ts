// ============================================================================
// 🔄 MAPPING STATUTS MVP - Affichage simplifié
// ============================================================================
// Ce fichier contient le mapping entre les statuts système (granulaires)
// et les statuts MVP (simplifiés pour l'affichage)
// ============================================================================

export type StatutMVP = 
  | 'nouveau'
  | 'visite_a_planifier'
  | 'creneaux_envoyes'
  | 'visite_planifiee'
  | 'visite_realisee'
  | 'devis_a_faire'
  | 'devis_envoye'
  | 'devis_accepte'
  | 'chantier_en_cours'
  | 'chantier_termine'
  | 'facturation_en_cours'
  | 'facture_envoyee'
  | 'facture_payee'
  | 'cloture'
  | 'perdu'

export type StatutSysteme = 
  | 'contact_recu'
  | 'qualification'
  | 'rdv_a_planifier'
  | 'rdv_planifie'
  | 'rdv_confirme'
  | 'visite_realisee'
  | 'devis_en_cours'
  | 'devis_pret'
  | 'devis_envoye'
  | 'en_negociation'
  | 'signe'
  | 'chantier_en_cours'
  | 'chantier_termine'
  | 'perdu'
  | 'annule'
  | 'facture_a_creer'
  | 'facture_envoyee'
  | 'facture_en_retard'
  | 'facture_payee'

// ============================================================================
// MAPPING SYSTÈME → MVP
// ============================================================================

const MAPPING_STATUTS: Record<StatutSysteme, StatutMVP> = {
  // Phase initiale
  'contact_recu': 'nouveau',
  'qualification': 'nouveau',
  
  // Phase RDV / Visite
  'rdv_a_planifier': 'visite_a_planifier',
  'rdv_planifie': 'creneaux_envoyes',
  'rdv_confirme': 'visite_planifiee',
  'visite_realisee': 'visite_realisee',
  
  // Phase Devis
  'devis_en_cours': 'devis_a_faire',
  'devis_pret': 'devis_a_faire',
  'devis_envoye': 'devis_envoye',
  'en_negociation': 'devis_envoye',
  'signe': 'devis_accepte',
  
  // Phase Chantier
  'chantier_en_cours': 'chantier_en_cours',
  'chantier_termine': 'chantier_termine',
  
  // Phase Facturation
  'facture_a_creer': 'facturation_en_cours',
  'facture_envoyee': 'facture_envoyee',
  'facture_en_retard': 'facture_envoyee', // Même affichage, avec alerte
  'facture_payee': 'facture_payee',
  
  // Fin
  'perdu': 'perdu',
  'annule': 'perdu',
}

// ============================================================================
// LABELS AFFICHAGE MVP
// ============================================================================

export const LABELS_MVP: Record<StatutMVP, string> = {
  'nouveau': '📥 Nouveau',
  'visite_a_planifier': '📅 Visite à planifier',
  'creneaux_envoyes': '⏳ Créneaux envoyés',
  'visite_planifiee': '✅ Visite planifiée',
  'visite_realisee': '🏠 Visite réalisée',
  'devis_a_faire': '📝 Devis à faire',
  'devis_envoye': '📤 Devis envoyé',
  'devis_accepte': '🎉 Devis accepté',
  'chantier_en_cours': '🔨 Chantier en cours',
  'chantier_termine': '✅ Chantier terminé',
  'facturation_en_cours': '💰 Facturation en cours',
  'facture_envoyee': '📧 Facture envoyée',
  'facture_payee': '💵 Payé',
  'cloture': '🏁 Clôturé',
  'perdu': '❌ Perdu',
}

// ============================================================================
// COULEURS MVP
// ============================================================================

export const COULEURS_MVP: Record<StatutMVP, { bg: string; text: string; border: string }> = {
  'nouveau': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'visite_a_planifier': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'creneaux_envoyes': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'visite_planifiee': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  'visite_realisee': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'devis_a_faire': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  'devis_envoye': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'devis_accepte': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'chantier_en_cours': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'chantier_termine': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30' },
  'facturation_en_cours': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  'facture_envoyee': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'facture_payee': { bg: 'bg-green-600/10', text: 'text-green-500', border: 'border-green-600/30' },
  'cloture': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  'perdu': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
}

// ============================================================================
// PROCHAINES ACTIONS PAR STATUT
// ============================================================================

export const PROCHAINES_ACTIONS_MVP: Record<StatutMVP, {
  action: string
  description: string
  bouton: string
  href: (dossier_id: string) => string
}> = {
  'nouveau': {
    action: 'Planifier un RDV',
    description: 'Prendre contact avec le client pour planifier une visite',
    bouton: 'Planifier RDV',
    href: (id) => `/rdv/nouveau?dossier_id=${id}`
  },
  'visite_a_planifier': {
    action: 'Planifier un RDV',
    description: 'Proposer des créneaux au client',
    bouton: 'Proposer créneaux',
    href: (id) => `/rdv/nouveau?dossier_id=${id}`
  },
  'creneaux_envoyes': {
    action: 'En attente de confirmation',
    description: 'Créneaux envoyés par email. En attente que le client clique pour confirmer.',
    bouton: 'Relancer le client',
    href: (id) => `/dossiers/${id}?action=relancer_creneaux`
  },
  'visite_planifiee': {
    action: 'Préparer la visite',
    description: 'RDV confirmé avec le client',
    bouton: 'Voir RDV',
    href: (id) => `/dossiers/${id}`
  },
  'visite_realisee': {
    action: 'Créer le devis',
    description: 'Visite effectuée, préparer le devis basé sur la fiche de visite',
    bouton: 'Créer devis',
    href: (id) => `/devis/nouveau?dossier_id=${id}`
  },
  'devis_a_faire': {
    action: 'Finaliser et envoyer le devis',
    description: 'Devis en préparation',
    bouton: 'Envoyer devis',
    href: (id) => `/dossiers/${id}`
  },
  'devis_envoye': {
    action: 'En attente de signature',
    description: 'Devis envoyé au client',
    bouton: 'Voir devis',
    href: (id) => `/dossiers/${id}`
  },
  'devis_accepte': {
    action: 'Créer la facture',
    description: 'Devis accepté, créer la facture (ou acompte)',
    bouton: 'Créer facture',
    href: (id) => `/dossiers/${id}`
  },
  'chantier_en_cours': {
    action: 'Terminer le chantier',
    description: 'Travaux en cours',
    bouton: 'Terminer chantier',
    href: (id) => `/dossiers/${id}?action=terminer_chantier`
  },
  'chantier_termine': {
    action: 'Créer la facture de solde',
    description: 'Chantier terminé, facturer le solde',
    bouton: 'Créer facture solde',
    href: (id) => `/dossiers/${id}`
  },
  'facturation_en_cours': {
    action: 'Envoyer la facture',
    description: 'Facture en préparation',
    bouton: 'Envoyer facture',
    href: (id) => `/dossiers/${id}`
  },
  'facture_envoyee': {
    action: 'En attente de paiement',
    description: 'Facture envoyée au client',
    bouton: 'Voir facture',
    href: (id) => `/dossiers/${id}`
  },
  'facture_payee': {
    action: 'Clôturer le dossier',
    description: 'Paiement reçu',
    bouton: 'Clôturer',
    href: (id) => `/dossiers/${id}?action=cloturer`
  },
  'cloture': {
    action: 'Aucune action',
    description: 'Dossier clôturé',
    bouton: 'Voir dossier',
    href: (id) => `/dossiers/${id}`
  },
  'perdu': {
    action: 'Archiver',
    description: 'Dossier perdu ou annulé',
    bouton: 'Archiver',
    href: (id) => `/dossiers/${id}?action=archiver`
  },
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Convertit un statut système en statut MVP
 */
export function toStatutMVP(statutSysteme: string): StatutMVP {
  return MAPPING_STATUTS[statutSysteme as StatutSysteme] || 'nouveau'
}

/**
 * Récupère le label d'affichage MVP pour un statut système
 */
export function getLabelMVP(statutSysteme: string): string {
  const statutMVP = toStatutMVP(statutSysteme)
  return LABELS_MVP[statutMVP] || statutSysteme
}

/**
 * Récupère les couleurs MVP pour un statut système
 */
export function getCouleursMVP(statutSysteme: string): { bg: string; text: string; border: string } {
  const statutMVP = toStatutMVP(statutSysteme)
  return COULEURS_MVP[statutMVP] || COULEURS_MVP['nouveau']
}

/**
 * Récupère la prochaine action MVP pour un statut système
 */
export function getProchaineActionMVP(statutSysteme: string, dossierId: string) {
  const statutMVP = toStatutMVP(statutSysteme)
  const action = PROCHAINES_ACTIONS_MVP[statutMVP]
  return {
    ...action,
    href: action.href(dossierId)
  }
}

/**
 * Récupère le numéro d'étape (1-13) pour un statut MVP
 */
export function getEtapeMVP(statutSysteme: string): number {
  const statutMVP = toStatutMVP(statutSysteme)
  const etapes: StatutMVP[] = [
    'nouveau',
    'visite_a_planifier',
    'creneaux_envoyes',
    'visite_planifiee',
    'visite_realisee',
    'devis_a_faire',
    'devis_envoye',
    'devis_accepte',
    'chantier_en_cours',
    'chantier_termine',
    'facturation_en_cours',
    'facture_envoyee',
    'facture_payee',
  ]
  const index = etapes.indexOf(statutMVP)
  return index >= 0 ? index + 1 : 0
}

/**
 * Calcule le pourcentage de progression d'un dossier
 */
export function getProgressionMVP(statutSysteme: string): number {
  const etape = getEtapeMVP(statutSysteme)
  if (etape === 0) return 0
  // 13 étapes au total, on calcule le pourcentage
  return Math.round((etape / 13) * 100)
}

// ============================================================================
// EXPORTS POUR LES COMPOSANTS UI
// ============================================================================

export const ETAPES_MVP = [
  { statut: 'nouveau', label: 'Contact', icon: '📥' },
  { statut: 'visite_a_planifier', label: 'Planifier', icon: '📅' },
  { statut: 'creneaux_envoyes', label: 'Créneaux', icon: '⏳' },
  { statut: 'visite_planifiee', label: 'Confirmé', icon: '✅' },
  { statut: 'visite_realisee', label: 'Visite', icon: '🏠' },
  { statut: 'devis_a_faire', label: 'Rédiger', icon: '📝' },
  { statut: 'devis_envoye', label: 'Envoyé', icon: '📤' },
  { statut: 'devis_accepte', label: 'Signé', icon: '🎉' },
  { statut: 'chantier_en_cours', label: 'Chantier', icon: '🔨' },
  { statut: 'chantier_termine', label: 'Fini', icon: '✅' },
  { statut: 'facturation_en_cours', label: 'Facturer', icon: '💰' },
  { statut: 'facture_envoyee', label: 'Facturé', icon: '📧' },
  { statut: 'facture_payee', label: 'Payé', icon: '💵' },
] as const
