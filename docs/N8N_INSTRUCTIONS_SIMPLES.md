# 📋 INSTRUCTIONS SIMPLES - N8N

## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.


## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.

## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.


## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.

## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.


## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.

## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.


## ✅ ÉTAPE 1 : Copier le CODE dans Custom Tool

### Où ?
- Ouvrez votre nœud **"Code Tool"** dans N8N
- Onglet **"Parameters"**
- Zone de code JavaScript (en haut)

### Quoi ?
Copiez **TOUT** ce code :

```javascript
const input = $input.item.json;

let action, payload, tenant_id;

// Format 1 : query.parameters.* (nouveau format N8N)
if (input.query && input.query.parameters && input.query.parameters.action) {
  action = input.query.parameters.action;
  payload = input.query.parameters.payload || {};
  tenant_id = input.query.parameters.tenant_id || input.query.tenant_id || input.tenant_id;
}
// Format 2 : query.query.*
else if (input.query && input.query.query && input.query.query.action) {
  action = input.query.query.action;
  payload = input.query.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id || input.query.query.tenant_id;
}
else if (input.query && input.query.action) {
  action = input.query.action;
  payload = input.query.payload || {};
  tenant_id = input.tenant_id || input.query.tenant_id;
}
else if (input.action) {
  action = input.action;
  payload = input.payload || {};
  tenant_id = input.tenant_id;
}
else {
  throw new Error('Structure inattendue. Reçu: ' + JSON.stringify(input, null, 2));
}

if (!action) {
  throw new Error('Le paramètre "action" est obligatoire');
}

if (!tenant_id) {
  throw new Error('Le paramètre "tenant_id" est obligatoire. Structure: ' + JSON.stringify(input, null, 2));
}

const actionMap = {
  'chercher-client': 'search-client',
  'creer-client': 'create-client',
  'creer-devis': 'create-devis',
  'ajouter-ligne-devis': 'add-ligne-devis',
  'finaliser-devis': 'finalize-devis',
  'creer-facture': 'create-facture',
  'finaliser-facture': 'finalize-facture',
  'statistiques': 'stats-dashboard',
  'recherche-globale': 'search-global'
};

const normalizedAction = actionMap[action] || action;

const requestBody = {};
if (payload) {
  for (var key in payload) {
    if (payload.hasOwnProperty(key)) {
      requestBody[key] = payload[key];
    }
  }
}
requestBody.tenant_id = tenant_id;

const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
const BASE_URL = 'https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1';
const functionUrl = BASE_URL + '/' + normalizedAction;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + LEO_API_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error('Erreur ' + normalizedAction + ' (' + response.status + '): ' + errorText);
}

const result = await response.json();
return result;
```

---

## ✅ ÉTAPE 2 : Copier le PROMPT dans AI Agent

### Où ?
- Ouvrez votre nœud **"AI Agent LÉO"** dans N8N
- Onglet **"Parameters"**
- Section **"System Message"** (en bas)

### Quoi ?
Remplacez **TOUT** le contenu du System Message par ceci :

```
Tu es LÉO, assistant IA pour le BTP.

RÈGLE ABSOLUE : Dans CHAQUE appel à call_edge_function, tu DOIS inclure tenant_id !

Format EXACT à générer :
{
  "query": {
    "query": {
      "action": "nom-action-EN-ANGLAIS",
      "payload": {...}
    },
    "tenant_id": "VALEUR-DEPUIS-context.tenant_id"
  }
}

Le tenant_id vient TOUJOURS de context.tenant_id de ton JSON d'entrée.
NE JAMAIS oublier tenant_id - c'est OBLIGATOIRE !

Actions disponibles (TOUTES EN ANGLAIS) :
- search-client (pas chercher-client)
- create-client (pas creer-client)
- create-devis (pas creer-devis)
- add-ligne-devis (pas ajouter-ligne-devis)
- finalize-devis (pas finaliser-devis)
- create-facture (pas creer-facture)
- finalize-facture (pas finaliser-facture)
- stats-dashboard
- search-global

RÈGLES :
1. Actions en ANGLAIS
2. tenant_id OBLIGATOIRE dans query.tenant_id
3. tenant_id vient de context.tenant_id
```

---

## ✅ ÉTAPE 3 : Mettre le SCHÉMA Input

### Où ?
- Dans le même nœud **"Code Tool"**
- Onglet **"Parameters"**
- Descendez jusqu'à **"Specify Input Schema"** (en bas)
- Activez le toggle si ce n'est pas déjà fait
- Sélectionnez **"Define using JSON Schema"**

### Quoi ?
Copiez ce JSON dans la zone de texte :

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "object",
      "properties": {
        "query": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action à effectuer"
            },
            "payload": {
              "type": ["object", "null"],
              "description": "Paramètres de l'action"
            }
          },
          "required": ["action"]
        },
        "tenant_id": {
          "type": "string",
          "description": "UUID du tenant"
        }
      },
      "required": ["query"]
    },
    "tenant_id": {
      "type": "string",
      "description": "UUID du tenant (optionnel)"
    }
  },
  "required": ["query"]
}
```

---

## ✅ ÉTAPE 4 : Sauvegarder

1. Cliquez sur **"Save"** dans le Code Tool
2. Cliquez sur **"Save"** dans l'AI Agent
3. Cliquez sur **"Save"** du workflow

---

## 🎯 C'EST TOUT !

Après ces 4 étapes, ça devrait fonctionner.