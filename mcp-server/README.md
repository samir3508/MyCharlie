# Serveur MCP Supabase pour LÉO

Serveur MCP (Model Context Protocol) pour connecter LÉO à votre base de données Supabase.

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

1. Copiez `.env.example` vers `.env` :
```bash
cp .env.example .env
```

2. Éditez `.env` et ajoutez vos informations Supabase :
```bash
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

## Utilisation

### Mode développement (avec watch)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

## Configuration dans N8N

### Option 1 : MCP Client (STDIO)

Créez une credential "MCP Client (STDIO)" dans N8N :

**Command :**
```
node
```

**Arguments :**
```
--loader
ts-node/esm
/chemin/absolu/vers/my-leo-saas/mcp-server/src/index.ts
```

**Environment Variables :**
```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Option 2 : Via npx

**Command :**
```
npx
```

**Arguments :**
```
tsx
/chemin/absolu/vers/my-leo-saas/mcp-server/src/index.ts
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes
## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Outils disponibles

- `list_tables` : Liste les tables de la base
- `describe_table` : Décrit la structure d'une table
- `list_clients` : Liste les clients d'un tenant
- `get_client` : Récupère un client par ID
- `create_client` : Crée un nouveau client
- `list_devis` : Liste les devis d'un tenant
- `get_devis` : Récupère un devis avec ses lignes

## Test

Pour tester le serveur manuellement :