/**
 * Utilitaires pour améliorer l'affichage et la gestion des titres
 */

/**
 * Formate un titre pour l'affichage en limitant la longueur
 * @param titre - Le titre à formater
 * @param maxLength - Longueur maximale souhaitée
 * @returns Le titre formaté
 */
export function formatTitreAffichage(titre: string | null | undefined, maxLength: number = 40): string {
  if (!titre) return 'Sans titre'
  
  if (titre.length <= maxLength) {
    return titre
  }
  
  return `${titre.substring(0, maxLength)}...`
}

/**
 * Génère un titre automatique pour un dossier basé sur les informations disponibles
 * @param dossier - Les informations du dossier
 * @returns Un titre suggéré
 */
export function genererTitreAutomatique(dossier: {
  type_travaux?: string | null
  adresse_chantier?: string | null
  clients?: { nom_complet?: string | null } | null
}): string {
  const { type_travaux, adresse_chantier, clients } = dossier
  
  // Priorité 1: Type de travaux
  if (type_travaux) {
    return type_travaux
  }
  
  // Priorité 2: Nom du client + "Travaux"
  if (clients?.nom_complet) {
    return `Travaux ${clients.nom_complet}`
  }
  
  // Priorité 3: Adresse chantier
  if (adresse_chantier) {
    const adresseCourte = adresse_chantier.split(',')[0]
    return `Travaux ${adresseCourte}`
  }
  
  return 'Nouveau dossier'
}

/**
 * Extrait les mots-clés d'un titre pour la recherche
 * @param titre - Le titre à analyser
 * @returns Tableau de mots-clés
 */
export function extraireMotsCles(titre: string | null | undefined): string[] {
  if (!titre) return []
  
  // Mots-clés courants dans les travaux
  const motsClesTravaux = [
    'rénovation', 'construction', 'extension', 'aménagement', 'decoration',
    'cuisine', 'salle', 'bain', 'sdb', 'toilette', 'chambre', 'salon',
    'carrelage', 'parquet', 'peinture', 'placo', 'plâtre', 'isolation',
    'electricité', 'plomberie', 'chauffage', 'climatisation', 'vmc',
    'terrasse', 'balcon', 'jardin', 'mur', 'toit', 'façade', 'fenêtre',
    'porte', 'volet', 'garage', 'cave', 'combles', 'sous-sol'
  ]
  
  const mots = titre.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Garder seulement lettres, chiffres et espaces
    .split(/\s+/) // Diviser par espaces
    .filter(mot => mot.length > 2) // Garder mots de plus de 2 lettres
  
  // Trouver les mots-clés de travaux
  const motsClesTrouves = mots.filter(mot => 
    motsClesTravaux.some(motCle => mot.includes(motCle) || motCle.includes(mot))
  )
  
  return [...new Set([...motsClesTrouves, ...mots.slice(0, 3)])] // Dédupliquer et limiter
}

/**
 * Vérifie si un titre est bien formaté
 * @param titre - Le titre à vérifier
 * @returns Objet avec les problèmes détectés
 */
export function verifierQualiteTitre(titre: string | null | undefined): {
  estValide: boolean
  probleme: string[]
  suggestions: string[]
} {
  if (!titre) {
    return {
      estValide: false,
      probleme: ['Titre manquant'],
      suggestions: ['Ajoutez un titre descriptif']
    }
  }
  
  const probleme: string[] = []
  const suggestions: string[] = []
  
  // Vérifier la longueur
  if (titre.length < 5) {
    probleme.push('Titre trop court')
    suggestions.push('Ajoutez plus de détails (minimum 5 caractères)')
  }
  
  if (titre.length > 100) {
    probleme.push('Titre trop long')
    suggestions.push('Raccourcissez le titre (maximum 100 caractères)')
  }
  
  // Vérifier si c'est seulement des chiffres
  if (/^\d+$/.test(titre)) {
    probleme.push('Titre numérique seulement')
    suggestions.push('Ajoutez des mots descriptifs')
  }
  
  // Vérifier les caractères spéciaux excessifs
  const caracteresSpeciaux = (titre.match(/[^\w\s]/g) || []).length
  if (caracteresSpeciaux > titre.length * 0.3) {
    probleme.push('Trop de caractères spéciaux')
    suggestions.push('Simplifiez le titre')
  }
  
  // Vérifier si contient des mots-clés de travaux
  const motsCles = extraireMotsCles(titre)
  if (motsCles.length === 0) {
    suggestions.push('Ajoutez des mots-clés de travaux (ex: cuisine, rénovation, carrelage)')
  }
  
  return {
    estValide: probleme.length === 0,
    probleme,
    suggestions
  }
}

/**
 * Améliore automatiquement un titre
 * @param titre - Le titre original
 * @param dossier - Contexte du dossier
 * @returns Le titre amélioré
 */
export function ameliorerTitre(titre: string | null | undefined, dossier: any): string {
  if (!titre) {
    return genererTitreAutomatique(dossier)
  }
  
  const verification = verifierQualiteTitre(titre)
  
  if (verification.estValide) {
    return titre
  }
  
  // Si le titre est trop court, utiliser le titre automatique
  if (titre.length < 5) {
    return genererTitreAutomatique(dossier)
  }
  
  // Sinon, retourner le titre original (l'utilisateur pourra le modifier manuellement)
  return titre
}
