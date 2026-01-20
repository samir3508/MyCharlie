# 📋 Analyse complète du workflow n8n

## 🔍 Problèmes identifiés

### 1. ❌ Détection du Tenant : Toujours le même tenant_id

**Problème :**
Le workflow n8n n'extrait pas le `tenant_id` à partir du numéro WhatsApp de l'expéditeur. Il utilise toujours la même valeur (vide ou hardcodée) pour tous les messages.

**Cause :**
Les nœuds "Format Text Message for LEO" et "Format Audio Message for LEO" utilisent :
```javascript
tenant_id: input.context?.tenant_id || input.body?.tenant_id || ""
```

Mais aucun nœud ne **détecte automatiquement** le `tenant_id` depuis le numéro WhatsApp de l'expéditeur en interrogeant la table `tenants.whatsapp_phone`.

**Impact :**
- Tous les messages WhatsApp sont associés au même tenant (ou aucun tenant)
- Les clients, devis, factures sont créés pour le mauvais tenant
- Les données sont mélangées entre différents utilisateurs

**Solution :**
Ajouter un nœud **"Find Tenant by WhatsApp Phone"** après le **Chat Trigger** et avant le **Check Message Type**.

📖 **Voir la documentation complète :** `docs/N8N_FIX_TENANT_DETECTION_WHATSAPP.md`

### 2. ⚠️ MCP Connection : Configuration vérifiée

**Statut :**
La configuration MCP dans `~/.cursor/mcp.json` semble correcte :
- ✅ Serveur n8n-mcp configuré avec `supergateway`
- ✅ URL du serveur MCP : `https://n8n.srv1271213.hstgr.cloud/mcp-server/http`
- ✅ Token d'autorisation Bearer configuré

**Si l'erreur persiste :**
1. Vérifiez que le serveur MCP n8n est accessible : `https://n8n.srv1271213.hstgr.cloud/mcp-server/http`
2. Vérifiez que le token Bearer n'est pas expiré
3. Vérifiez les logs du serveur n8n pour voir les erreurs éventuelles
4. Redémarrez Cursor après avoir modifié le fichier `mcp.json`

## ✅ Solutions à implémenter

### Solution 1 : Ajouter la détection automatique du tenant

1. **Ouvrir le workflow n8n** : `LÉO - Agent IA BTP avec leo-router`

2. **Ajouter un nœud Code** après le **Chat Trigger** :
   - **Nom :** `Find Tenant by WhatsApp Phone`
   - **Type :** Code (JavaScript)
   - **Position :** Entre "Chat Trigger" et "Check Message Type"

3. **Copier le code** depuis `docs/N8N_FIX_TENANT_DETECTION_WHATSAPP.md` (section Étape 2)

4. **Configurer la variable d'environnement** dans n8n :
   - Settings → Variables (ou `$env`)
   - Ajouter : `SUPABASE_SERVICE_ROLE_KEY` = votre service role key Supabase

5. **Vérifier les données** dans Supabase :
   ```sql
   SELECT id, company_name, whatsapp_phone, phone 
   FROM tenants 
   WHERE whatsapp_phone IS NOT NULL OR phone IS NOT NULL;
   ```

6. **Tester** en envoyant un message WhatsApp depuis un numéro lié à un tenant

### Solution 2 : Vérifier la connexion MCP

1. **Tester l'endpoint MCP** :
   ```bash
   curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
        https://n8n.srv1271213.hstgr.cloud/mcp-server/http
   ```

2. **Vérifier les logs n8n** pour voir si le serveur MCP répond

3. **Vérifier que le token n'est pas expiré** dans les logs n8n

4. **Si besoin, régénérer le token** depuis l'interface n8n MCP Server

## 📊 Structure du workflow corrigé

```
[Chat Trigger]
    ↓
[Find Tenant by WhatsApp Phone] ← NOUVEAU (détecte tenant_id)
    ↓
[Check Message Type] (IF - audio ou texte)
    ├─ Texte → [Format Text Message for LEO] → [Merge Messages]
    └─ Audio → [Format Audio Message for LEO] → [Merge Messages]
    ↓
[Merge Messages]
    ↓
[Extract Info & Parse Travaux]
    ↓
[AI Agent LÉO] (utilise maintenant context.tenant_id détecté)
    ↓
[Format Response]
    ↓
[Check Response Type] (IF - WhatsApp ou Web)
    ├─ WhatsApp → [Send SMS/WhatsApp]
    └─ Web → [Respond to Webhook]
```

## 🧪 Tests à effectuer

### Test 1 : Détection du tenant

1. Envoyez un message WhatsApp depuis un numéro associé à un tenant dans Supabase
2. Vérifiez dans les logs n8n du nœud "Find Tenant by WhatsApp Phone" :
   - ✅ Numéro WhatsApp extrait
   - ✅ Numéro nettoyé
   - ✅ Tenant trouvé : `{company_name} ({tenant_id})`
3. Vérifiez dans les nœuds suivants que `context.tenant_id` est correctement rempli

### Test 2 : Messages de différents tenants

1. Envoyez des messages depuis deux numéros différents (associés à des tenants différents)
2. Vérifiez que chaque message utilise le bon `tenant_id`
3. Vérifiez que les clients/devis créés sont bien associés au bon tenant

### Test 3 : Connexion MCP

1. Redémarrez Cursor
2. Vérifiez dans les logs Cursor qu'il n'y a pas d'erreur MCP
3. Si erreur persistante, vérifiez l'accessibilité du serveur n8n MCP

## 📝 Notes importantes

1. **Numéros WhatsApp uniques** : Assurez-vous que chaque tenant a un numéro WhatsApp unique dans `tenants.whatsapp_phone`. Si plusieurs tenants ont le même numéro, le workflow utilisera le premier trouvé.

2. **Format des numéros** : Le code gère plusieurs formats :
   - `whatsapp:+33612345678`
   - `+33612345678`
   - `0612345678`
   - `33612345678`

3. **Performance** : Le nœud "Find Tenant by WhatsApp Phone" fait une requête HTTP à Supabase à chaque message. Si vous avez beaucoup de messages, considérez ajouter un cache.

4. **Fallback** : Si aucun tenant n'est trouvé, le workflow continue avec un `tenant_id` vide. Vous pouvez ajouter un nœud **IF** pour arrêter le workflow dans ce cas.

## 🔗 Documentation liée

- **Détection du tenant :** `docs/N8N_FIX_TENANT_DETECTION_WHATSAPP.md`
- **Code du nœud :** `docs/N8N_CODE_DETECTER_TENANT_WHATSAPP.js`
- **Configuration WhatsApp :** `docs/CONFIGURATION_TWILIO_WHATSAPP.md`
