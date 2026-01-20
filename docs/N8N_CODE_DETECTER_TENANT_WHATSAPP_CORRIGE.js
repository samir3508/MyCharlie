// ============================================================================
// 🔍 DÉTECTER LE TENANT À PARTIR DU NUMÉRO WHATSAPP
// ============================================================================
// CORRIGÉ : Utilise this.helpers.httpRequest au lieu de $http.get
// ============================================================================

const input = $input.item.json;

// ============================================================================
// 1️⃣ EXTRACTION DU NUMÉRO WHATSAPP
// ============================================================================

// Essayer différents chemins où le numéro WhatsApp peut être stocké
let whatsappPhone = 
  input.messages?.[0]?.from ||           // Format Meta WhatsApp Cloud API
  input.From ||                           // Format direct depuis WhatsApp
  input.body?.From ||                     // Format dans body.From
  input.contacts?.[0]?.wa_id ||          // Format depuis contacts
  input.body?.contacts?.[0]?.wa_id ||    // Format depuis body.contacts
  input.body?.from ||                    // Format alternatif body.from
  input.body?.metadata?.phone ||         // Format depuis metadata
  '';

console.log('📱 Numéro WhatsApp extrait:', whatsappPhone);

// ============================================================================
// 2️⃣ NETTOYAGE DU NUMÉRO
// ============================================================================

function cleanPhone(phone) {
  if (!phone) return '';
  
  // Enlever les préfixes "whatsapp:", "tel:", etc.
  let cleaned = phone.replace(/whatsapp:/gi, '')
                     .replace(/tel:/gi, '')
                     .replace(/phone:/gi, '')
                     .replace(/\s+/g, '')           // Enlever espaces
                     .replace(/[-\/\(\)]/g, '')     // Enlever tirets, slashes, parenthèses
                     .trim();
  
  // Si le numéro commence par +, le garder, sinon essayer d'ajouter +33 pour la France
  if (!cleaned.startsWith('+')) {
    // Si le numéro commence par 0 (format français), remplacer par +33
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '+33' + cleaned.substring(1);
    }
    // Si le numéro commence par 33, ajouter le +
    else if (cleaned.startsWith('33') && cleaned.length === 11) {
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

let tenantId = input.context?.tenant_id || input.body?.tenant_id || null;
let tenantName = input.context?.tenant_name || null;
let tenantFound = false;

// Si on n'a pas déjà de tenant_id ET qu'on a un numéro WhatsApp, chercher
if (!tenantId && cleanedPhone) {
  try {
    const supabaseUrl = 'https://lawllirgeisuvanbvkcr.supabase.co';
    // ⚠️ CLÉ SERVICE ROLE DIRECTEMENT DANS LE CODE (pas besoin de variable d'environnement)
    // Cette clé permet d'accéder à Supabase sans authentification utilisateur
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1NjYzNywiZXhwIjoyMDgzODMyNjM3fQ.3OR8IDsOtr8g854NlVOM_Lp1kuJhuKIuo8zNZGM4Fuo';
    
    console.log('🔑 Utilisation de la clé service role directement dans le code');
    
    if (supabaseServiceKey) {
      // Variations du numéro à tester
      const phoneVariations = [
        cleanedPhone,                                    // +33745108883
        cleanedPhone.replace('+33', '0'),                // +33745108883 → 0745108883
        cleanedPhone.replace('+', ''),                   // +33745108883 → 33745108883
        cleanedPhone.replace('+33', '33'),               // +33745108883 → 33745108883
        cleanedPhone.substring(1),                      // +33745108883 → 33745108883 (sans le +)
      ];
      
      // Supprimer les doublons
      const uniqueVariations = [...new Set(phoneVariations)];
      
      let foundTenant = null;
      
      // Fonction helper pour faire une requête Supabase
      const searchTenant = async (phoneVar, useWildcard = false) => {
        const phoneVarEncoded = encodeURIComponent(phoneVar);
        let queryUrl;
        
        if (useWildcard) {
          // Recherche avec wildcards : ilike.%25value%25 = LIKE '%value%'
          // %25 est l'encodage URL de %
          const wildcardValue = `%25${phoneVarEncoded}%25`;
          queryUrl = `${supabaseUrl}/rest/v1/tenants?select=id,company_name,whatsapp_phone,phone&or=(whatsapp_phone.ilike.${wildcardValue},phone.ilike.${wildcardValue})&limit=1`;
        } else {
          // Recherche exacte d'abord : ilike.value = LIKE 'value'
          queryUrl = `${supabaseUrl}/rest/v1/tenants?select=id,company_name,whatsapp_phone,phone&or=(whatsapp_phone.ilike.${phoneVarEncoded},phone.ilike.${phoneVarEncoded})&limit=1`;
        }
        
        console.log(`🔍 Recherche tenant avec: ${phoneVar} (${useWildcard ? 'wildcard' : 'exact'})`);
        console.log(`   URL: ${queryUrl.substring(0, 200)}...`);
        
        try {
          // ⚠️ CRITIQUE : Utiliser this.helpers.httpRequest au lieu de $http.get
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
          
          // Récupérer le status code
          const statusCode = (response && response.statusCode) || (response && response.status) || 200;
          
          // Récupérer les données
          let tenants = null;
          if (response && response.body !== undefined) {
            tenants = Array.isArray(response.body) ? response.body : (response.body.data || []);
          } else if (Array.isArray(response)) {
            tenants = response;
          } else {
            tenants = [];
          }
          
          // Si data est une string, essayer de la parser
          if (typeof tenants === 'string' && tenants.trim()) {
            try {
              tenants = JSON.parse(tenants);
            } catch (e) {
              tenants = [];
            }
          }
          
          if (statusCode >= 200 && statusCode < 300 && tenants && Array.isArray(tenants) && tenants.length > 0) {
            return tenants[0];
          } else if (statusCode >= 200 && statusCode < 300) {
            console.log(`   Aucun tenant trouvé avec cette variation (${useWildcard ? 'wildcard' : 'exact'})`);
            return null;
          } else {
            console.warn(`   Erreur HTTP ${statusCode} lors de la recherche`);
            return null;
          }
        } catch (err) {
          console.warn(`⚠️ Erreur recherche avec ${phoneVar}:`, err.message || err.toString());
          return null;
        }
      };
      
      // Essayer chaque variation : d'abord recherche exacte, puis avec wildcards
      for (const phoneVar of uniqueVariations) {
        // 1. Recherche exacte d'abord
        foundTenant = await searchTenant(phoneVar, false);
        if (foundTenant) {
          console.log(`✅ Tenant trouvé (recherche exacte): ${foundTenant.company_name} (${foundTenant.id})`);
          console.log(`   whatsapp_phone: ${foundTenant.whatsapp_phone || 'N/A'}`);
          console.log(`   phone: ${foundTenant.phone || 'N/A'}`);
          break;
        }
        
        // 2. Si pas trouvé, essayer avec wildcards
        foundTenant = await searchTenant(phoneVar, true);
        if (foundTenant) {
          console.log(`✅ Tenant trouvé (recherche wildcard): ${foundTenant.company_name} (${foundTenant.id})`);
          console.log(`   whatsapp_phone: ${foundTenant.whatsapp_phone || 'N/A'}`);
          console.log(`   phone: ${foundTenant.phone || 'N/A'}`);
          break;
        }
      }
      
      if (foundTenant) {
        tenantId = foundTenant.id;
        tenantName = foundTenant.company_name;
        tenantFound = true;
        console.log(`✅ Tenant détecté: ${tenantName} (${tenantId})`);
      } else {
        console.warn(`⚠️ Aucun tenant trouvé avec le numéro: ${cleanedPhone}`);
        console.warn(`   Variations essayées:`, uniqueVariations);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la recherche du tenant:', error);
    console.error('   Stack:', error.stack);
  }
}

// ============================================================================
// 4️⃣ CONSTRUCTION DU RÉSULTAT
// ============================================================================

if (!tenantId) {
  console.warn('⚠️ Aucun tenant_id trouvé. Le workflow continuera sans tenant spécifique.');
  console.warn(`   Numéro WhatsApp recherché: ${cleanedPhone || 'N/A'}`);
}

return {
  json: {
    ...input,
    context: {
      ...input.context,
      tenant_id: tenantId || input.context?.tenant_id || input.body?.tenant_id || '',
      tenant_name: tenantName || input.context?.tenant_name || input.body?.tenant_name || '',
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
