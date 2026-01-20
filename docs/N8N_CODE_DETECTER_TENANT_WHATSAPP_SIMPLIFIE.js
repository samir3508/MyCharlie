// ============================================================================
// 🔍 DÉTECTER LE TENANT À PARTIR DU NUMÉRO WHATSAPP (VERSION SIMPLIFIÉE)
// ============================================================================
// Version simplifiée qui évite les blocages et utilise une syntaxe PostgREST standard
// ============================================================================

const input = $input.item.json;

// ============================================================================
// 1️⃣ EXTRACTION DU NUMÉRO WHATSAPP
// ============================================================================

let whatsappPhone = 
  input.messages?.[0]?.from ||           // Format Meta WhatsApp Cloud API
  input.From ||                           // Format direct depuis WhatsApp
  input.body?.From ||                     // Format dans body.From
  input.contacts?.[0]?.wa_id ||          // Format depuis contacts
  input.body?.contacts?.[0]?.wa_id ||    // Format depuis body.contacts
  input.body?.from ||                    // Format alternatif body.from
  '';

console.log('📱 Numéro WhatsApp extrait:', whatsappPhone);

// ============================================================================
// 2️⃣ NETTOYAGE DU NUMÉRO
// ============================================================================

function cleanPhone(phone) {
  if (!phone) return '';
  
  let cleaned = phone.replace(/whatsapp:/gi, '')
                     .replace(/tel:/gi, '')
                     .replace(/\s+/g, '')
                     .replace(/[-\/\(\)]/g, '')
                     .trim();
  
  // Normaliser le format : +33XXXXXXXXX
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '+33' + cleaned.substring(1);
    } else if (cleaned.startsWith('33') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

const cleanedPhone = cleanPhone(whatsappPhone);
console.log('🧹 Numéro nettoyé:', cleanedPhone);

// ============================================================================
// 3️⃣ RECHERCHE DU TENANT DANS SUPABASE
// ============================================================================

// ⚠️ CRITIQUE : TOUJOURS chercher le tenant basé sur le numéro WhatsApp actuel
// Ne pas utiliser un tenant_id précédent car chaque numéro peut avoir un tenant différent
let tenantId = null;
let tenantName = null;
let tenantFound = false;

// Si on a un numéro WhatsApp, chercher le tenant correspondant
if (cleanedPhone) {
  try {
    const supabaseUrl = 'https://lawllirgeisuvanbvkcr.supabase.co';
    // ⚠️ CLÉ SERVICE ROLE DIRECTEMENT DANS LE CODE (pas besoin de variable d'environnement)
    // Cette clé permet d'accéder à Supabase sans authentification utilisateur
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1NjYzNywiZXhwIjoyMDgzODMyNjM3fQ.3OR8IDsOtr8g854NlVOM_Lp1kuJhuKIuo8zNZGM4Fuo';
    
    console.log('🔑 Utilisation de la clé service role directement dans le code');
    console.log(`🔍 Recherche du tenant pour le numéro: ${cleanedPhone}`);
    
    // Variations du numéro à tester
    const phoneVariations = [
      cleanedPhone,                                    // +33745108883
      cleanedPhone.replace('+33', '0'),                // 0745108883
      cleanedPhone.replace('+', ''),                   // 33745108883
      cleanedPhone.substring(1),                       // 33745108883 (sans +)
      cleanedPhone.replace('+33', '33'),               // 33745108883 (sans + mais avec 33)
    ];
    
    // Supprimer les doublons
    const uniqueVariations = [...new Set(phoneVariations)];
    
    let foundTenant = null;
    
    // Essayer chaque variation avec une recherche simple
    for (const phoneVar of uniqueVariations) {
      try {
        // ⚠️ Syntaxe PostgREST standard : utiliser ilike avec pattern directement
        // Pour une recherche "contient", on peut utiliser plusieurs approches
        // Approche 1 : Recherche exacte d'abord
        let queryUrl = `${supabaseUrl}/rest/v1/tenants?select=id,company_name,whatsapp_phone,phone&or=(whatsapp_phone.eq.${encodeURIComponent(phoneVar)},phone.eq.${encodeURIComponent(phoneVar)})&limit=1`;
        
        console.log(`🔍 Recherche exacte avec: ${phoneVar}`);
        
        const response = await this.helpers.httpRequest({
          method: 'GET',
          url: queryUrl,
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          returnFullResponse: true,
          ignoreHttpStatusErrors: true
        });
        
        const statusCode = (response && response.statusCode) || (response && response.status) || 200;
        let tenants = null;
        
        if (response && response.body !== undefined) {
          tenants = Array.isArray(response.body) ? response.body : (response.body.data || []);
        } else if (Array.isArray(response)) {
          tenants = response;
        } else {
          tenants = [];
        }
        
        if (typeof tenants === 'string' && tenants.trim()) {
          try {
            tenants = JSON.parse(tenants);
          } catch (e) {
            tenants = [];
          }
        }
        
        if (statusCode >= 200 && statusCode < 300 && tenants && Array.isArray(tenants) && tenants.length > 0) {
          foundTenant = tenants[0];
          console.log(`✅ Tenant trouvé (exacte): ${foundTenant.company_name} (${foundTenant.id})`);
          break;
        }
        
        // Si pas trouvé avec recherche exacte, essayer avec ilike (contient)
        // ⚠️ PostgREST : pour "contient", utiliser le pattern directement dans ilike
        // Format: ilike.*value* ou utiliser % encodé
        queryUrl = `${supabaseUrl}/rest/v1/tenants?select=id,company_name,whatsapp_phone,phone&or=(whatsapp_phone.ilike.%25${encodeURIComponent(phoneVar)}%25,phone.ilike.%25${encodeURIComponent(phoneVar)}%25)&limit=1`;
        
        console.log(`🔍 Recherche wildcard avec: ${phoneVar}`);
        
        const response2 = await this.helpers.httpRequest({
          method: 'GET',
          url: queryUrl,
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          returnFullResponse: true,
          ignoreHttpStatusErrors: true
        });
        
        const statusCode2 = (response2 && response2.statusCode) || (response2 && response2.status) || 200;
        let tenants2 = null;
        
        if (response2 && response2.body !== undefined) {
          tenants2 = Array.isArray(response2.body) ? response2.body : (response2.body.data || []);
        } else if (Array.isArray(response2)) {
          tenants2 = response2;
        } else {
          tenants2 = [];
        }
        
        if (typeof tenants2 === 'string' && tenants2.trim()) {
          try {
            tenants2 = JSON.parse(tenants2);
          } catch (e) {
            tenants2 = [];
          }
        }
        
        if (statusCode2 >= 200 && statusCode2 < 300 && tenants2 && Array.isArray(tenants2) && tenants2.length > 0) {
          foundTenant = tenants2[0];
          console.log(`✅ Tenant trouvé (wildcard): ${foundTenant.company_name} (${foundTenant.id})`);
          break;
        }
        
      } catch (err) {
        console.warn(`⚠️ Erreur recherche avec ${phoneVar}:`, err.message || err.toString());
        continue;
      }
    }
    
    if (foundTenant) {
      tenantId = foundTenant.id;
      tenantName = foundTenant.company_name;
      tenantFound = true;
      console.log(`✅ Tenant détecté pour ${cleanedPhone}: ${tenantName} (${tenantId})`);
      console.log(`   Numéro WhatsApp du tenant: ${foundTenant.whatsapp_phone || 'N/A'}`);
      console.log(`   Numéro téléphone du tenant: ${foundTenant.phone || 'N/A'}`);
    } else {
      console.warn(`⚠️ Aucun tenant trouvé avec le numéro: ${cleanedPhone}`);
      console.warn(`   Variations essayées:`, uniqueVariations);
      console.warn(`   ⚠️ Le workflow continuera SANS tenant spécifique pour ce numéro`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la recherche du tenant:', error);
    console.error('   Stack:', error.stack);
  }
}

// ============================================================================
// 4️⃣ CONSTRUCTION DU RÉSULTAT
// ============================================================================

// ⚠️ CRITIQUE : Utiliser UNIQUEMENT le tenant_id trouvé pour ce numéro spécifique
// Ne pas utiliser de fallback avec un tenant_id précédent
if (!tenantId) {
  console.warn('⚠️ Aucun tenant_id trouvé pour ce numéro. Le workflow continuera sans tenant spécifique.');
  console.warn(`   Numéro WhatsApp recherché: ${cleanedPhone || 'N/A'}`);
  console.warn(`   ⚠️ IMPORTANT : Aucune donnée ne sera liée à un tenant pour ce message`);
} else {
  console.log(`✅ Tenant final utilisé: ${tenantName} (${tenantId}) pour le numéro ${cleanedPhone}`);
}

return {
  json: {
    ...input,
    context: {
      ...input.context,
      // ⚠️ Utiliser UNIQUEMENT le tenant_id trouvé pour ce numéro, pas de fallback
      tenant_id: tenantId || '',
      tenant_name: tenantName || '',
      tenant_found: tenantFound,
      whatsapp_phone_original: whatsappPhone,
      whatsapp_phone_cleaned: cleanedPhone,
      is_whatsapp: true
    },
    body: {
      ...input.body,
      From: whatsappPhone || input.body?.From || input.From || '',
    }
  }
};
