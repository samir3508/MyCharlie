# Fix : Format d'input du MCP Client dans N8N

## 🔍 Le problème

L'erreur `ZodError` avec les clés non reconnues (`sessionId`, `action`, `chatInput`, `toolCallId`) vient du fait que :

**Le node MCP Client reçoit en INPUT :**
```json
{
  "sessionId": "bea37d4f1436438caa8e4a42e1fdaf40",
  "action": "sendMessage",
  "chatInput": "va essayer. nouveau avec le mcp",
  "tool": "list_tables",
  "toolCallId": "call_PbmpZfyZ75Y7Cul610pHwSnP"
}
```

**Mais le serveur MCP Supabase attend :**
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

Le serveur MCP ne reconnaît pas les clés `sessionId`, `action`, `chatInput`, `toolCallId`.

## ✅ Solution : Ajouter un node Code pour transformer

### Étape 1 : Modifier votre workflow

**Structure actuelle (ne marche pas) :**
```
[AI Agent Léo] (port Tools) ──→ [MCP Client]
```

**Structure correcte :**
```
[AI Agent Léo] (port Tools) ──→ [Code - Transform MCP Input] ──→ [MCP Client]
```

### Étape 2 : Ajouter le node Code

1. **Déconnectez** le MCP Client du port Tools de l'AI Agent
2. **Ajoutez un node Code** entre l'AI Agent et le MCP Client
3. **Connectez :**
   - AI Agent (port Tools) → Code (port Input)
   - Code (port Output) → MCP Client (port Input)

### Étape 3 : Configurer le node Code

**Dans le node Code, ajoutez ce JavaScript :**

```javascript
// Le node MCP Client reçoit un objet avec toutes les clés du Chat Trigger
// On doit transformer pour n'envoyer que "name" et "arguments"

const input = $input.item.json;

// Si l'AI Agent envoie directement le format correct, on le garde
if (input.name && input.arguments !== undefined) {
  return {
    json: {
      name: input.name,
      arguments: input.arguments || {}
    }
  };
}

// Sinon, on transforme depuis le format de l'AI Agent
// L'AI Agent peut envoyer : { "tool": "list_tables", "arguments": {...} }
// ou le contexte complet du Chat Trigger

let toolName = null;
let toolArguments = {};

// Cas 1 : Le champ "tool" existe (format AI Agent)
if (input.tool) {
  toolName = input.tool;
  toolArguments = input.arguments || input.params || {};
}

// Cas 2 : Le champ "name" existe directement
else if (input.name) {
  toolName = input.name;
  toolArguments = input.arguments || {};
}

// Cas 3 : Fallback - essayer de trouver dans les autres champs
else {
  // Chercher dans les clés possibles
  const possibleToolKeys = ['tool', 'toolName', 'function', 'functionName'];
  for (const key of possibleToolKeys) {
    if (input[key]) {
      toolName = input[key];
      break;
    }
  }
  
  // Chercher les arguments
  const possibleArgKeys = ['arguments', 'params', 'parameters', 'args'];
  for (const key of possibleArgKeys) {
    if (input[key]) {
      toolArguments = input[key];
      break;
    }
  }
}

// Si on n'a toujours pas de toolName, erreur
if (!toolName) {
  throw new Error('Impossible de trouver le nom de l\'outil. Format reçu: ' + JSON.stringify(Object.keys(input)));
}

// Retourner le format attendu par le MCP Client
return {
  json: {
    name: toolName,
    arguments: toolArguments
  }
};
```

### Étape 4 : Tester

1. **Exécutez votre workflow**
2. **Testez avec :** "liste mes tables"
3. **Vérifiez dans les logs du node Code** que la transformation fonctionne
4. **Vérifiez dans les logs du MCP Client** que l'erreur ZodError a disparu

## 🔧 Solution alternative : Utiliser le mode "Mapping" dans N8N

Si vous préférez ne pas utiliser de node Code, vous pouvez utiliser le mode **Mapping** du node MCP Client :

1. **Cliquez sur le node MCP Client**
2. **Onglet "Parameters"**
3. **Cherchez les champs pour configurer l'outil**
4. **Utilisez les expressions N8N** pour mapper :
   - `{{ $json.tool }}` → pour le nom de l'outil
   - `{{ $json.arguments }}` → pour les arguments

**Mais attention :** Le format exact dépend de la version de N8N et du node MCP Client. Le node Code est plus fiable.

## 📝 Explication détaillée

### Pourquoi ça arrive ?

Quand l'AI Agent appelle un outil via le port "Tools", N8N peut :
1. Soit passer directement `{ name, arguments }` au node MCP Client
2. Soit passer tout le contexte du workflow (sessionId, action, chatInput, etc.)

Dans votre cas, c'est le cas #2 qui se produit.

### Le serveur MCP Supabase attend quoi ?

Le serveur MCP Supabase utilise un schéma Zod strict qui n'accepte que :
- `name` : string (nom de l'outil)
- `arguments` : object (paramètres de l'outil)

Toute autre clé est rejetée avec l'erreur `unrecognized_keys`.

### Pourquoi le node Code fonctionne ?

Le node Code filtre et transforme les données pour ne garder que ce qui est nécessaire :
- Extrait `tool` ou `name` → `name`
- Extrait `arguments` ou `params` → `arguments`
- Ignore toutes les autres clés (`sessionId`, `action`, etc.)

## ✅ Vérification

Après avoir ajouté le node Code, testez :

1. **"liste mes tables"** → Devrait appeler `list_tables` sans erreur
2. **"montre moi les clients"** → Devrait appeler `query_table` avec `{"table": "clients", "select": "*"}`

Si vous voyez encore l'erreur ZodError, vérifiez :
- Que le node Code est bien placé entre AI Agent et MCP Client
- Que le code JavaScript dans le node Code est correct
- Que les logs du node Code montrent la transformation correcte

## 🆘 Si ça ne marche toujours pas

Partagez-moi :
1. Le contenu exact du node Code que vous avez ajouté
2. Les logs du node Code (Input et Output)
3. Les logs du node MCP Client (Input et Output)
4. L'erreur exacte si elle persiste

