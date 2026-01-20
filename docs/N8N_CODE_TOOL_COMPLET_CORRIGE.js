// ============================================================================
// 🤖 TOOL SUPABASE POUR CHARLIE & LÉO - VERSION N8N (CORRIGÉ)
// ============================================================================
// 
// ⚠️  INSTRUCTIONS IMPORTANTES :
// 
// Ce fichier contient UNIQUEMENT la section corrigée de la fonction supabaseRequest.
// Le code complet fait plusieurs milliers de lignes.
// 
// POUR APPLIQUER LA CORRECTION :
// 
// 1. Copiez TOUT votre code actuel du Code Tool dans N8N
// 2. Recherchez la fonction supabaseRequest
// 3. Localisez la section "// Recherche" (environ ligne 200-210)
// 4. Remplacez cette section par le code ci-dessous
// 
// ============================================================================
// 🔧 SECTION À REMPLACER DANS supabaseRequest
// ============================================================================

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
// ✅ FIN DE LA SECTION CORRIGÉE
// ============================================================================

// Le reste du code reste identique.
// Copiez ce code dans la section 'Recherche' de supabaseRequest dans votre Code Tool N8N.
