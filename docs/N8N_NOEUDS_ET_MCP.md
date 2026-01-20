# 📋 Nœuds du workflow n8n et connexions MCP

## 🔍 Structure actuelle du workflow

### Nœuds présents dans le workflow

```
[1] Chat Trigger (n8n-nodes-base.chatTrigger)
    ↓
[2] Check Message Type (IF - audio ou texte)
    ├─ Texte → [3] Format Text Message for LEO
    └─ Audio → [4] Format Audio Message for LEO
    ↓
[5] Merge Messages (combine les deux chemins)
    ↓
[6] Extract Info & Parse Travaux (parse les travaux depuis le message)
    ↓
[7] AI Agent LÉO (@n8n/n8n-nodes-langchain.agent)
    ↓
[8] Format Response
    ↓
[9] Check Response Type (IF - WhatsApp ou Web)
    ├─ WhatsApp → [10] Send SMS/WhatsApp (Twilio)
    └─ Web → [11] Respond to Webhook
```

### Détails des nœuds

#### [1] Chat Trigger
- **Type** : `n8n-nodes-base.chatTrigger`
- **Rôle** : Point d'entrée du workflow, reçoit les messages
- **Webhook ID** : `leo-chat-trigger`
- **MCP** : ❌ Pas de connexion MCP

#### [2] Check Message Type
- **Type** : `n8n-nodes-base.if`
- **Rôle** : Vérifie si le message est audio ou texte
- **Condition** : `body.message_type === "audio"`
- **MCP** : ❌ Pas de connexion MCP

#### [3] Format Text Message for LEO
- **Type** : `n8n-nodes-base.code`
- **Rôle** : Formate les messages texte pour LÉO
- **Extrait** : `tenant_id` depuis `context.tenant_id || body.tenant_id || ""`
- **MCP** : ❌ Pas de connexion MCP

#### [4] Format Audio Message for LEO
- **Type** : `n8n-nodes-base.code`
- **Rôle** : Formate les messages audio pour LÉO
- **Extrait** : `tenant_id` depuis `context.tenant_id || body.tenant_id || ""`
- **MCP** : ❌ Pas de connexion MCP

#### [5] Merge Messages
- **Type** : `n8n-nodes-base.merge`
- **Rôle** : Combine les messages texte et audio
- **MCP** : ❌ Pas de connexion MCP

#### [6] Extract Info & Parse Travaux
- **Type** : `n8n-nodes-base.code`
- **Rôle** : Parse les travaux depuis le message raw
- **MCP** : ❌ Pas de connexion MCP

#### [7] AI Agent LÉO ⭐
- **Type** : `@n8n/n8n-nodes-langchain.agent`
- **Rôle** : Agent IA GPT-4o qui traite les messages
- **Outil utilisé** : `call_edge_function` (HTTP Request, PAS MCP)
- **URL appelée** : `https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1/leo-router`
- **Méthode** : POST
- **Headers** : `Authorization: Bearer {{ $env.LEO_API_SECRET }}`
- **MCP** : ❌ Pas de connexion MCP (utilise HTTP Request direct)

#### [8] Format Response
- **Type** : `n8n-nodes-base.code`
- **Rôle** : Formate la réponse de l'AI
- **MCP** : ❌ Pas de connexion MCP

#### [9] Check Response Type
- **Type** : `n8n-nodes-base.if`
- **Rôle** : Vérifie si la réponse doit aller vers WhatsApp ou Web
- **Condition** : `context.is_whatsapp === true`
- **MCP** : ❌ Pas de connexion MCP

#### [10] Send SMS/WhatsApp
- **Type** : `n8n-nodes-base.twilio`
- **Rôle** : Envoie les messages WhatsApp via Twilio
- **MCP** : ❌ Pas de connexion MCP

#### [11] Respond to Webhook
- **Type** : `n8n-nodes-base.respondToWebhook`
- **Rôle** : Répond au webhook pour les réponses Web
- **MCP** : ❌ Pas de connexion MCP

---

## 🔌 Connexions MCP

### ❌ Aucun nœud n'utilise le MCP dans le workflow n8n

**Important :** Le workflow n8n n'utilise **PAS** le serveur MCP n8n. Il fait des **HTTP Requests directs** vers Supabase.

### Configuration MCP dans Cursor (pas dans n8n)

Le fichier `~/.cursor/mcp.json` configure un **serveur MCP n8n** pour que **Cursor** puisse s'y connecter :

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://n8n.srv1271213.hstgr.cloud/mcp-server/http",
        "--header",
        "authorization:Bearer eyJ..."
      ]
    }
  }
}
```

**Rôle :**
- ✅ Permet à **Cursor** de se connecter au serveur MCP déployé sur n8n
- ✅ Le serveur MCP n8n est accessible à : `https://n8n.srv1271213.hstgr.cloud/mcp-server/http`
- ❌ Le **workflow n8n** n'utilise PAS ce MCP - il utilise des HTTP Requests

### Comment le workflow n8n accède à Supabase

Le nœud **"AI Agent LÉO"** utilise un outil `call_edge_function` qui fait un **HTTP Request direct** vers :

```
POST https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1/leo-router
Headers:
  Authorization: Bearer {{ $env.LEO_API_SECRET }}
  Content-Type: application/json
Body:
{
  "action": "...",
  "payload": {...},
  "tenant_id": "..."
}
```

**Ce n'est PAS via MCP**, c'est un **HTTP Request standard**.

---

## 📊 Résumé

| Nœud | Type | Utilise MCP ? | Connexion Supabase |
|------|------|---------------|-------------------|
| Chat Trigger | chatTrigger | ❌ Non | Aucune |
| Check Message Type | IF | ❌ Non | Aucune |
| Format Text/Audio | Code | ❌ Non | Aucune |
| Merge Messages | Merge | ❌ Non | Aucune |
| Extract Info | Code | ❌ Non | Aucune |
| **AI Agent LÉO** | LangChain Agent | ❌ Non | ✅ HTTP Request direct vers `leo-router` |
| Format Response | Code | ❌ Non | Aucune |
| Check Response Type | IF | ❌ Non | Aucune |
| Send SMS/WhatsApp | Twilio | ❌ Non | Aucune |
| Respond to Webhook | Respond | ❌ Non | Aucune |

---

## 🔍 Problème identifié : Pas de détection du tenant

**Le workflow actuel :**
- ❌ **N'utilise PAS le MCP n8n**
- ❌ **Ne détecte PAS automatiquement le `tenant_id` depuis le numéro WhatsApp**
- ⚠️ Les nœuds "Format Text/Audio Message" utilisent : `context.tenant_id || body.tenant_id || ""` qui peut être vide ou toujours le même

**Solution :**
Ajouter un nœud **"Find Tenant by WhatsApp Phone"** après le **Chat Trigger** pour détecter automatiquement le `tenant_id`.

📖 **Voir :** `docs/N8N_FIX_TENANT_DETECTION_WHATSAPP.md`

---

## 🛠️ Pour utiliser le MCP dans n8n (optionnel)

Si vous voulez utiliser le serveur MCP n8n dans le workflow (au lieu de HTTP Request direct), vous devriez :

1. **Ajouter un nœud "MCP Client Tool"** dans n8n
2. **Configurer la connexion** vers `https://n8n.srv1271213.hstgr.cloud/mcp-server/http`
3. **Connecter le MCP Client Tool** à l'entrée "Tool" de l'AI Agent LÉO

**Mais actuellement, le workflow utilise HTTP Request direct, ce qui fonctionne aussi bien.**
