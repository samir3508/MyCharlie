# Code N8N - Format Response Node

## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`
## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`


## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`




## Problème
Le nœud "Format Response" ne récupère que le texte de la réponse, alors qu'il faut passer toutes les données (is_whatsapp, From, To, context, etc.) au nœud "If" pour décider si on renvoie vers WhatsApp ou vers l'application web.

## Code corrigé

```javascript
// Récupérer toutes les données de l'input
const input = $input.item.json;

// Extraire la réponse de LÉO (texte) depuis différents formats possibles
const leoResponse = input.output 
  || input.text 
  || input.response 
  || "";

// REMONTER DANS TOUS LES INPUTS POUR TROUVER LES DONNÉES ORIGINALES
// Les données WhatsApp peuvent être dans "Code in JavaScript1" ou dans les nœuds précédents
// Le workflow passe par: Chat Trigger → Format Message → Merge Messages → Code in JavaScript1 → AI Agent → Format Response
// Il faut donc chercher dans TOUS les inputs avec différentes structures possibles

const allInputs = $input.all();
let originalBody = {};
let foundOriginalData = false;

// Chercher dans tous les inputs pour trouver les données originales (is_whatsapp, From, To, context)
for (const item of allInputs) {
  // 1. Chercher dans body.body (structure imbriquée possible)
  if (item.json.body?.body && (item.json.body.body.is_whatsapp !== undefined || item.json.body.body.From || item.json.body.body.To)) {
    originalBody = item.json.body.body;
    foundOriginalData = true;
    break;
  }
  
  // 2. Chercher dans body (format le plus probable)
  if (item.json.body && (item.json.body.is_whatsapp !== undefined || item.json.body.From || item.json.body.To || item.json.body.context)) {
    originalBody = item.json.body;
    foundOriginalData = true;
    break;
  }
  
  // 3. Chercher à la racine
  if (item.json.is_whatsapp !== undefined || item.json.From || item.json.To) {
    originalBody = item.json;
    foundOriginalData = true;
    break;
  }
  
  // 4. Chercher dans les propriétés imbriquées (pour gérer les structures complexes)
  if (item.json.json?.body) {
    const nestedBody = item.json.json.body;
    if (nestedBody.is_whatsapp !== undefined || nestedBody.From || nestedBody.To) {
      originalBody = nestedBody;
      foundOriginalData = true;
      break;
    }
  }
}

// Si on n'a toujours pas trouvé, utiliser les données de l'input actuel
if (!foundOriginalData) {
  // Essayer input.body d'abord
  if (input.body) {
    originalBody = input.body;
  } else {
    // Sinon, créer un body vide mais au moins on aura la structure
    originalBody = {};
  }
}

// Passer TOUTES les données nécessaires pour la décision dans le nœud If
// Structure avec "body" pour correspondre à la condition {{ $json.body.is_whatsapp }}
return {
  json: {
    // Le texte de la réponse de LÉO (utilisé pour l'affichage)
    response: leoResponse,
    
    // Structure "body" pour correspondre à la condition du nœud If
    body: {
      // Informations sur le canal (nécessaires pour le nœud If)
      // Si les données ne sont pas trouvées, on peut essayer de détecter WhatsApp autrement :
      // - Si "To" contient un numéro de téléphone, c'est probablement WhatsApp
      // - Si "From" contient un numéro, c'est probablement WhatsApp
      is_whatsapp: originalBody.is_whatsapp !== undefined 
        ? originalBody.is_whatsapp 
        : (originalBody.To && /^\+?[1-9]\d{1,14}$/.test(originalBody.To.replace(/\s/g, ''))) 
          || (originalBody.From && /^\+?[1-9]\d{1,14}$/.test(originalBody.From.replace(/\s/g, '')))
          || false,
      From: originalBody.From || "",
      To: originalBody.To || "",
      
      // Message original
      message: originalBody.message || input.message || "",
      
      // Contexte complet (pour les webhooks et l'application)
      context: originalBody.context || {},
      
      // Toutes les autres données originales (pour compatibilité)
      ...originalBody,
    }
  }
};
```

## Explication

Ce code :
1. **Récupère toutes les données** de l'input (pas seulement le texte)
2. **Extrait le texte de la réponse** de LÉO depuis différents champs possibles (`output`, `text`, `response`)
3. **Remonte dans tous les inputs** pour trouver les données originales (`is_whatsapp`, `From`, `To`, `context`) qui peuvent venir de différents nœuds précédents
4. **Retourne une structure avec `body`** pour correspondre à la condition `{{ $json.body.is_whatsapp }}` du nœud "If"
5. **Préserve toutes les données originales** pour que le routage fonctionne correctement

## Utilisation dans le nœud If

Dans le nœud "If", vous pouvez maintenant utiliser :
- `{{ $json.body.is_whatsapp }}` pour vérifier si c'est un message WhatsApp ⚠️ **IMPORTANT** : utiliser `.body`
- `{{ $json.body.From }}` pour obtenir l'expéditeur
- `{{ $json.body.To }}` pour obtenir le destinataire
- `{{ $json.response }}` pour obtenir le texte de la réponse (à la racine)
- `{{ $json.body.context }}` pour obtenir le contexte complet

## Condition recommandée pour le nœud If

### Branche TRUE (WhatsApp)
```javascript
// Condition : Si c'est un message WhatsApp
{{ $json.body.is_whatsapp === true }}
```
→ Connecter à "Send an SMS/MMS/WhatsApp..." avec :
- `To`: `{{ $json.body.To }}`
- `Message`: `{{ $json.response }}`

### Branche FALSE (Application Web)
```javascript
// Condition : Si ce n'est PAS WhatsApp (application web)
{{ $json.body.is_whatsapp !== true }}
// OU
{{ !$json.body.is_whatsapp }}
```
→ Connecter à "Respond to Webhook" avec :
- Toutes les données JSON complètes pour que l'application web puisse traiter la réponse

## Structure complète des données en sortie

Après ce nœud, vous aurez accès à :

```json
{
  "response": "Texte de la réponse de LÉO",
  "body": {
    "is_whatsapp": true/false,
    "From": "Numéro WhatsApp ou vide",
    "To": "Numéro WhatsApp ou vide",
    "context": {
      "tenant_id": "uuid",
      "conversation_id": "uuid",
      "tenant": {...},
      "recent_clients": [...],
      ...
    },
    "message": "Message original de l'utilisateur",
    ... (toutes les autres données du body original)
  }
}
```

## Important

- Le champ `response` contient **uniquement le texte** de la réponse de LÉO (à la racine du JSON)
- Les autres champs (`is_whatsapp`, `From`, `To`, `context`, etc.) sont dans `body` pour correspondre à la condition `{{ $json.body.is_whatsapp }}`
- Le code **remonte dans tous les inputs** pour trouver les données originales (pour gérer les cas où elles viennent de différents nœuds)
- Cette structure permet au nœud "If" de décider correctement où renvoyer la réponse

## Debug

Si `is_whatsapp` reste `false` alors que le message vient de WhatsApp :

1. **Utilisez la version avec debug** : Voir `N8N_FORMAT_RESPONSE_CODE_DEBUG.md` pour une version avec des logs détaillés

2. **Vérifiez le nœud "Code in JavaScript1"** : Assurez-vous qu'il passe bien les données WhatsApp dans la structure :
   ```javascript
   {
     body: {
       is_whatsapp: true,
       From: "...",
       To: "...",
       message: "...",
       context: {...}
     }
   }
   ```

3. **Vérifiez le nœud "Format Message pour léo"** : Si c'est là que les données WhatsApp sont ajoutées, assurez-vous qu'elles sont bien présentes dans `body`

4. **Solution alternative** : Si les données sont dans un nœud encore plus tôt, vous pouvez les stocker dans une variable de workflow N8N et les récupérer ici avec `$workflow.getStaticData('global')`