# ✅ Garder Postgres : Solutions pour éviter l'erreur `tool` / `tool_calls`

## 🎯 Objectif

Garder ton nœud **Postgres Chat Memory** tout en évitant l'erreur :
```
Invalid parameter: messages with role 'tool' must be a response to a preceding message with 'tool_calls'.
```

---

## ✅ Solution 1 : Réinitialiser la Session Key (RECOMMANDÉ - 2 minutes)

### Pourquoi ça fonctionne

En changeant la Session Key, tu crées une **nouvelle session** qui ignore l'ancien historique corrompu. L'historique corrompu reste dans Postgres mais n'est plus utilisé.

### Étapes

1. **Ouvrir n8n** et ton workflow avec CHARLIE
2. **Cliquer sur le nœud "Memoire Charlie"** (Postgres Chat Memory)
3. **Modifier la Session Key** :

**Avant :**
```
{{ $json.body.context.tenant_id }}
```

**Après (Option A - Session par tenant + reset) :**
```
{{ $json.body.context.tenant_id }}-reset-{{ $now.format('YYYYMMDD') }}
```

**Après (Option B - Session unique par jour) :**
```
{{ $json.body.context.tenant_id }}-{{ $now.format('YYYY-MM-DD') }}
```

**Après (Option C - Session fixe pour forcer le nettoyage) :**
```
charlie-memory-clean-2026
```

4. **Sauvegarder** le workflow
5. **Tester** avec un nouveau message

### Résultat

- ✅ Postgres gardé
- ✅ Nouvelle session créée (ignore l'ancien historique corrompu)
- ✅ Mémoire par tenant conservée (si tu utilises `tenant_id` dans la Session Key)
- ✅ Plus d'erreur `tool` / `tool_calls`

**Note :** L'ancien historique reste dans Postgres mais n'est plus utilisé. Tu peux le nettoyer plus tard si besoin.

---

## ✅ Solution 2 : Nettoyer les sessions corrompues dans Postgres (si accès DB)

Si tu as accès à la base de données Postgres de n8n :

### Étape 1 : Identifier la table

La table utilisée par Postgres Chat Memory est généralement :
- `langchain_pg_messages` (nom par défaut)
- Ou le nom que tu as configuré dans le nœud Postgres Chat Memory

### Étape 2 : Nettoyer les sessions CHARLIE

```sql
-- Option A : Supprimer toutes les sessions pour un tenant spécifique
DELETE FROM langchain_pg_messages 
WHERE session_id LIKE '%4370c96b-2fda-4c4f-a8b5-476116b8f2fc%';

-- Option B : Supprimer toutes les sessions CHARLIE (si tu utilises un préfixe)
DELETE FROM langchain_pg_messages 
WHERE session_id LIKE '%charlie%' OR session_id LIKE '%CHARLIE%';

-- Option C : Supprimer toutes les sessions (⚠️ ATTENTION : supprime TOUT l'historique)
TRUNCATE TABLE langchain_pg_messages;
```

### Étape 3 : Vérifier

```sql
-- Vérifier qu'il ne reste plus de sessions
SELECT DISTINCT session_id FROM langchain_pg_messages;
```

### Étape 4 : Tester dans n8n

1. Envoie un nouveau message
2. Vérifie que l'erreur ne se reproduit plus

---

## ✅ Solution 3 : Utiliser Chat Memory Manager pour filtrer (AVANCÉ)

Si tu veux garder Postgres mais filtrer les messages `tool` problématiques :

### Configuration

1. **Ajouter un nœud "Chat Memory Manager"** avant CHARLIE
2. **Configurer** :
   - **Memory** : Connecter ton nœud Postgres Chat Memory
   - **Operation** : `Get Messages` ou `Load Messages`
   - **Filter** : Filtrer les messages `tool` si possible
3. **Connecter** le Chat Memory Manager à CHARLIE

**Note :** Cette solution est plus complexe et peut ne pas complètement résoudre le problème si le format des messages est corrompu.

---

## ✅ Solution 4 : Mettre à jour n8n (si possible)

Si tu utilises une version ancienne de n8n, essaie de mettre à jour :

1. **Vérifier ta version** : Settings → About
2. **Mettre à jour** vers la dernière version si possible
3. Les versions récentes de n8n gèrent parfois mieux les `tool_calls`

**Note :** Cette solution ne garantit pas la résolution du problème, mais peut aider.

---

## 🔍 Vérification après fix

### Test 1 : Message simple

```
"liste mes clients"
```

**Résultat attendu :** CHARLIE liste les clients sans erreur.

### Test 2 : Action avec tool

```
"crée un devis pour Martin Dupont"
```

**Résultat attendu :** CHARLIE crée le devis en appelant les outils sans erreur.

### Test 3 : Conversation avec mémoire

```
Message 1: "crée un client Sophie Martin"
Message 2: "fais lui un devis"
```

**Résultat attendu :** CHARLIE se souvient de Sophie Martin dans le message 2.

---

## 📋 Comparaison des solutions

| Solution | Complexité | Persistence | Par tenant | Temps |
|----------|------------|-------------|------------|-------|
| **1. Réinitialiser Session Key** | ⭐ Facile | ✅ Oui | ✅ Oui | 2 min |
| **2. Nettoyer Postgres** | ⭐⭐ Moyen | ✅ Oui | ✅ Oui | 5-10 min |
| **3. Chat Memory Manager** | ⭐⭐⭐ Complexe | ✅ Oui | ✅ Oui | 15-30 min |
| **4. Mettre à jour n8n** | ⭐ Facile | ✅ Oui | ✅ Oui | Variable |

**Recommandation :** Commence par la **Solution 1** (réinitialiser Session Key). C'est la plus simple et la plus rapide.

---

## ⚠️ Si l'erreur revient

Si l'erreur revient après avoir appliqué une solution :

1. **Vérifier la Session Key** : Assure-toi qu'elle est bien configurée et retourne une valeur
2. **Vérifier la version de n8n** : Mettre à jour si possible
3. **Nettoyer complètement Postgres** : Utiliser la Solution 2 pour supprimer toutes les sessions
4. **En dernier recours** : Basculer temporairement sur Window Buffer Memory (voir `FIX_MEMOIRE_CHARLIE_RAPIDE.md`)

---

## 🎯 Solution recommandée pour toi

**Étape 1 : Réinitialiser la Session Key (2 minutes)**

Dans n8n, modifie la Session Key de "Memoire Charlie" :

```
{{ $json.body.context.tenant_id }}-reset-{{ $now.format('YYYYMMDD') }}
```

Cela créera une nouvelle session par jour, ce qui :
- ✅ Garde Postgres
- ✅ Évite l'erreur (nouvelle session = pas d'historique corrompu)
- ✅ Conserve la mémoire par tenant
- ✅ Permet la persistence

**Étape 2 : Si l'erreur persiste**

Nettoyer Postgres avec la Solution 2 (si tu as accès à la DB).

---

## 📝 Notes importantes

1. **L'ancien historique reste dans Postgres** : Il n'est juste plus utilisé. Tu peux le nettoyer plus tard si besoin.

2. **Session Key doit être stable** : Si tu utilises `tenant_id`, assure-toi qu'il ne change pas entre les messages.

3. **Test après chaque changement** : Vérifie toujours que l'erreur ne se reproduit plus après avoir modifié la configuration.

4. **Backup avant nettoyage** : Si tu nettoies Postgres (Solution 2), fais un backup avant si possible.
