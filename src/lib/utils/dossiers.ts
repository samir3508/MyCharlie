/**
 * Utilitaires pour les dossiers
 */

/**
 * Retourne les classes CSS pour la couleur de priorité d'un dossier
 */
export function getPrioriteColor(priorite: string | null): string {
  switch (priorite) {
    case 'urgente': 
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'haute': 
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'normale': 
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'basse': 
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    default: 
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}
