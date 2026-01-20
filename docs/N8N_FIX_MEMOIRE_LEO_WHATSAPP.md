# 🔧 Correction : Nœud "Memoire Léo" - Erreur avec WhatsApp Trigger

## ❌ Problème actuel

Le nœud "Memoire Léo" affiche l'erreur :
> "Missing output data - Expected output #0 from node AI Agent"
> "Error in sub-node 'Memoire Léo'"

**Configuration actuelle (incorrecte) :**
- **Key :** `{{ $('WhatsApp Trigger').item.json.messages[0].from }}`
- **Session ID :** `33745108883`

**Problèmes identifiés :**
1. ❌ La syntaxe `{{ $('WhatsApp Trigger').item.json.messages[0].from }}` n'est pas correcte pour accéder aux données dans n8n
2. ❌ Le nœud "Memoire Léo" est un sous-nœud de "AI Agent", donc il doit recevoir les données depuis le nœud parent, pas directement depuis "WhatsApp Trigger"
3. ❌ La clé devrait être dynamique et basée sur le contexte de la conversation, pas un numéro de téléphone hardcodé

---

## ✅ Solution : Corriger la configuration du nœud "Memoire Léo"

### Option 1 : Utiliser tenant_id (recommandé pour MVP)

**Configuration :**
- **Key :** `{{ $json.body.context.tenant_id }}`
- **Session ID :** `Define below` → `{{ $json.body.context.tenant_id }}`

**Avantages :**
- ✅ **Plus simple** : Pas besoin de gérer `conversation_id` ou numéro de téléphone
- ✅ **Mémoire globale** : LÉO se souvient de TOUTES les conversations du tenant
- ✅ **Cohérence** : L'utilisateur peut référencer des devis/factures de conversations précédentes
- ✅ **Déjà disponible** : `tenant_id` est toujours présent dans le contexte

**⚠️ Prérequis :**
- Le nœud précédent (qui formate le message) doit inclure `tenant_id` dans `body.context.tenant_id`
- Si vous utilisez WhatsApp, vous devez extraire le `tenant_id` depuis le message WhatsApp

---

### Option 2 : Utiliser le numéro de téléphone WhatsApp (si tenant_id n'est pas disponible)

Si vous ne pouvez pas utiliser `tenant_id`, vous pouvez utiliser le numéro de téléphone comme clé de session :

**Configuration :**
- **Key :** `{{ $json.body.context.whatsapp_from }}`
- **Session ID :** `Define below` → `{{ $json.body.context.whatsapp_from }}`

**⚠️ Prérequis :**
- Vous devez extraire le numéro de téléphone dans le nœud de formatage précédent
- Ajouter dans le nœud qui formate le message WhatsApp :

```javascript
// Dans le nœud qui formate le message pour LÉO
const input = $input.item.json;

// Extraire le numéro depuis WhatsApp Trigger
const whatsappFrom = input.body?.messages?.[0]?.from 
  || input.messages?.[0]?.from 
  || input.from
  || "";

return {
  body: {
    raw_message: input.body?.message || input.body?.text || "",
    client: input.body?.client || null,
    travaux: input.body?.travaux || null
  },
  context: {
    tenant_id: input.context?.tenant_id || input.body?.tenant_id || "",
    whatsapp_from: whatsappFrom, // ← Ajouter cette ligne
    conversation_date: new Date().toISOString().split('T')[0],
    is_whatsapp: true
  }
};
```

---

### Option 3 : Utiliser sessionId (si disponible depuis Chat Trigger)

Si vous utilisez le Chat Trigger de n8n (pas WhatsApp Trigger), vous pouvez utiliser `sessionId` :

**Configuration :**
- **Key :** `{{ $json.sessionId }}`
- **Session ID :** `Define below` → `{{ $json.sessionId }}`

**Avantages :**
- ✅ Mémoire séparée par conversation
- ✅ Automatiquement fourni par Chat Trigger

---

## 🔍 Comment vérifier que ça fonctionne

1. **Exécuter le workflow** jusqu'au nœud "Memoire Léo"
2. **Vérifier l'INPUT** du nœud "Memoire Léo" :
   - Cliquez sur le nœud "Memoire Léo"
   - Regardez l'onglet "Input" ou "Data"
   - Vérifiez que `$json.body.context.tenant_id` (ou la clé que vous utilisez) contient une valeur
3. **Vérifier que la clé n'est plus vide** :
   - Si vous voyez un UUID ou un numéro de téléphone → ✅ Ça fonctionne
   - Si vous voyez "indéfini" ou vide → ❌ Vérifier les nœuds précédents

---

## 📝 Structure attendue des données

Le nœud "Memoire Léo" (Postgres Supa) attend des données dans ce format :

```json
{
  "body": {
    "raw_message": "Message de l'utilisateur",
    "client": { ... },
    "travaux": [ ... ]
  },
  "context": {
    "tenant_id": "uuid-du-tenant",
    "whatsapp_from": "33745108883", // Optionnel si vous utilisez Option 2
    "conversation_date": "2026-01-19",
    "is_whatsapp": true
  }
}
```

**Important :** Le nœud "Memoire Léo" doit recevoir ces données depuis le nœud précédent (probablement "AI Agent" ou un nœud de formatage), pas directement depuis "WhatsApp Trigger".

---

## 🔧 Étapes de correction

### 1. Vérifier le nœud qui formate le message WhatsApp

Assurez-vous qu'un nœud (probablement "Format Text Message for LEO" ou similaire) extrait les données depuis WhatsApp Trigger et les formate correctement.

**Exemple de code pour extraire depuis WhatsApp :**

```javascript
// Dans le nœud qui formate le message WhatsApp
const input = $input.item.json;

// Extraire le numéro de téléphone depuis différentes structures possibles
const whatsappFrom = input.body?.messages?.[0]?.from 
  || input.messages?.[0]?.from 
  || input.from
  || input.body?.from
  || "";

// Extraire le message
const message = input.body?.messages?.[0]?.text 
  || input.body?.message 
  || input.body?.text 
  || input.message
  || "";

return {
  body: {
    raw_message: message,
    client: input.body?.client || null,
    travaux: input.body?.travaux || null
  },
  context: {
    tenant_id: input.context?.tenant_id || input.body?.tenant_id || "",
    whatsapp_from: whatsappFrom,
    conversation_date: new Date().toISOString().split('T')[0],
    is_whatsapp: true
  }
};
```

### 2. Configurer le nœud "Memoire Léo"

**Dans les paramètres du nœud "Memoire Léo" :**

1. **Table Name :** `n8n_chat_histories` (déjà correct)
2. **Context Window Length :** `5` (déjà correct)
3. **Credential to connect with :** Votre credential Supabase (déjà configuré)
4. **Session ID :** 
   - Sélectionnez `Define below`
   - Entrez : `{{ $json.body.context.tenant_id }}` (Option 1) OU `{{ $json.body.context.whatsapp_from }}` (Option 2)
5. **Key :**
   - Entrez : `{{ $json.body.context.tenant_id }}` (Option 1) OU `{{ $json.body.context.whatsapp_from }}` (Option 2)

### 3. Vérifier l'ordre des nœuds

L'ordre devrait être :
1. **WhatsApp Trigger** → reçoit le message
2. **Format Message** → formate le message et extrait les données
3. **AI Agent** → traite le message avec LÉO
4. **Memoire Léo** (sous-nœud de AI Agent) → sauvegarde/charge l'historique

**Important :** Le nœud "Memoire Léo" doit être un sous-nœud de "AI Agent" et recevoir les données depuis le nœud parent.

---

## ✅ Après correction

Une fois corrigé, le nœud "Memoire Léo" devrait :
- ✅ Charger l'historique des messages précédents
- ✅ Sauvegarder les nouveaux messages
- ✅ Permettre à LÉO de se souvenir des conversations précédentes
- ✅ Ne plus afficher d'erreur "Missing output data"

---

## 🐛 Dépannage

### Erreur : "Le paramètre clé est vide"

**Cause :** La clé `{{ $json.body.context.tenant_id }}` est vide ou indéfinie.

**Solution :**
1. Vérifier que le nœud précédent inclut `tenant_id` dans `body.context.tenant_id`
2. Si vous utilisez WhatsApp, vous devez extraire le `tenant_id` depuis le message ou la base de données
3. Utiliser l'Option 2 (numéro de téléphone) si `tenant_id` n'est pas disponible

### Erreur : "Missing output data - Expected output #0 from node AI Agent"

**Cause :** Le nœud "Memoire Léo" essaie d'accéder à des données depuis un nœud qui n'a pas de sortie.

**Solution :**
1. Vérifier que "Memoire Léo" est bien un sous-nœud de "AI Agent"
2. Vérifier que "AI Agent" a bien une sortie (pas d'erreur dans le nœud)
3. Utiliser `{{ $json }}` au lieu de `{{ $('WhatsApp Trigger') }}` pour accéder aux données du nœud parent

### Erreur : "Cannot read property 'from' of undefined"

**Cause :** La structure des données depuis WhatsApp Trigger n'est pas celle attendue.

**Solution :**
1. Exécuter le workflow jusqu'à "WhatsApp Trigger"
2. Vérifier la structure exacte des données dans l'onglet "Output"
3. Adapter le code d'extraction dans le nœud de formatage

---

## 📚 Références

- [N8N Fix Postgres Supa Conversation ID](./N8N_FIX_POSTGRES_SUPA_CONVERSATION_ID.md)
- [N8N Node Extract Context](./N8N_NODE_EXTRACT_CONTEXT.md)
