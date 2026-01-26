# ✅ Solution Finale : Garder Postgres + Accès à l'historique

## 🎯 Situation

- ✅ Tu veux garder ton nœud Postgres
- ✅ Tu veux accéder à tout l'historique des conversations précédentes
- ❌ Actuellement : erreur `tool` / `tool_calls` à cause de messages corrompus

**Important :** CHARLIE est appelé directement depuis n8n (pas depuis l'app), donc l'historique est **uniquement dans Postgres n8n**, pas dans Supabase.

---

## ✅ Solution : Session Key stable + Nettoyer Postgres

### Étape 1 : Garder Session Key stable (OBLIGATOIRE)

Dans n8n, configure la Session Key de "Memoire Charlie" :

```
{{ $json.body.context.tenant_id }}
```

**⚠️ CRITIQUE :** 
- **PAS de timestamp** (pas de `-reset-{{ $now.format(...) }}`)
- **PAS de reset** dans la Session Key
- **Juste le tenant_id** → Session stable = accès à tout l'historique

### Étape 2 : Nettoyer les messages corrompus dans Postgres

Si tu as accès à la base Postgres de n8n, exécute cette requête SQL :

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
- ✅ Messages corrompus supprimés
- ✅ Messages valides conservés
- ✅ Plus d'erreur `tool` / `tool_calls`
- ✅ Accès à tout l'historique (Session Key stable)

---

## 🔍 Si tu n'as pas accès à Postgres n8n

### Option A : Nettoyer toutes les sessions pour ton tenant

Si tu peux accéder à Postgres n8n mais que la requête ci-dessus ne fonctionne pas :

```sql
-- Supprimer toutes les sessions pour un tenant spécifique
DELETE FROM langchain_pg_messages 
WHERE session_id = '4370c96b-2fda-4c4f-a8b5-476116b8f2fc';
```

**⚠️ ATTENTION :** Cela supprime **tout** l'historique Postgres pour ce tenant, mais :
- ✅ Plus d'erreur
- ✅ Nouvelle session propre
- ✅ L'historique se reconstruira au fur et à mesure des nouvelles conversations

### Option B : Utiliser une Session Key avec reset temporaire

Si tu ne peux pas nettoyer Postgres :

1. **Utilise une Session Key avec reset** pour éviter l'erreur :
   ```
   {{ $json.body.context.tenant_id }}-reset-{{ $now.format('YYYYMMDD') }}
   ```

2. **L'historique sera perdu** pour cette session, mais :
   - ✅ Plus d'erreur
   - ✅ Nouvelle session propre
   - ✅ L'historique se reconstruira avec les nouvelles conversations

3. **Pour récupérer l'ancien historique** : Tu devras nettoyer Postgres plus tard quand tu auras accès.

---

## 📊 Comparaison des solutions

| Solution | Session Key | Accès historique | Erreur `tool` | Complexité |
|----------|-------------|-------------------|---------------|------------|
| **Stable + Nettoyer** | Stable (`tenant_id`) | ✅ Oui (après nettoyage) | ✅ Évitée | ⭐⭐ Moyen |
| **Stable + Tout supprimer** | Stable (`tenant_id`) | ❌ Non (supprimé) | ✅ Évitée | ⭐ Facile |
| **Reset temporaire** | Change (avec timestamp) | ❌ Non (nouvelle session) | ✅ Évitée | ⭐ Facile |

**Recommandation :** Si tu as accès à Postgres → **Stable + Nettoyer**. Sinon → **Reset temporaire** en attendant d'avoir accès.

---

## 🎯 Solution recommandée pour toi

### Si tu as accès à Postgres n8n :

1. **Session Key stable** : `{{ $json.body.context.tenant_id }}`
2. **Nettoyer seulement les messages corrompus** (requête SQL ci-dessus)
3. ✅ Accès à tout l'historique + plus d'erreur

### Si tu n'as pas accès à Postgres n8n :

1. **Session Key avec reset** : `{{ $json.body.context.tenant_id }}-reset-{{ $now.format('YYYYMMDD') }}`
2. ✅ Plus d'erreur
3. ⚠️ L'historique sera perdu pour cette session (mais se reconstruira)

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
   → CHARLIE doit se souvenir de Sophie Martin (si Session Key stable + nettoyage réussi)

3. **Test 3 : Vérifier l'historique dans Postgres**
   ```sql
   SELECT COUNT(*) FROM langchain_pg_messages 
   WHERE session_id = '4370c96b-2fda-4c4f-a8b5-476116b8f2fc';
   ```
   → Doit retourner un nombre > 0 si l'historique est conservé

---

## 💡 Important : Où est stocké l'historique ?

**CHARLIE :**
- ✅ Historique dans **Postgres n8n** (`langchain_pg_messages` table)
- ❌ **PAS** dans Supabase `messages` / `conversations` (CHARLIE est appelé directement depuis n8n)

**LÉO :**
- ✅ Historique dans **Supabase** (`messages` / `conversations` tables)
- ✅ Historique aussi dans **Postgres n8n** (si mémoire Postgres utilisée)

**Donc pour CHARLIE :** L'historique est **uniquement dans Postgres n8n**. C'est normal et c'est là qu'il doit être.

---

## 🚀 Action immédiate

1. **Dans n8n**, modifie la Session Key de "Memoire Charlie" :
   ```
   {{ $json.body.context.tenant_id }}
   ```
   (Sans timestamp, sans reset)

2. **Si tu as accès à Postgres n8n**, exécute la requête SQL de nettoyage

3. **Teste** avec un nouveau message

4. ✅ Si ça fonctionne → Problème résolu !
