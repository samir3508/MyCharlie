/**
 * Utilitaires pour améliorer l'affichage et la gestion des titres
 */

/**
 * Nettoie un titre pour corriger les problèmes d'encodage
 * @param titre - Le titre à nettoyer
 * @returns Le titre nettoyé
 */
export function nettoyerTitre(titre: string | null | undefined): string {
  if (!titre) return 'Sans titre'
  
  // Remplacer les caractères bizarres courants
  let titreNettoye = titre
    .replace(/[^\x20-\x7EÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝýÿÇçÑñ]/g, '?') // Garder caractères latins de base
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim()
  
  // Si le titre contient beaucoup de caractères bizarres, le remplacer
  const caracteresBizarres = (titreNettoye.match(/[^\x20-\x7EÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝýÿÇçÑñ]/g) || []).length
  
  if (caracteresBizarres > titreNettoye.length * 0.3) {
    // Si plus de 30% de caractères bizarres, générer un titre automatique
    return 'Dossier - Titre à corriger'
  }
  
  return titreNettoye
}

/**
 * Formate un titre pour l'affichage en limitant la longueur
 * @param titre - Le titre à formater
 * @param maxLength - Longueur maximale souhaitée
 * @returns Le titre formaté
 */
export function formatTitreAffichage(titre: string | null | undefined, maxLength: number = 40): string {
  if (!titre) return 'Sans titre'
  
  // D'abord nettoyer le titre
  const titreNettoye = nettoyerTitre(titre)
  
  if (titreNettoye.length <= maxLength) {
    return titreNettoye
  }
  
  return `${titreNettoye.substring(0, maxLength)}...`
}

/**
 * Génère un titre automatique pour un dossier basé sur les informations disponibles
 * @param dossier - Les informations du dossier
 * @returns Un titre suggéré
 */
export function genererTitreAutomatique(dossier: {
  type_travaux?: string | null
  adresse_chantier?: string | null
  clients?: { nom_complet?: string | null; nom?: string | null; prenom?: string | null } | null
  description?: string | null
  statut?: string | null
}): string {
  const { type_travaux, adresse_chantier, clients, description, statut } = dossier
  
  // Extraire le nom du client
  let nomClient = clients?.nom_complet || 
    (clients?.prenom && clients?.nom ? `${clients.prenom} ${clients.nom}`.trim() : null) ||
    clients?.nom || 
    null

  // Ignorer les noms invalides (instructions mal parsées: "moi le", "fais moi", etc.)
  const motsInterdits = [
    'moi', 'le', 'la', 'les', 'lui', 'elle', 'un', 'une', 'des', 'du', 'de',
    'fais', 'fait', 'faire', 'c\'est', 'cest', 'oui', 'non', 'ok', 'dossier',
    'travaux', 'client', 'merci', 'svp', 'stp', 's\'il te plaît', 's\'il vous plaît'
  ]
  const estNomValide = (nom: string | null): boolean => {
    if (!nom || typeof nom !== 'string') return false
    const n = nom.trim()
    if (n.length < 3) return false
    const nLower = n.toLowerCase()
    // Exactement un mot interdit
    if (motsInterdits.includes(nLower)) return false
    // Commence par "moi " / "fais moi" etc.
    if (/^(moi\s|fais\s|fait\s|faire\s|c\'?est\s)/i.test(n)) return false
    // Que des mots interdits (ex: "moi le")
    const mots = nLower.split(/\s+/).filter(Boolean)
    if (mots.length > 0 && mots.every(m => motsInterdits.includes(m))) return false
    return true
  }
  if (nomClient && !estNomValide(nomClient)) {
    nomClient = null
  }

  // Fonction pour extraire la ville d'une adresse
  const extraireVille = (adresse: string): string => {
    // Chercher un code postal (5 chiffres) suivi d'une ville
    const match = adresse.match(/\d{5}\s+([A-Za-zÀ-ÿ\s-]+)/i)
    if (match && match[1]) {
      return match[1].trim()
    }
    // Sinon, prendre le dernier élément après la dernière virgule
    const parties = adresse.split(',').map(p => p.trim())
    if (parties.length > 1) {
      return parties[parties.length - 1]
    }
    // Sinon, prendre le premier élément
    return parties[0]
  }

  // Fonction pour normaliser le type de travaux
  const normaliserTypeTravaux = (type: string): string => {
    const typeLower = type.toLowerCase().trim()
    
    // Mots-clés de travaux courants
    const typesTravaux: Record<string, string> = {
      'cuisine': 'Rénovation cuisine',
      'salle de bain': 'Rénovation salle de bain',
      'sdb': 'Rénovation salle de bain',
      'salle bain': 'Rénovation salle de bain',
      'peinture': 'Peinture',
      'carrelage': 'Carrelage',
      'parquet': 'Pose parquet',
      'plomberie': 'Travaux plomberie',
      'électricité': 'Travaux électricité',
      'electricite': 'Travaux électricité',
      'isolation': 'Isolation',
      'chauffage': 'Installation chauffage',
      'fenêtre': 'Remplacement fenêtres',
      'fenetre': 'Remplacement fenêtres',
      'porte': 'Remplacement portes',
      'toit': 'Travaux toiture',
      'toiture': 'Travaux toiture',
      'façade': 'Rénovation façade',
      'facade': 'Rénovation façade',
      'terrasse': 'Aménagement terrasse',
      'balcon': 'Aménagement balcon',
      'extension': 'Extension',
      'rénovation': 'Rénovation',
      'renovation': 'Rénovation',
      'construction': 'Construction',
      'aménagement': 'Aménagement',
      'amenagement': 'Aménagement',
      'décoration': 'Décoration',
      'decoration': 'Décoration',
    }

    // Chercher une correspondance exacte ou partielle
    for (const [key, value] of Object.entries(typesTravaux)) {
      if (typeLower.includes(key) || key.includes(typeLower)) {
        return value
      }
    }

    // Si pas de correspondance, capitaliser la première lettre
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  }

  // Priorité 1: Type de travaux + Client (le plus descriptif)
  if (type_travaux && nomClient) {
    const typeNormalise = normaliserTypeTravaux(type_travaux)
    return `${typeNormalise} - ${nomClient}`
  }

  // Priorité 2: Type de travaux + Ville
  if (type_travaux && adresse_chantier) {
    const typeNormalise = normaliserTypeTravaux(type_travaux)
    const ville = extraireVille(adresse_chantier)
    return `${typeNormalise} - ${ville}`
  }

  // Priorité 3: Type de travaux seul
  if (type_travaux) {
    return normaliserTypeTravaux(type_travaux)
  }

  // Priorité 4: Extraire type de travaux depuis la description
  if (description) {
    const descLower = description.toLowerCase()
    const motsClesTravaux = [
      'cuisine', 'salle de bain', 'sdb', 'peinture', 'carrelage', 'parquet',
      'plomberie', 'électricité', 'electricite', 'isolation', 'chauffage',
      'fenêtre', 'fenetre', 'porte', 'toit', 'toiture', 'façade', 'facade',
      'terrasse', 'balcon', 'extension', 'rénovation', 'renovation',
      'construction', 'aménagement', 'amenagement', 'décoration', 'decoration'
    ]

    for (const motCle of motsClesTravaux) {
      if (descLower.includes(motCle)) {
        const typeNormalise = normaliserTypeTravaux(motCle)
        if (nomClient) {
          return `${typeNormalise} - ${nomClient}`
        }
        if (adresse_chantier) {
          const ville = extraireVille(adresse_chantier)
          return `${typeNormalise} - ${ville}`
        }
        return typeNormalise
      }
    }
  }

  // Priorité 5: Client + "Travaux"
  if (nomClient) {
    return `Travaux ${nomClient}`
  }

  // Priorité 6: Adresse chantier
  if (adresse_chantier) {
    const ville = extraireVille(adresse_chantier)
    return `Travaux ${ville}`
  }

  // Priorité 7: Basé sur le statut
  if (statut) {
    const statutLabels: Record<string, string> = {
      'contact_recu': 'Nouveau contact',
      'qualification': 'Projet en qualification',
      'rdv_a_planifier': 'RDV à planifier',
      'rdv_planifie': 'RDV planifié',
      'rdv_confirme': 'RDV confirmé',
      'visite_realisee': 'Visite réalisée',
      'devis_en_cours': 'Devis en préparation',
      'devis_pret': 'Devis prêt',
      'devis_envoye': 'Devis envoyé',
      'en_negociation': 'En négociation',
      'signe': 'Projet signé',
      'chantier_en_cours': 'Chantier en cours',
      'chantier_termine': 'Chantier terminé',
    }
    return statutLabels[statut] || 'Nouveau dossier'
  }

  // Par défaut
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
