# 🔧 Correction : Séparer les sessions par utilisateur/conversation dans N8N

## ❌ Problème identifié

**Tous les messages sont associés au même `tenant_id` comme `session_id`, ce qui mélange toutes les conversations.**

Actuellement :
- N8N utilise `{{ $json.body.context.tenant_id }}` comme **Session ID** dans Postgres Supa
- Résultat : Toutes les conversations d'un même tenant partagent la même session
- Conséquence : Les messages de différents utilisateurs/conversations sont mélangés

---

## ✅ Solution : Utiliser `sessionId` unique de N8N

### Pourquoi utiliser `sessionId` ?

- ✅ **Unique par conversation** : N8N génère un `sessionId` unique pour chaque conversation
- ✅ **Par utilisateur** : Chaque utilisateur a son propre `sessionId`
- ✅ **Par canal** : Web et WhatsApp ont des `sessionId` différents
- ✅ **Déjà disponible** : `$json.sessionId` est automatiquement fourni par N8N Chat Trigger

---

## 📋 Correction à apporter dans N8N

### 1. Modifier le nœud "Postgres Supa"

**❌ Configuration actuelle (incorrecte) :**
```
Clé : {{ $json.body.context.tenant_id }}
Session ID : {{ $json.body.context.tenant_id }}
```

**✅ Configuration corrigée :**
```
Clé : {{ $json.body.context.tenant_id }}
Session ID : {{ $json.sessionId }}
```

**Explication :**
- **Clé** = `tenant_id` : Permet l'isolation par tenant (sécurité RLS)
- **Session ID** = `sessionId` : Permet de séparer les conversations par utilisateur

---

### 2. Vérifier que `tenant_id` est bien dans le message JSON

Le `tenant_id` doit toujours être présent dans `message.context.tenant_id` pour que le trigger SQL puisse l'extraire automatiquement.

**Dans les nœuds de formatage (Format Text/Audio Message) :**
```javascript
context: {
  tenant_id: input.context?.tenant_id || input.body?.tenant_id || "",
  // ... autres champs
}
```

---

## 🔍 Comment ça fonctionne maintenant

### Flux de données :

1. **N8N Chat Trigger** reçoit un message
   - `$json.sessionId` = UUID unique par conversation (ex: `"chat-abc123"`)
   - `$json.body.context.tenant_id` = UUID du tenant (ex: `"97c62509-..."`)

2. **Postgres Supa** sauvegarde l'historique
   - **Clé** = `tenant_id` (pour RLS et isolation)
   - **Session ID** = `sessionId` (pour séparer les conversations)

3. **Trigger SQL** extrait automatiquement `tenant_id`
   - Lit `message.context.tenant_id` depuis le JSON
   - Remplit la colonne `tenant_id` de la table

4. **Politiques RLS** filtrent par `tenant_id`
   - Chaque utilisateur voit uniquement les conversations de son tenant
   - `session_id` sépare les conversations au sein du même tenant

---

## 📊 Résultat attendu

### Avant (problème) :
```
Session ID: "97c62509-84ff-4e87-8ba9-c3095b7fd30f" (tenant_id)
├── Message 1 (Utilisateur A)
├── Message 2 (Utilisateur B)
├── Message 3 (Utilisateur A)
└── Message 4 (Utilisateur C)
→ Tout mélangé ! ❌
```

### Après (corrigé) :
```
Tenant: "97c62509-84ff-4e87-8ba9-c3095b7fd30f"
├── Session: "chat-userA-conv1"
│   ├── Message 1 (Utilisateur A)
│   └── Message 2 (Utilisateur A)
├── Session: "chat-userB-conv1"
│   ├── Message 1 (Utilisateur B)
│   └── Message 2 (Utilisateur B)
└── Session: "chat-userA-conv2"
    └── Message 1 (Utilisateur A, nouvelle conversation)
→ Chaque conversation est séparée ! ✅
```

---

## 🔒 Sécurité maintenue

Les politiques RLS garantissent que :
- ✅ Chaque utilisateur voit uniquement les conversations de son tenant
- ✅ Impossible d'accéder aux conversations d'autres tenants
- ✅ L'isolation multi-tenant est préservée

---

## 🧪 Test

1. **Envoyer un message depuis l'application web**
   - Vérifier que `sessionId` est unique (ex: `"chat-abc123"`)
   - Vérifier que `tenant_id` est correct dans le contexte

2. **Envoyer un autre message depuis une autre session**
   - Le `sessionId` doit être différent (ex: `"chat-xyz789"`)
   - Les deux messages doivent avoir le même `tenant_id` mais des `session_id` différents

3. **Vérifier dans Supabase** :
```sql
SELECT 
  session_id,
  tenant_id,
  COUNT(*) as message_count
FROM n8n_chat_histories
WHERE tenant_id = '97c62509-84ff-4e87-8ba9-c3095b7fd30f'
GROUP BY session_id, tenant_id
ORDER BY message_count DESC;
```

**Résultat attendu :**
- Plusieurs `session_id` différents
- Tous avec le même `tenant_id`
- Chaque `session_id` a son propre nombre de messages

---

## ⚠️ Notes importantes

1. **Le `tenant_id` reste obligatoire** dans le contexte pour la sécurité RLS
2. **Le `sessionId` ne doit JAMAIS être utilisé pour la sécurité** (il peut être manipulé)
3. **Les anciennes données** avec `session_id = tenant_id` continueront de fonctionner grâce au trigger SQL qui extrait `tenant_id` depuis le JSON

---

## 📝 Migration des données existantes

Les données existantes ont été mises à jour :
- ✅ `tenant_id` extrait depuis `message.context.tenant_id`
- ✅ Pour les `session_id` qui sont des UUID tenant valides, le `tenant_id` a été défini

Les anciennes sessions avec `session_id = tenant_id` continueront de fonctionner mais ne seront plus créées.

---

## 🎯 Résumé

**Changement unique à faire dans N8N :**
- **Postgres Supa** → **Session ID** : `{{ $json.sessionId }}` au lieu de `{{ $json.body.context.tenant_id }}`
- **Clé** : Garder `{{ $json.body.context.tenant_id }}` (pour RLS)

**Résultat :**
- ✅ Chaque conversation a sa propre session
- ✅ Les conversations sont séparées par utilisateur
- ✅ L'isolation multi-tenant est préservée
- ✅ L'historique est correctement organisé
