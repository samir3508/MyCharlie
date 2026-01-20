# 🔧 Fix : Erreur MCP "Unauthorized: invalid signature"

## 🚨 Problème

**Erreur :**
```
[supergateway] Streamable HTTP error: StreamableHTTPError: Streamable HTTP error: Error POSTing to endpoint: {"message":"Unauthorized: invalid signature"}
code: 401
```

**Cause :**
Le token JWT utilisé par Cursor pour se connecter au serveur MCP N8N a une **signature invalide**. Le serveur MCP N8N valide le JWT avec une clé secrète, et la signature ne correspond pas.

---

## ✅ Solution : Générer un nouveau token JWT valide

Le problème vient du workflow MCP Server dans N8N qui génère des tokens JWT. Il faut vérifier que :

1. **Le workflow MCP Server est actif** dans N8N
2. **Le workflow génère des tokens JWT valides** avec la bonne clé secrète
3. **La clé secrète dans N8N correspond** à celle utilisée pour valider le JWT

---

## 📋 ÉTAPE 1 : Vérifier que le workflow MCP Server est actif

### Dans N8N :

1. **Connectez-vous à N8N :** https://n8n.srv1129094.hstgr.cloud
2. **Cherchez le workflow "MCP Server"** ou "MCP Server HTTP"
3. **Vérifiez que le workflow est ACTIF** (toggle vert activé)
4. **Si le workflow n'est pas actif, activez-le**

---

## 📋 ÉTAPE 2 : Vérifier la configuration du workflow MCP Server

### Dans le workflow MCP Server :

1. **Ouvrez le workflow MCP Server**
2. **Trouvez le nœud qui génère le token JWT** (généralement un nœud "Code" ou "Function")
3. **Vérifiez que la clé secrète est correcte**

Le token JWT doit être signé avec une clé secrète qui correspond à celle utilisée par le nœud de validation.

---

## 📋 ÉTAPE 3 : Régénérer un nouveau token JWT

### Option 1 : Utiliser le nœud "Generate JWT" dans N8N

1. **Dans le workflow MCP Server, trouvez le nœud qui génère le JWT**
2. **Modifiez-le pour générer un nouveau token avec la bonne clé secrète**

### Option 2 : Créer un nouveau token manuellement

Le token JWT doit avoir cette structure :
```json
{
  "sub": "af5c1480-8da9-43bc-b4ac-d239125535ba",
  "iss": "n8n",
  "aud": "mcp-server-api",
  "iat": 1768770163
}
```

Et doit être signé avec la clé secrète utilisée par le serveur MCP.

---

## 📋 ÉTAPE 4 : Vérifier la configuration MCP dans Cursor

### Vérifier le fichier `~/.cursor/mcp.json` :

1. **Ouvrez le fichier :** `~/.cursor/mcp.json`
2. **Vérifiez la configuration du serveur MCP N8N**

Exemple de configuration :
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "supergateway",
      "args": [
        "--streamableHttp",
        "https://n8n.srv1129094.hstgr.cloud/mcp-server/http",
        "--header",
        "authorization:Bearer VOTRE_TOKEN_JWT_ICI"
      ]
    }
  }
}
```

⚠️ **Le token JWT doit être généré par le workflow MCP Server dans N8N !**

---

## 📋 ÉTAPE 5 : Tester la connexion MCP

### Après avoir mis à jour le token :

1. **Redémarrez Cursor** complètement (Cmd+Q puis rouvrir)
2. **Attendez quelques secondes** que Cursor se connecte au serveur MCP
3. **Vérifiez les logs MCP** dans Cursor (Outils développeur → Console)

### Si l'erreur persiste :

1. **Vérifiez que le workflow MCP Server est actif**
2. **Vérifiez que le token JWT est bien généré** par le workflow
3. **Vérifiez que la clé secrète dans N8N correspond** à celle utilisée pour valider

---

## 🔍 Diagnostic : Comment savoir si le token est valide

### Test 1 : Vérifier le token JWT manuellement

Vous pouvez décoder le token JWT pour voir son contenu :
```bash
# Le token JWT a 3 parties séparées par des points
# Partie 1 : Header (base64)
# Partie 2 : Payload (base64)
# Partie 3 : Signature (base64)

# Pour décoder le payload :
echo "eyJzdWIiOiJhZjVjMTQ4MC04ZGE5LTQzYmMtYjRhYy1kMjM5MTI1NTM1YmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjdjYmYzYWY2LWYzMmUtNDdkOC05OWUxLWEyZjY5MTY2YzRiMyIsImlhdCI6MTc2ODc3MDE2M30" | base64 -d
```

### Test 2 : Tester l'endpoint MCP directement

```bash
curl -X POST https://n8n.srv1129094.hstgr.cloud/mcp-server/http \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": {
        "name": "test",
        "version": "1.0.0"
      }
    }
  }'
```

Si vous obtenez une erreur 401, le token est invalide.

---

## 💡 Note importante

**Le token JWT doit être généré par le workflow MCP Server dans N8N !**

- Le workflow MCP Server dans N8N doit générer un token JWT valide
- Le token doit être signé avec la clé secrète correcte
- Le token doit être passé dans le header `Authorization: Bearer TOKEN`

Si vous ne savez pas comment générer le token, consultez le workflow MCP Server dans N8N pour voir comment il est généré.

---

## 🆘 Si rien ne fonctionne

1. **Vérifiez les logs du workflow MCP Server dans N8N :**
   - Ouvrez l'exécution du workflow
   - Regardez les logs pour voir si le token est généré correctement

2. **Vérifiez que le workflow MCP Server est actif :**
   - Le workflow doit être ACTIF (toggle vert) pour générer des tokens

3. **Contactez le support N8N** si le problème persiste

---

## 📚 Ressources

- `docs/N8N_MCP_FIX_SUPERGATEWAY.md` - Problèmes avec supergateway
- `docs/N8N_MCP_CONNECTION_ISSUE.md` - Problèmes de connexion MCP
- `docs/N8N_VERIFIER_CONNEXION_MCP.md` - Guide de vérification MCP
