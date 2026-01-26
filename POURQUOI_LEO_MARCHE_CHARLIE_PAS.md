# 🔍 Pourquoi LÉO fonctionne et CHARLIE pas ?

## ✅ LÉO fonctionne : Pourquoi ?

### 1. Session Key stable

**LÉO utilise :**
```
{{ $json.body.context.tenant_id }}
```

**Avantages :**
- ✅ Session Key **stable** (ne change jamais)
- ✅ Même session = même historique
- ✅ Pas de messages `tool` orphelins (la session est continue)

### 2. Historique propre

Avec une Session Key stable :
- Les messages `tool` sont toujours associés aux bons messages `assistant` avec `tool_calls`
- L'ordre est préservé
- Pas de corruption dans l'historique

### 3. Utilisation via leo-router

LÉO utilise `leo-router` (Edge Function) qui :
- Gère mieux les appels d'outils
- Peut avoir une meilleure gestion des erreurs
- Stocke peut-être les messages différemment

---

## ❌ CHARLIE ne fonctionne pas : Pourquoi ?

### 1. Session Key qui changeait (AVANT)

**CHARLIE utilisait (avant) :**
```
{{ $('extraction info').item.json.body.context.tenant_id }}-fresh-{{ $now.format('YYYYMMDDHHmm') }}
```

**Problèmes :**
- ❌ Session Key change **chaque minute** (`YYYYMMDDHHmm`)
- ❌ Nouvelle session = historique perdu
- ❌ Messages `tool` de l'ancienne session deviennent orphelins
- ❌ Quand l'historique est rechargé, les messages `tool` ne sont plus associés aux bons `tool_calls`

### 2. Messages tool orphelins

Quand la Session Key change :
1. CHARLIE appelle un outil (Code Tool) → message `assistant` avec `tool_calls`
2. Code Tool répond → message `tool`
3. **Session Key change** → nouvelle session créée
4. **Ancienne session** : messages `tool` sans `assistant` avec `tool_calls` précédent
5. **Erreur** : "messages with role 'tool' must be a response to a preceding message with 'tool_calls'"

### 3. Utilisation directe du Code Tool

CHARLIE utilise directement le Code Tool n8n (pas via Edge Function comme LÉO), ce qui peut :
- Stocker les messages `tool` différemment
- Avoir moins de gestion d'erreurs
- Créer plus facilement des messages orphelins

---

## ✅ Solution : Faire comme LÉO

### Étape 1 : Session Key stable (comme LÉO)

Dans n8n, configure la Session Key de "Memoire Charlie" **exactement comme LÉO** :

```
{{ $json.body.context.tenant_id }}
```

**Important :**
- ✅ **PAS de timestamp** (pas de `-fresh-{{ $now.format(...) }}`)
- ✅ **PAS de reset** dans la Session Key
- ✅ **Juste le tenant_id** → Session stable = comme LÉO

### Étape 2 : Nettoyer l'ancien historique corrompu

Si tu as accès à Postgres n8n, exécute :

```sql
-- Supprimer les messages 'tool' orphelins
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

---

## 📊 Comparaison LÉO vs CHARLIE

| Aspect | LÉO | CHARLIE (avant) | CHARLIE (après fix) |
|--------|-----|-----------------|---------------------|
| **Session Key** | Stable (`tenant_id`) | Changeait (timestamp) | Stable (`tenant_id`) ✅ |
| **Mémoire** | Postgres Chat Memory | Postgres Chat Memory | Postgres Chat Memory |
| **Outils** | leo-router (Edge Function) | Code Tool direct | Code Tool direct |
| **Erreur `tool`** | ❌ Non | ✅ Oui | ❌ Non (après fix) |
| **Historique** | ✅ Conservé | ❌ Perdu (nouvelle session) | ✅ Conservé |

---

## 🎯 Résumé

**Pourquoi LÉO fonctionne :**
1. ✅ Session Key stable → Pas de nouvelles sessions
2. ✅ Historique continu → Messages `tool` toujours associés
3. ✅ Pas de corruption dans l'historique

**Pourquoi CHARLIE ne fonctionnait pas :**
1. ❌ Session Key changeait → Nouvelles sessions
2. ❌ Messages `tool` orphelins dans anciennes sessions
3. ❌ Erreur quand l'historique est rechargé

**Solution :**
1. ✅ Utiliser la même Session Key que LÉO : `{{ $json.body.context.tenant_id }}`
2. ✅ Nettoyer les messages corrompus dans Postgres
3. ✅ CHARLIE fonctionnera comme LÉO

---

## 🚀 Action immédiate

**Dans n8n, modifie la Session Key de "Memoire Charlie" pour qu'elle soit identique à LÉO :**

```
{{ $json.body.context.tenant_id }}
```

**C'est exactement la même que LÉO** → CHARLIE fonctionnera comme LÉO !
