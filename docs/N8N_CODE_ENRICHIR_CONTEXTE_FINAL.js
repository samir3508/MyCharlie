/**
 * N8N Code Node - Enrichir le Contexte LÉO
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};
 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};


 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};



 * 
 * Ce code enrichit le contexte avec toutes les informations nécessaires
 * depuis Supabase pour créer devis, factures et clients.
 * 
 * Position: Après "Format Message pour léo", avant "Agent IA LÉO"
 */

// ============================================
// 1. RÉCUPÉRER LES DONNÉES D'ENTRÉE
// ============================================
const inputItems = $input.all();
const originalItem = inputItems.find(item => item.json.body) || inputItems[0];
const baseContext = originalItem.json.body?.context || {};

const tenantId = baseContext.tenant_id;
if (!tenantId) {
  console.log('⚠️ Pas de tenant_id, retour du contexte original');
  return originalItem;
}

// ============================================
// 2. CONFIGURATION SUPABASE
// ============================================
// Dans N8N, les variables d'environnement sont accessibles via $env
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_SERVICE_ROLE_KEY;

// Si les variables ne sont pas configurées, on peut les hardcoder temporairement
// const SUPABASE_URL = 'https://xxxxx.supabase.co';
// const SUPABASE_KEY = 'your-service-role-key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation du contexte de base avec dates uniquement.');
  // On retourne quand même un contexte enrichi avec au moins les dates
  const now = new Date();
  const enrichedContext = {
    ...baseContext,
    current_date: now.toISOString().split('T')[0],
    current_datetime: now.toISOString(),
    current_year: now.getFullYear().toString()
  };
  return {
    json: {
      ...originalItem.json,
      body: {
        ...originalItem.json.body,
        context: enrichedContext
      }
    }
  };
}

// ============================================
// 3. FONCTION HELPER POUR REQUÊTES SUPABASE
// ============================================
async function querySupabase(table, filters = {}, options = {}) {
  const {
    select = '*',
    orderBy = null,
    limit = null,
    ascending = false
  } = options;

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  // Ajouter les filtres (format Supabase: key=eq.value)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Ajouter select
  params.append('select', select);
  
  // Ajouter order by si fourni
  if (orderBy) {
    params.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  // Ajouter limit si fourni
  if (limit) {
    params.append('limit', limit.toString());
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  try {
    // Dans N8N, utiliser this.helpers.httpRequest ou $http
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log(`✅ Requête ${table} réussie:`, Array.isArray(response) ? `${response.length} résultats` : 'OK');
    return response;
  } catch (error) {
    console.error(`❌ Erreur requête ${table}:`, error.message || error);
    return null;
  }
}

// ============================================
// 4. RÉCUPÉRER LES DONNÉES DEPUIS SUPABASE
// ============================================

// 4.1 - Informations complètes du tenant
let tenantInfo = {};
try {
  const tenantData = await querySupabase.call(this,
    'tenants',
    { id: tenantId },
    {
      select: 'id,company_name,email,phone,whatsapp_phone,address,siret,tva_intra,iban,bic,legal_mentions',
      limit: 1
    }
  );
  
  if (tenantData && Array.isArray(tenantData) && tenantData.length > 0) {
    tenantInfo = tenantData[0];
    console.log('✅ Tenant récupéré:', tenantInfo.company_name || tenantInfo.id);
  } else {
    console.warn('⚠️ Aucun tenant trouvé avec l\'ID:', tenantId);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération tenant:', error.message || error);
}

// 4.2 - Clients récents (10 derniers)
let recentClients = [];
try {
  const clientsData = await querySupabase.call(this,
    'clients',
    { tenant_id: tenantId },
    {
      select: 'id,nom,prenom,nom_complet,email,telephone,adresse_facturation,adresse_chantier,type,notes',
      orderBy: 'created_at',
      limit: 10,
      ascending: false
    }
  );
  
  if (clientsData && Array.isArray(clientsData)) {
    recentClients = clientsData;
    console.log(`✅ ${recentClients.length} clients récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération clients:', error.message || error);
}

// 4.3 - Derniers devis (5 derniers) - Optionnel
let recentDevis = [];
try {
  const devisData = await querySupabase.call(this,
    'devis',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation,delai_execution',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (devisData && Array.isArray(devisData)) {
    recentDevis = devisData;
    console.log(`✅ ${recentDevis.length} devis récents récupérés`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération devis:', error.message || error);
}

// 4.4 - Dernières factures (5 dernières) - Optionnel
let recentFactures = [];
try {
  const facturesData = await querySupabase.call(this,
    'factures',
    { tenant_id: tenantId },
    {
      select: 'id,numero,titre,client_id,montant_ttc,statut,date_creation',
      orderBy: 'date_creation',
      limit: 5,
      ascending: false
    }
  );
  
  if (facturesData && Array.isArray(facturesData)) {
    recentFactures = facturesData;
    console.log(`✅ ${recentFactures.length} factures récentes récupérées`);
  }
} catch (error) {
  console.warn('⚠️ Erreur récupération factures:', error.message || error);
}

// ============================================
// 5. CONSTRUIRE LE CONTEXTE ENRICHI
// ============================================
const now = new Date();
const enrichedContext = {
  // Conserver tout le contexte original
  ...baseContext,
  
  // Informations complètes du tenant
  tenant: {
    id: tenantInfo.id || tenantId,
    company_name: tenantInfo.company_name || baseContext.tenant_name || 'Entreprise',
    email: tenantInfo.email || baseContext.tenant_email || null,
    phone: tenantInfo.phone || null,
    whatsapp_phone: tenantInfo.whatsapp_phone || null,
    address: tenantInfo.address || null,
    siret: tenantInfo.siret || null,
    tva_intra: tenantInfo.tva_intra || null,
    iban: tenantInfo.iban || null,
    bic: tenantInfo.bic || null,
    legal_mentions: tenantInfo.legal_mentions || null
  },
  
  // Clients récents (format simplifié pour LÉO)
  recent_clients: recentClients.map(client => ({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    nom_complet: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
    email: client.email || null,
    telephone: client.telephone || null,
    adresse_facturation: client.adresse_facturation || null,
    adresse_chantier: client.adresse_chantier || null,
    type: client.type || 'particulier',
    notes: client.notes || null
  })),
  
  // Derniers devis (pour référence)
  recent_devis: recentDevis,
  
  // Dernières factures (pour référence)
  recent_factures: recentFactures,
  
  // Dates actuelles
  current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
  current_datetime: now.toISOString(),
  current_year: now.getFullYear().toString()
};

console.log('✅ Contexte enrichi construit avec succès');
console.log('- Tenant:', enrichedContext.tenant.company_name);
console.log('- Clients récents:', enrichedContext.recent_clients.length);
console.log('- Date actuelle:', enrichedContext.current_date);

// ============================================
// 6. RETOURNER L'ITEM ENRICHI
// ============================================
return {
  json: {
    ...originalItem.json,
    body: {
      ...originalItem.json.body,
      context: enrichedContext
    }
  }
};