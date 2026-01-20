// ============================================================================
// 🔧 SECTION À REMPLACER DANS supabaseRequest
// ============================================================================
// Copiez ce code dans votre Code Tool N8N
// ============================================================================

// ════════════════════════════════════════════════════════════════════════════
// CONTEXTE : Fonction supabaseRequest
// ════════════════════════════════════════════════════════════════════════════

async function supabaseRequest(table, method, options = {}) {
  // ... code avant ...
  
  // Filtres additionnels
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          queryParams.push(`${key}=is.${value}`);
        } else {
          queryParams.push(`${key}=eq.${value}`);
        }
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // ❌ À REMPLACER : Section Recherche (INCORRECTE)
  // ════════════════════════════════════════════════════════════════════════
  
  // Recherche
  if (options.search) {
    for (const [key, value] of Object.entries(options.search)) {
      if (value) {
        queryParams.push(`${key}=ilike.*${encodeURIComponent(value)}*`);  // ❌ INCORRECT
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // ✅ REMPLACER PAR : Section Recherche (CORRIGÉE)
  // ════════════════════════════════════════════════════════════════════════
  
  // Recherche
  if (options.search) {
    for (const [key, value] of Object.entries(options.search)) {
      if (value) {
        // Détecter si c'est un numéro de devis/facture/dossier (format: DV-YYYY-XXXX, FA-YYYY-XXXX, etc.)
        const isNumero = key === 'numero' || 
                        (typeof value === 'string' && value.match(/^(DV|FA|DOS|FAC)-/));
        
        if (isNumero) {
          // Recherche exacte pour les numéros (identifiants uniques)
          queryParams.push(`${key}=eq.${encodeURIComponent(value)}`);
          console.log(`🔍 Recherche exacte (eq) pour ${key}: ${value}`);
        } else {
          // Recherche "contient" pour les textes (syntaxe PostgREST correcte)
          queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
          console.log(`🔍 Recherche partielle (ilike) pour ${key}: ${value}`);
        }
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // SUITE DU CODE (reste identique)
  // ════════════════════════════════════════════════════════════════════════
  
  // Select (seulement pour GET)
  if (method === 'GET') {
    queryParams.push(`select=${options.select || '*'}`);
  }
  
  // ... reste du code ...
