# ✅ Garder Postgres + Accès à l'historique complet

## ⚠️ Problème avec Session Key qui change

Si tu utilises une Session Key avec timestamp :
```
{{ $json.body.context.tenant_id }}-reset-{{ $now.format('YYYYMMDD') }}
```

**Résultat :**
- ✅ Plus d'erreur `tool` / `tool_calls`
- ❌ **Pas d'accès à l'ancien historique** (nouvelle session = historique vide)

---

## ✅ Solution : Session Key stable + Nettoyer Postgres

### Option 1 : Session Key stable + Nettoyer seulement les messages corrompus (RECOMMANDÉ)

**Étape 1 : Garder une Session Key stable**

Dans n8n, configure la Session Key de "Memoire Charlie" :

```
{{ $json.body.context.tenant_id }}
```

**Pas de timestamp, pas de reset** → Session stable = accès à tout l'historique.

**Étape 2 : Nettoyer seulement les messages corrompus dans Postgres**

Si tu as accès à la base Postgres de n8n, exécute cette requête SQL pour supprimer uniquement les messages `tool` mal formatés :

```sql
-- Supprimer les messages 'tool' orphelins (sans 'tool_calls' précédent)
WITH tool_messages AS (
  SELECT 
    id,
    session_id,
    idx,
    content::jsonb->>'role' as role,
    LAG(content::jsonb->>'role') OVER (PARTITION BY session_id ORDER BY idx) as prev_role,
    LAG(content::jsonb->'tool_calls') OVER (PARTITION BY session_id ORDER BY idx) as prev_tool_calls
  FROM langchain_pg_messages
  WHERE content::jsonb->>'role' = 'tool'
)
DELETE FROM langchain_pg_messages
WHERE id IN (
  SELECT id FROM tool_messages
  WHERE prev_role != 'assistant' OR prev_tool_calls IS NULL
);
```

**Résultat :**
- ✅ Session Key stable = accès à tout l'historique
- ✅ Messages corrompus supprimés = plus d'erreur
- ✅ Historique propre conservé

---

### Option 2 : Utiliser l'historique depuis l'app (Supabase) au lieu de Postgres

Ton app stocke déjà les messages dans Supabase (`messages` et `conversations` tables) **par tenant**. Tu peux utiliser cet historique au lieu de Postgres n8n.

**Avantages :**
- ✅ Historique complet depuis Supabase (pas limité à Postgres n8n)
- ✅ Pas de problème avec les messages `tool` (l'app ne stocke que user/assistant)
- ✅ Persistence garantie (Supabase est ta source de vérité)

**Comment faire :**

1. **Désactiver la mémoire Postgres** de CHARLIE (ou la déconnecter)
2. **Utiliser l'historique depuis l'app** :
   - L'app envoie déjà l'historique dans le trigger n8n (voir `src/app/api/leo/chat/route.ts`)
   - L'historique est dans `body.context.history` ou similaire
   - Utiliser un **Chat Memory Manager** pour injecter cet historique

**Note :** Cette solution nécessite de modifier le workflow n8n pour utiliser l'historique depuis l'app au lieu de Postgres.

---

### Option 3 : Session Key stable + Nettoyer toutes les sessions (si nettoyage partiel ne suffit pas)

Si l'Option 1 ne fonctionne pas, tu peux nettoyer toutes les sessions pour un tenant spécifique :

```sql
-- Supprimer toutes les sessions pour un tenant spécifique
DELETE FROM langchain_pg_messages 
WHERE session_id = '4370c96b-2fda-4c4f-a8b5-476116b8f2fc';
```

**⚠️ ATTENTION :** Cela supprime **tout** l'historique Postgres pour ce tenant. Mais l'historique reste disponible dans Supabase (`messages` table).

**Résultat :**
- ✅ Session Key stable = nouvelle session propre
- ✅ Plus d'erreur
- ✅ L'historique reste dans Supabase (ton app peut le récupérer)

---

## 🎯 Solution recommandée pour toi

### Étape 1 : Garder Session Key stable

Dans n8n, configure la Session Key de "Memoire Charlie" :

```
{{ $json.body.context.tenant_id }}
```

**Important :** Pas de timestamp, pas de reset → Session stable.

### Étape 2 : Nettoyer Postgres (si tu as accès)

Si tu as accès à la base Postgres de n8n, exécute la requête SQL de l'Option 1 pour supprimer seulement les messages corrompus.

### Étape 3 : Si pas d'accès à Postgres

Si tu n'as pas accès à la base Postgres de n8n :

1. **Utilise une Session Key avec reset** (comme avant) pour éviter l'erreur
2. **L'historique reste disponible dans Supabase** : ton app stocke déjà tous les messages dans `messages` et `conversations` tables
3. **Pour récupérer l'historique** : utilise l'API de ton app qui récupère l'historique depuis Supabase

---

## 📊 Comparaison

| Solution | Session Key | Accès historique Postgres | Accès historique Supabase | Erreur `tool` |
|----------|-------------|---------------------------|---------------------------|---------------|
| **Option 1** | Stable | ✅ Oui (après nettoyage) | ✅ Oui | ✅ Évitée |
| **Option 2** | N/A | ❌ Non (Postgres désactivé) | ✅ Oui (depuis app) | ✅ Évitée |
| **Option 3** | Stable | ❌ Non (nettoyé) | ✅ Oui | ✅ Évitée |
| **Avec reset** | Change | ❌ Non (nouvelle session) | ✅ Oui | ✅ Évitée |

---

## 💡 Important : Ton app stocke déjà l'historique

**Ton app (Next.js) stocke déjà tous les messages dans Supabase :**

- Table `messages` : Tous les messages (user + assistant)
- Table `conversations` : Les conversations par tenant
- L'historique est récupéré dans `src/app/api/leo/chat/route.ts` (ligne 165-178)

**Donc même si Postgres n8n est nettoyé ou réinitialisé, l'historique reste disponible depuis Supabase.**

---

## 🚀 Recommandation finale

**Si tu as accès à Postgres n8n :**
1. Garde Session Key stable : `{{ $json.body.context.tenant_id }}`
2. Nettoie seulement les messages corrompus (Option 1)
3. ✅ Accès à tout l'historique + plus d'erreur

**Si tu n'as pas accès à Postgres n8n :**
1. Utilise Session Key avec reset pour éviter l'erreur
2. L'historique reste dans Supabase (ton app le gère)
3. Pour récupérer l'historique, utilise l'API de ton app

---

## 🔍 Vérification

Après avoir appliqué la solution :

1. **Test 1 : Nouveau message**
   ```
   "liste mes clients"
   ```
   → Doit fonctionner sans erreur

2. **Test 2 : Conversation avec mémoire**
   ```
   Message 1: "crée un client Sophie Martin"
   Message 2: "fais lui un devis"
   ```
   → CHARLIE doit se souvenir de Sophie Martin

3. **Test 3 : Historique depuis Supabase**
   - Vérifie dans Supabase que les messages sont bien stockés dans `messages` table
   - L'historique est disponible même si Postgres n8n est réinitialisé
