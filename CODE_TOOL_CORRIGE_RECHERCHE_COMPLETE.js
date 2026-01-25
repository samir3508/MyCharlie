// ⚠️ SECTION À REMPLACER DANS LE CODE TOOL
// Cette section corrige les recherches par nom/prénom pour TOUS les modules

// ════════════════════════════════════════════════════════════════════════════
// 👤 SEARCH-CLIENT - VERSION CORRIGÉE
// ════════════════════════════════════════════════════════════════════════════

case 'search-client': {
  const q = payload.query || payload.search || payload.nom || '';
  if (!q) {
    result = { success: false, error: 'VALIDATION_ERROR', message: 'Requête manquante' };
    break;
  }
  
  console.log(`🔍 [search-client] Recherche pour: "${q}"`);
  
  // Détecter le type de recherche
  let searchField = 'nom_complet';
  if (q.includes('@')) {
    searchField = 'email';
  } else if (/^[\d\s\+\-]+$/.test(q)) {
    searchField = 'telephone';
  }
  
  // ✅ AMÉLIORATION : Essayer plusieurs stratégies de recherche
  
  // Stratégie 1 : Recherche exacte (plus rapide si nom complet exact)
  let clientsFound = await supabaseRequest.call(this, 'clients', 'GET', {
    filters: { [searchField]: q },
    limit: 20
  });
  
  // Stratégie 2 : Si aucun résultat, essayer recherche partielle (ilike)
  if (!clientsFound.success || clientsFound.count === 0) {
    console.log('🔍 [search-client] Recherche exacte échouée, essai avec ilike...');
    clientsFound = await supabaseRequest.call(this, 'clients', 'GET', {
      search: { [searchField]: q },
      limit: 20
    });
  }
  
  // Stratégie 3 : Si toujours aucun résultat ET que c'est un nom avec espace
  // Essayer de chercher par nom OU prénom séparément avec une requête OR
  if ((!clientsFound.success || clientsFound.count === 0) && q.includes(' ') && searchField === 'nom_complet') {
    console.log('🔍 [search-client] Recherche ilike échouée, essai avec OR sur nom ET prénom...');
    
    const parts = q.trim().split(/\s+/);
    const prenom = parts[0];
    const nom = parts.slice(1).join(' ');
    
    console.log(`   Prenom: "${prenom}", Nom: "${nom}"`);
    
    // Construire l'URL manuellement avec OR
    // Syntaxe PostgREST : or=(condition1,condition2,condition3)
    // Pour ILIKE : column.ilike.%25value%25
    const orConditions = [
      `nom.ilike.%25${encodeURIComponent(nom)}%25`,
      `prenom.ilike.%25${encodeURIComponent(prenom)}%25`,
      `nom_complet.ilike.%25${encodeURIComponent(q)}%25`
    ].join(',');
    
    const url = `${REST_URL}/clients?tenant_id=eq.${tenant_id}&or=(${orConditions})&select=*&order=created_at.desc&limit=20`;
    
    try {
      const response = await this.helpers.httpRequest({
        method: 'GET',
        url: url,
        headers: headers,
        returnFullResponse: true
      });
      
      const statusCode = (response && response.statusCode) || (response && response.status) || 200;
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      
      if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
        clientsFound = {
          success: true,
          data: data,
          count: data.length
        };
        console.log(`✅ [search-client] Trouvé avec OR: ${data.length} client(s)`);
      }
    } catch (err) {
      console.warn('⚠️ [search-client] Erreur recherche OR:', err.message);
    }
  }
  
  // Retourner le résultat
  result = clientsFound;
  if (result.success) {
    result.message = `${result.count} client(s) trouvé(s) pour "${q}"`;
    result.clients = result.data;
    
    // Log de débogage
    if (result.count > 0) {
      console.log(`✅ [search-client] ${result.count} client(s) trouvé(s):`);
      result.data.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.nom_complet} (${c.email || 'pas d\'email'})`);
      });
    } else {
      console.log(`⚠️ [search-client] Aucun client trouvé pour "${q}"`);
    }
  }
  break;
}

// ════════════════════════════════════════════════════════════════════════════
// 📝 LIST-DEVIS - VERSION CORRIGÉE
// ════════════════════════════════════════════════════════════════════════════

case 'list-devis': {
  const search = payload.search || payload.query || payload.numero || payload.nom || payload.prenom || payload.client_name || payload.client_nom || payload.client_prenom;
  
  if (search) {
    console.log(`🔍 [list-devis] Recherche pour: "${search}"`);
    
    // Détecter si c'est un numéro de devis (format: DV-YYYY-XXXX)
    const isNumero = typeof search === 'string' && (search.match(/^DV-\d{4}-\d{3,4}$/) || search.startsWith('DV-'));
    
    if (isNumero) {
      console.log(`🔍 [list-devis] Recherche par numéro de devis: ${search}`);
      // Recherche par numéro de devis (recherche exacte)
      result = await supabaseRequest.call(this, 'devis', 'GET', {
        search: { numero: search },
        select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
        limit: payload.limit || 50
      });
    } else {
      console.log(`🔍 [list-devis] Recherche par nom/prénom du client: ${search}`);
      
      // Recherche par nom/prénom du client
      // ✅ AMÉLIORATION : Utiliser la recherche client corrigée
      // Essayer d'abord recherche exacte
      let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { nom_complet: search },
        select: 'id',
        limit: 20
      });
      
      // Si aucun résultat, essayer recherche partielle
      if (!clientsResult.success || clientsResult.count === 0) {
        console.log('🔍 [list-devis] Recherche exacte client échouée, essai avec ilike...');
        clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
          search: { nom_complet: search },
          select: 'id',
          limit: 20
        });
      }
      
      // Si toujours aucun résultat et que search contient un espace, essayer OR
      if ((!clientsResult.success || clientsResult.count === 0) && search.includes(' ')) {
        console.log('🔍 [list-devis] Recherche ilike client échouée, essai avec OR...');
        
        const parts = search.trim().split(/\s+/);
        const prenom = parts[0];
        const nom = parts.slice(1).join(' ');
        
        const orConditions = [
          `nom.ilike.%25${encodeURIComponent(nom)}%25`,
          `prenom.ilike.%25${encodeURIComponent(prenom)}%25`,
          `nom_complet.ilike.%25${encodeURIComponent(search)}%25`
        ].join(',');
        
        const url = `${REST_URL}/clients?tenant_id=eq.${tenant_id}&or=(${orConditions})&select=id&order=created_at.desc&limit=20`;
        
        try {
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: url,
            headers: headers,
            returnFullResponse: true
          });
          
          const statusCode = (response && response.statusCode) || (response && response.status) || 200;
          const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
          
          if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
            clientsResult = {
              success: true,
              data: data,
              count: data.length
            };
            console.log(`✅ [list-devis] Client trouvé avec OR: ${data.length} client(s)`);
          }
        } catch (err) {
          console.warn('⚠️ [list-devis] Erreur recherche OR client:', err.message);
        }
      }
      
      if (clientsResult.success && clientsResult.count > 0) {
        console.log(`✅ [list-devis] ${clientsResult.count} client(s) trouvé(s), recherche des devis...`);
        
        // Récupérer les devis de ces clients
        const clientIds = clientsResult.data.map(c => c.id);
        
        if (clientIds.length === 1) {
          // Un seul client, recherche simple
          result = await supabaseRequest.call(this, 'devis', 'GET', {
            filters: { client_id: clientIds[0] },
            select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
            limit: payload.limit || 50,
            order: 'date_creation.desc'
          });
          
          console.log(`✅ [list-devis] ${result.count || 0} devis trouvé(s) pour le client`);
        } else {
          // Plusieurs clients, utiliser in.()
          const clientIdsStr = clientIds.map(id => `"${id}"`).join(',');
          const url = `${REST_URL}/devis?tenant_id=eq.${tenant_id}&client_id=in.(${clientIdsStr})&select=*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)&order=date_creation.desc&limit=${payload.limit || 50}`;
          
          try {
            const response = await this.helpers.httpRequest({
              method: 'GET',
              url: url,
              headers: {
                'apikey': CONFIG.SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              returnFullResponse: true
            });
            
            const statusCode = (response && response.statusCode) || (response && response.status) || 200;
            const responseData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            
            if (statusCode >= 200 && statusCode < 300) {
              result = {
                success: true,
                data: Array.isArray(responseData) ? responseData : [],
                count: Array.isArray(responseData) ? responseData.length : 0,
                message: `${Array.isArray(responseData) ? responseData.length : 0} devis trouvé(s) pour "${search}"`
              };
              
              console.log(`✅ [list-devis] ${result.count} devis trouvé(s) pour ${clientIds.length} clients`);
            } else {
              result = { success: false, error: 'QUERY_ERROR', message: 'Erreur lors de la recherche', data: [] };
            }
          } catch (httpError) {
            console.warn('⚠️ [list-devis] Erreur requête in.(), fallback individuel...');
            // Fallback: chercher devis par client individuellement
            const allDevis = [];
            for (const clientId of clientIds) {
              const clientDevis = await supabaseRequest.call(this, 'devis', 'GET', {
                filters: { client_id: clientId },
                select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
                limit: 50
              });
              if (clientDevis.success && clientDevis.data) {
                allDevis.push(...clientDevis.data);
              }
            }
            result = {
              success: true,
              data: allDevis,
              count: allDevis.length,
              message: `${allDevis.length} devis trouvé(s) pour "${search}"`
            };
            
            console.log(`✅ [list-devis] ${allDevis.length} devis trouvé(s) via fallback`);
          }
        }
      } else {
        // Aucun client trouvé
        result = { 
          success: true, 
          data: [], 
          count: 0, 
          message: `Aucun client trouvé pour "${search}"` 
        };
        console.log(`⚠️ [list-devis] Aucun client trouvé pour "${search}"`);
      }
    }
  } else {
    // Pas de recherche, lister tous les devis
    console.log(`🔍 [list-devis] Liste de tous les devis (sans recherche)`);
    result = await supabaseRequest.call(this, 'devis', 'GET', {
      select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
      limit: payload.limit || 50,
      order: 'date_creation.desc'
    });
  }
  
  if (result.success) {
    result.message = `${result.count} devis trouvé(s)${search ? ` pour "${search}"` : ''}`;
    result.devis = result.data;
  }
  break;
}

// ════════════════════════════════════════════════════════════════════════════
// 💰 LIST-FACTURES - VERSION CORRIGÉE (AJOUTER RECHERCHE PAR NOM)
// ════════════════════════════════════════════════════════════════════════════

case 'list-factures': {
  const search = payload.search || payload.query || payload.numero || payload.nom || payload.prenom || payload.client_name;
  
  if (search) {
    console.log(`🔍 [list-factures] Recherche pour: "${search}"`);
    
    // Détecter si c'est un numéro de facture
    const isNumero = typeof search === 'string' && (search.match(/^FA-\d{4}-\d{3,4}$/) || search.startsWith('FA-'));
    
    if (isNumero) {
      console.log(`🔍 [list-factures] Recherche par numéro: ${search}`);
      // Appeler leo-router avec recherche par numéro
      try {
        const leoRouterUrl = `${CONFIG.SUPABASE_URL}/functions/v1/leo-router`;
        const leoResponse = await this.helpers.httpRequest({
          method: 'POST',
          url: leoRouterUrl,
          headers: {
            'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: {
            action: 'list-factures',
            payload: { numero: search, ...payload },
            tenant_id: tenant_id
          },
          returnFullResponse: true
        });
        
        const statusCode = (leoResponse && leoResponse.statusCode) || (leoResponse && leoResponse.status) || 200;
        const responseData = typeof leoResponse.body === 'string' 
          ? JSON.parse(leoResponse.body) 
          : leoResponse.body;
        
        if (statusCode >= 200 && statusCode < 300) {
          result = {
            success: true,
            message: `${responseData.count || 0} facture(s) trouvée(s)`,
            data: responseData.data || [],
            count: responseData.count || 0,
            factures: responseData.data || []
          };
        } else {
          result = {
            success: false,
            error: responseData.error || 'FACTURES_LIST_ERROR',
            message: responseData.message || 'Erreur lors de la récupération des factures',
            details: responseData
          };
        }
      } catch (leoError) {
        result = {
          success: false,
          error: 'LEO_ROUTER_ERROR',
          message: `Erreur lors de l'appel à leo-router: ${leoError.message}`,
          details: { error: leoError.message, stack: leoError.stack }
        };
      }
    } else {
      console.log(`🔍 [list-factures] Recherche par nom/prénom: ${search}`);
      
      // Recherche par nom/prénom du client (même logique que list-devis)
      // Essayer recherche exacte
      let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { nom_complet: search },
        select: 'id',
        limit: 20
      });
      
      // Essayer ilike
      if (!clientsResult.success || clientsResult.count === 0) {
        clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
          search: { nom_complet: search },
          select: 'id',
          limit: 20
        });
      }
      
      // Essayer OR si nom avec espace
      if ((!clientsResult.success || clientsResult.count === 0) && search.includes(' ')) {
        const parts = search.trim().split(/\s+/);
        const prenom = parts[0];
        const nom = parts.slice(1).join(' ');
        
        const orConditions = [
          `nom.ilike.%25${encodeURIComponent(nom)}%25`,
          `prenom.ilike.%25${encodeURIComponent(prenom)}%25`,
          `nom_complet.ilike.%25${encodeURIComponent(search)}%25`
        ].join(',');
        
        const url = `${REST_URL}/clients?tenant_id=eq.${tenant_id}&or=(${orConditions})&select=id&order=created_at.desc&limit=20`;
        
        try {
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: url,
            headers: headers,
            returnFullResponse: true
          });
          
          const statusCode = (response && response.statusCode) || (response && response.status) || 200;
          const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
          
          if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
            clientsResult = {
              success: true,
              data: data,
              count: data.length
            };
          }
        } catch (err) {
          console.warn('⚠️ [list-factures] Erreur recherche OR client:', err.message);
        }
      }
      
      if (clientsResult.success && clientsResult.count > 0) {
        console.log(`✅ [list-factures] ${clientsResult.count} client(s) trouvé(s), recherche des factures...`);
        
        const clientIds = clientsResult.data.map(c => c.id);
        
        // Appeler leo-router avec les client_ids
        if (clientIds.length === 1) {
          // Un seul client
          try {
            const leoRouterUrl = `${CONFIG.SUPABASE_URL}/functions/v1/leo-router`;
            const leoResponse = await this.helpers.httpRequest({
              method: 'POST',
              url: leoRouterUrl,
              headers: {
                'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
              },
              body: {
                action: 'list-factures',
                payload: { client_id: clientIds[0], ...payload },
                tenant_id: tenant_id
              },
              returnFullResponse: true
            });
            
            const statusCode = (leoResponse && leoResponse.statusCode) || (leoResponse && leoResponse.status) || 200;
            const responseData = typeof leoResponse.body === 'string' 
              ? JSON.parse(leoResponse.body) 
              : leoResponse.body;
            
            if (statusCode >= 200 && statusCode < 300) {
              result = {
                success: true,
                message: `${responseData.count || 0} facture(s) trouvée(s) pour "${search}"`,
                data: responseData.data || [],
                count: responseData.count || 0,
                factures: responseData.data || []
              };
            } else {
              result = {
                success: false,
                error: responseData.error || 'FACTURES_LIST_ERROR',
                message: responseData.message || 'Erreur lors de la récupération des factures',
                details: responseData
              };
            }
          } catch (leoError) {
            result = {
              success: false,
              error: 'LEO_ROUTER_ERROR',
              message: `Erreur lors de l'appel à leo-router: ${leoError.message}`,
              details: { error: leoError.message, stack: leoError.stack }
            };
          }
        } else {
          // Plusieurs clients - récupérer les factures via Supabase directement
          const url = `${REST_URL}/factures?tenant_id=eq.${tenant_id}&client_id=in.(${clientIds.map(id => `"${id}"`).join(',')})&select=*,clients(id,nom,prenom,nom_complet,email,telephone)&order=date_emission.desc&limit=${payload.limit || 50}`;
          
          try {
            const response = await this.helpers.httpRequest({
              method: 'GET',
              url: url,
              headers: {
                'apikey': CONFIG.SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              returnFullResponse: true
            });
            
            const statusCode = (response && response.statusCode) || (response && response.status) || 200;
            const responseData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            
            if (statusCode >= 200 && statusCode < 300) {
              result = {
                success: true,
                data: Array.isArray(responseData) ? responseData : [],
                count: Array.isArray(responseData) ? responseData.length : 0,
                message: `${Array.isArray(responseData) ? responseData.length : 0} facture(s) trouvée(s) pour "${search}"`,
                factures: Array.isArray(responseData) ? responseData : []
              };
            } else {
              result = { success: false, error: 'QUERY_ERROR', message: 'Erreur lors de la recherche', data: [] };
            }
          } catch (httpError) {
            console.warn('⚠️ [list-factures] Erreur requête, appel leo-router par client...');
            // Fallback via leo-router
            const allFactures = [];
            for (const clientId of clientIds) {
              try {
                const leoRouterUrl = `${CONFIG.SUPABASE_URL}/functions/v1/leo-router`;
                const leoResponse = await this.helpers.httpRequest({
                  method: 'POST',
                  url: leoRouterUrl,
                  headers: {
                    'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: {
                    action: 'list-factures',
                    payload: { client_id: clientId },
                    tenant_id: tenant_id
                  },
                  returnFullResponse: true
                });
                
                const statusCode = (leoResponse && leoResponse.statusCode) || 200;
                const responseData = typeof leoResponse.body === 'string' 
                  ? JSON.parse(leoResponse.body) 
                  : leoResponse.body;
                
                if (statusCode >= 200 && statusCode < 300 && responseData.data) {
                  allFactures.push(...responseData.data);
                }
              } catch (err) {
                console.warn(`⚠️ Erreur leo-router pour client ${clientId}:`, err.message);
              }
            }
            result = {
              success: true,
              data: allFactures,
              count: allFactures.length,
              message: `${allFactures.length} facture(s) trouvée(s) pour "${search}"`,
              factures: allFactures
            };
          }
        }
      } else {
        result = { success: true, data: [], count: 0, message: `Aucun client trouvé pour "${search}"`, factures: [] };
      }
    }
  } else {
    // Pas de recherche, appeler leo-router normalement
    try {
      const leoRouterUrl = `${CONFIG.SUPABASE_URL}/functions/v1/leo-router`;
      const leoResponse = await this.helpers.httpRequest({
        method: 'POST',
        url: leoRouterUrl,
        headers: {
          'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: {
          action: 'list-factures',
          payload: payload || {},
          tenant_id: tenant_id
        },
        returnFullResponse: true
      });
      
      const statusCode = (leoResponse && leoResponse.statusCode) || (leoResponse && leoResponse.status) || 200;
      const responseData = typeof leoResponse.body === 'string' 
        ? JSON.parse(leoResponse.body) 
        : leoResponse.body;
      
      if (statusCode >= 200 && statusCode < 300) {
        result = {
          success: true,
          message: `${responseData.count || 0} facture(s) trouvée(s)`,
          data: responseData.data || [],
          count: responseData.count || 0,
          factures: responseData.data || []
        };
      } else {
        result = {
          success: false,
          error: responseData.error || 'FACTURES_LIST_ERROR',
          message: responseData.message || 'Erreur lors de la récupération des factures',
          details: responseData
        };
      }
    } catch (leoError) {
      result = {
        success: false,
        error: 'LEO_ROUTER_ERROR',
        message: `Erreur lors de l'appel à leo-router: ${leoError.message}`,
        details: { error: leoError.message, stack: leoError.stack }
      };
    }
  }
  break;
}

// ════════════════════════════════════════════════════════════════════════════
// 📁 LIST-DOSSIERS - VERSION DÉJÀ CORRIGÉE (GARDER TELLE QUELLE)
// ════════════════════════════════════════════════════════════════════════════
// La version actuelle dans votre code est déjà bonne, ne rien changer

// ════════════════════════════════════════════════════════════════════════════
// 📅 LIST-RDV - AJOUTER RECHERCHE PAR NOM CLIENT
// ════════════════════════════════════════════════════════════════════════════

case 'list-rdv': {
  const search = payload.search || payload.query || payload.nom || payload.prenom || payload.client_name;
  const limit = payload.limit || 50;
  
  if (search) {
    console.log(`🔍 [list-rdv] Recherche pour: "${search}"`);
    
    // Recherche par nom/prénom du client
    // Essayer recherche exacte
    let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
      filters: { nom_complet: search },
      select: 'id',
      limit: 20
    });
    
    // Essayer ilike
    if (!clientsResult.success || clientsResult.count === 0) {
      clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
        search: { nom_complet: search },
        select: 'id',
        limit: 20
      });
    }
    
    // Essayer OR si nom avec espace
    if ((!clientsResult.success || clientsResult.count === 0) && search.includes(' ')) {
      const parts = search.trim().split(/\s+/);
      const prenom = parts[0];
      const nom = parts.slice(1).join(' ');
      
      const orConditions = [
        `nom.ilike.%25${encodeURIComponent(nom)}%25`,
        `prenom.ilike.%25${encodeURIComponent(prenom)}%25`,
        `nom_complet.ilike.%25${encodeURIComponent(search)}%25`
      ].join(',');
      
      const url = `${REST_URL}/clients?tenant_id=eq.${tenant_id}&or=(${orConditions})&select=id&order=created_at.desc&limit=20`;
      
      try {
        const response = await this.helpers.httpRequest({
          method: 'GET',
          url: url,
          headers: headers,
          returnFullResponse: true
        });
        
        const statusCode = (response && response.statusCode) || (response && response.status) || 200;
        const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        
        if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
          clientsResult = {
            success: true,
            data: data,
            count: data.length
          };
        }
      } catch (err) {
        console.warn('⚠️ [list-rdv] Erreur recherche OR client:', err.message);
      }
    }
    
    if (clientsResult.success && clientsResult.count > 0) {
      console.log(`✅ [list-rdv] ${clientsResult.count} client(s) trouvé(s), recherche des RDV...`);
      
      const clientIds = clientsResult.data.map(c => c.id);
      
      if (clientIds.length === 1) {
        result = await supabaseRequest.call(this, 'rdv', 'GET', {
          filters: { client_id: clientIds[0] },
          select: '*,dossiers(titre),clients(id,nom_complet)',
          order: 'date_heure.asc',
          limit: limit
        });
      } else {
        // Plusieurs clients
        const url = `${REST_URL}/rdv?tenant_id=eq.${tenant_id}&client_id=in.(${clientIds.map(id => `"${id}"`).join(',')})&select=*,dossiers(titre),clients(id,nom_complet)&order=date_heure.asc&limit=${limit}`;
        
        try {
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: url,
            headers: headers,
            returnFullResponse: true
          });
          
          const statusCode = (response && response.statusCode) || (response && response.status) || 200;
          const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
          
          if (statusCode >= 200 && statusCode < 300) {
            result = {
              success: true,
              data: Array.isArray(data) ? data : [],
              count: Array.isArray(data) ? data.length : 0
            };
          } else {
            result = { success: false, error: 'QUERY_ERROR', message: 'Erreur lors de la recherche', data: [] };
          }
        } catch (httpError) {
          // Fallback
          const allRdv = [];
          for (const clientId of clientIds) {
            const clientRdv = await supabaseRequest.call(this, 'rdv', 'GET', {
              filters: { client_id: clientId },
              select: '*,dossiers(titre),clients(id,nom_complet)',
              limit: limit
            });
            if (clientRdv.success && clientRdv.data) {
              allRdv.push(...clientRdv.data);
            }
          }
          result = {
            success: true,
            data: allRdv,
            count: allRdv.length
          };
        }
      }
    } else {
      result = { success: true, data: [], count: 0, message: `Aucun client trouvé pour "${search}"` };
    }
  } else {
    // Pas de recherche
    result = await supabaseRequest.call(this, 'rdv', 'GET', {
      select: '*,dossiers(titre),clients(id,nom_complet)',
      order: 'date_heure.asc',
      limit: limit
    });
  }
  
  if (result.success) {
    result.message = `${result.count} RDV trouvé(s)${search ? ` pour "${search}"` : ''}`;
    result.rdv = result.data;
  }
  break;
}
