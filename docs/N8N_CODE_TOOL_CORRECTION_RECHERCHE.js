// ============================================================================
// 🔧 CORRECTION : Fonction supabaseRequest - Section Recherche
// ============================================================================
// À copier dans le Code Tool du workflow N8N
// Remplace uniquement la section "Recherche" de la fonction supabaseRequest
// ============================================================================

// ⚠️ REMPLACER CETTE SECTION dans la fonction supabaseRequest du Code Tool :

// ❌ ANCIEN CODE (INCORRECT) :
/*
  // Recherche
  if (options.search) {
    for (const [key, value] of Object.entries(options.search)) {
      if (value) {
        queryParams.push(`${key}=ilike.*${encodeURIComponent(value)}*`);  // ❌ INCORRECT
      }
    }
  }
*/

// ✅ NOUVEAU CODE (CORRECT) :
  // Recherche
  if (options.search) {
    for (const [key, value] of Object.entries(options.search)) {
      if (value) {
        // Détecter si c'est un numéro de devis/facture/dossier (format: DV-YYYY-XXXX, FA-YYYY-XXXX, etc.)
        // Les numéros sont des identifiants uniques, donc on utilise une recherche exacte (eq)
        const isNumero = key === 'numero' || 
                        (typeof value === 'string' && value.match(/^(DV|FA|DOS|FAC)-/));
        
        if (isNumero) {
          // Recherche exacte pour les numéros (identifiants uniques)
          // Syntaxe PostgREST : column=eq.value
          queryParams.push(`${key}=eq.${encodeURIComponent(value)}`);
          console.log(`🔍 Recherche exacte (eq) pour ${key}: ${value}`);
        } else {
          // Recherche "contient" pour les textes
          // Syntaxe PostgREST correcte : column=ilike.%25value%25
          // %25 est l'encodage URL de % (pour LIKE '%value%')
          queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
          console.log(`🔍 Recherche partielle (ilike) pour ${key}: ${value}`);
        }
      }
    }
  }

// ============================================================================
// 📝 INSTRUCTIONS D'APPLICATION
// ============================================================================
//
// 1. Ouvrir le workflow N8N dans l'éditeur
// 2. Localiser le nœud "Code Tool" (ou "Code Tool1")
// 3. Ouvrir le code JavaScript du nœud
// 4. Rechercher la fonction "supabaseRequest"
// 5. Localiser la section "// Recherche" (environ ligne 200-210)
// 6. Remplacer la section "Recherche" par le code ci-dessus
// 7. Sauvegarder le workflow
// 8. Tester avec l'action "envoyer-devis" et un numéro de devis
//
// ============================================================================
// 🧪 TEST
// ============================================================================
//
// Après la correction, tester avec :
//
// {
//   "action": "envoyer-devis",
//   "payload": {
//     "devis_id": "DV-2026-0023",
//     "recipient_email": "adlbapp4@gmail.com"
//   },
//   "tenant_id": "4370c96b-2fda-4c4f-a8b5-476116b8f2fc"
// }
//
// Le devis devrait être trouvé et l'email envoyé avec succès.
//
// ============================================================================
// 📌 NOTES IMPORTANTES
// ============================================================================
//
// 1. Recherche exacte (eq) :
//    - Utilisée pour les identifiants uniques (numéros de devis, factures, dossiers)
//    - Plus rapide et plus précise
//    - Syntaxe : column=eq.value
//
// 2. Recherche partielle (ilike) :
//    - Utilisée pour les recherches textuelles (noms, descriptions, etc.)
//    - Syntaxe PostgREST correcte : column=ilike.%25value%25
//    - %25 = % encodé en URL (pour LIKE '%value%')
//
// 3. Détection automatique :
//    - Si la clé est 'numero' OU si la valeur commence par 'DV-', 'FA-', 'DOS-', 'FAC-'
//    → Utilise 'eq' (recherche exacte)
//    - Sinon
//    → Utilise 'ilike.%25value%25' (recherche partielle)
//
// ============================================================================
