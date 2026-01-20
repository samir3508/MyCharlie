# 🔍 Détecter le Tenant à partir du Numéro WhatsApp dans N8N

## 🚨 Problème

Le workflow n8n utilise toujours le même `tenant_id` hardcodé (`f117dc59-1cef-41c3-91a3-8c12d47f6bfb`) au lieu de détecter automatiquement le tenant à partir du numéro WhatsApp qui envoie le message.

## ✅ Solution : Ajouter un nœud "Find Tenant by WhatsApp Phone"

### Étape 1 : Identifier où le numéro WhatsApp arrive dans le workflow

Quand un message WhatsApp arrive via le **WhatsApp Trigger** dans n8n, le numéro de l'expéditeur est généralement disponible dans :
- `$json.From` (format : `whatsapp:+33612345678` ou `+33612345678`)
- `$json.body.From` (selon le format du trigger)

### Étape 2 : Ajouter un nœud "Postgres - Execute Query" APRÈS le WhatsApp Trigger

**Position :** Juste après le **WhatsApp Trigger** et AVANT les nœuds de formatage des messages.

**Nom du nœud :** `Find Tenant by WhatsApp Phone`

**Configuration :**

1. **Credential** : Utilisez votre credential Postgres Supabase (la même que pour vos autres nœuds)

2. **Query SQL** :
```sql
SELECT 
  id,
  company_name,
  whatsapp_phone,
  phone
FROM tenants
WHERE 
  -- Chercher dans whatsapp_phone (nettoyer le format)
  REPLACE(REPLACE(whatsapp_phone, 'whatsapp:', ''), ' ', '') = REPLACE(REPLACE($1, 'whatsapp:', ''), ' ', '')
  OR
  -- Chercher aussi dans phone (si le numéro est stocké là)
  REPLACE(REPLACE(phone, 'whatsapp:', ''), ' ', '') = REPLACE(REPLACE($1, 'whatsapp:', ''), ' ', '')
LIMIT 1;
```

**⚠️ IMPORTANT :** Dans n8n, utilisez `{{ $json.From }}` ou `{{ $json.body.From }}` selon votre trigger au lieu de `$1`.

**Query n8n (avec syntaxe n8n) :**
```sql
SELECT 
  id,
  company_name,
  whatsapp_phone,
  phone
FROM tenants
WHERE 
  -- Chercher dans whatsapp_phone (nettoyer le format)
  REPLACE(REPLACE(whatsapp_phone, 'whatsapp:', ''), ' ', '') = REPLACE(REPLACE({{ $json.From || $json.body.From || '' }}, 'whatsapp:', ''), ' ', '')
  OR
  -- Chercher aussi dans phone (si le numéro est stocké là)
  REPLACE(REPLACE(phone, 'whatsapp:', ''), ' ', '') = REPLACE(REPLACE({{ $json.From || $json.body.From || '' }}, 'whatsapp:', ''), ' ', '')
LIMIT 1;
```

### Étape 3 : Alternative - Utiliser un nœud Code (plus flexible)

Si la query SQL ne fonctionne pas bien avec n8n, utilisez un nœud **Code** à la place :

**Nom du nœud :** `Find Tenant by WhatsApp Phone`

**Code JavaScript :**
```javascript
// Récupérer le numéro WhatsApp depuis le trigger
const input = $input.item.json;

// Extraire le numéro depuis différents formats possibles
let whatsappPhone = input.From || input.body?.From || input.contacts?.[0]?.wa_id || '';

// Nettoyer le numéro (enlever "whatsapp:", espaces, etc.)
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/whatsapp:/gi, '').replace(/\s+/g, '').replace(/\+/g, '').trim();
}

const cleanedPhone = cleanPhone(whatsappPhone);

if (!cleanedPhone) {
  // Pas de numéro WhatsApp, retourner une erreur ou utiliser le tenant par défaut
  return {
    json: {
      ...input,
      context: {
        ...input.context,
        tenant_id: null,
        tenant_not_found: true,
        error: 'Numéro WhatsApp non trouvé dans le message'
      }
    }
  };
}

// Faire une requête HTTP vers Supabase pour trouver le tenant
// Utiliser le REST API de Supabase
const supabaseUrl = 'https://lawllirgeisuvanbvkcr.supabase.co';
const supabaseServiceKey = $env.SUPABASE_SERVICE_ROLE_KEY || '';

const queryUrl = `${supabaseUrl}/rest/v1/tenants?select=id,company_name,whatsapp_phone,phone&or=(whatsapp_phone.ilike.%${cleanedPhone}%,phone.ilike.%${cleanedPhone}%)&limit=1`;

try {
  const response = await $http.get(queryUrl, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    }
  });

  const tenants = Array.isArray(response) ? response : (response.body || []);

  if (tenants && tenants.length > 0) {
    const tenant = tenants[0];
    
    return {
      json: {
        ...input,
        context: {
          ...input.context,
          tenant_id: tenant.id,
          tenant_name: tenant.company_name,
          tenant_found: true
        },
        tenant: {
          id: tenant.id,
          company_name: tenant.company_name,
          whatsapp_phone: tenant.whatsapp_phone,
          phone: tenant.phone
        }
      }
    };
  } else {
    // Aucun tenant trouvé avec ce numéro
    return {
      json: {
        ...input,
        context: {
          ...input.context,
          tenant_id: null,
          tenant_not_found: true,
          whatsapp_phone_searched: cleanedPhone,
          error: `Aucun tenant trouvé avec le numéro WhatsApp: ${cleanedPhone}`
        }
      }
    };
  }
} catch (error) {
  console.error('Erreur lors de la recherche du tenant:', error);
  
  return {
    json: {
      ...input,
      context: {
        ...input.context,
        tenant_id: null,
        tenant_not_found: true,
        error: `Erreur lors de la recherche: ${error.message}`
      }
    }
  };
}
```

### Étape 4 : Modifier les nœuds "Format Text/Audio Message" pour utiliser le tenant détecté

Dans les nœuds **"Format Text Message for LEO"** et **"Format Audio Message for LEO"**, modifier le code pour utiliser le `tenant_id` détecté :

**Ancien code :**
```javascript
tenant_id: input.context?.tenant_id || input.body?.tenant_id || ""
```

**Nouveau code :**
```javascript
tenant_id: input.context?.tenant_id || input.body?.tenant_id || input.tenant?.id || ""
```

### Étape 5 : Ajouter une validation avec IF

Ajoutez un nœud **IF** après "Find Tenant by WhatsApp Phone" pour vérifier si le tenant a été trouvé :

**Condition :**
```
{{ $json.context.tenant_id && $json.context.tenant_id !== null && $json.context.tenant_id !== '' }}
```

**Si TRUE :** Continuer le workflow normalement  
**Si FALSE :** Envoyer un message d'erreur et arrêter le workflow

---

## 📋 Structure du Workflow Modifiée

```
[WhatsApp Trigger]
    ↓
[Find Tenant by WhatsApp Phone] ← NOUVEAU NŒUD
    ↓
[IF - Tenant Found?]
    ├─ TRUE → [Format Text/Audio Message for LEO]
    └─ FALSE → [Send Error Message]
```

---

## 🔍 Vérifier que les numéros WhatsApp sont correctement stockés

Avant de tester, vérifiez que les tenants ont leurs numéros WhatsApp stockés dans la base de données :

```sql
SELECT id, company_name, whatsapp_phone, phone 
FROM tenants 
WHERE whatsapp_phone IS NOT NULL OR phone IS NOT NULL;
```

**Format attendu :**
- `whatsapp_phone` peut être : `whatsapp:+33612345678`, `+33612345678`, `0612345678`, etc.
- La fonction de nettoyage dans le code gère tous ces formats

---

## ⚠️ Note importante

Si plusieurs tenants ont le même numéro WhatsApp, le workflow utilisera le premier trouvé. Dans ce cas, vous devrez :
1. Vérifier vos données dans Supabase
2. S'assurer que chaque tenant a un numéro WhatsApp unique
3. Ou ajouter une logique pour choisir le bon tenant (par exemple, par `company_name` ou un autre critère)

---

## 🧪 Test

1. Envoyez un message WhatsApp depuis un numéro lié à un tenant
2. Vérifiez dans les logs n8n que le nœud "Find Tenant by WhatsApp Phone" trouve le bon tenant
3. Vérifiez que le `tenant_id` est correctement passé au reste du workflow
