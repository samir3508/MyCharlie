// ============================================================================
// 🤖 TOOL SUPABASE POUR CHARLIE & LÉO - VERSION N8N V4 (COMPLÈTE + CORRIGÉE)
// ============================================================================
// ✅ VERSION FINALE avec toutes les fonctionnalités + recherche par nom corrigée
// Date : 24 janvier 2026
// ============================================================================

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

let appUrl = 'https://mycharlie.fr';

try {
  if (typeof $env !== 'undefined' && $env.APP_URL) {
    appUrl = $env.APP_URL;
  }
} catch (e) {
  // $env non disponible
}

const CONFIG = {
  SUPABASE_URL: 'https://lawllirgeisuvanbvkcr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTY2MzcsImV4cCI6MjA4MzgzMjYzN30.szrUnHY8jKJc6kzP18qPUKG5Ny5s8wmTsIksi172rI0',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1NjYzNywiZXhwIjoyMDgzODMyNjM3fQ.3OR8IDsOtr8g854NlVOM_Lp1kuJhuKIuo8zNZGM4Fuo',
  APP_URL: appUrl,
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: ''
};

try {
  if (typeof $env !== 'undefined') {
    if ($env.GOOGLE_CLIENT_ID) CONFIG.GOOGLE_CLIENT_ID = $env.GOOGLE_CLIENT_ID;
    if ($env.GOOGLE_CLIENT_SECRET) CONFIG.GOOGLE_CLIENT_SECRET = $env.GOOGLE_CLIENT_SECRET;
  }
} catch (e) {
  // Ignorer
}

const REST_URL = `${CONFIG.SUPABASE_URL}/rest/v1`;

// ════════════════════════════════════════════════════════════════════════════
// VÉRIFICATION DU CONTEXTE N8N
// ════════════════════════════════════════════════════════════════════════════

if (typeof this === 'undefined' || !this.helpers || typeof this.helpers.httpRequest !== 'function') {
  return JSON.stringify({
    success: false,
    error: 'CONTEXT_ERROR',
    message: 'this.helpers.httpRequest n\'est pas disponible',
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
  // Ignorer
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
    console.log(`🔄 Tableau ${key} reconstruit: ${arrayItems.length} éléments`);
    return arrayItems;
  }
  
  if (obj.payload && obj.payload[key] && Array.isArray(obj.payload[key])) {
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
  console.warn(`⚠️ Tenant ID différent détecté, utilisation du contexte`);
}

if (!action) {
  return JSON.stringify({
    success: false,
    error: 'ACTION_MISSING',
    message: 'Aucune action spécifiée',
    data: [],
    count: 0
  });
}

if (!tenant_id) {
  return JSON.stringify({
    success: false,
    error: 'TENANT_ID_MISSING',
    message: 'Le tenant_id est obligatoire',
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
// FONCTION HTTP
// ════════════════════════════════════════════════════════════════════════════

async function supabaseRequest(table, method, options = {}) {
  if (!this || !this.helpers || typeof this.helpers.httpRequest !== 'function') {
    return {
      success: false,
      error: 'HTTP_REQUEST_UNAVAILABLE',
      message: 'this.helpers.httpRequest non disponible',
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
        } else {
          queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
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
        message: 'Réponse vide',
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
        message: 'Données vides',
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
      message: error.message || 'Erreur HTTP',
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

function base64Encode(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  } else if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  } else {
    return str;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAPPING ACTIONS (action, tenant_id déjà validés plus haut)
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
  'ajouter-ligne-facture': 'add-ligne-facture', 'add-ligne-facture': 'add-ligne-facture',
  'modifier-ligne-facture': 'update-ligne-facture', 'update-ligne-facture': 'update-ligne-facture',
  'supprimer-ligne-facture': 'delete-ligne-facture', 'delete-ligne-facture': 'delete-ligne-facture',
  'finaliser-facture': 'finalize-facture', 'finalize-facture': 'finalize-facture',
  'envoyer-facture': 'send-facture', 'send-facture': 'send-facture',
  'marquer-facture-payee': 'mark-facture-paid', 'mark-facture-paid': 'mark-facture-paid',
  'envoyer-relance': 'send-relance', 'send-relance': 'send-relance',
  'obtenir-facture': 'get-facture', 'get-facture': 'get-facture',
  'voir-facture': 'get-facture',
  'lister-factures': 'list-factures', 'list-factures': 'list-factures',
  'modifier-facture': 'update-facture', 'update-facture': 'update-facture',
  'supprimer-facture': 'delete-facture', 'delete-facture': 'delete-facture',
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
    // 👤 CLIENTS - AVEC RECHERCHE CORRIGÉE
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
          message: 'Le nom est requis'
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
            result.message = `✅ Client ${prenom || ''} ${nom} créé. Dossier créé.`;
            result.dossier = dossierResult.data[0];
            result.dossier_id = dossierResult.data[0].id;
          } else {
            result.message = `✅ Client ${prenom || ''} ${nom} créé. ⚠️ Dossier non créé.`;
          }
        } catch (dossierError) {
          result.message = `✅ Client ${prenom || ''} ${nom} créé. ⚠️ Erreur dossier.`;
        }
      }
      break;
    }
    
    case 'search-client': {
      const q = payload.query || payload.search || payload.nom || '';
      if (!q) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'Requête manquante' };
        break;
      }
      
      console.log(`🔍 [search-client] Recherche: "${q}"`);
      
      let searchField = 'nom_complet';
      if (q.includes('@')) {
        searchField = 'email';
      } else if (/^[\d\s\+\-]+$/.test(q)) {
        searchField = 'telephone';
      }
      
      // ✅ STRATÉGIE 1 : Exacte
      let clientsFound = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { [searchField]: q },
        limit: 20
      });
      
      // ✅ STRATÉGIE 2 : Partielle (ilike)
      if (!clientsFound.success || clientsFound.count === 0) {
        console.log('🔍 Exacte échouée, essai ilike...');
        clientsFound = await supabaseRequest.call(this, 'clients', 'GET', {
          search: { [searchField]: q },
          limit: 20
        });
      }
      
      // ✅ STRATÉGIE 3 : OR sur nom ET prénom
      if ((!clientsFound.success || clientsFound.count === 0) && q.includes(' ') && searchField === 'nom_complet') {
        console.log('🔍 Ilike échouée, essai OR...');
        
        const parts = q.trim().split(/\s+/);
        const prenom = parts[0];
        const nom = parts.slice(1).join(' ');
        
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
            console.log(`✅ Trouvé avec OR: ${data.length} client(s)`);
          }
        } catch (err) {
          console.warn('⚠️ Erreur OR:', err.message);
        }
      }
      
      result = clientsFound;
      if (result.success) {
        result.message = `${result.count} client(s) trouvé(s)`;
        result.clients = result.data;
        
        if (result.count > 0) {
          console.log(`✅ ${result.count} client(s) trouvé(s)`);
        } else {
          console.log(`⚠️ Aucun client trouvé`);
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
        result = { success: false, error: 'VALIDATION_ERROR', message: 'client_id requis' };
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
        result = { success: false, error: 'VALIDATION_ERROR', message: 'Aucun champ à MAJ' };
        break;
      }
      
      result = await supabaseRequest.call(this, 'clients', 'PATCH', {
        filters: { id: client_id },
        body: updateBody
      });
      
      if (result.success) {
        result.message = '✅ Client mis à jour';
        if (result.count > 0) {
          result.client = result.data[0];
        }
      }
      break;
    }
    
    case 'delete-client': {
      const { client_id } = payload;
      
      if (!client_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'client_id requis' };
        break;
      }
      
      const clientCheck = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { id: client_id },
        select: 'id'
      });
      
      if (!clientCheck.success || clientCheck.count === 0) {
        result = { success: false, error: 'NOT_FOUND', message: 'Client non trouvé' };
        break;
      }
      
      result = await supabaseRequest.call(this, 'clients', 'DELETE', {
        filters: { id: client_id }
      });
      
      if (result.success) {
        result.message = '✅ Client supprimé';
        result.data = [];
        result.count = 0;
      }
      break;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 📝 DEVIS - AVEC RECHERCHE PAR NOM CORRIGÉE
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'create-devis': {
      const { client_id, titre, adresse_chantier, delai_execution } = payload;
      if (!client_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'client_id requis' };
        break;
      }
      
      const clientCheck = await supabaseRequest.call(this, 'clients', 'GET', {
        filters: { id: client_id },
        select: 'id,nom,prenom,nom_complet'
      });
      
      if (!clientCheck.success || clientCheck.count === 0) {
        // Récupérer quelques clients pour aider au debug
        const clientsList = await supabaseRequest.call(this, 'clients', 'GET', {
          select: 'id,nom_complet,email',
          limit: 5
        });
        
        const clientsInfo = clientsList.success && clientsList.data 
          ? clientsList.data.map(c => `- ${c.nom_complet || 'Sans nom'} (${c.id.substring(0, 8)}...)`).join('\n')
          : 'Aucun client trouvé';
        
        result = { 
          success: false, 
          error: 'CLIENT_NOT_FOUND', 
          message: `Client non trouvé avec l'ID: ${client_id.substring(0, 8)}...`,
          hint: `Clients disponibles pour ce tenant:\n${clientsInfo}`,
          provided_client_id: client_id
        };
        break;
      }
      
      const client = clientCheck.data[0];
      
      let dossierId = null;
      try {
        const dossierCheck = await supabaseRequest.call(this, 'dossiers', 'GET', {
          filters: { client_id },
          limit: 1
        });
        
        if (dossierCheck.success && dossierCheck.count > 0) {
          dossierId = dossierCheck.data[0].id;
        } else {
          const nomCompletClient = `${client.prenom || ''} ${client.nom}`.trim();
          const dossierNumero = await generateNumero.call(this, 'DOS');
          
          const dossierResult = await supabaseRequest.call(this, 'dossiers', 'POST', {
            body: {
              client_id: client_id,
              numero: dossierNumero,
              titre: `Dossier ${nomCompletClient}`,
              description: `Créé auto`,
              statut: 'contact_recu',
              priorite: 'normale',
              source: 'autre'
            }
          });
          
          if (dossierResult.success && dossierResult.data && dossierResult.data.length > 0) {
            dossierId = dossierResult.data[0].id;
          }
        }
      } catch (dossierError) {
        console.warn('⚠️ Erreur dossier:', dossierError);
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
        result.message = `✅ Devis ${numero} créé`;
        result.devis = result.data[0];
        if (dossierId) {
          result.dossier_id = dossierId;
        }
      }
      break;
    }
    
    case 'list-devis': {
      const search = payload.search || payload.query || payload.numero || payload.nom || payload.prenom || payload.client_name;
      
      if (search) {
        console.log(`🔍 [list-devis] Recherche: "${search}"`);
        
        const isNumero = typeof search === 'string' && (search.match(/^DV-\d{4}-\d{3,4}$/) || search.startsWith('DV-'));
        
        if (isNumero) {
          console.log(`🔍 Par numéro`);
          result = await supabaseRequest.call(this, 'devis', 'GET', {
            search: { numero: search },
            select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
            limit: payload.limit || 50
          });
        } else {
          console.log(`🔍 Par nom client`);
          
          // ✅ STRATÉGIE 1 : Exacte
          let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
            filters: { nom_complet: search },
            select: 'id',
            limit: 20
          });
          
          // ✅ STRATÉGIE 2 : Partielle
          if (!clientsResult.success || clientsResult.count === 0) {
            console.log('🔍 Exacte échouée, ilike...');
            clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
              search: { nom_complet: search },
              select: 'id',
              limit: 20
            });
          }
          
          // ✅ STRATÉGIE 3 : OR
          if ((!clientsResult.success || clientsResult.count === 0) && search.includes(' ')) {
            console.log('🔍 Ilike échouée, OR...');
            
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
                console.log(`✅ OR réussi: ${data.length}`);
              }
            } catch (err) {
              console.warn('⚠️ Erreur OR:', err.message);
            }
          }
          
          if (clientsResult.success && clientsResult.count > 0) {
            console.log(`✅ ${clientsResult.count} client(s), recherche devis...`);
            
            const clientIds = clientsResult.data.map(c => c.id);
            
            if (clientIds.length === 1) {
              result = await supabaseRequest.call(this, 'devis', 'GET', {
                filters: { client_id: clientIds[0] },
                select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
                limit: payload.limit || 50,
                order: 'date_creation.desc'
              });
            } else {
              const clientIdsStr = clientIds.map(id => `"${id}"`).join(',');
              const url = `${REST_URL}/devis?tenant_id=eq.${tenant_id}&client_id=in.(${clientIdsStr})&select=*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)&order=date_creation.desc&limit=${payload.limit || 50}`;
              
              try {
                const response = await this.helpers.httpRequest({
                  method: 'GET',
                  url: url,
                  headers: headers,
                  returnFullResponse: true
                });
                
                const statusCode = (response && response.statusCode) || (response && response.status) || 200;
                const responseData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
                
                if (statusCode >= 200 && statusCode < 300) {
                  result = {
                    success: true,
                    data: Array.isArray(responseData) ? responseData : [],
                    count: Array.isArray(responseData) ? responseData.length : 0
                  };
                } else {
                  result = { success: false, error: 'QUERY_ERROR', message: 'Erreur recherche', data: [] };
                }
              } catch (httpError) {
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
                  count: allDevis.length
                };
              }
            }
          } else {
            result = { success: true, data: [], count: 0, message: `Aucun client pour "${search}"` };
          }
        }
      } else {
        result = await supabaseRequest.call(this, 'devis', 'GET', {
          select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier)',
          limit: payload.limit || 50,
          order: 'date_creation.desc'
        });
      }
      
      if (result.success) {
        result.message = `${result.count} devis${search ? ` pour "${search}"` : ''}`;
        result.devis = result.data;
      }
      break;
    }
    
    case 'add-ligne-devis': {
      const { devis_id, lignes } = payload;
      
      if (!devis_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'devis_id requis' };
        break;
      }
      
      if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'lignes requis (tableau non vide)' };
        break;
      }
      
      const devisCheck = await supabaseRequest.call(this, 'devis', 'GET', {
        filters: { id: devis_id },
        select: 'id'
      });
      
      if (!devisCheck.success || devisCheck.count === 0) {
        result = { success: false, error: 'DEVIS_NOT_FOUND', message: 'Devis non trouvé' };
        break;
      }
      
      const insertedLignes = [];
      const errors = [];
      
      for (let i = 0; i < lignes.length; i++) {
        const ligne = lignes[i];
        
        const ligneResult = await supabaseRequest.call(this, 'lignes_devis', 'POST', {
          body: {
            devis_id,
            ordre: i + 1,
            designation: ligne.designation || ligne.label || 'Prestation',
            description_detaillee: ligne.description_detaillee || ligne.description || null,
            quantite: parseFloat(ligne.quantite || 1),
            unite: ligne.unite || 'u',
            prix_unitaire_ht: parseFloat(ligne.prix_unitaire_ht || ligne.prix || 0),
            tva_pct: parseFloat(ligne.tva_pct || ligne.tva || 10)
          },
          addTenantId: false,
          filterTenant: false
        });
        
        if (ligneResult.success) {
          insertedLignes.push(ligneResult.data[0]);
        } else {
          errors.push({ ligne: i + 1, error: ligneResult.message });
        }
      }
      
      if (errors.length > 0) {
        result = {
          success: false,
          error: 'PARTIAL_ERROR',
          message: `${insertedLignes.length} ajoutée(s), ${errors.length} erreur(s)`,
          inserted: insertedLignes,
          errors: errors
        };
      } else {
        result = {
          success: true,
          message: `✅ ${insertedLignes.length} ligne(s) ajoutée(s)`,
          lignes: insertedLignes,
          count: insertedLignes.length
        };
      }
      break;
    }
    
    case 'update-ligne-devis': {
      const { ligne_id, designation, quantite, unite, prix_unitaire_ht, tva_pct, description_detaillee, ordre } = payload;
      
      if (!ligne_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'ligne_id requis' };
        break;
      }
      
      const updateBody = {};
      if (designation !== undefined) updateBody.designation = designation;
      if (quantite !== undefined) updateBody.quantite = parseFloat(quantite);
      if (unite !== undefined) updateBody.unite = unite;
      if (prix_unitaire_ht !== undefined) updateBody.prix_unitaire_ht = parseFloat(prix_unitaire_ht);
      if (tva_pct !== undefined) updateBody.tva_pct = parseFloat(tva_pct);
      if (description_detaillee !== undefined) updateBody.description_detaillee = description_detaillee;
      if (ordre !== undefined) updateBody.ordre = parseInt(ordre);
      
      if (Object.keys(updateBody).length === 0) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'Aucun champ à MAJ' };
        break;
      }
      
      result = await supabaseRequest.call(this, 'lignes_devis', 'PATCH', {
        filters: { id: ligne_id },
        body: updateBody,
        filterTenant: false
      });
      
      if (result.success) {
        result.message = '✅ Ligne MAJ';
        if (result.count > 0) {
          result.ligne = result.data[0];
        }
      }
      break;
    }
    
    case 'delete-ligne-devis': {
      const { ligne_id } = payload;
      
      if (!ligne_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'ligne_id requis' };
        break;
      }
      
      result = await supabaseRequest.call(this, 'lignes_devis', 'DELETE', {
        filters: { id: ligne_id },
        filterTenant: false
      });
      
      if (result.success) {
        result.message = '✅ Ligne supprimée';
        result.data = [];
        result.count = 0;
      }
      break;
    }
    
    case 'finalize-devis': {
      const { devis_id } = payload;
      
      if (!devis_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'devis_id requis' };
        break;
      }
      
      const devisCheck = await supabaseRequest.call(this, 'devis', 'GET', {
        filters: { id: devis_id },
        select: 'id'
      });
      
      if (!devisCheck.success || devisCheck.count === 0) {
        result = { success: false, error: 'DEVIS_NOT_FOUND', message: 'Devis non trouvé' };
        break;
      }
      
      const lignesResult = await supabaseRequest.call(this, 'lignes_devis', 'GET', {
        filters: { devis_id },
        select: 'quantite,prix_unitaire_ht,tva_pct',
        filterTenant: false
      });
      
      let montant_ht = 0;
      let montant_tva = 0;
      
      if (lignesResult.success && lignesResult.data) {
        for (const ligne of lignesResult.data) {
          const ligne_ht = (ligne.quantite || 0) * (ligne.prix_unitaire_ht || 0);
          const ligne_tva = ligne_ht * ((ligne.tva_pct || 0) / 100);
          montant_ht += ligne_ht;
          montant_tva += ligne_tva;
        }
      }
      
      const montant_ttc = montant_ht + montant_tva;
      const montant_ttc_rounded = Math.round(montant_ttc * 100) / 100;
      
      const templateId = await findTemplateByMontant.call(this, montant_ttc_rounded);
      
      const pdfUrl = CONFIG.APP_URL 
        ? `${CONFIG.APP_URL}/api/pdf/devis/${devis_id}`
        : `/api/pdf/devis/${devis_id}`;
      
      const updateBody = {
        montant_ht: Math.round(montant_ht * 100) / 100,
        montant_tva: Math.round(montant_tva * 100) / 100,
        montant_ttc: montant_ttc_rounded,
        statut: 'brouillon',
        pdf_url: pdfUrl
      };
      
      if (templateId) {
        updateBody.template_condition_paiement_id = templateId;
      }
      
      result = await supabaseRequest.call(this, 'devis', 'PATCH', {
        filters: { id: devis_id },
        body: updateBody
      });
      
      if (result.success) {
        result.message = `✅ Devis finalisé`;
        result.totals = {
          montant_ht: Math.round(montant_ht * 100) / 100,
          montant_tva: Math.round(montant_tva * 100) / 100,
          montant_ttc: montant_ttc_rounded
        };
        result.pdf_url = pdfUrl;
      }
      break;
    }
    
    case 'get-devis': {
      const { devis_id, devis_numero, numero } = payload;
      const identifier = devis_id || devis_numero || numero;
      
      if (!identifier) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'devis_id requis' };
        break;
      }
      
      let devisUUID = identifier;
      if (identifier.startsWith('DV-')) {
        const searchResult = await supabaseRequest.call(this, 'devis', 'GET', {
          search: { numero: identifier },
          select: 'id',
          limit: 1
        });
        
        if (!searchResult.success || searchResult.count === 0) {
          result = { success: false, error: 'NOT_FOUND', message: `Devis ${identifier} non trouvé` };
          break;
        }
        
        devisUUID = searchResult.data[0].id;
      }
      
      result = await supabaseRequest.call(this, 'devis', 'GET', {
        filters: { id: devisUUID },
        select: '*,clients(id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier),lignes_devis(*),templates_conditions_paiement(*)'
      });
      
      if (result.success && result.count > 0) {
        result.devis = result.data[0];
        const pdfUrl = CONFIG.APP_URL 
          ? `${CONFIG.APP_URL}/api/pdf/devis/${devisUUID}`
          : `/api/pdf/devis/${devisUUID}`;
        
        result.devis.pdf_url = pdfUrl;
        result.pdf_url = pdfUrl;
        result.message = `✅ Devis ${result.devis.numero}`;
      } else {
        result = { success: false, error: 'NOT_FOUND', message: 'Devis non trouvé' };
      }
      break;
    }
    
    case 'update-devis': {
      const { devis_id, statut, date_envoi, notes, delai_execution, adresse_chantier, titre, description } = payload;
      
      if (!devis_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'devis_id requis' };
        break;
      }
      
      let devisUUID = devis_id;
      if (devis_id.startsWith('DV-')) {
        const searchResult = await supabaseRequest.call(this, 'devis', 'GET', {
          search: { numero: devis_id },
          select: 'id',
          limit: 1
        });
        
        if (!searchResult.success || searchResult.count === 0) {
          result = { success: false, error: 'NOT_FOUND', message: 'Devis non trouvé' };
          break;
        }
        
        devisUUID = searchResult.data[0].id;
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // IMPORTANT : delai_execution est INDÉPENDANT des délais de paiement du template
      // - delai_execution = quand l'artisan commence les travaux (TEXT libre)
      // - template.delai_* = délais pour les échéances de paiement (INTEGER jours)
      // ═══════════════════════════════════════════════════════════════════════
      
      const updateBody = {};
      if (statut) updateBody.statut = statut;
      if (date_envoi) updateBody.date_envoi = date_envoi;
      if (notes !== undefined) updateBody.notes = notes;
      if (delai_execution !== undefined) updateBody.delai_execution = delai_execution;
      if (adresse_chantier !== undefined) updateBody.adresse_chantier = adresse_chantier;
      if (titre !== undefined) updateBody.titre = titre;
      if (description !== undefined) updateBody.description = description;
      
      if (Object.keys(updateBody).length === 0) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'Aucun champ à MAJ' };
        break;
      }
      
      result = await supabaseRequest.call(this, 'devis', 'PATCH', {
        filters: { id: devisUUID },
        body: updateBody
      });
      
      if (result.success) {
        result.message = `✅ Devis MAJ`;
      }
      break;
    }
    
    case 'delete-devis': {
      const { devis_id } = payload;
      
      if (!devis_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'devis_id requis' };
        break;
      }
      
      let devisUUID = devis_id;
      if (devis_id.startsWith('DV-')) {
        const searchResult = await supabaseRequest.call(this, 'devis', 'GET', {
          search: { numero: devis_id },
          select: 'id',
          limit: 1
        });
        
        if (!searchResult.success || searchResult.count === 0) {
          result = { success: false, error: 'NOT_FOUND', message: 'Devis non trouvé' };
          break;
        }
        
        devisUUID = searchResult.data[0].id;
      }
      
      result = await supabaseRequest.call(this, 'devis', 'DELETE', {
        filters: { id: devisUUID }
      });
      
      if (result.success) {
        result.message = `✅ Devis supprimé`;
        result.data = [];
        result.count = 0;
      }
      break;
    }
    
    case 'envoyer-devis': {
      let { devis_id, email, recipient_email, method } = payload;
      recipient_email = recipient_email || email;
      method = method || 'email';
      
      if (!devis_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'devis_id requis' };
        break;
      }
      
      if (method === 'email' && !recipient_email) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'email requis' };
        break;
      }
      
      let devisUUID = devis_id;
      if (devis_id.startsWith('DV-')) {
        const searchResult = await supabaseRequest.call(this, 'devis', 'GET', {
          search: { numero: devis_id },
          select: 'id',
          limit: 1
        });
        
        if (!searchResult.success || searchResult.count === 0) {
          result = { success: false, error: 'NOT_FOUND', message: `Devis ${devis_id} non trouvé` };
          break;
        }
        
        devisUUID = searchResult.data[0].id;
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // Récupérer le devis pour mettre à jour le statut
      // ═══════════════════════════════════════════════════════════════════════
      
      const devisResult = await supabaseRequest.call(this, 'devis', 'GET', {
        filters: { id: devisUUID },
        select: '*,clients(*)'
      });
      
      if (!devisResult.success || devisResult.count === 0) {
        result = { success: false, error: 'NOT_FOUND', message: 'Devis non trouvé' };
        break;
      }
      
      const devis = devisResult.data[0];
      
      // ═══════════════════════════════════════════════════════════════════════
      // Essayer d'envoyer l'email via l'Edge Function (optionnel)
      // Si ça échoue, on continue quand même pour ne pas casser le workflow
      // ═══════════════════════════════════════════════════════════════════════
      
      let emailSent = false;
      let emailError = null;
      
      try {
        const edgeFunctionUrl = `${CONFIG.SUPABASE_URL}/functions/v1/send-devis`;
        const edgeResponse = await this.helpers.httpRequest({
          method: 'POST',
          url: edgeFunctionUrl,
          headers: {
            'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: {
            tenant_id: tenant_id,
            devis_id: devisUUID,
            method: method,
            recipient_email: recipient_email,
            ...(payload.recipient_phone && { recipient_phone: payload.recipient_phone })
          }
        });
        
        // Si on arrive ici, la requête a réussi (pas d'exception)
        if (edgeResponse && edgeResponse.success) {
          emailSent = true;
        } else {
          emailError = edgeResponse?.message || 'Réponse inattendue de l\'Edge Function';
        }
      } catch (edgeError) {
        // Si l'Edge Function échoue (Gmail non connecté, etc.), on continue quand même
        // L'erreur peut être une réponse HTTP avec un corps JSON
        try {
          const errorBody = typeof edgeError.response === 'string' 
            ? JSON.parse(edgeError.response) 
            : edgeError.response;
          
          // Si c'est une erreur 400 "Gmail non connecté", on l'ignore et on continue
          if (errorBody && (errorBody.error === 'GMAIL_NOT_CONNECTED' || errorBody.error === 'API_ERROR')) {
            emailError = errorBody.message || errorBody.error;
          } else {
            emailError = edgeError.message || 'Erreur lors de l\'appel à send-devis';
          }
        } catch (parseError) {
          emailError = edgeError.message || 'Erreur lors de l\'appel à send-devis';
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // Mettre à jour le statut du devis (toujours, même si l'email a échoué)
      // ═══════════════════════════════════════════════════════════════════════
      
      await supabaseRequest.call(this, 'devis', 'PATCH', {
        filters: { id: devisUUID },
        body: {
          statut: 'envoye',
          date_envoi: new Date().toISOString().split('T')[0]
        }
      });
      
      // ═══════════════════════════════════════════════════════════════════════
      // Retourner le résultat (succès avec avertissement si email non envoyé)
      // ═══════════════════════════════════════════════════════════════════════
      
      if (emailSent) {
        result = {
          success: true,
          message: `✅ Email envoyé à ${recipient_email}`,
          devis: {
            id: devis.id,
            numero: devis.numero,
            montant_ttc: devis.montant_ttc
          },
          email: {
            to: recipient_email,
            sent: true
          }
        };
      } else {
        // Email non envoyé mais statut mis à jour quand même
        result = {
          success: true,
          message: `⚠️ Statut mis à jour (email non envoyé: ${emailError || 'Gmail non connecté'})`,
          devis: {
            id: devis.id,
            numero: devis.numero,
            montant_ttc: devis.montant_ttc
          },
          email: {
            to: recipient_email,
            sent: false,
            error: emailError || 'Gmail non connecté. Connectez Gmail dans Paramètres > Intégrations.'
          },
          warning: 'Pour envoyer les emails, connectez votre compte Gmail dans Paramètres > Intégrations.'
        };
      }
      break;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 💰 FACTURES - AVEC RECHERCHE PAR NOM CORRIGÉE
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'creer-facture-depuis-devis': {
      const { devis_id, type, type_facture } = payload;
      
      if (!devis_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'devis_id requis' };
        break;
      }
      
      const factureType = type || type_facture || 'acompte';
      if (!['acompte', 'intermediaire', 'solde'].includes(factureType)) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'type: acompte|intermediaire|solde' };
        break;
      }
      
      let devisUUID = devis_id;
      if (devis_id.startsWith('DV-')) {
        const searchResult = await supabaseRequest.call(this, 'devis', 'GET', {
          search: { numero: devis_id },
          select: 'id',
          limit: 1
        });
        if (!searchResult.success || searchResult.count === 0) {
          result = { success: false, error: 'NOT_FOUND', message: `Devis ${devis_id} non trouvé` };
          break;
        }
        devisUUID = searchResult.data[0].id;
      }
      
      try {
        const edgeFunctionUrl = `${CONFIG.SUPABASE_URL}/functions/v1/create-facture-from-devis`;
        const edgeResponse = await this.helpers.httpRequest({
          method: 'POST',
          url: edgeFunctionUrl,
          headers: {
            'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: {
            tenant_id: tenant_id,
            devis_id: devisUUID,
            type: factureType
          },
          returnFullResponse: true
        });
        
        const statusCode = (edgeResponse && edgeResponse.statusCode) || (edgeResponse && edgeResponse.status) || 200;
        const responseData = typeof edgeResponse.body === 'string' 
          ? JSON.parse(edgeResponse.body) 
          : edgeResponse.body;
        
        if (statusCode >= 200 && statusCode < 300) {
          result = {
            success: true,
            message: `✅ Facture ${factureType} créée`,
            data: [responseData],
            count: 1,
            facture: responseData
          };
        } else {
          result = {
            success: false,
            error: responseData.error || 'FACTURE_ERROR',
            message: responseData.message || 'Erreur création facture',
            details: responseData
          };
        }
      } catch (edgeError) {
        result = {
          success: false,
          error: 'EDGE_ERROR',
          message: edgeError.message
        };
      }
      break;
    }
    
    case 'get-facture': {
      const { facture_id } = payload;
      
      if (!facture_id) {
        result = { success: false, error: 'VALIDATION_ERROR', message: 'facture_id requis' };
        break;
      }
      
      let factureUUID = facture_id;
      if (facture_id.startsWith('FA-')) {
        const searchResult = await supabaseRequest.call(this, 'factures', 'GET', {
          search: { numero: facture_id },
          select: 'id',
          limit: 1
        });
        if (!searchResult.success || searchResult.count === 0) {
          result = { success: false, error: 'NOT_FOUND', message: `Facture ${facture_id} non trouvée` };
          break;
        }
        factureUUID = searchResult.data[0].id;
      }
      
      result = await supabaseRequest.call(this, 'factures', 'GET', {
        filters: { id: factureUUID },
        select: '*,clients(*),lignes_factures(*),devis(numero,id)'
      });
      
      if (result.success && result.count > 0) {
        result.facture = result.data[0];
        const pdfUrl = CONFIG.APP_URL 
          ? `${CONFIG.APP_URL}/api/pdf/facture/${factureUUID}`
          : `/api/pdf/facture/${factureUUID}`;
        
        result.facture.pdf_url = pdfUrl;
        result.pdf_url = pdfUrl;
        result.message = `✅ Facture ${result.facture.numero}`;
      } else {
        result = { success: false, error: 'NOT_FOUND', message: 'Facture non trouvée' };
      }
      break;
    }
    
    case 'list-factures': {
      const search = payload.search || payload.query || payload.numero || payload.nom || payload.prenom || payload.client_name;
      
      if (search) {
        console.log(`🔍 [list-factures] Recherche: "${search}"`);
        
        const isNumero = typeof search === 'string' && (search.match(/^FA-\d{4}-\d{3,4}$/) || search.startsWith('FA-'));
        
        if (isNumero) {
          console.log(`🔍 Par numéro`);
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
            
            const statusCode = (leoResponse && leoResponse.statusCode) || 200;
            const responseData = typeof leoResponse.body === 'string' 
              ? JSON.parse(leoResponse.body) 
              : leoResponse.body;
            
            if (statusCode >= 200 && statusCode < 300) {
              result = {
                success: true,
                message: `${responseData.count || 0} facture(s)`,
                data: responseData.data || [],
                count: responseData.count || 0,
                factures: responseData.data || []
              };
            } else {
              result = {
                success: false,
                error: responseData.error || 'ERROR',
                message: responseData.message || 'Erreur',
                details: responseData
              };
            }
          } catch (leoError) {
            result = {
              success: false,
              error: 'LEO_ERROR',
              message: leoError.message
            };
          }
        } else {
          console.log(`🔍 Par nom client`);
          
          // ✅ STRATÉGIE 1 : Exacte
          let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
            filters: { nom_complet: search },
            select: 'id',
            limit: 20
          });
          
          // ✅ STRATÉGIE 2 : Partielle
          if (!clientsResult.success || clientsResult.count === 0) {
            clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
              search: { nom_complet: search },
              select: 'id',
              limit: 20
            });
          }
          
          // ✅ STRATÉGIE 3 : OR
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
              
              const statusCode = (response && response.statusCode) || 200;
              const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
              
              if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
                clientsResult = {
                  success: true,
                  data: data,
                  count: data.length
                };
              }
            } catch (err) {
              console.warn('⚠️ Erreur OR:', err.message);
            }
          }
          
          if (clientsResult.success && clientsResult.count > 0) {
            const clientIds = clientsResult.data.map(c => c.id);
            
            if (clientIds.length === 1) {
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
                
                const statusCode = (leoResponse && leoResponse.statusCode) || 200;
                const responseData = typeof leoResponse.body === 'string' 
                  ? JSON.parse(leoResponse.body) 
                  : leoResponse.body;
                
                if (statusCode >= 200 && statusCode < 300) {
                  result = {
                    success: true,
                    message: `${responseData.count || 0} facture(s)`,
                    data: responseData.data || [],
                    count: responseData.count || 0,
                    factures: responseData.data || []
                  };
                } else {
                  result = {
                    success: false,
                    error: responseData.error || 'ERROR',
                    message: responseData.message || 'Erreur'
                  };
                }
              } catch (leoError) {
                result = {
                  success: false,
                  error: 'LEO_ERROR',
                  message: leoError.message
                };
              }
            } else {
              // Plusieurs clients
              const url = `${REST_URL}/factures?tenant_id=eq.${tenant_id}&client_id=in.(${clientIds.map(id => `"${id}"`).join(',')})&select=*,clients(id,nom,prenom,nom_complet,email)&order=date_emission.desc&limit=${payload.limit || 50}`;
              
              try {
                const response = await this.helpers.httpRequest({
                  method: 'GET',
                  url: url,
                  headers: headers,
                  returnFullResponse: true
                });
                
                const statusCode = (response && response.statusCode) || 200;
                const responseData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
                
                if (statusCode >= 200 && statusCode < 300) {
                  result = {
                    success: true,
                    data: Array.isArray(responseData) ? responseData : [],
                    count: Array.isArray(responseData) ? responseData.length : 0,
                    factures: Array.isArray(responseData) ? responseData : []
                  };
                } else {
                  result = { success: false, error: 'QUERY_ERROR', message: 'Erreur', data: [] };
                }
              } catch (httpError) {
                result = { success: true, data: [], count: 0, factures: [] };
              }
            }
          } else {
            result = { success: true, data: [], count: 0, message: `Aucun client pour "${search}"`, factures: [] };
          }
        }
      } else {
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
          
          const statusCode = (leoResponse && leoResponse.statusCode) || 200;
          const responseData = typeof leoResponse.body === 'string' 
            ? JSON.parse(leoResponse.body) 
            : leoResponse.body;
          
          if (statusCode >= 200 && statusCode < 300) {
            result = {
              success: true,
              message: `${responseData.count || 0} facture(s)`,
              data: responseData.data || [],
              count: responseData.count || 0,
              factures: responseData.data || []
            };
          } else {
            result = {
              success: false,
              error: responseData.error || 'ERROR',
              message: responseData.message || 'Erreur'
            };
          }
        } catch (leoError) {
          result = {
            success: false,
            error: 'LEO_ERROR',
            message: leoError.message
          };
        }
      }
      break;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 📁 DOSSIERS
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'create-dossier': {
      const { client_id, titre, description, statut, priorite } = payload;
      
      if (client_id) {
        const clientCheck = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { id: client_id },
          select: 'id'
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
        result.message = `✅ Dossier créé`;
        result.dossier = result.data[0];
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
        // ✅ Même logique que list-devis
        let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { nom_complet: searchTerm },
          select: 'id',
          limit: 20
        });
        
        if (!clientsResult.success || clientsResult.count === 0) {
          clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
            search: { nom_complet: searchTerm },
            select: 'id',
            limit: 20
          });
        }
        
        if ((!clientsResult.success || clientsResult.count === 0) && searchTerm.includes(' ')) {
          const parts = searchTerm.trim().split(/\s+/);
          const prenom = parts[0];
          const nom = parts.slice(1).join(' ');
          
          const orConditions = [
            `nom.ilike.%25${encodeURIComponent(nom)}%25`,
            `prenom.ilike.%25${encodeURIComponent(prenom)}%25`,
            `nom_complet.ilike.%25${encodeURIComponent(searchTerm)}%25`
          ].join(',');
          
          const url = `${REST_URL}/clients?tenant_id=eq.${tenant_id}&or=(${orConditions})&select=id&order=created_at.desc&limit=20`;
          
          try {
            const response = await this.helpers.httpRequest({
              method: 'GET',
              url: url,
              headers: headers,
              returnFullResponse: true
            });
            
            const statusCode = (response && response.statusCode) || 200;
            const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            
            if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
              clientsResult = {
                success: true,
                data: data,
                count: data.length
              };
            }
          } catch (err) {
            console.warn('⚠️ Erreur OR:', err.message);
          }
        }
        
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
                headers: headers,
                returnFullResponse: true
              });
              
              const statusCode = (response && response.statusCode) || 200;
              const responseData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
              
              if (statusCode >= 200 && statusCode < 300) {
                result = {
                  success: true,
                  data: Array.isArray(responseData) ? responseData : [],
                  count: Array.isArray(responseData) ? responseData.length : 0
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
                count: allDossiers.length
              };
              break;
            }
          }
        } else {
          result = { success: true, data: [], count: 0, message: `Aucun client pour "${searchTerm}"` };
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
        result.message = `${result.count} dossier(s)${searchTerm ? ` pour "${searchTerm}"` : ''}`;
        result.dossiers = result.data;
      }
      break;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 📅 RDV - AVEC RECHERCHE PAR NOM CORRIGÉE
    // ═══════════════════════════════════════════════════════════════════════
    
    case 'create-rdv': {
      const { dossier_id, client_id, titre, date_heure, duree_minutes, type_rdv, lieu, adresse, notes, notes_acces } = payload;
      
      const adresseRdv = adresse || lieu || '';
      
      let dossierIdFinal = dossier_id;
      if (client_id && !dossier_id) {
        try {
          const dossiersResult = await supabaseRequest.call(this, 'dossiers', 'GET', {
            filters: { client_id },
            limit: 1
          });
          
          if (dossiersResult.success && dossiersResult.count > 0) {
            dossierIdFinal = dossiersResult.data[0].id;
          } else {
            const dossierNumero = await generateNumero.call(this, 'DOS');
            
            const createDossierResult = await supabaseRequest.call(this, 'dossiers', 'POST', {
              body: {
                client_id: client_id,
                titre: `Dossier Client`,
                statut: 'contact_recu',
                priorite: 'normale',
                numero: dossierNumero,
                source: 'whatsapp'
              }
            });
            
            if (createDossierResult.success && createDossierResult.data && createDossierResult.data.length > 0) {
              dossierIdFinal = createDossierResult.data[0].id;
            }
          }
        } catch (dossierError) {
          console.warn('⚠️ Erreur dossier:', dossierError);
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
      
      if (notes !== undefined) rdvBody.notes = notes;
      if (notes_acces !== undefined) rdvBody.notes_acces = notes_acces;
      
      if (rdvBody.lieu) {
        delete rdvBody.lieu;
      }
      
      result = await supabaseRequest.call(this, 'rdv', 'POST', {
        body: rdvBody
      });
      
      if (result.success && result.data && result.data.length > 0) {
        result.message = `✅ RDV planifié`;
        result.rdv = result.data[0];
        // Note: La mise à jour du statut du dossier est gérée automatiquement par l'application Next.js
      }
      break;
    }
    
    case 'list-rdv': {
      const search = payload.search || payload.query || payload.nom || payload.prenom || payload.client_name;
      const limit = payload.limit || 50;
      
      if (search) {
        console.log(`🔍 [list-rdv] Recherche: "${search}"`);
        
        // ✅ STRATÉGIE 1 : Exacte
        let clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
          filters: { nom_complet: search },
          select: 'id',
          limit: 20
        });
        
        // ✅ STRATÉGIE 2 : Partielle
        if (!clientsResult.success || clientsResult.count === 0) {
          clientsResult = await supabaseRequest.call(this, 'clients', 'GET', {
            search: { nom_complet: search },
            select: 'id',
            limit: 20
          });
        }
        
        // ✅ STRATÉGIE 3 : OR
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
            
            const statusCode = (response && response.statusCode) || 200;
            const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            
            if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
              clientsResult = {
                success: true,
                data: data,
                count: data.length
              };
            }
          } catch (err) {
            console.warn('⚠️ Erreur OR:', err.message);
          }
        }
        
        if (clientsResult.success && clientsResult.count > 0) {
          console.log(`✅ ${clientsResult.count} client(s), recherche RDV...`);
          
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
              
              const statusCode = (response && response.statusCode) || 200;
              const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
              
              if (statusCode >= 200 && statusCode < 300) {
                result = {
                  success: true,
                  data: Array.isArray(data) ? data : [],
                  count: Array.isArray(data) ? data.length : 0
                };
              } else {
                result = { success: false, error: 'QUERY_ERROR', message: 'Erreur', data: [] };
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
          result = { success: true, data: [], count: 0, message: `Aucun client pour "${search}"` };
        }
      } else {
        result = await supabaseRequest.call(this, 'rdv', 'GET', {
          select: '*,dossiers(titre),clients(id,nom_complet)',
          order: 'date_heure.asc',
          limit: limit
        });
      }
      
      if (result.success) {
        result.message = `${result.count} RDV${search ? ` pour "${search}"` : ''}`;
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
        supabaseRequest.call(this, 'devis', 'GET', { select: 'id' }),
        supabaseRequest.call(this, 'factures', 'GET', { select: 'id' }),
        supabaseRequest.call(this, 'dossiers', 'GET', { select: 'id' })
      ]);
      
      result = {
        success: true,
        message: 'Stats',
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
          'create-devis', 'add-ligne-devis', 'update-ligne-devis', 'delete-ligne-devis', 'finalize-devis', 
          'get-devis', 'list-devis', 'update-devis', 'delete-devis', 'envoyer-devis',
          'creer-facture-depuis-devis', 'get-facture', 'list-factures',
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
    message: error.message || 'Erreur exécution',
    details: error.toString(),
    data: [],
    count: 0
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RETOUR
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

if (!result.data) result.data = [];
if (result.count === undefined) result.count = Array.isArray(result.data) ? result.data.length : 0;

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
if (result.facture) finalResult.facture = result.facture;
if (result.factures) finalResult.factures = result.factures;
if (result.dossier) finalResult.dossier = result.dossier;
if (result.dossiers) finalResult.dossiers = result.dossiers;
if (result.rdv) finalResult.rdv = result.rdv;
if (result.lignes) finalResult.lignes = result.lignes;
if (result.template) finalResult.template = result.template;
if (result.totals) finalResult.totals = result.totals;
if (result.pdf_url) finalResult.pdf_url = result.pdf_url;

return JSON.stringify(finalResult, null, 2);
