// ============================================================================
// 🔍 DÉTECTER LE TENANT À PARTIR DU NUMÉRO WHATSAPP
// ============================================================================
// Ce nœud doit être placé APRÈS le Chat Trigger et AVANT le Check Message Type
// ============================================================================

const input = $input.item.json;

// ============================================================================
// 1️⃣ EXTRACTION DU NUMÉRO WHATSAPP
// ============================================================================

// Essayer différents chemins où le numéro WhatsApp peut être stocké
let whatsappPhone = 
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
  // Exemple: "0612345678" → "+33612345678"
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
    // Utiliser Supabase REST API via HTTP Request
    const supabaseUrl = 'https://lawllirgeisuvanbvkcr.supabase.co';
    const supabaseServiceKey = $env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseServiceKey) {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY non configuré dans n8n $env');
      // Continuer avec le reste du workflow sans tenant_id
    } else {
      // Chercher le tenant par whatsapp_phone ou phone
      // On cherche avec plusieurs variations du numéro pour être sûr
      const phoneVariations = [
        cleanedPhone,
        cleanedPhone.replace('+33', '0'),      // +33612345678 → 0612345678
        cleanedPhone.replace('+', ''),         // +33612345678 → 33612345678
        cleanedPhone.replace('+33', '33'),     // +33612345678 → 33612345678 (déjà fait mais gardé pour clarté)
      ];
      
      // Faire une requête pour chaque variation jusqu'à trouver un résultat
      let foundTenant = null;
      
      for (const phoneVar of phoneVariations) {
        // Chercher dans whatsapp_phone
        let queryUrl = `${supabaseUrl}/rest/v1/tenants?select=id,company_name,whatsapp_phone,phone&or=(whatsapp_phone.ilike.%${phoneVar}%,phone.ilike.%${phoneVar}%)&limit=1`;
        
        console.log(`🔍 Recherche tenant avec: ${phoneVar}`);
        
        try {
          const response = await $http.get(queryUrl, {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          
          // n8n peut retourner response.body ou response directement
          const tenants = Array.isArray(response) 
            ? response 
            : (response.body || (Array.isArray(response) ? response : []));
          
          if (tenants && tenants.length > 0) {
            foundTenant = tenants[0];
            console.log(`✅ Tenant trouvé: ${foundTenant.company_name} (${foundTenant.id})`);
            break;
          }
        } catch (err) {
          console.warn(`⚠️ Erreur recherche avec ${phoneVar}:`, err.message);
          continue;
        }
      }
      
      if (foundTenant) {
        tenantId = foundTenant.id;
        tenantName = foundTenant.company_name;
        tenantFound = true;
        console.log(`✅ Tenant détecté: ${tenantName} (${tenantId})`);
      } else {
        console.warn(`⚠️ Aucun tenant trouvé avec le numéro: ${cleanedPhone}`);
        console.warn(`   Variations essayées:`, phoneVariations);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la recherche du tenant:', error);
    // Continuer sans bloquer le workflow
  }
}

// ============================================================================
// 4️⃣ CONSTRUCTION DU RÉSULTAT
// ============================================================================

// Si toujours pas de tenant_id trouvé, on utilise un fallback mais on log un warning
if (!tenantId) {
  console.warn('⚠️ Aucun tenant_id trouvé. Le workflow continuera sans tenant spécifique.');
  console.warn(`   Numéro WhatsApp recherché: ${cleanedPhone || 'N/A'}`);
  console.warn(`   Valeurs d'entrée disponibles:`, JSON.stringify(Object.keys(input), null, 2));
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
      // Garder is_whatsapp si déjà présent, sinon le définir à true (on est dans un workflow WhatsApp)
      is_whatsapp: input.context?.is_whatsapp !== undefined ? input.context.is_whatsapp : true
    },
    body: {
      ...input.body,
      // Ajouter le numéro WhatsApp au body aussi si nécessaire
      From: whatsappPhone || input.body?.From || input.From || '',
    }
  }
};
