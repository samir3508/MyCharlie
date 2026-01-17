/**
 * Génère les URLs de l'application pour la production
 */

export function getAppUrl(): string {
  // En production, utiliser l'URL de Render
  if (typeof window !== 'undefined') {
    // Côté client, utiliser l'URL actuelle
    return window.location.origin
  }
  
  // Côté serveur, utiliser l'URL de production
  return process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'
}

export function getDevisUrl(devisId: string): string {
  return `${getAppUrl()}/devis/${devisId}`
}

export function getFactureUrl(factureId: string): string {
  return `${getAppUrl()}/factures/${factureId}`
}

export function getDevisEditUrl(devisId: string): string {
  return `${getAppUrl()}/devis/${devisId}/edit`
}

export function getFactureEditUrl(factureId: string): string {
  return `${getAppUrl()}/factures/${factureId}/edit`
}

export function getDevisSignUrl(devisId: string): string {
  return `${getAppUrl()}/devis/${devisId}/sign`
}

export function getFactureSignUrl(factureId: string): string {
  return `${getAppUrl()}/factures/${factureId}/sign`
}
