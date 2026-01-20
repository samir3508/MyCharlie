# 🔧 Fix : Détection automatique du Tenant depuis WhatsApp

## 🚨 Problème identifié

Le workflow n8n utilise toujours le même `tenant_id` au lieu de détecter automatiquement le tenant à partir du numéro WhatsApp de l'utilisateur qui envoie le message.

**Symptômes :**
- Tous les messages WhatsApp sont associés au même tenant
- Le `tenant_id` n'est pas extrait du numéro WhatsApp de l'expéditeur
- Le workflow utilise `input.context?.tenant_id || input.body?.tenant_id || ""` qui peut être vide ou toujours le même

## ✅ Solution : Ajouter un nœud "Find Tenant by WhatsApp Phone"

### Étape 1 : Position du nœud

Ajouter un nœud **Code** nommé **"Find Tenant by WhatsApp Phone"** juste **après le Chat Trigger** et **avant le Check Message Type**.

**Structure actuelle :**
```
[Chat Trigger] → [Check Message Type] → ...
```

**Structure corrigée :**
```
[Chat Trigger] → [Find Tenant by WhatsApp Phone] → [Check Message Type] → ...
```

### Étape 2 : Code du nœud "Find Tenant by WhatsApp Phone"

**Type de nœud :** Code (JavaScript)

**Code à copier :**

```javascript
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
      ];
      
      // Faire une requête pour chaque variation jusqu'à trouver un résultat
      let foundTenant = null;
      
      for (const phoneVar of phoneVariations) {
        // Chercher dans whatsapp_phone et phone avec ilike (insensible à la casse)
        let queryUrl = `${supabaseUrl}/rest/v1/tenants?select=id,company_name,whatsapp_phone,phone&or=(whatsapp_phone.ilike.%${phoneVar}%,phone.ilike.%${phoneVar}%)&limit=1`;
        
        console.log(`🔍 Recherche tenant avec: ${phoneVar}`);
        
        try {
          // Utiliser this.helpers.httpRequest pour n8n Code Tool
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: queryUrl,
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            returnFullResponse: true
          });
          
          // n8n peut retourner response.body ou response directement
          let tenants = null;
          if (response && response.body) {
            tenants = Array.isArray(response.body) ? response.body : (response.body.data || []);
          } else if (Array.isArray(response)) {
            tenants = response;
          } else {
            tenants = [];
          }
          
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
```

### Étape 3 : Vérifier la variable d'environnement n8n

Assurez-vous que la variable d'environnement `SUPABASE_SERVICE_ROLE_KEY` est configurée dans n8n :

1. Dans n8n, allez dans **Settings** → **Variables** (ou **$env**)
2. Ajoutez ou vérifiez : `SUPABASE_SERVICE_ROLE_KEY` avec votre service role key Supabase
3. La clé doit commencer par `eyJ...` (JWT token)

### Étape 4 : Vérifier les données dans Supabase

Vérifiez que les tenants ont leurs numéros WhatsApp stockés :

```sql
SELECT id, company_name, whatsapp_phone, phone 
FROM tenants 
WHERE whatsapp_phone IS NOT NULL OR phone IS NOT NULL;
```

**Formats acceptés :**
- `whatsapp:+33612345678`
- `+33612345678`
- `0612345678`
- `33612345678`

Le code nettoie automatiquement ces formats.

## 🔍 Comment ça fonctionne

1. **Chat Trigger** reçoit le message WhatsApp avec le numéro de l'expéditeur (`From`)
2. **Find Tenant by WhatsApp Phone** :
   - Extrait le numéro depuis différents chemins possibles
   - Nettoie le numéro (enlève `whatsapp:`, espaces, etc.)
   - Cherche dans Supabase la table `tenants` avec plusieurs variations du numéro
   - Ajoute `tenant_id` et `tenant_name` dans `context`
3. **Format Text/Audio Message for LEO** utilise maintenant `context.tenant_id` qui est correctement détecté

## 🧪 Test

1. Envoyez un message WhatsApp depuis un numéro associé à un tenant dans Supabase
2. Vérifiez dans les logs n8n que le nœud "Find Tenant by WhatsApp Phone" :
   - Extrait correctement le numéro WhatsApp
   - Trouve le tenant correspondant
   - Ajoute `tenant_id` dans `context`
3. Vérifiez que les nœuds suivants utilisent le bon `tenant_id`

## ⚠️ Notes importantes

1. **Numéros multiples** : Si plusieurs tenants ont le même numéro WhatsApp, le workflow utilisera le premier trouvé. Assurez-vous que chaque tenant a un numéro unique.

2. **Fallback** : Si aucun tenant n'est trouvé, le workflow continue avec un `tenant_id` vide. Vous pouvez ajouter un nœud **IF** après "Find Tenant by WhatsApp Phone" pour vérifier `context.tenant_found` et arrêter le workflow si `false`.

3. **Performance** : Le nœud fait une requête HTTP à Supabase. Si vous avez beaucoup de messages, considérez ajouter un cache ou utiliser un nœud Postgres direct.

## 📋 Structure complète du workflow corrigé

```
[Chat Trigger]
    ↓
[Find Tenant by WhatsApp Phone] ← NOUVEAU
    ↓
[IF - Tenant Found?] ← OPTIONNEL (pour validation)
    ├─ TRUE → [Check Message Type]
    └─ FALSE → [Send Error / Stop]
    ↓
[Check Message Type]
    ↓
[Format Text/Audio Message for LEO] ← Utilise maintenant context.tenant_id détecté
    ↓
...
```

## ✅ Résultat attendu

Après cette correction :
- Chaque message WhatsApp est automatiquement associé au bon tenant
- Le `tenant_id` est détecté depuis le numéro WhatsApp de l'expéditeur
- Les nœuds suivants utilisent le `tenant_id` correct pour toutes les opérations (création de clients, devis, etc.)
