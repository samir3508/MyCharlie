// ============================================================================
// 🔍 EXTRACTION INFO - Compatible WhatsApp Cloud API (n8n) + BASE V2
// - CORRIGÉ : Récupère le tenant_id depuis le contexte précédent (Code in JavaScript)
// - CORRIGÉ : Extraction des lignes de travaux avec gestion des espaces et chiffres dans labels
// ============================================================================

const items = $input.all();

// Helper: safe get
const get = (obj, path, fallback = undefined) => {
  try {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj) ?? fallback;
  } catch (e) {
    return fallback;
  }
};

// ===============================
// 0) RÉCUPÉRER LE BODY DE BASE
// ===============================
const input0 = items[0]?.json ?? {};
const body = input0.body ?? input0;

// ===============================
// 1) RÉCUPÉRER LE TENANT_ID DEPUIS LE CONTEXTE PRÉCÉDENT (CRITIQUE)
// ===============================
// Le nœud "Code in JavaScript" a détecté le tenant et l'a mis dans context.tenant_id
// ⚠️ Les nœuds intermédiaires peuvent perdre le context, donc on cherche partout
let tenantId = null;
let tenantName = null;

// PRIORITÉ 1 : Chercher directement dans l'input actuel (le plus fiable)
const currentInput = $input.item.json || {};
console.log('🔍 Recherche tenant_id dans currentInput:', JSON.stringify(Object.keys(currentInput)).substring(0, 200));

if (currentInput.context?.tenant_id) {
  tenantId = currentInput.context.tenant_id;
  tenantName = currentInput.context.tenant_name || null;
  console.log(`✅ Tenant_id trouvé dans input.context: ${tenantId} (${tenantName || 'N/A'})`);
}

// PRIORITÉ 2 : Chercher dans tous les items précédents (depuis "Code in JavaScript" via le flux)
if (!tenantId) {
  console.log(`🔍 Recherche dans ${items.length} items précédents...`);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const json = item.json || {};
    
    console.log(`   Item ${i}:`, JSON.stringify(Object.keys(json)).substring(0, 100));
    
    // Chercher dans context.tenant_id (mis par "Code in JavaScript")
    if (json.context?.tenant_id) {
      tenantId = json.context.tenant_id;
      tenantName = json.context.tenant_name || null;
      console.log(`✅ Tenant_id trouvé dans items[${i}].context: ${tenantId} (${tenantName || 'N/A'})`);
      break;
    }
    
    // Chercher aussi dans body.context.tenant_id
    if (json.body?.context?.tenant_id) {
      tenantId = json.body.context.tenant_id;
      tenantName = json.body.context.tenant_name || null;
      console.log(`✅ Tenant_id trouvé dans items[${i}].body.context: ${tenantId} (${tenantName || 'N/A'})`);
      break;
    }
    
    // Chercher au niveau racine
    if (json.tenant_id) {
      tenantId = json.tenant_id;
      tenantName = json.tenant_name || null;
      console.log(`✅ Tenant_id trouvé dans items[${i}] au niveau racine: ${tenantId} (${tenantName || 'N/A'})`);
      break;
    }
  }
}

// PRIORITÉ 3 : Si toujours pas trouvé, chercher dans le body actuel et input0
if (!tenantId) {
  console.log('🔍 Recherche dans body et input0...');
  tenantId = body.context?.tenant_id || body.tenant_id || input0.context?.tenant_id || input0.tenant_id || null;
  tenantName = body.context?.tenant_name || body.tenant_name || input0.context?.tenant_name || input0.tenant_name || null;
  if (tenantId) {
    console.log(`✅ Tenant_id trouvé dans body/input0: ${tenantId} (${tenantName || 'N/A'})`);
  }
}

// PRIORITÉ 4 : Dernière tentative - utiliser $() pour accéder directement au nœud "Code in JavaScript"
// ⚠️ Syntaxe correcte : $('Code in JavaScript').first().json.context.tenant_id
if (!tenantId) {
  try {
    console.log('🔍 Dernière tentative: accès direct au nœud "Code in JavaScript"...');
    const tenantIdFromCode = $('Code in JavaScript').first().json.context?.tenant_id;
    const tenantNameFromCode = $('Code in JavaScript').first().json.context?.tenant_name;
    
    if (tenantIdFromCode) {
      tenantId = tenantIdFromCode;
      tenantName = tenantNameFromCode || null;
      console.log(`✅ Tenant_id trouvé via $('Code in JavaScript').first().json: ${tenantId} (${tenantName || 'N/A'})`);
    } else {
      console.warn('⚠️ Le nœud "Code in JavaScript" n\'a pas de context.tenant_id');
    }
  } catch (err) {
    console.warn('⚠️ Impossible d\'accéder au nœud "Code in JavaScript" via $():', err.message);
    console.warn('   Erreur complète:', err);
  }
}

// ⚠️ CRITIQUE : NE PLUS UTILISER DE FALLBACK HARDCODÉ
// Si aucun tenant_id n'est trouvé, on log un warning mais on ne met pas de valeur par défaut
if (!tenantId) {
  console.warn('⚠️ Aucun tenant_id trouvé dans le contexte précédent !');
  console.warn('   Le workflow continuera sans tenant spécifique.');
  console.warn('   Vérifiez que le nœud "Code in JavaScript" détecte correctement le tenant.');
  console.warn('   Numéro WhatsApp recherché:', body.From || body.contacts?.[0]?.wa_id || 'N/A');
} else {
  console.log(`✅ Tenant_id utilisé: ${tenantId} (${tenantName || 'N/A'})`);
}

// ===============================
// 2) RÉCUPÉRER LE MESSAGE À PARSER (robuste)
// ===============================
let message = '';
let msgType = null;
let from = null;

// Cas A: ton "Edit Fields" (aplati) ou données depuis "Extraction du type"
if (typeof body === 'object' && (body.message_type !== undefined || body.text_audio_message !== undefined || body.text)) {
  // Dans ton cas actuel, tu as mis "Salut cava" dans message_type
  // Donc on reconstruit intelligemment :
  const mt = body.message_type;              // devrait être "text" / "audio" etc, mais chez toi c'est parfois le texte
  const tam = body.text_audio_message;       // devrait contenir le texte ou transcription
  const img = body.image_content;
  const aud = body.audio_content;
  const textBody = body.text?.body || body.text; // Format depuis "Extraction du type"

  // Détecter type réel
  const possibleTypes = new Set(['text', 'audio', 'image', 'video', 'document']);
  msgType = (typeof mt === 'string' && possibleTypes.has(mt)) ? mt : (body.type || null);

  // Message (priorité)
  message =
    (typeof tam === 'string' && tam.trim()) ? tam.trim() :
    (typeof textBody === 'string' && textBody.trim()) ? textBody.trim() : // Format "Extraction du type"
    (typeof mt === 'string' && !possibleTypes.has(mt) && mt.trim()) ? mt.trim() :  // <= ton cas: message_type contient le texte
    (typeof img === 'string' && img.trim()) ? img.trim() :
    (typeof aud === 'string' && aud.trim()) ? aud.trim() :
    '';

  from = body.from ?? input0.from ?? null;
}

// Cas B: payload Meta brut (entry/changes)
if (!message) {
  const metaType = get(body, 'entry.0.changes.0.value.messages.0.type', null);
  const metaText = get(body, 'entry.0.changes.0.value.messages.0.text.body', '');
  msgType = msgType ?? metaType;

  message = (typeof metaText === 'string' && metaText.trim()) ? metaText.trim() : message;

  // from (numéro WA)
  from = from ?? get(body, 'entry.0.changes.0.value.messages.0.from', null);
}

// Cas C: ancien format (history/raw_message/message/Body)
if (!message) {
  if (body.history && Array.isArray(body.history) && body.history.length > 0) {
    const firstUserMessage = body.history.find(m => m.role === 'user' && m.content);
    if (firstUserMessage?.content) message = String(firstUserMessage.content).trim();
  }
  if (!message) message = String(body.raw_message || body.message || body.Body || '').trim();
}

console.log('📝 Message reçu:', message.substring(0, 120));
console.log('🧩 Type détecté:', msgType);
console.log('📨 From détecté:', from);

// ===============================
// 3) DATE
// ===============================
const todayDate = new Date().toISOString().slice(0, 10);

// ===============================
// 4) EXTRACTION CLIENT (si présent dans le message)
// ===============================
const namePatterns = [
  /(?:client|créer?|ajouter?|rajouter?)\s+(?:le\s+)?(?:client\s+)?([A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ]+)/i,
  /devis pour\s+([A-Za-zÀ-ÿ\s'-]+?)(?:\s*[,\n📍]|$)/i,
  /^([A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ]+)(?:\s*[,\n📍])/m
];

let clientName = null;
for (const p of namePatterns) {
  const m = message.match(p);
  if (m?.[1]) {
    clientName = m[1].trim().replace(/^(le|la|ce|cette|aussi)\s+/i, '').trim();
    break;
  }
}

let prenom = null, nom = null;
if (clientName) {
  const parts = clientName.split(/\s+/);
  if (parts.length >= 2) { prenom = parts[0]; nom = parts.slice(1).join(' '); }
  else { nom = parts[0]; }
}

const addressPatterns = [
  /📍\s*([^\n]+)/,
  /(\d{1,4}[^,\n]{5,},?\s*\d{5}\s*[A-Za-zÀ-ÿ\s-]+)/,
  /adresse\s*:?\s*([^\n]+)/i
];

let address = null;
for (const p of addressPatterns) {
  const m = message.match(p);
  if (m?.[1]) { address = m[1].trim(); break; }
}

const phonePatterns = [
  /📞\s*([\d\s.-]+)/,
  /(0\d(?:[\s.-]?\d{2}){4})/,
  /(\+33[\d\s.-]+)/,
  /tel(?:ephone)?\s*:?\s*([\d\s.-]+)/i
];

let phone = null;
for (const p of phonePatterns) {
  const m = message.match(p);
  if (m?.[1]) { phone = m[1].replace(/[\s.-]/g, ''); break; }
}

const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
const email = emailMatch ? emailMatch[0] : null;

console.log('👤 Client extrait:', { clientName, prenom, nom, address, phone, email });

// ===============================
// 5) EXTRACTION DES LIGNES DE TRAVAUX (CORRIGÉ)
// ===============================
const lines = [];

const normalizedMsg = message
  .replace(/\r\n/g, ' ')
  .replace(/\r/g, ' ')
  .replace(/\n/g, ' ')
  .replace(/\t/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// FORFAIT
// ✅ CORRECTION : Ajout de 0-9 dans le label pour capturer "200L"
// ✅ CORRECTION : Gestion des espaces dans les montants (ex: "1 080")
const forfaitRegex = /([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*forfait\s+(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi;
let match;
while ((match = forfaitRegex.exec(normalizedMsg)) !== null) {
  const label = match[1].trim();
  // ✅ CORRECTION : Supprimer les espaces dans les montants avant parsing
  const prixStr = match[2].replace(/\s+/g, '').replace(',', '.');
  const prix = parseFloat(prixStr);
  const tva = parseInt(match[3], 10);
  
  if (!isNaN(prix) && !isNaN(tva) && label.length > 0) {
    if (!lines.find(l => l.label === label && l.unit_price === prix)) {
      lines.push({ label, quantity: 1, unit: 'forfait', unit_price: prix, tva });
    }
  }
}

// QTY × PRICE
// ✅ CORRECTION : Ajout de 0-9 dans le label
// ✅ CORRECTION : Gestion des espaces dans les montants (ex: "1 080")
// ✅ CORRECTION : Ajout de "u" dans les unités
const qtyPriceRegex = /([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s+(m²|ml|m|u\.|unité|u)\s*[×xX]\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi;
while ((match = qtyPriceRegex.exec(normalizedMsg)) !== null) {
  const label = match[1].trim();
  // ✅ CORRECTION : Supprimer les espaces dans les quantités et prix avant parsing
  const qtyStr = match[2].replace(/\s+/g, '').replace(',', '.');
  const qty = parseFloat(qtyStr);
  const unit = match[3];
  const prixStr = match[4].replace(/\s+/g, '').replace(',', '.');
  const prix = parseFloat(prixStr);
  const tva = parseInt(match[5], 10);
  
  if (!isNaN(qty) && !isNaN(prix) && !isNaN(tva) && label.length > 0) {
    if (!lines.find(l => l.label === label && l.quantity === qty && l.unit_price === prix)) {
      lines.push({ label, quantity: qty, unit, unit_price: prix, tva });
    }
  }
}

console.log(`🔨 ${lines.length} ligne(s) de travaux extraite(s)`);

// ===============================
// 6) INFOS WHATSAPP (Meta)
// ===============================

// On considère WhatsApp true si on a un "from" numérique type 33... ou si payload Meta contient messaging_product
// Un numéro qui commence par 33 (France) ou qui a 10+ chiffres est probablement WhatsApp
let isWhatsapp =
  Boolean(from && (String(from).startsWith('33') || String(from).length >= 10)) ||
  body.is_whatsapp === true ||
  body.context?.is_whatsapp === true ||
  input0.context?.is_whatsapp === true ||
  input0.is_whatsapp === true ||
  currentInput.messaging_product === 'whatsapp' ||
  currentInput.context?.is_whatsapp === true ||
  get(body, 'entry.0.changes.0.value.messaging_product', '') === 'whatsapp';

// Si toujours pas détecté, récupérer depuis le nœud "Code in JavaScript"
if (!isWhatsapp) {
  try {
    const isWhatsappFromCode = $('Code in JavaScript').first().json.context?.is_whatsapp;
    if (isWhatsappFromCode === true) {
      isWhatsapp = true;
      console.log('✅ is_whatsapp trouvé via $(\'Code in JavaScript\').first().json: true');
    }
  } catch (err) {
    console.warn('⚠️ Impossible de récupérer is_whatsapp depuis "Code in JavaScript":', err.message);
  }
}

// whatsapp_phone = from
const whatsappPhone = from ? String(from) : (body.context?.whatsapp_phone ?? input0.from ?? null);

// ===============================
// 7) STRUCTURE FINALE
// ===============================
return {
  json: {
    body: {
      raw_message: message,
      message_type: msgType ?? body.type ?? null,
      client: {
        name: clientName,
        prenom,
        nom,
        address,
        phone,
        email
      },
      travaux: lines.length > 0 ? lines : null,
      context: {
        tenant_id: tenantId || '', // ⚠️ CRITIQUE : Utiliser le tenant_id détecté, pas de fallback hardcodé
        tenant_name: tenantName || '',
        conversation_date: todayDate,
        is_whatsapp: isWhatsapp,
        whatsapp_phone: whatsappPhone
      }
    }
  }
};
