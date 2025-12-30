# 🔧 Configuration N8N AI Agent pour forcer l'utilisation des outils

## 🚨 Problème : LÉO ne appelle pas les outils même s'ils sont connectés

Si les outils sont connectés mais LÉO ne les appelle pas, vérifiez ces paramètres dans N8N :

---

## ✅ ÉTAPE 1 : Vérifier "Max Iterations"

### Dans le nœud "AI Agent LÉO" :

1. **Ouvrez le nœud "AI Agent LÉO"**
2. **Allez dans l'onglet "Settings"** (ou "Paramètres")
3. **Cherchez "Max Iterations"** ou "Maximum Iterations"
4. **Vérifiez la valeur :**
   - ⚠️ Si c'est **10** ou moins → trop bas !
   - ✅ Mettez **20** ou **30** minimum
   - ✅ Pour les devis complexes, mettez **30-40**

**Pourquoi :** Si Max Iterations est trop bas, LÉO s'arrête avant d'avoir le temps d'appeler tous les outils.

---

## ✅ ÉTAPE 2 : Vérifier "Tool Choice"

### Dans le nœud "AI Agent LÉO" :

1. **Cherchez "Tool Choice"** ou "Tool Selection"
2. **Vérifiez la valeur :**
   - ✅ Doit être **"auto"** ou **"required"**
   - ❌ PAS **"none"** (cela empêche l'utilisation des outils)

**Si "Tool Choice" est sur "none" :**
- L'agent ne peut pas utiliser les outils
- Changez-le en **"auto"** ou **"required"**

---

## ✅ ÉTAPE 3 : Vérifier "Temperature"

### Dans le nœud "AI Agent LÉO" :

1. **Cherchez "Temperature"**
2. **Vérifiez la valeur :**
   - ✅ Recommandé : **0.7** à **1.0**
   - ❌ PAS trop bas (< 0.3) → l'agent peut être trop conservateur
   - ❌ PAS trop haut (> 1.5) → l'agent peut être trop créatif

**Pourquoi :** Une température trop basse peut rendre l'agent trop conservateur et l'empêcher d'utiliser les outils.

---

## ✅ ÉTAPE 4 : Vérifier "System Message"

### Dans le nœud "AI Agent LÉO" :

1. **Allez dans "Options" → "Message système"**
2. **Vérifiez que le prompt contient :**
   - ✅ Instructions explicites pour utiliser `execute_sql`
   - ✅ Règle #0 qui force l'utilisation des outils
   - ✅ Exemples concrets d'appels d'outils

3. **Utilisez le prompt optimal :**
   - Fichier : `docs/LEO_PROMPT_OPTIMAL.md`
   - Ce prompt force l'utilisation des outils

---

## ✅ ÉTAPE 5 : Vérifier les outils dans l'onglet "Tools"

### Dans le nœud "AI Agent LÉO" :

1. **Allez dans l'onglet "Tools"** (ou "Outils")
2. **Vérifiez que ces outils sont listés :**
   - ✅ `execute_sql` (Supabase MCP)
   - ✅ `calculator`
   - ✅ `date`
   - ✅ `think`

3. **Si les outils ne sont pas listés :**
   - Vérifiez la connexion "Tool" (voir guide de diagnostic)
   - Vérifiez la configuration du nœud "Supabase Mcp"

---

## ✅ ÉTAPE 6 : Test avec un message simple

### Test 1 : Forcer l'utilisation d'un outil

**Message de test :**
```
Utilise l'outil execute_sql pour exécuter cette requête : SELECT 1 as test;
```

**Attendu :**
- LÉO devrait appeler `execute_sql("SELECT 1 as test;")`
- Dans les logs N8N, vous devriez voir un appel à `execute_sql`

**Si LÉO ne l'appelle pas :**
- Vérifiez "Max Iterations" (ÉTAPE 1)
- Vérifiez "Tool Choice" (ÉTAPE 2)
- Vérifiez le prompt système (ÉTAPE 4)

---

## 📋 Configuration recommandée

### Pour le nœud "AI Agent LÉO" :

```
Settings:
  - Max Iterations: 30
  - Tool Choice: "auto" ou "required"
  - Temperature: 0.7 à 1.0
  - Timeout: 180 secondes
  - Retry on Error: true
  - Max Retries: 2
```

### Pour le nœud "Supabase Mcp" :

```
Configuration:
  - Endpoint: https://mcp.supabase.com/mcp?project_ref=zhemkkukhxspakxvrmlr
  - Server Transport: HTTP Streamable
  - Authentication: Bearer Auth
  - Bearer Token: Personal Access Token (commence par sb_)
```

---

## 🔍 Diagnostic : LÉO ne voit pas les outils

### Symptômes :
- LÉO dit "Je n'ai pas accès à cette fonctionnalité"
- LÉO dit "Je ne peux pas créer de devis"
- LÉO fait juste un résumé sans appeler les outils
- Les logs N8N ne montrent aucun appel à `execute_sql`

### Solutions :

1. **Vérifier "Max Iterations" :**
   - Augmentez à **30** minimum

2. **Vérifier "Tool Choice" :**
   - Mettez **"auto"** ou **"required"**

3. **Vérifier le prompt système :**
   - Utilisez `LEO_PROMPT_OPTIMAL.md`
   - Vérifiez que la RÈGLE #0 est présente

4. **Vérifier la connexion "Tool" :**
   - "Supabase Mcp" doit être connecté à l'entrée "Tool" (pointillée)
   - Les outils doivent apparaître dans "Tools"

---

## 🆘 Si rien ne fonctionne

1. **Partagez un screenshot** de :
   - Les "Settings" du nœud "AI Agent LÉO"
   - L'onglet "Tools" de "AI Agent LÉO"
   - Les logs du nœud "AI Agent LÉO"

2. **Testez avec ces messages :**
   - "Quels outils as-tu à ta disposition ?"
   - "Utilise execute_sql pour SELECT 1;"

3. **Vérifiez la version de N8N** (certaines versions ont des bugs)

---

**Fichiers de référence :**
- `docs/LEO_PROMPT_OPTIMAL.md` - Prompt qui force l'utilisation des outils
- `docs/N8N_DIAGNOSTIC_OUTILS.md` - Guide de diagnostic complet
- `docs/N8N_MAX_ITERATIONS_FIX.md` - Guide pour Max Iterations
















