# Fix : Erreur ZodError avec MCP Supabase dans N8N

## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp
## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp




## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp


## 🔍 Le problème

**Erreur :**
```json
{
  "error": {
    "name": "ZodError",
    "message": "Unrecognized key(s) in object: 'sessionId', 'action', 'chatInput', 'toolCallId'"
  }
}
```

**Cause :**
Le node MCP Client reçoit en INPUT toutes les données du workflow :
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7CuI61OpHwSnP"
}
```

Mais le MCP Supabase attend uniquement :
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

## ✅ Solution : Ajouter un node Code pour transformer les données

### Étape 1 : Ajouter un node Code

1. **Dans votre workflow N8N**, entre l'AI Agent et le MCP Client
2. **Cliquez sur la connexion** entre "AI Agent Léo" (port Tools) et "MCP Client"
3. **Cliquez sur "Add node"** ou glissez un node Code
4. **Placez-le** entre les deux nodes

### Étape 2 : Configurer le node Code

**Nom du node :** `Transform MCP Input`

**Code JavaScript :**
```javascript
// Récupérer les données de l'AI Agent
const input = $input.item.json;

// Extraire uniquement les paramètres nécessaires pour MCP
// L'AI Agent envoie soit directement {name, arguments}, soit {tool, ...}
let toolName = input.name || input.tool || input.toolName;
let toolArguments = input.arguments || input.params || {};

// Si toolName n'est pas défini, essayer de le trouver dans les autres champs
if (!toolName) {
  // Chercher dans les clés possibles
  toolName = input.tool || input.function_name || null;
}

// Si on a toujours rien, retourner une erreur
if (!toolName) {
  throw new Error('Tool name not found in input. Available keys: ' + Object.keys(input).join(', '));
}

// Construire l'objet attendu par MCP
const mcpInput = {
  name: toolName,
  arguments: toolArguments || {}
};

// Log pour debug
console.log('🔧 [Transform] Input received:', JSON.stringify(input, null, 2));
console.log('✅ [Transform] MCP Input:', JSON.stringify(mcpInput, null, 2));

return {
  json: mcpInput
};
```

### Étape 3 : Connecter les nodes

**Nouvelle structure :**
```
[AI Agent Léo] (port Tools) 
    ↓
[Code - Transform MCP Input] 
    ↓
[MCP Client - Supabase]
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez** que l'erreur ZodError n'apparaît plus

## 🔧 Solution alternative : Utiliser les paramètres du node MCP

Si le node Code ne fonctionne pas, vous pouvez aussi configurer le node MCP Client pour ignorer les champs supplémentaires :

### Dans le node MCP Client :

1. **Onglet "Settings"**
2. **Cherchez "Options"** ou "Advanced"
3. **Ajoutez une option** pour filtrer les paramètres

**Ou utilisez cette configuration dans le node Code :**

```javascript
// Version simplifiée - extraire uniquement name et arguments
const input = $input.item.json;

// Le MCP Supabase attend : { name: "tool_name", arguments: {...} }
return {
  json: {
    name: input.tool || input.name || input.function_name,
    arguments: input.arguments || input.params || {}
  }
};
```

## 📋 Vérification

Après avoir ajouté le node Code :

1. **Exécutez le workflow**
2. **Cliquez sur le node "Code - Transform MCP Input"**
3. **Vérifiez l'output** : Il doit contenir uniquement `name` et `arguments`
4. **Cliquez sur le node "MCP Client"**
5. **Vérifiez l'output** : Il ne doit plus y avoir d'erreur ZodError

## 🎯 Exemple complet

**Input du node Code (depuis AI Agent) :**
```json
{
  "sessionId": "b8eeae50ddb04043aaace29cab052258",
  "action": "envoyerMessage",
  "chatInput": "liste moi mes table stp",
  "outil": "liste_migrations",
  "toolCallId": "appel_bd5QB6ep20QisDkJgeAEkiPN"
}
```

**Output du node Code (vers MCP Client) :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Note :** Le code transforme `liste_migrations` en `list_tables` car c'est l'outil valide dans Supabase MCP.

**Output du MCP Client (succès) :**
```json
{
  "response": [
    {
      "type": "text",
      "text": "{\"tables\": [\"clients\", \"devis\", \"factures\", ...]}"
    }
  ]
}
```

## 🆘 Erreur "inputType undefined"

Si vous voyez l'erreur :
```
Impossible de lire les propriétés d'un type indéfini (lecture de 'inputType')
```

Cela signifie généralement que le nœud MCP Client Tool ne reçoit pas les données dans le bon format.

**Solution :**
1. Vérifiez que le node Code transforme correctement les données
2. Vérifiez que le node Code retourne `{json: {...}}` et non juste `{...}`
3. Testez le node MCP Client Tool avec des données statiques :
   ```json
   {
     "name": "list_tables",
     "arguments": {}
   }
   ```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs** du node Code pour voir ce qu'il reçoit
2. **Vérifiez les logs** du node MCP Client pour voir ce qu'il envoie
3. **Testez manuellement** le node MCP Client avec les bons paramètres
4. **Vérifiez la documentation** du node MCP Client dans N8N
5. **Vérifiez que l'endpoint MCP est correct** : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
6. **Vérifiez que le token Bearer est valide** (doit commencer par `sb_`)

## 📚 Ressources

- Documentation N8N Code node : https://docs.n8n.io/code/
- Documentation MCP Supabase : https://supabase.com/docs/guides/ai/mcp