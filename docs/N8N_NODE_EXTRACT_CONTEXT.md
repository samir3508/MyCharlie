# N8N - Nœud Code pour Extraire le Contexte

## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.
## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.




## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.


## 🎯 Objectif

Créer un nœud "Code" qui extrait toutes les informations nécessaires depuis les nœuds précédents et les formate clairement pour le prompt de LÉO.

## 📋 Emplacement dans le Workflow

Placez ce nœud **AVANT** le nœud "Code in JavaScript1" qui prépare le prompt système.

**Ordre** :
1. Merge Messages
2. **Nœud Code "Extract Context"** ← NOUVEAU
3. Code in JavaScript1 (prompt système)
4. AI Agent LÉO

## 🔧 Code JavaScript pour le Nœud

```javascript
// Extraire les données des nœuds précédents
const body = $input.item.json.body || {};
const context = $input.item.json.context || {};
const history = $input.item.json.history || [];

// Extraire les informations essentielles
const tenantId = context.tenant_id || '';
const tenantName = context.tenant_name || '';
const tenantEmail = context.tenant_email || '';
const conversationId = context.conversation_id || '';
const message = body.message || '';

// Vérifier que le tenant_id est présent
if (!tenantId) {
  throw new Error('tenant_id manquant dans le contexte');
}

// Construire l'objet de contexte formaté pour LÉO
const leoContext = {
  tenant_id: tenantId,
  tenant_name: tenantName,
  tenant_email: tenantEmail,
  conversation_id: conversationId,
  message: message,
  history: history
};

// Retourner le contexte formaté
return {
  json: {
    ...$input.item.json,
    leo_context: leoContext
  }
};
```

## 📝 Utilisation dans le Nœud "Code in JavaScript1"

Dans le nœud qui prépare le prompt système, utilisez `$json.leo_context` :

### Option 1 : Avec le contexte structuré

```javascript
const context = $json.leo_context || {};

// Le tenant_id est maintenant facilement accessible
const tenantId = context.tenant_id; // "f117dc59-1cef-41c3-91a3-8c12d47f6bfb"

// Utiliser dans le prompt
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '${tenantId}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '${tenantId}'
- VALUES ('${tenantId}', ...)
- etc.
`;
```

### Option 2 : Avec variables N8N directes (plus simple)

Si vous utilisez l'alternative "Format encore plus simple" ci-dessus, utilisez directement :

```javascript
// Le prompt utilise directement les variables N8N
const systemPrompt = `
## 🔐 CONTEXTE SYSTÈME

**Valeur du tenant_id à utiliser dans TOUTES tes requêtes SQL** : '{{ $json.tenant_id }}'

⚠️ **CRITIQUE** : Utilise cette valeur exacte dans toutes tes requêtes :
- WHERE tenant_id = '{{ $json.tenant_id }}'
- VALUES ('{{ $json.tenant_id }}', ...)
- etc.

**Informations du contexte** :
- Entreprise : {{ $json.tenant_name }}
- Email : {{ $json.tenant_email }}
- Conversation ID : {{ $json.conversation_id }}
`;
```

**Note** : N8N remplacera automatiquement `{{ $json.tenant_id }}` par la valeur réelle avant de l'envoyer à l'AI Agent.

## ✅ Avantages

1. **Extraction centralisée** : Toutes les données sont extraites en un seul endroit
2. **Validation** : On peut vérifier que le tenant_id est présent avant de continuer
3. **Format simple** : Le prompt reçoit des données déjà formatées
4. **Maintenance facile** : Si le format change, on modifie un seul nœud
5. **Débogage** : Plus facile de voir ce qui est passé à LÉO

## 🔍 Alternative : Format encore plus simple

Si vous voulez être encore plus explicite, vous pouvez retourner directement les valeurs :

```javascript
const context = $input.item.json.context || {};

return {
  json: {
    tenant_id: context.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb',
    tenant_name: context.tenant_name || 'VayShop',
    tenant_email: context.tenant_email || 'adlbapp4@gmail.com',
    conversation_id: context.conversation_id || '',
    message: ($input.item.json.body || {}).message || '',
    history: $input.item.json.history || []
  }
};
```

Puis dans le prompt, utilisez directement `$json.tenant_id` :

```javascript
const systemPrompt = `
**Valeur du tenant_id** : '${$json.tenant_id}'

Tu DOIS utiliser '${$json.tenant_id}' dans toutes tes requêtes SQL.
`;
```

## 🎯 Configuration Recommandée

**Nom du nœud** : "Extract Context for LEO"

**Type** : Code (JavaScript)

**Mode** : Run Once for All Items

**Code** : Utiliser le premier exemple ci-dessus

---

## 🎨 Exemple Complet de Workflow

### Ordre des nœuds

```
1. Merge Messages
   ↓
2. Extract Context (Nouveau nœud Code)
   - Input: $json.body, $json.context, $json.history
   - Output: $json.tenant_id, $json.tenant_name, etc.
   ↓
3. Code in JavaScript1 (Prompt System)
   - Utilise: {{ $json.tenant_id }}
   - Génère le prompt système complet
   ↓
4. AI Agent LÉO
   - Reçoit le prompt système avec tenant_id déjà injecté
   - Plus besoin de chercher dans le contexte !
```

### Avantages de cette approche

✅ **Simplifie le prompt** : Le tenant_id est déjà injecté, pas besoin d'instructions complexes
✅ **Moins d'erreurs** : Pas de risque d'utiliser `'context.tenant_id'` comme texte
✅ **Plus maintenable** : Un seul endroit pour extraire les données
✅ **Plus rapide** : LÉO n'a pas à parser le JSON complexe
✅ **Débogage facile** : On voit exactement ce qui est passé dans le nœud Code

---

Cette approche simplifie grandement le prompt et garantit que LÉO reçoit toujours les bonnes valeurs.