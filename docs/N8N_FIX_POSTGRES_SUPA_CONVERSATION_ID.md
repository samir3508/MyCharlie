# 🔧 Correction : Postgres Supa - conversation_id manquant

## ❌ Problème actuel

Le nœud "Postgres Supa" affiche l'erreur :
> "Le paramètre clé est vide."

La clé `{{ $json.body.context.conversation_id }}` est "indéfini" car le `conversation_id` n'est pas transmis dans le workflow.

---

## ✅ Solution : Ajouter conversation_id dans les nœuds de formatage

### 1. Modifier le nœud "Format Text Message for LEO"

**Code actuel :**
```javascript
// Format message pour LÉO
const input = $input.item.json;

return {
  body: {
    raw_message: input.body?.message || input.body?.text || "",
    client: input.body?.client || null,
    travaux: input.body?.travaux || null
  },
  context: {
    tenant_id: input.context?.tenant_id || input.body?.tenant_id || "",
    conversation_date: new Date().toISOString().split('T')[0],
    is_whatsapp: input.context?.is_whatsapp || false
  }
};
```

**Code corrigé :**
```javascript
// Format message pour LÉO
const input = $input.item.json;

return {
  body: {
    raw_message: input.body?.message || input.body?.text || "",
    client: input.body?.client || null,
    travaux: input.body?.travaux || null
  },
  context: {
    tenant_id: input.context?.tenant_id || input.body?.tenant_id || "",
    conversation_id: input.context?.conversation_id || input.sessionId || input.body?.sessionId || "",
    conversation_date: new Date().toISOString().split('T')[0],
    is_whatsapp: input.context?.is_whatsapp || false
  }
};
```

**Ligne ajoutée :**
```javascript
conversation_id: input.context?.conversation_id || input.sessionId || input.body?.sessionId || "",
```

---

### 2. Modifier le nœud "Format Audio Message for LEO"

**Même correction** : Ajouter la même ligne `conversation_id` dans le contexte.

---

### 3. Configurer le nœud "Postgres Supa"

### ✅ Option recommandée pour MVP : Utiliser tenant_id

**Configuration :**
- **Clé :** `{{ $json.body.context.tenant_id }}`
- **Session ID :** `Define below` → `{{ $json.body.context.tenant_id }}`

**Avantages :**
- ✅ **Plus simple** : Pas besoin de gérer `conversation_id`
- ✅ **Mémoire globale** : LÉO se souvient de TOUTES les conversations de l'utilisateur
- ✅ **Cohérence** : L'utilisateur peut référencer des devis/factures de conversations précédentes
- ✅ **Déjà disponible** : `tenant_id` est toujours présent dans le contexte

**Exemple d'utilisation :**
- L'utilisateur dit "Créer un devis pour le même client que la semaine dernière"
- LÉO peut accéder à l'historique de toutes les conversations du tenant

---

### Alternative : Utiliser conversation_id (mémoire par conversation)

Si vous préférez une mémoire séparée par conversation :

1. **Option 1 : Utiliser sessionId directement**
   - **Clé :** `{{ $json.sessionId }}`
   - ✅ Mémoire séparée par conversation
   - ⚠️ Nécessite que `sessionId` soit passé depuis le Chat Trigger

2. **Option 2 : Utiliser conversation_id du contexte**
   - **Clé :** `{{ $json.body.context.conversation_id }}`
   - ✅ Mémoire séparée par conversation
   - ⚠️ Nécessite d'ajouter `conversation_id` dans les nœuds de formatage (voir section 1)

---

## 🔍 Comment vérifier que ça fonctionne

1. **Exécuter le workflow** jusqu'au nœud "Postgres Supa"
2. **Vérifier l'INPUT** du nœud "Postgres Supa"
3. **Vérifier que la clé n'est plus vide** :
   - Si vous voyez un UUID → ✅ Ça fonctionne
   - Si vous voyez "indéfini" → ❌ Vérifier les nœuds précédents

---

## 📝 Note sur N8N Chat Trigger

Le Chat Trigger de N8N passe automatiquement :
- `$json.sessionId` → ID de session de la conversation
- `$json.body.message` → Message de l'utilisateur
- `$json.context` → Contexte (si fourni par l'application)

**Important :** Si votre application envoie `conversation_id` dans le contexte, il sera dans `input.context.conversation_id`. Sinon, utilisez `input.sessionId` qui est fourni automatiquement par N8N Chat Trigger.

---

## ✅ Après correction

Une fois corrigé, le nœud "Postgres Supa" devrait :
- ✅ Charger l'historique des messages précédents
- ✅ Sauvegarder les nouveaux messages
- ✅ Permettre à LÉO de se souvenir des conversations précédentes


## ❌ Problème actuel

Le nœud "Postgres Supa" affiche l'erreur :
> "Le paramètre clé est vide."

La clé `{{ $json.body.context.conversation_id }}` est "indéfini" car le `conversation_id` n'est pas transmis dans le workflow.

---

## ✅ Solution : Ajouter conversation_id dans les nœuds de formatage

### 1. Modifier le nœud "Format Text Message for LEO"

**Code actuel :**
```javascript
// Format message pour LÉO
const input = $input.item.json;

return {
  body: {
    raw_message: input.body?.message || input.body?.text || "",
    client: input.body?.client || null,
    travaux: input.body?.travaux || null
  },
  context: {
    tenant_id: input.context?.tenant_id || input.body?.tenant_id || "",
    conversation_date: new Date().toISOString().split('T')[0],
    is_whatsapp: input.context?.is_whatsapp || false
  }
};
```

**Code corrigé :**
```javascript
// Format message pour LÉO
const input = $input.item.json;

return {
  body: {
    raw_message: input.body?.message || input.body?.text || "",
    client: input.body?.client || null,
    travaux: input.body?.travaux || null
  },
  context: {
    tenant_id: input.context?.tenant_id || input.body?.tenant_id || "",
    conversation_id: input.context?.conversation_id || input.sessionId || input.body?.sessionId || "",
    conversation_date: new Date().toISOString().split('T')[0],
    is_whatsapp: input.context?.is_whatsapp || false
  }
};
```

**Ligne ajoutée :**
```javascript
conversation_id: input.context?.conversation_id || input.sessionId || input.body?.sessionId || "",
```

---

### 2. Modifier le nœud "Format Audio Message for LEO"

**Même correction** : Ajouter la même ligne `conversation_id` dans le contexte.

---

### 3. Configurer le nœud "Postgres Supa"

### ✅ Option recommandée pour MVP : Utiliser tenant_id

**Configuration :**
- **Clé :** `{{ $json.body.context.tenant_id }}`
- **Session ID :** `Define below` → `{{ $json.body.context.tenant_id }}`

**Avantages :**
- ✅ **Plus simple** : Pas besoin de gérer `conversation_id`
- ✅ **Mémoire globale** : LÉO se souvient de TOUTES les conversations de l'utilisateur
- ✅ **Cohérence** : L'utilisateur peut référencer des devis/factures de conversations précédentes
- ✅ **Déjà disponible** : `tenant_id` est toujours présent dans le contexte

**Exemple d'utilisation :**
- L'utilisateur dit "Créer un devis pour le même client que la semaine dernière"
- LÉO peut accéder à l'historique de toutes les conversations du tenant

---

### Alternative : Utiliser conversation_id (mémoire par conversation)

Si vous préférez une mémoire séparée par conversation :

1. **Option 1 : Utiliser sessionId directement**
   - **Clé :** `{{ $json.sessionId }}`
   - ✅ Mémoire séparée par conversation
   - ⚠️ Nécessite que `sessionId` soit passé depuis le Chat Trigger

2. **Option 2 : Utiliser conversation_id du contexte**
   - **Clé :** `{{ $json.body.context.conversation_id }}`
   - ✅ Mémoire séparée par conversation
   - ⚠️ Nécessite d'ajouter `conversation_id` dans les nœuds de formatage (voir section 1)

---

## 🔍 Comment vérifier que ça fonctionne

1. **Exécuter le workflow** jusqu'au nœud "Postgres Supa"
2. **Vérifier l'INPUT** du nœud "Postgres Supa"
3. **Vérifier que la clé n'est plus vide** :
   - Si vous voyez un UUID → ✅ Ça fonctionne
   - Si vous voyez "indéfini" → ❌ Vérifier les nœuds précédents

---

## 📝 Note sur N8N Chat Trigger

Le Chat Trigger de N8N passe automatiquement :
- `$json.sessionId` → ID de session de la conversation
- `$json.body.message` → Message de l'utilisateur
- `$json.context` → Contexte (si fourni par l'application)

**Important :** Si votre application envoie `conversation_id` dans le contexte, il sera dans `input.context.conversation_id`. Sinon, utilisez `input.sessionId` qui est fourni automatiquement par N8N Chat Trigger.

---

## ✅ Après correction

Une fois corrigé, le nœud "Postgres Supa" devrait :
- ✅ Charger l'historique des messages précédents
- ✅ Sauvegarder les nouveaux messages
- ✅ Permettre à LÉO de se souvenir des conversations précédentes
