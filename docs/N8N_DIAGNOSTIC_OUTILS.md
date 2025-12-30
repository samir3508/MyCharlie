# 🔧 Diagnostic : LÉO n'appelle pas les outils

## 🚨 Problème : LÉO n'appelle aucun outil MCP

Si LÉO ne crée pas les devis et n'appelle pas les outils, suivez ce diagnostic étape par étape.

---

## ✅ ÉTAPE 1 : Vérifier la connexion des outils dans N8N

### Dans le workflow N8N :

1. **Ouvrez le nœud "AI Agent LÉO"**
2. **Regardez les connexions entrantes :**
   - Vous devriez voir une ligne **pointillée** (dashed line) venant de "Supabase Mcp"
   - Cette ligne doit être connectée à l'entrée **"Tool"** (pas "Input" ou "Output")
   - L'entrée "Tool" est généralement une entrée spéciale avec un pointillé

3. **Si la connexion n'existe pas ou est mal connectée :**
   - Déconnectez "Supabase Mcp" de "AI Agent LÉO"
   - Reconnectez-le en faisant glisser depuis "Supabase Mcp" vers l'entrée **"Tool"** de "AI Agent LÉO"
   - L'entrée "Tool" devrait être visible comme une entrée séparée (pointillée)

### Vérifier que les outils sont listés :

1. **Dans le nœud "AI Agent LÉO", allez dans l'onglet "Tools"** (ou "Outils")
2. **Vous devriez voir :**
   - ✅ `execute_sql` (venant de Supabase MCP)
   - ✅ `calculator`
   - ✅ `date`
   - ✅ `think`

3. **Si les outils ne sont pas listés :**
   - Les outils ne sont pas connectés correctement
   - Vérifiez la connexion "Tool" (voir ci-dessus)

---

## ✅ ÉTAPE 2 : Vérifier la configuration du nœud "Supabase Mcp"

### Dans le nœud "Supabase Mcp" :

1. **Endpoint :**
   ```
   https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr
   ```
   - ⚠️ Vérifiez que l'URL est complète avec `?project_ref=...`
   - ⚠️ Vérifiez que le `project_ref` est correct

2. **Server Transport :**
   - Doit être : `HTTP Streamable`

3. **Authentication :**
   - Type : `Bearer Auth`
   - Token : Votre Personal Access Token Supabase (commence par `sb_`)
   - ⚠️ PAS le `service_role` key
   - ⚠️ PAS le `anon` key

4. **Test de connexion :**
   - Exécutez le nœud "Supabase Mcp" seul (clic droit → "Execute Node")
   - Il devrait retourner la liste des outils disponibles
   - Si erreur → problème de configuration (endpoint ou token)

---

## ✅ ÉTAPE 3 : Test simple pour vérifier que LÉO voit les outils

### Test 1 : Demander à LÉO de lister les outils

**Message de test :**
```
Quels outils as-tu à ta disposition ? Liste-moi tous les outils disponibles.
```

**Attendu :**
- LÉO devrait lister `execute_sql`, `calculator`, `date`, `think`
- Si LÉO dit "Je n'ai pas d'outils" ou ne liste rien → les outils ne sont pas connectés

**Si LÉO ne liste pas les outils :**
- ❌ Les outils ne sont pas connectés correctement
- ❌ Vérifiez l'ÉTAPE 1 (connexion "Tool")

### Test 2 : Forcer LÉO à utiliser un outil

**Message de test :**
```
Utilise l'outil execute_sql pour exécuter cette requête : SELECT 1 as test;
```

**Attendu :**
- LÉO devrait appeler `execute_sql("SELECT 1 as test;")`
- Dans les logs N8N, vous devriez voir un appel à `execute_sql`

**Si LÉO ne l'appelle pas :**
- ❌ LÉO ne voit pas les outils
- ❌ Vérifiez l'ÉTAPE 1 et 2

---

## ✅ ÉTAPE 4 : Vérifier les logs N8N

### Pour voir si LÉO appelle les outils :

1. **Exécutez le workflow** avec un message de test
2. **Ouvrez les logs du nœud "AI Agent LÉO"**
3. **Cherchez :**
   - Des appels à `execute_sql`
   - Des appels à `tools/call`
   - Des messages comme "Calling tool execute_sql"

### Si vous ne voyez aucun appel d'outil :

- ❌ LÉO ne voit pas les outils disponibles
- ❌ Le prompt ne force peut-être pas assez l'utilisation
- ❌ Les outils ne sont pas correctement connectés

---

## ✅ ÉTAPE 5 : Vérifier le prompt système

### Dans le nœud "AI Agent LÉO" :

1. **Allez dans "Options" → "Message système"**
2. **Vérifiez que le prompt contient :**
   - ✅ Instructions explicites pour utiliser `execute_sql`
   - ✅ Règle #0 qui force l'utilisation des outils
   - ✅ Liste des étapes à exécuter avec `execute_sql`

3. **Utilisez le prompt optimal :**
   - Fichier : `docs/LEO_PROMPT_OPTIMAL.md`
   - Ce prompt commence par forcer l'utilisation des outils

---

## 🔍 Solutions selon le problème

### Problème 1 : Les outils ne sont pas listés dans "AI Agent LÉO" → "Tools"

**Solution :**
1. Vérifiez que "Supabase Mcp" est connecté à l'entrée "Tool" (pointillée)
2. Vérifiez la configuration du nœud "Supabase Mcp" (endpoint, token)
3. Exécutez "Supabase Mcp" seul pour tester la connexion
4. Si erreur → corrigez l'endpoint ou le token

### Problème 2 : Les outils sont listés mais LÉO ne les appelle pas

**Solution :**
1. Utilisez le prompt optimal qui force l'utilisation (`LEO_PROMPT_OPTIMAL.md`)
2. Testez avec le message : "Utilise execute_sql pour SELECT 1;"
3. Si LÉO ne l'appelle toujours pas → problème de prompt ou de modèle

### Problème 3 : LÉO dit "Je n'ai pas accès à cette fonctionnalité"

**Solution :**
- Les outils ne sont pas connectés
- Vérifiez l'ÉTAPE 1 (connexion "Tool")

---

## 📋 Checklist complète

- [ ] Le nœud "Supabase Mcp" est connecté à l'entrée "Tool" (pointillée) de "AI Agent LÉO"
- [ ] Les outils apparaissent dans "AI Agent LÉO" → "Tools" (`execute_sql`, `calculator`, etc.)
- [ ] L'endpoint MCP est complet : `https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr`
- [ ] Le token d'authentification est un Personal Access Token valide (commence par `sb_`)
- [ ] Le nœud "Supabase Mcp" fonctionne seul (test de connexion)
- [ ] Le prompt système contient la règle #0 qui force l'utilisation des outils
- [ ] Le test "Quels outils as-tu ?" fonctionne (LÉO liste les outils)
- [ ] Les logs N8N montrent des appels à `execute_sql` (ou pas)

---

## 🆘 Si rien ne fonctionne

1. **Partagez un screenshot** de :
   - La connexion entre "Supabase Mcp" et "AI Agent LÉO"
   - L'onglet "Tools" de "AI Agent LÉO"
   - Les logs du nœud "AI Agent LÉO"

2. **Testez avec ces messages :**
   - "Quels outils as-tu à ta disposition ?"
   - "Utilise execute_sql pour SELECT 1;"

3. **Vérifiez la version de N8N** (certaines versions ont des bugs avec les outils MCP)

---

**Fichiers de référence :**
- `docs/LEO_PROMPT_OPTIMAL.md` - Prompt qui force l'utilisation des outils
- `docs/N8N_VERIFIER_OUTILS.md` - Guide de vérification
- `docs/LEO_MCP_SUPABASE_GUIDE.md` - Guide complet MCP
















