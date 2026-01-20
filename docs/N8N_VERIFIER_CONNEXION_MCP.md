# 🔍 Vérifier la connexion MCP dans N8N

## 🚨 Problème : Erreur de connexion MCP

Si vous voyez une erreur liée à MCP dans votre workflow N8N, suivez ce guide étape par étape.

---

## ✅ ÉTAPE 1 : Identifier le type d'erreur MCP

### Erreur 1 : "MCP connection failed"
- **Cause** : Le nœud MCP ne peut pas se connecter au serveur Supabase
- **Solution** : Vérifier l'endpoint et le token (voir ÉTAPE 2)

### Erreur 2 : "Authentication failed"
- **Cause** : Le token Bearer est invalide ou expiré
- **Solution** : Générer un nouveau Personal Access Token Supabase (voir ÉTAPE 3)

### Erreur 3 : "Tool not found" ou "ZodError"
- **Cause** : Format de données incorrect entre l'AI Agent et le MCP Client
- **Solution** : Vérifier la connexion "Tool" (voir ÉTAPE 4)

### Erreur 4 : Aucun nœud MCP dans le workflow
- **Cause** : Le workflow utilise `leo-router` (HTTP Request) au lieu de MCP
- **Solution** : C'est normal ! Vous n'avez pas besoin de MCP pour utiliser `leo-router`

---

## ✅ ÉTAPE 2 : Vérifier la configuration du nœud MCP (si présent)

### Dans le nœud "Supabase Mcp" :

1. **Endpoint :**
   ```
   https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr
   ```
   - ⚠️ L'URL doit être complète avec `?project_ref=...`
   - ⚠️ Le `project_ref` doit correspondre à votre projet Supabase
   - ⚠️ Testez l'URL dans un navigateur (vous devriez voir une erreur JSON-RPC, c'est normal)

2. **Server Transport :**
   - Doit être : `HTTP Streamable`
   - ⚠️ PAS "SSE" ou "WebSocket"

3. **Authentication :**
   - Type : `Bearer Auth`
   - Token : Votre Personal Access Token Supabase
   - ⚠️ Le token doit commencer par `sb_`
   - ⚠️ PAS le `service_role` key
   - ⚠️ PAS le `anon` key

4. **Test de connexion :**
   - Clic droit sur le nœud "Supabase Mcp" → "Execute Node"
   - Vous devriez voir une liste d'outils disponibles (`execute_sql`, etc.)
   - Si erreur → problème de configuration (voir ÉTAPE 3)

---

## ✅ ÉTAPE 3 : Générer un nouveau Personal Access Token Supabase

### Si le token est invalide ou expiré :

1. **Allez sur Supabase Dashboard :**
   - https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Générez un Personal Access Token :**
   - Allez dans **Settings** → **Access Tokens**
   - Cliquez sur **Generate New Token**
   - Donnez-lui un nom (ex: "N8N MCP")
   - Copiez le token (il commence par `sb_`)

3. **Mettez à jour le nœud MCP dans N8N :**
   - Ouvrez le nœud "Supabase Mcp"
   - Collez le nouveau token dans **Authentication** → **Token**
   - Testez à nouveau (ÉTAPE 2, point 4)

---

## ✅ ÉTAPE 4 : Vérifier la connexion "Tool" entre MCP et AI Agent

### Si vous utilisez un nœud MCP :

1. **Vérifier la connexion :**
   - Le nœud "Supabase Mcp" doit être connecté à l'entrée **"Tool"** (pointillée) de "AI Agent LÉO"
   - ⚠️ PAS à l'entrée "Input" ou "Output"
   - L'entrée "Tool" est une entrée spéciale avec un pointillé

2. **Reconnecter si nécessaire :**
   - Déconnectez "Supabase Mcp" de "AI Agent LÉO"
   - Faites glisser depuis "Supabase Mcp" vers l'entrée **"Tool"** de "AI Agent LÉO"
   - L'entrée "Tool" devrait être visible comme une entrée séparée (pointillée)

3. **Vérifier que les outils sont listés :**
   - Dans "AI Agent LÉO" → onglet **"Tools"**
   - Vous devriez voir : `execute_sql`, `calculator`, `date`, `think`
   - Si rien → la connexion "Tool" n'est pas correcte

---

## ✅ ÉTAPE 5 : Vérifier si vous avez besoin de MCP

### Votre workflow actuel utilise `leo-router` :

Si votre workflow utilise un nœud **HTTP Request** qui appelle `leo-router` :
```
https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1/leo-router
```

**Vous N'AVEZ PAS besoin de MCP !**

- `leo-router` est une Edge Function Supabase qui gère toutes les actions
- MCP est une alternative pour utiliser `execute_sql` directement
- Les deux fonctionnent, mais vous n'avez pas besoin des deux en même temps

### Quand utiliser MCP vs `leo-router` :

**Utiliser `leo-router` (recommandé) :**
- ✅ Toutes les actions sont centralisées (clients, devis, factures, etc.)
- ✅ Plus simple à maintenir
- ✅ Pas besoin de configurer MCP

**Utiliser MCP Supabase :**
- ✅ Vous voulez exécuter des requêtes SQL directement
- ✅ Vous avez besoin de `execute_sql` pour des requêtes personnalisées
- ⚠️ Nécessite une configuration supplémentaire (endpoint, token)

---

## 🔍 Diagnostic : Où est l'erreur ?

### Si l'erreur vient de `leo-router` :

1. **Vérifier que l'URL est correcte :**
   ```
   https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1/leo-router
   ```

2. **Vérifier l'authentification :**
   - Header `Authorization: Bearer {{ $env.LEO_API_SECRET }}`
   - La variable d'environnement `LEO_API_SECRET` doit être définie dans N8N

3. **Vérifier le format de la requête :**
   ```json
   {
     "action": "search-client",
     "payload": {...},
     "tenant_id": "..."
   }
   ```

### Si l'erreur vient de MCP :

1. Vérifier l'endpoint MCP (ÉTAPE 2, point 1)
2. Vérifier le token Bearer (ÉTAPE 3)
3. Vérifier la connexion "Tool" (ÉTAPE 4)

---

## 📋 Checklist de diagnostic

- [ ] J'ai vérifié si mon workflow utilise un nœud MCP ou `leo-router`
- [ ] Si MCP : L'endpoint est correct avec `?project_ref=...`
- [ ] Si MCP : Le token Bearer commence par `sb_` (Personal Access Token)
- [ ] Si MCP : Le nœud "Supabase Mcp" est connecté à l'entrée "Tool" de "AI Agent LÉO"
- [ ] Si MCP : Les outils apparaissent dans "AI Agent LÉO" → "Tools"
- [ ] Si `leo-router` : L'URL est correcte (`/functions/v1/leo-router`)
- [ ] Si `leo-router` : La variable `LEO_API_SECRET` est définie dans N8N
- [ ] J'ai testé le nœud MCP seul (clic droit → "Execute Node")

---

## 🆘 Si rien ne fonctionne

1. **Partagez :**
   - Le message d'erreur exact (copier-coller)
   - Un screenshot du nœud MCP (si présent)
   - Un screenshot de la connexion entre MCP et AI Agent (si présent)

2. **Vérifiez les logs N8N :**
   - Ouvrez l'exécution du workflow
   - Regardez les logs du nœud qui génère l'erreur
   - Copiez les erreurs complètes

---

## 📚 Ressources

- `docs/N8N_DIAGNOSTIC_OUTILS.md` - Diagnostic complet des outils MCP
- `docs/FIX_MCP_ZOD_ERROR_N8N.md` - Solution pour l'erreur ZodError avec MCP

---

## 💡 Note importante

**Si vous utilisez `leo-router` dans votre workflow, vous N'AVEZ PAS besoin de MCP Supabase !**

Votre workflow actuel (`n8n-workflow-leo-complet.json`) utilise `leo-router` via HTTP Request. C'est la méthode recommandée pour LÉO, car elle centralise toutes les actions (clients, devis, factures, etc.).

MCP Supabase est une alternative si vous voulez exécuter des requêtes SQL directement, mais ce n'est pas nécessaire pour faire fonctionner LÉO.
