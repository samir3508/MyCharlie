// ============================================================================
// 🤖 TOOL SUPABASE POUR CHARLIE & LÉO - VERSION N8N (CORRIGÉ)
// ============================================================================
// CORRECTION APPLIQUÉE : Section "Recherche" dans supabaseRequest
// ============================================================================

// ... (tout le code avant la fonction supabaseRequest reste identique) ...

async function supabaseRequest(table, method, options = {}) {
  // Vérifier que this.helpers.httpRequest existe
  if (!this || !this.helpers || typeof this.helpers.httpRequest !== 'function') {
    return {
      success: false,
      error: 'HTTP_REQUEST_UNAVAILABLE',
      message: 'this.helpers.httpRequest n\'est pas disponible dans ce contexte n8n',
      data: [],
      count: 0
    };
  }
  let url = `${REST_URL}/${table}`;
  const queryParams = [];
  
  // Filtre tenant_id
  if (options.filterTenant !== false) {
    queryParams.push(`tenant_id=eq.${tenant_id}`);
  }
  
  // Filtres additionnels
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null) {
        // Pour les booléens, PostgREST utilise is.true ou is.false
        if (typeof value === 'boolean') {
          queryParams.push(`${key}=is.${value}`);
        } else {
          queryParams.push(`${key}=eq.${value}`);
        }
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // 🔧 SECTION CORRIGÉE : Recherche
  // ════════════════════════════════════════════════════════════════════════
  // ❌ ANCIEN CODE (à remplacer) :
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
  
  // ✅ NOUVEAU CODE (à utiliser) :
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
  // ════════════════════════════════════════════════════════════════════════
  
  // Select (seulement pour GET)
  if (method === 'GET') {
    queryParams.push(`select=${options.select || '*'}`);
  }
  
  // Order
  if (options.order) {
    queryParams.push(`order=${options.order}`);
  } else if (method === 'GET') {
    queryParams.push('order=created_at.desc');
  }
  
  // Limit
  if (options.limit) {
    queryParams.push(`limit=${options.limit}`);
  }
  
  // ... (le reste du code reste identique) ...
