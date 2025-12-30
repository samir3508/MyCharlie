# Utilisation du Serveur MCP Supabase

## ✅ Installation terminée

Le serveur MCP Supabase a été installé dans `mcp-server/`.

## Configuration requise

Assurez-vous que votre `.env.local` contient :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

## Tester le serveur localement

### Option 1 : Test avec Node directement

```bash
cd mcp-server
npm run dev
```

Le serveur devrait démarrer et afficher :
```
✅ [MCP Server] Supabase client initialisé
✅ [MCP Server] Serveur MCP LÉO Supabase démarré
📡 [MCP Server] Prêt à recevoir des requêtes...
```

## Configuration dans N8N

### Étape 1 : Ajouter le node MCP Client Tool

1. Dans votre workflow N8N, ajoutez un node **"MCP Client (STDIO)"**
2. Créez une nouvelle credential "MCP Client (STDIO)"

### Étape 2 : Configuration de la credential

**Nom** : `LÉO Supabase MCP`

**Command :**
```
node
```

**Arguments (une ligne par argument) :**
```
--loader
ts-node/esm
/path/to/my-leo-saas/mcp-server/src/index.ts
```

**Working Directory :**
```
/path/to/my-leo-saas/mcp-server
```

**⚠️ Important :** Remplacez `/path/to/my-leo-saas` par le chemin absolu vers votre projet.

### Étape 3 : Configuration du node MCP Client Tool

1. Sélectionnez la credential créée
2. Dans le champ "Tool Name", vous pouvez spécifier un outil particulier ou laisser vide pour voir tous les outils disponibles

### Étape 4 : Tester avec list_tables

Connectez un node précédent qui envoie :
```json
{
  "name": "list_tables",
  "arguments": {
    "schemas": ["public"]
  }
}
```

## Outils disponibles

### 1. list_tables
Liste toutes les tables de la base de données.

```json
{
  "name": "list_tables",
  "arguments": {
    "schemas": ["public"]
  }
}
```

### 2. list_clients
Liste les clients d'un tenant.

```json
{
  "name": "list_clients",
  "arguments": {
    "tenant_id": "uuid-du-tenant",
    "limit": 20
  }
}
```

### 3. get_client
Récupère un client par ID.

```json
{
  "name": "get_client",
  "arguments": {
    "client_id": "uuid-du-client"
  }
}
```

### 4. create_client
Crée un nouveau client.

```json
{
  "name": "create_client",
  "arguments": {
    "tenant_id": "uuid-du-tenant",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "telephone": "0123456789",
    "type": "particulier"
  }
}
```

### 5. update_client
Met à jour un client existant.

```json
{
  "name": "update_client",
  "arguments": {
    "client_id": "uuid-du-client",
    "email": "nouveau.email@example.com"
  }
}
```

### 6. list_devis
Liste les devis d'un tenant.

```json
{
  "name": "list_devis",
  "arguments": {
    "tenant_id": "uuid-du-tenant",
    "statut": "accepté",
    "limit": 20
  }
}
```

### 7. get_devis
Récupère un devis par ID avec ses lignes.

```json
{
  "name": "get_devis",
  "arguments": {
    "devis_id": "uuid-du-devis"
  }
}
```

### 8. list_factures
Liste les factures d'un tenant.

```json
{
  "name": "list_factures",
  "arguments": {
    "tenant_id": "uuid-du-tenant",
    "statut": "payée",
    "limit": 20
  }
}
```

## Intégration avec l'AI Agent LÉO

### Workflow recommandé

```
[Chat Trigger] → [AI Agent Léo] → [Code Transform] → [MCP Client Tool] → [Respond to Webhook]
```

### Node Code "Transform" (entre AI Agent et MCP)

Le node Code transforme la sortie de l'AI Agent au format MCP :

```javascript
const input = $input.all()[0].json;

// Extraire le tool de l'AI Agent
const toolName = input.tool || input.name;

if (!toolName) {
  throw new Error('Aucun tool trouvé dans la sortie de l\'AI Agent');
}

// Construire les arguments selon le tool
let argumentsObj = {};

if (toolName === 'list_tables') {
  argumentsObj = { schemas: ['public'] };
} else if (toolName === 'list_clients' && input.tenant_id) {
  argumentsObj = { tenant_id: input.tenant_id, limit: input.limit || 20 };
} else {
  argumentsObj = input.arguments || {};
}

return {
  json: {
    name: toolName,
    arguments: argumentsObj
  }
};
```

## Dépannage

### Erreur "Configuration Supabase manquante"
- Vérifiez que `.env.local` contient `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
- Le serveur charge les variables depuis `.env.local` à la racine du projet

### Erreur "Command not found: node"
- Vérifiez que Node.js est installé
- Utilisez le chemin complet vers node si nécessaire : `/usr/local/bin/node`

### Erreur "Cannot find module"
- Vérifiez que vous avez fait `npm install` dans le dossier `mcp-server`
- Vérifiez le chemin dans "Working Directory" de la credential N8N

### Le serveur ne démarre pas
- Vérifiez les logs dans N8N pour voir les erreurs
- Testez le serveur localement avec `npm run dev` pour voir les erreurs

## Prochaines étapes

1. Testez chaque outil individuellement
2. Intégrez avec l'AI Agent LÉO
3. Ajoutez d'autres outils selon vos besoins

