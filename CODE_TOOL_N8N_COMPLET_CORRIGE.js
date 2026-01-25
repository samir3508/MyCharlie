// ============================================================================
// 🤖 TOOL SUPABASE POUR CHARLIE & LÉO - VERSION N8N V3 (CORRIGÉ)
// ============================================================================
// Ce code utilise this.helpers.httpRequest() directement sur l'API REST
// avec la fonction supabaseRequest CORRIGÉE pour la recherche de devis
// ✅ VERSION COMPLÈTE avec recherche par nom/prénom corrigée pour TOUT
// ============================================================================

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

// ⚠️ Récupération de la variable d'environnement n8n si disponible
// Dans n8n, les variables d'environnement sont accessibles via $env
// Mais dans un Code Tool, on doit les passer explicitement ou utiliser une valeur par défaut

// ⚠️ URL de production : Application déployée sur mycharlie.fr
// Pour le développement local, configurez APP_URL dans n8n $env ou utilisez ngrok
let appUrl = 'https://mycharlie.fr'; // URL de production par défaut

// Essayer de récupérer depuis $env si disponible (dans n8n) - permet de surcharger pour le dev local
try {
  if (typeof $env !== 'undefined' && $env.APP_URL) {
    appUrl = $env.APP_URL;
  }
} catch (e) {
  // $env n'est pas disponible, utiliser la valeur par défaut (production)
}

const CONFIG = {
  SUPABASE_URL: 'https://lawllirgeisuvanbvkcr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTY2MzcsImV4cCI6MjA4MzgzMjYzN30.szrUnHY8jKJc6kzP18qPUKG5Ny5s8wmTsIksi172rI0',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1NjYzNywiZXhwIjoyMDgzODMyNjM3fQ.3OR8IDsOtr8g854NlVOM_Lp1kuJhuKIuo8zNZGM4Fuo',
  APP_URL: appUrl,
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: ''
};

// Essayer de récupérer les credentials Google depuis $env si disponible
try {
  if (typeof $env !== 'undefined') {
    if ($env.GOOGLE_CLIENT_ID) CONFIG.GOOGLE_CLIENT_ID = $env.GOOGLE_CLIENT_ID;
    if ($env.GOOGLE_CLIENT_SECRET) CONFIG.GOOGLE_CLIENT_SECRET = $env.GOOGLE_CLIENT_SECRET;
  }
} catch (e) {
  // Ignorer si $env n'est pas disponible
}

const REST_URL = `${CONFIG.SUPABASE_URL}/rest/v1`;

// ════════════════════════════════════════════════════════════════════════════
// VÉRIFICATION DU CONTEXTE N8N
// ════════════════════════════════════════════════════════════════════════════

if (typeof this === 'undefined' || !this.helpers || typeof this.helpers.httpRequest !== 'function') {
  return JSON.stringify({
    success: false,
    error: 'CONTEXT_ERROR',
    message: 'this.helpers.httpRequest n\'est pas disponible. Ce code doit être utilisé dans un Code Tool n8n.',
    data: [],
    count: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// RÉCUPÉRATION DES PARAMÈTRES
// ════════════════════════════════════════════════════════════════════════════

let input;
if (typeof query === 'string') {
  try {
    input = JSON.parse(query);
  } catch (e) {
    input = { action: query };
  }
} else {
  input = query || {};
}

let contextData = {};
try {
  if (typeof $input !== 'undefined' && $input.first) {
    const firstItem = $input.first();
    if (firstItem && firstItem.json) {
      contextData = firstItem.json;
    }
  }
} catch (e) {
  // Ignorer si $input n'est pas disponible
}

let mergedPayload = {
  ...contextData,
  ...input,
  ...(input.payload || input.data || {})
};

function reconstructArray(obj, key) {
  if (obj[key] && Array.isArray(obj[key])) {
    return obj[key];
  }
  
  const arrayItems = [];
  let index = 0;
  while (obj[`${key}[${index}]`] !== undefined) {
    arrayItems.push(obj[`${key}[${index}]`]);
    index++;
  }
  
  if (arrayItems.length > 0) {
    console.log(`🔄 [Reconstruction] Tableau ${key} reconstruit depuis les indices [0] à [${index - 1}]: ${arrayItems.length} éléments`);
    return arrayItems;
  }
  
  if (obj.payload && obj.payload[key] && Array.isArray(obj.payload[key])) {
    console.log(`🔄 [Reconstruction] Tableau ${key} trouvé dans payload.payload`);
    return obj.payload[key];
  }
  
  if (obj.payload) {
    const payloadArrayItems = [];
    let payloadIndex = 0;
    while (obj.payload[`${key}[${payloadIndex}]`] !== undefined) {
      payloadArrayItems.push(obj.payload[`${key}[${payloadIndex}]`]);
      payloadIndex++;
    }
    if (payloadArrayItems.length > 0) {
      console.log(`🔄 [Reconstruction] Tableau ${key} reconstruit depuis payload.payload indices: ${payloadArrayItems.length} éléments`);
      return payloadArrayItems;
    }
  }
  
  return obj[key];
}

const arraysToReconstruct = ['creneaux', 'travaux', 'lignes', 'clients', 'devis', 'factures'];
const payload = { ...mergedPayload };

for (const arrayKey of arraysToReconstruct) {
  if (mergedPayload[arrayKey] !== undefined || Object.keys(mergedPayload).some(k => k.startsWith(`${arrayKey}[`))) {
    const reconstructed = reconstructArray(mergedPayload, arrayKey);
    if (reconstructed !== undefined) {
      payload[arrayKey] = reconstructed;
      let index = 0;
      while (mergedPayload[`${arrayKey}[${index}]`] !== undefined) {
        delete payload[`${arrayKey}[${index}]`];
        index++;
      }
    }
  }
}

const action = (input.action || '').toLowerCase().trim();

const contextTenantId = (contextData.body && contextData.body.context && contextData.body.context.tenant_id) 
  || contextData.tenant_id;
const inputTenantId = input.tenant_id || payload.tenant_id;
const tenant_id = contextTenantId || inputTenantId;

if (contextTenantId && inputTenantId && contextTenantId !== inputTenantId) {
  console.warn(`⚠️ ATTENTION : L'IA a fourni un tenant_id différent (${inputTenantId}) du contexte (${contextTenantId}). Utilisation du tenant_id du contexte pour garantir la sécurité.`);
}

if (tenant_id) {
  const source = (contextData.body && contextData.body.context && contextData.body.context.tenant_id) ? 'contextData.body.context.tenant_id'
    : contextData.tenant_id ? 'contextData.tenant_id'
    : input.tenant_id ? 'input.tenant_id'
    : 'payload.tenant_id';
  console.log(`✅ Tenant ID utilisé: ${tenant_id} (source: ${source})`);
} else {
  console.warn('⚠️ Aucun tenant_id trouvé dans les sources disponibles');
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════════════════

if (!action) {
  return JSON.stringify({
    success: false,
    error: 'ACTION_MISSING',
    message: 'Aucune action spécifiée',
    data: [],
    count: 0,
    debug: {
      input: input,
      query: typeof query !== 'undefined' ? query : 'undefined',
      payload: payload
    }
  });
}

if (!tenant_id) {
  return JSON.stringify({
    success: false,
    error: 'TENANT_ID_MISSING',
    message: 'Le tenant_id est obligatoire. Il doit être fourni via contextData.body.context.tenant_id, contextData.tenant_id, input.tenant_id ou payload.tenant_id',
    data: [],
    count: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HEADERS
// ════════════════════════════════════════════════════════════════════════════

const headers = {
  'apikey': CONFIG.SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// ════════════════════════════════════════════════════════════════════════════
// FONCTION HTTP (utilise this.helpers.httpRequest de n8n)
// ════════════════════════════════════════════════════════════════════════════

async function supabaseRequest(table, method, options = {}) {
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
  
  if (options.filterTenant !== false) {
    queryParams.push(`tenant_id=eq.${tenant_id}`);
  }
  
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
  
  if (options.search) {
    for (const [key, value] of Object.entries(options.search)) {
      if (value !== undefined && value !== null && value !== '') {
        const isNumero = key === 'numero' || 
                        (typeof value === 'string' && value.match(/^(DV|FA|DOS|FAC)-/));
        
        if (isNumero) {
          const encodedValue = encodeURIComponent(value);
          queryParams.push(`${key}=eq.${encodedValue}`);
          console.log(`🔍 Recherche exacte (eq) pour ${key}: ${value} (encodé: ${encodedValue})`);
        } else {
          queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
          console.log(`🔍 Recherche partielle (ilike) pour ${key}: ${value}`);
        }
      }
    }
  }
  
  if (method === 'GET') {
    queryParams.push(`select=${options.select || '*'}`);
  }
  
  if (options.order) {
    queryParams.push(`order=${options.order}`);
  } else if (method === 'GET') {
    queryParams.push('order=created_at.desc');
  }
  
  if (options.limit) {
    queryParams.push(`limit=${options.limit}`);
  }
  
  if (queryParams.length > 0) {
    url += '?' + queryParams.join('&');
  }
  
  let body = undefined;
  if ((method === 'POST' || method === 'PATCH') && options.body) {
    body = { ...options.body };
    if (options.addTenantId !== false && !body.tenant_id) {
      body.tenant_id = tenant_id;
    }
  }
  
  try {
    const requestOptions = {
      method,
      url,
      headers,
      returnFullResponse: true,
      ignoreHttpStatusErrors: true
    };
    
    if ((method === 'POST' || method === 'PATCH') && body) {
      requestOptions.body = body;
    }
    
    const response = await this.helpers.httpRequest(requestOptions);
    
    if (!response) {
      return {
        success: false,
        error: 'RESPONSE_ERROR',
        message: 'Réponse vide de l\'API Supabase',
        data: [],
        count: 0
      };
    }
    
    const statusCode = (response && response.statusCode) || (response && response.status) || 200;
    
    let data = null;
    if (response && response.body !== undefined) {
      data = response.body;
    } else if (response && !response.statusCode && !response.status) {
      data = response;
    }
    
    if (typeof data === 'string' && data.trim()) {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }
    }
    
    if (data === null || data === undefined) {
      if (method === 'PATCH' || method === 'DELETE') {
        return {
          success: statusCode >= 200 && statusCode < 300,
          data: [],
          count: 0,
          statusCode: statusCode
        };
      }
      return {
        success: false,
        error: 'DATA_ERROR',
        message: 'Données vides dans la réponse',
        data: [],
        count: 0,
        statusCode: statusCode
      };
    }
    
    if (statusCode >= 200 && statusCode < 300) {
      const dataArray = Array.isArray(data) ? data : (data ? [data] : []);
      return {
        success: true,
        data: dataArray,
        count: dataArray.length
      };
    } else {
      return {
        success: false,
        error: (data && typeof data === 'object' && data.code) || 'API_ERROR',
        message: (data && typeof data === 'object' && data.message) || `Erreur HTTP ${statusCode}`,
        details: data,
        data: [],
        count: 0,
        statusCode: statusCode
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'REQUEST_ERROR',
      message: error.message || 'Erreur lors de la requête HTTP',
      details: error.toString(),
      data: [],
      count: 0
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ════════════════════════════════════════════════════════════════════════════

function formatPhone(phone) {
  if (!phone) return null;
  return phone.replace(/[\s\-\.\(\)]/g, '');
}

function parseNomComplet(nomComplet) {
  if (!nomComplet) return { nom: '', prenom: '' };
  const parts = nomComplet.trim().split(/\s+/);
  if (parts.length === 1) return { nom: parts[0], prenom: '' };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

async function generateNumero(type = 'DV') {
  const year = new Date().getFullYear();
  let prefix, table;
  
  if (type === 'FA') {
    prefix = 'FA';
    table = 'factures';
  } else if (type === 'DOS') {
    prefix = 'DOS';
    table = 'dossiers';
  } else {
    prefix = 'DV';
    table = 'devis';
  }
  
  const searchPattern = `${prefix}-${year}-`;
  
  const result = await supabaseRequest.call(this, table, 'GET', {
    select: 'numero',
    order: 'numero.desc',
    limit: 1000
  });
  
  let maxNum = 0;
  
  if (result.success && result.data && result.data.length > 0) {
    for (const item of result.data) {
      if (item.numero && item.numero.startsWith(searchPattern)) {
        const numPart = item.numero.substring(searchPattern.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  
  const nextNum = maxNum + 1;
  return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
}

async function findTemplateByMontant(montantTTC) {
  const templatesResult = await supabaseRequest.call(this, 'templates_conditions_paiement', 'GET', {
    select: 'id,nom,montant_min,montant_max,is_default',
    order: 'montant_min.asc'
  });
  
  if (!templatesResult.success || !templatesResult.data || templatesResult.data.length === 0) {
    return null;
  }
  
  const templates = templatesResult.data;
  
  for (const template of templates) {
    const montantMin = parseFloat(template.montant_min || 0);
    const montantMax = template.montant_max ? parseFloat(template.montant_max) : null;
    
    if (montantTTC >= montantMin && (montantMax === null || montantTTC < montantMax)) {
      return template.id;
    }
  }
  
  const defaultTemplate = templates.find(t => t.is_default === true);
  if (defaultTemplate) {
    return defaultTemplate.id;
  }
  
  return templates[0]?.id || null;
}

// ════════════════════════════════════════════════════════════════════════════
// MAPPING ACTIONS
// ════════════════════════════════════════════════════════════════════════════

const ACTION_MAP = {
  'creer-client': 'create-client', 'créer-client': 'create-client',
  'ajouter-client': 'create-client', 'nouveau-client': 'create-client',
  'chercher-client': 'search-client', 'rechercher-client': 'search-client', 'search-client': 'search-client',
  'lister-clients': 'list-clients', 'liste-clients': 'list-clients', 'list-clients': 'list-clients',
  'obtenir-client': 'get-client', 'get-client': 'get-client',
  'modifier-client': 'update-client', 'update-client': 'update-client',
  'supprimer-client': 'delete-client', 'delete-client': 'delete-client',
  'creer-devis': 'create-devis', 'créer-devis': 'create-devis', 'create-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis', 'ajouter-lignes-devis': 'add-ligne-devis', 'add-ligne-devis': 'add-ligne-devis',
  'modifier-ligne-devis': 'update-ligne-devis', 'update-ligne-devis': 'update-ligne-devis',
  'supprimer-ligne-devis': 'delete-ligne-devis', 'delete-ligne-devis': 'delete-ligne-devis',
  'finaliser-devis': 'finalize-devis', 'finalize-devis': 'finalize-devis',
  'terminer-devis': 'finalize-devis',
  'lister-devis': 'list-devis', 'liste-devis': 'list-devis', 'list-devis': 'list-devis',
  'obtenir-devis': 'get-devis', 'voir-devis': 'get-devis', 'get-devis': 'get-devis',
  'modifier-devis': 'update-devis', 'update-devis': 'update-devis',
  'supprimer-devis': 'delete-devis', 'delete-devis': 'delete-devis',
  'generer-pdf': 'generate-pdf', 'generate-pdf': 'generate-pdf', 'générer-pdf': 'generate-pdf',
  'envoyer-devis': 'envoyer-devis', 'send-devis': 'envoyer-devis',
  'creer-facture': 'create-facture', 'create-facture': 'create-facture',
  'creer-facture-depuis-devis': 'creer-facture-depuis-devis',
  'créer-facture-depuis-devis': 'creer-facture-depuis-devis',
  'facture-depuis-devis': 'creer-facture-depuis-devis',
  'obtenir-facture': 'get-facture', 'get-facture': 'get-facture',
  'voir-facture': 'get-facture',
  'lister-factures': 'list-factures', 'list-factures': 'list-factures',
  'creer-dossier': 'create-dossier',
  'lister-dossiers': 'list-dossiers',
  'creer-rdv': 'create-rdv',
  'lister-rdv': 'list-rdv',
  'statistiques': 'stats', 'stats': 'stats'
};

const normalizedAction = ACTION_MAP[action] || action;

// ════════════════════════════════════════════════════════════════════════════
// EXÉCUTION
// ════════════════════════════════════════════════════════════════════════════

let result = {
  success: false,
  error: 'NOT_STARTED',
  message: 'Exécution non démarrée',
  data: [],
  count: 0
};

try {
  switch (normalizedAction) {
    
    // ═══════════════════════════════════════════════════════════════════════
    // 👤 CLIENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'create-client': {
      let nom = payload.nom || input.nom || contextData.nom || payload.name || contextData.name;
      let prenom = payload.prenom || input.prenom || contextData.prenom;
      let nom_complet = payload.nom_complet || input.nom_complet || contextData.nom_complet || payload.name || contextData.name;
      let email = payload.email || input.email || contextData.email;
      let telephone = payload.telephone || input.telephone || contextData.telephone || payload.phone || contextData.phone;
      let adresse_facturation = payload.adresse_facturation || input.adresse_facturation || contextData.adresse_facturation || payload.address || contextData.address;
      let type = payload.type || input.type || contextData.type || payload.type_client || contextData.type_client || 'particulier';
      
      const bodyClient = (input.body && input.body.client) || (contextData.body && contextData.body.client) || (payload.body && payload.body.client);
      if (bodyClient) {
        nom = nom || bodyClient.nom;
        prenom = prenom || bodyClient.prenom;
        nom_complet = nom_complet || bodyClient.name || bodyClient.nom_complet;
        email = email || bodyClient.email;
        telephone = telephone || bodyClient.phone || bodyClient.telephone;
        adresse_facturation = adresse_facturation || bodyClient.address || bodyClient.adresse_facturation;
      }
      
      console.log('🔍 Données client récupérées:', { nom, prenom, nom_complet, email, telephone, adresse_facturation, type });
      
      if (nom_complet && (!nom || !prenom)) {
        const parsed = parseNomComplet(nom_complet);
        nom = nom || parsed.nom;
        prenom = prenom || parsed.prenom;
      }
      
      if (nom && !prenom && nom.includes(' ')) {
        const parsed = parseNomComplet(nom);
        nom = parsed.nom;
        prenom = parsed.prenom;
      }
      
      if (!nom) {
        result = { 
          success: false, 
          error: 'VALIDATION_ERROR', 
          message: 'Le nom est requis. Informations reçues: ' + JSON.stringify({ nom, prenom, nom_complet, email, telephone, adresse_facturation, type })
        };
        break;
      }
      
      if (email) {
        const existing = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { email },
          limit: 1
        });
        if (existing.success && existing.count > 0) {
          result = {
            success: false,
            error: 'DUPLICATE_CLIENT',
            message: `Un client avec l'email ${email} existe déjà`,
            existing_client: existing.data[0]
          };
          break;
        }
      }
      
      if (telephone) {
        const cleanPhone = formatPhone(telephone);
        const existing = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { telephone: cleanPhone },
          limit: 1
        });
        if (existing.success && existing.count > 0) {
          result = {
            success: false,
            error: 'DUPLICATE_CLIENT',
            message: `Un client avec le téléphone ${telephone} existe déjà`,
            existing_client: existing.data[0]
          };
          break;
        }
      }
      
      result = await supabaseRequest.call(this, 'clients', 'POST', {
        body: {
          nom,
          prenom: prenom || '',
          email: email || null,
          telephone: formatPhone(telephone) || null,
          adresse_facturation: adresse_facturation || '',
          type: type || 'particulier'
        }
      });
      
      if (result.success && result.data && result.data.length > 0) {
        const newClient = result.data[0];
        result.client = newClient;
        
        try {
          const nomCompletClient = nom_complet || `${prenom || ''} ${nom}`.trim();
          const dossierTitle = `Dossier ${nomCompletClient}`;
          
          const dossierNumero = await generateNumero.call(this, 'DOS');
          
          const dossierResult = await supabaseRequest.call(this, 'dossiers', 'POST', {
            body: {
              client_id: newClient.id,
              numero: dossierNumero,
              titre: dossierTitle,
              description: `Dossier automatiquement créé pour ${nomCompletClient}`,
              statut: 'contact_recu',
              priorite: 'normale',
              source: 'autre'
            }
          });
          
          if (dossierResult.success && dossierResult.data && dossierResult.data.length > 0) {
            result.message = `✅ Client ${prenom || ''} ${nom} créé avec succès. Dossier automatiquement créé.`;
            result.dossier = dossierResult.data[0];
            result.dossier_id = dossierResult.data[0].id;
            console.log('📁 Dossier créé automatiquement:', dossierResult.data[0].numero || dossierResult.data[0].id);
          } else {
            result.message = `✅ Client ${prenom || ''} ${nom} créé avec succès. ⚠️ Échec création automatique du dossier.`;
            console.warn('⚠️ Échec création automatique du dossier:', dossierResult);
          }
        } catch (dossierError) {
          result.message = `✅ Client ${prenom || ''} ${nom} créé avec succès. ⚠️ Erreur lors de la création automatique du dossier.`;
          console.error('❌ Erreur création automatique du dossier:', dossierError);
        }
      } else if (result.success) {
        result.message = `✅ Client ${prenom || ''} ${nom} créé avec succès (données non disponibles)`;
      }
      break;
    }
    
    case 'search-client': {
      const q = payload.query || payload.search || payload.nom || '';
      if (!q) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'Requête manquante' };
        break;
      }
      
      console.log(`🔍 [search-client] Recherche pour: "${q}"`);
      
      let searchField = 'nom_complet';
      if (q.includes('@')) {
        searchField = 'email';
      } else if (/^[\d\s\+\-]+$/.test(q)) {
        searchField = 'telephone';
      }
      
      // ✅ STRATÉGIE 1 : Recherche exacte (plus rapide)
      let clientsFound = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { [searchField]: q },
        limit: 20
      });
      
      // ✅ STRATÉGIE 2 : Recherche partielle (ilike)
      if (!clientsFound.success || clientsFound.count === 0) {
        console.log('🔍 [search-client] Recherche exacte échouée, essai avec ilike...');
        clientsFound = await supabaseRequest.call(this, 'clients', 'GET', {
          search: { [searchField]: q },
          limit: 20
        });
      }
      
      // ✅ STRATÉGIE 3 : Recherche OR sur nom ET prénom
      if ((!clientsFound.success || clientsFound.count === 0) && q.includes(' ') && searchField === 'nom_complet') {
        console.log('🔍 [search-client] Recherche ilike échouée, essai avec OR sur nom ET prénom...');
        
        const parts = q.trim().split(/\s+/);
        const prenom = parts[0];
        const nom = parts.slice(1).join(' ');
        
        console.log(`   Prenom: "${prenom}", Nom: "${nom}"`);
        
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
      
      result = clientsFound;
      if (result.success) {
        result.message = `${result.count} client(s) trouvé(s) pour "${q}"`;
        result.clients = result.data;
        
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
    
    case 'list-clients': {
      result = await supabaseRequest.call(this, 'clients', 'GET', {
        limit: payload.limit || 50
      });
      if (result.success) {
        result.message = `${result.count} client(s)`;
        result.clients = result.data;
      }
      break;
    }
    
    case 'get-client': {
      if (!payload.id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'ID requis' };
        break;
      }
      result = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { id: payload.id }
      });
      if (result.success && result.count > 0) {
        result.client = result.data[0];
      } else {
        result = { success: false, error: 'NOT_FOUND', message: 'Client non trouvé' };
      }
      break;
    }
    
    case 'update-client': {
      const { client_id, nom, prenom, email, telephone, adresse_facturation, adresse_chantier, type, notes } = payload;
      
      if (!client_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'client_id est requis' };
        break;
      }
      
      const updateBody = {};
      if (nom !== undefined) updateBody.nom = nom;
      if (prenom !== undefined) updateBody.prenom = prenom;
      if (email !== undefined) updateBody.email = email;
      if (telephone !== undefined) updateBody.telephone = telephone;
      if (adresse_facturation !== undefined) updateBody.adresse_facturation = adresse_facturation;
      if (adresse_chantier !== undefined) updateBody.adresse_chantier = adresse_chantier;
      if (type !== undefined) updateBody.type = type;
      if (notes !== undefined) updateBody.notes = notes;
      
      if (Object.keys(updateBody).length === 0) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'Aucun champ à mettre à jour' };
        break;
      }
      
      result = await supabaseRequest.call(this, 'clients', 'PATCH', {
        filters: { id: client_id },
        body: updateBody
      });
      
      if (result.success && result.count > 0) {
        result.message = '✅ Client mis à jour avec succès';
        result.client = result.data[0];
      } else if (result.success) {
        const updatedClient = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { id: client_id }
        });
        if (updatedClient.success && updatedClient.count > 0) {
          result.message = '✅ Client mis à jour avec succès';
          result.client = updatedClient.data[0];
          result.data = [updatedClient.data[0]];
          result.count = 1;
        }
      }
      break;
    }
    
    case 'delete-client': {
      const { client_id } = payload;
      
      if (!client_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'client_id est requis' };
        break;
      }
      
      const clientCheck = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { id: client_id },
        select: 'id,nom,prenom'
      });
      
      if (!clientCheck.success || clientCheck.count === 0) {
        result = { success: false, error: 'NOT_FOUND', message: 'Client non trouvé' };
        break;
      }
      
      result = await supabaseRequest.call(this, 'clients', 'DELETE', {
        filters: { id: client_id }
      });
      
      if (result.success) {
        result.message = '✅ Client supprimé avec succès';
        result.data = [];
        result.count = 0;
      }
      break;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 📝 DEVIS
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'create-devis': {
      const { client_id, titre, adresse_chantier, delai_execution } = payload;
      if (!client_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'client_id requis' };
        break;
      }
      
      const clientCheck = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { id: client_id },
        select: 'id,nom,prenom'
      });
      
      if (!clientCheck.success || clientCheck.count === 0) {
        result = { success: false, error: 'CLIENT_NOT_FOUND', message: 'Client non trouvé' };
        break;
      }
      
      const client = clientCheck.data[0];
      
      let dossierId = null;
      try {
        const dossierCheck = await supabaseRequest.call(this, 'dossiers', 'GET', {
          filters: { client_id },
          limit: 1,
          orderBy: 'created_at',
          orderDirection: 'desc'
        });
        
        if (dossierCheck.success && dossierCheck.count > 0) {
          dossierId = dossierCheck.data[0].id;
          console.log('📁 Dossier existant trouvé pour le client:', dossierId);
        } else {
          const nomCompletClient = `${client.prenom || ''} ${client.nom}`.trim();
          const dossierTitle = `Dossier ${nomCompletClient}`;
          
          const dossierNumero = await generateNumero.call(this, 'DOS');
          
          const dossierResult = await supabaseRequest.call(this, 'dossiers', 'POST', {
            body: {
              client_id: client_id,
              numero: dossierNumero,
              titre: dossierTitle,
              description: `Dossier automatiquement créé lors de la création du devis`,
              statut: 'contact_recu',
              priorite: 'normale',
              source: 'autre'
            }
          });
          
          if (dossierResult.success && dossierResult.data && dossierResult.data.length > 0) {
            dossierId = dossierResult.data[0].id;
            console.log('📁 Dossier créé automatiquement pour le client:', dossierId);
          }
        }
      } catch (dossierError) {
        console.warn('⚠️ Erreur lors de la recherche/création du dossier:', dossierError);
      }
      
      const numero = await generateNumero.call(this, 'DV');
      const today = new Date().toISOString().split('T')[0];
      
      const devisBody = {
        client_id,
        numero,
        titre: titre || `Devis - ${client.prenom || ''} ${client.nom}`,
        adresse_chantier: adresse_chantier || '',
        delai_execution: delai_execution || '',
        statut: 'brouillon',
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
        date_creation: today
      };
      
      if (dossierId) {
        devisBody.dossier_id = dossierId;
      }
      
      result = await supabaseRequest.call(this, 'devis', 'POST', {
        body: devisBody
      });
      
      if (result.success && result.data && result.data.length > 0) {
        result.message = `✅ Devis ${numero} créé${dossierId ? ' et lié au dossier' : ''}`;
        result.devis = result.data[0];
        if (dossierId) {
          result.dossier_id = dossierId;
        }
      } else if (result.success) {
        result.message = `✅ Devis ${numero} créé (données non disponibles)`;
      }
      break;
    }
    
    case 'list-devis': {
      const search = payload.search || payload.query || payload.numero || payload.nom || payload.prenom || payload.client_name || payload.client_nom || payload.client_prenom;
      
      if (search) {
        console.log(`🔍 [list-devis] Recherche pour: "${search}"`);
        
        const isNumero = typeof search === 'string' && (search.match(/^DV-\d{4}-\d{3,4}$/) || search.startsWith('DV-'));
        
        if (isNumero) {
          console.log(`🔍 [list-devis] Recherche par numéro de devis: ${search}`);
          result = await supabaseRequest.call(this, 'devis', 'GET', {
            search: { numero: search },
            select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
            limit: payload.limit || 50
          });
        } else {
          console.log(`🔍 [list-devis] Recherche par nom/prénom du client: ${search}`);
          
          // ✅ STRATÉGIE 1 : Recherche exacte
          let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
            filters: { nom_complet: search },
            select: 'id',
            limit: 20
          });
          
          // ✅ STRATÉGIE 2 : Recherche partielle
          if (!clientsResult.success || clientsResult.count === 0) {
            console.log('🔍 [list-devis] Recherche exacte client échouée, essai avec ilike...');
            clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
              search: { nom_complet: search },
              select: 'id',
              limit: 20
            });
          }
          
          // ✅ STRATÉGIE 3 : Recherche OR
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
            
            const clientIds = clientsResult.data.map(c => c.id);
            
            if (clientIds.length === 1) {
              result = await supabaseRequest.call(this, 'devis', 'GET', {
                filters: { client_id: clientIds[0] },
                select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
                limit: payload.limit || 50,
                order: 'date_creation.desc'
              });
              
              console.log(`✅ [list-devis] ${result.count || 0} devis trouvé(s) pour le client`);
            } else {
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // 📁 DOSSIERS (garder tel quel - déjà bon)
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'create-dossier': {
      const { client_id, titre, description, statut, priorite } = payload;
      
      if (client_id) {
        const clientCheck = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { id: client_id },
          select: 'id,nom,prenom'
        });
        
        if (!clientCheck.success || clientCheck.count === 0) {
          result = { success: false, error: 'CLIENT_NOT_FOUND', message: 'Client non trouvé' };
          break;
        }
      }
      
      const dossierNumero = await generateNumero.call(this, 'DOS');
      
      result = await supabaseRequest.call(this, 'dossiers', 'POST', {
        body: {
          client_id: client_id || null,
          numero: dossierNumero,
          titre: titre || 'Nouveau dossier',
          description: description || null,
          statut: statut || 'contact_recu',
          priorite: priorite || 'normale',
          source: payload.source || 'autre'
        }
      });
      if (result.success && result.data && result.data.length > 0) {
        result.message = `✅ Dossier créé${client_id ? ' et lié au client' : ''}`;
        result.dossier = result.data[0];
      } else if (result.success) {
        result.message = `✅ Dossier créé (données non disponibles)`;
      }
      break;
    }
    
    case 'list-dossiers': {
      const { client_id, limit, statut, search, query, nom, prenom, client_name, numero } = payload || {};
      const searchTerm = search || query || nom || prenom || client_name || numero;
      
      const filters = {};
      if (client_id) {
        filters.client_id = client_id;
      }
      if (statut) {
        filters.statut = statut;
      }
      
      if (searchTerm && (searchTerm.startsWith('DOS-') || searchTerm.match(/^DOS-\d{4}-\d{3,4}$/))) {
        result = await supabaseRequest.call(this, 'dossiers', 'GET', {
          search: { numero: searchTerm },
          select: '*,clients(id,nom,prenom,nom_complet,email,telephone)',
          limit: limit || 50
        });
      } else if (searchTerm && !client_id) {
        const clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
          search: { 
            nom_complet: searchTerm,
            nom: searchTerm,
            prenom: searchTerm
          },
          select: 'id',
          limit: 20
        });
        
        if (clientsResult.success && clientsResult.count > 0) {
          const clientIds = clientsResult.data.map(c => c.id);
          if (clientIds.length === 1) {
            filters.client_id = clientIds[0];
          } else {
            const clientIdsStr = clientIds.map(id => `"${id}"`).join(',');
            const url = `${REST_URL}/dossiers?tenant_id=eq.${tenant_id}&client_id=in.(${clientIdsStr})&select=*,clients(id,nom,prenom,nom_complet,email,telephone)&order=created_at.desc&limit=${limit || 50}`;
            
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
                  message: `${Array.isArray(responseData) ? responseData.length : 0} dossier(s) trouvé(s) pour "${searchTerm}"`
                };
                break;
              }
            } catch (httpError) {
              const allDossiers = [];
              for (const clientId of clientIds) {
                const clientDossiers = await supabaseRequest.call(this, 'dossiers', 'GET', {
                  filters: { client_id: clientId },
                  select: '*,clients(id,nom,prenom,nom_complet,email,telephone)',
                  limit: 50
                });
                if (clientDossiers.success && clientDossiers.data) {
                  allDossiers.push(...clientDossiers.data);
                }
              }
              result = {
                success: true,
                data: allDossiers,
                count: allDossiers.length,
                message: `${allDossiers.length} dossier(s) trouvé(s) pour "${searchTerm}"`
              };
              break;
            }
          }
        } else {
          result = { success: true, data: [], count: 0, message: `Aucun client trouvé pour "${searchTerm}"` };
          break;
        }
      }
      
      result = await supabaseRequest.call(this, 'dossiers', 'GET', {
        select: '*,clients(id,nom,prenom,nom_complet,email,telephone)',
        filters: filters,
        order: 'created_at.desc',
        limit: limit || 50
      });
      
      if (result.success) {
        if (client_id && result.count === 0) {
          result.message = `Aucun dossier trouvé pour ce client`;
          result.dossiers = [];
        } else {
          result.message = `${result.count} dossier(s) trouvé(s)${searchTerm ? ` pour "${searchTerm}"` : ''}`;
          result.dossiers = result.data;
        }
      }
      break;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 📅 RDV - AVEC RECHERCHE PAR NOM
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'create-rdv': {
      const { dossier_id, client_id, titre, date_heure, duree_minutes, type_rdv, lieu, adresse, notes, notes_acces } = payload;
      
      const adresseRdv = adresse || lieu || '';
      
      let dossierIdFinal = dossier_id;
      if (client_id && !dossier_id) {
        try {
          const dossiersResult = await supabaseRequest.call(this, 'dossiers', 'GET', {
            filters: { client_id },
            order: 'created_at.desc',
            limit: 1
          });
          if (dossiersResult.success && dossiersResult.count > 0) {
            dossierIdFinal = dossiersResult.data[0].id;
            console.log('📁 Dossier trouvé automatiquement pour le client:', dossierIdFinal);
          } else {
            console.log('📁 Aucun dossier trouvé pour le client, création automatique...');
            
            let clientName = 'Client';
            try {
              const clientResult = await supabaseRequest.call(this, 'clients', 'GET', {
                filters: { id: client_id },
                select: 'nom,prenom,nom_complet',
                limit: 1
              });
              if (clientResult.success && clientResult.count > 0) {
                const client = clientResult.data[0];
                clientName = client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Client';
              }
            } catch (clientError) {
              console.warn('⚠️ Erreur lors de la récupération du nom du client:', clientError);
            }
            
            const dossierNumero = await generateNumero.call(this, 'DOS');
            
            const createDossierResult = await supabaseRequest.call(this, 'dossiers', 'POST', {
              body: {
                client_id: client_id,
                titre: `Dossier ${clientName}`,
                statut: 'contact_recu',
                priorite: 'normale',
                numero: dossierNumero,
                source: 'whatsapp'
              }
            });
            
            if (createDossierResult.success && createDossierResult.data && createDossierResult.data.length > 0) {
              dossierIdFinal = createDossierResult.data[0].id;
              console.log('✅ Dossier créé automatiquement pour le client:', dossierIdFinal, 'Numéro:', dossierNumero);
            } else {
              console.warn('⚠️ Erreur lors de la création automatique du dossier:', createDossierResult);
            }
          }
        } catch (dossierError) {
          console.warn('⚠️ Erreur lors de la recherche/création du dossier:', dossierError);
        }
      }
      
      const rdvBody = {
        dossier_id: dossierIdFinal || null,
        client_id: client_id || null,
        titre: titre || 'Nouveau RDV',
        date_heure: date_heure || new Date().toISOString(),
        duree_minutes: duree_minutes || 60,
        type_rdv: type_rdv || 'visite',
        adresse: adresseRdv,
        statut: 'planifie'
      };
      
      if (notes !== undefined && notes !== null) {
        rdvBody.notes = notes;
      }
      if (notes_acces !== undefined && notes_acces !== null) {
        rdvBody.notes_acces = notes_acces;
      }
      
      if (rdvBody.lieu) {
        delete rdvBody.lieu;
        console.warn('⚠️ Champ "lieu" détecté et supprimé du body (doit être "adresse")');
      }
      
      result = await supabaseRequest.call(this, 'rdv', 'POST', {
        body: rdvBody
      });
      if (result.success && result.data && result.data.length > 0) {
        result.message = `✅ RDV planifié`;
        result.rdv = result.data[0];
      } else if (result.success) {
        result.message = `✅ RDV planifié (données non disponibles)`;
      }
      break;
    }
    
    case 'list-rdv': {
      const search = payload.search || payload.query || payload.nom || payload.prenom || payload.client_name;
      const limit = payload.limit || 50;
      
      if (search) {
        console.log(`🔍 [list-rdv] Recherche pour: "${search}"`);
        
        // ✅ STRATÉGIE 1 : Recherche exacte
        let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { nom_complet: search },
          select: 'id',
          limit: 20
        });
        
        // ✅ STRATÉGIE 2 : Recherche partielle
        if (!clientsResult.success || clientsResult.count === 0) {
          clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
            search: { nom_complet: search },
            select: 'id',
            limit: 20
          });
        }
        
        // ✅ STRATÉGIE 3 : Recherche OR
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // 📊 STATS
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'stats': {
      const [clientsRes, devisRes, facturesRes, dossiersRes] = await Promise.all([
        supabaseRequest.call(this, 'clients', 'GET', { select: 'id' }),
        supabaseRequest.call(this, 'devis', 'GET', { select: 'id,statut,montant_ttc' }),
        supabaseRequest.call(this, 'factures', 'GET', { select: 'id,statut,montant_ttc' }),
        supabaseRequest.call(this, 'dossiers', 'GET', { select: 'id,statut' })
      ]);
      
      result = {
        success: true,
        message: 'Statistiques',
        data: {
          clients: clientsRes.count || 0,
          devis: devisRes.count || 0,
          factures: facturesRes.count || 0,
          dossiers: dossiersRes.count || 0
        }
      };
      break;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ❌ ACTION INCONNUE
    // ═══════════════════════════════════════════════════════════════════════
    
    default: {
      result = {
        success: false,
        error: 'UNKNOWN_ACTION',
        message: `Action "${action}" non reconnue`,
        available: [
          'create-client', 'search-client', 'list-clients', 'get-client', 'update-client', 'delete-client',
          'create-devis', 'list-devis', 'get-devis',
          'create-dossier', 'list-dossiers',
          'create-rdv', 'list-rdv',
          'stats'
        ]
      };
    }
  }
} catch (error) {
  result = {
    success: false,
    error: 'EXECUTION_ERROR',
    message: error.message || 'Erreur lors de l\'exécution',
    details: error.toString(),
    stack: error.stack,
    data: [],
    count: 0
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RETOUR (STRING obligatoire pour n8n Tool)
// ════════════════════════════════════════════════════════════════════════════

if (!result) {
  result = {
    success: false,
    error: 'UNKNOWN_ERROR',
    message: 'Erreur inconnue',
    data: [],
    count: 0
  };
}

if (!result.data) {
  result.data = [];
}
if (result.count === undefined || result.count === null) {
  result.count = Array.isArray(result.data) ? result.data.length : 0;
}

const finalResult = {
  success: result.success !== false,
  error: result.error || null,
  message: result.message || '',
  data: result.data || [],
  count: result.count || 0,
  action: normalizedAction,
  original_action: action,
  tenant_id: tenant_id,
  timestamp: new Date().toISOString()
};

if (result.client) finalResult.client = result.client;
if (result.clients) finalResult.clients = result.clients;
if (result.devis) finalResult.devis = result.devis;
if (result.dossier) finalResult.dossier = result.dossier;
if (result.dossiers) finalResult.dossiers = result.dossiers;
if (result.rdv) finalResult.rdv = result.rdv;

return JSON.stringify(finalResult, null, 2);
