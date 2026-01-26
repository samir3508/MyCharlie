# 🚨 Fix Rapide : Erreur Mémoire CHARLIE

## ❌ Erreur actuelle

```
Bad request - please check your parameters
Invalid parameter: messages with role 'tool' must be a response to a preceding message with 'tool_calls'.
```

**Cause :** La mémoire Postgres de CHARLIE stocke les messages `tool` dans un format incompatible avec l'API OpenAI.

---

## ✅ Solution immédiate (5 minutes)

### Étape 1 : Ouvrir le workflow n8n

1. Va dans n8n
2. Ouvre le workflow qui contient **CHARLIE - Agent Commercial & Administratif**
3. Trouve le nœud **Memoire Charlie** (Postgres Chat Memory)

### Étape 2 : Remplacer par Window Buffer Memory

1. **Supprime ou déconnecte** le nœud **Memoire Charlie** (Postgres)
2. **Ajoute** un nœud **Window Buffer Memory** (cherche "Window Buffer" dans les nœuds)
3. **Configure** :
   - **Session Key** : `{{ $json.body.context.tenant_id }}`
   - **Buffer Size** : `20` (ou 10-30 selon tes besoins)
4. **Connecte** ce nœud à CHARLIE en **ai_memory** (même connexion que l'ancienne mémoire)

### Étape 3 : Vérifier la Session Key

**Important :** La Session Key doit être **exactement** :
```
{{ $json.body.context.tenant_id }}
```

Si ton workflow utilise un autre format pour le tenant_id, adapte :
- `{{ $json.context.tenant_id }}`
- `{{ $json.body.context.tenant_id }}-whatsapp-{{ $json.body.context.whatsapp_phone }}`

**Comment vérifier :**
- Clique sur le nœud Window Buffer Memory
- Regarde l'onglet "Input" ou "Data"
- Vérifie que la Session Key contient bien un UUID (ex: `4370c96b-2fda-4c4f-a8b5-476116b8f2fc`)

### Étape 4 : Tester

1. Sauvegarde le workflow
2. Teste avec un message simple : "liste mes clients"
3. Si ça fonctionne → ✅ Problème résolu !

---

## 🎯 Résultat

- ✅ Plus d'erreur `tool` / `tool_calls`
- ✅ Mémoire par tenant (chaque artisan a son historique)
- ✅ CHARLIE se souvient des conversations récentes (20 derniers messages)

**Limite :** La mémoire est perdue au redémarrage de n8n (mais ça fonctionne entre les redémarrages).

---

## 🔍 Si ça ne fonctionne pas

### Vérification 1 : Session Key vide

**Symptôme :** La mémoire ne fonctionne pas, CHARLIE ne se souvient de rien.

**Solution :** Vérifie que `$json.body.context.tenant_id` contient bien une valeur. Si non, adapte la Session Key selon ton workflow.

### Vérification 2 : Erreur persiste

**Symptôme :** L'erreur `tool` / `tool_calls` revient.

**Solution :** 
1. Vérifie que l'ancienne mémoire Postgres est bien **déconnectée**
2. Vérifie que la Window Buffer Memory est bien connectée en **ai_memory**
3. Redémarre n8n si nécessaire

### Vérification 3 : Pas de mémoire du tout

**Symptôme :** CHARLIE ne se souvient de rien entre les messages.

**Solution :**
1. Vérifie que la Window Buffer Memory est bien connectée
2. Vérifie que la Session Key est correcte
3. Augmente le Buffer Size (ex: 30 au lieu de 20)

---

## 📝 Alternative : Pas de mémoire

Si tu veux juste supprimer l'erreur sans mémoire :

1. **Déconnecte** complètement la mémoire Postgres
2. **Ne connecte aucune mémoire** à CHARLIE
3. ✅ Plus d'erreur, mais CHARLIE n'aura pas de mémoire

**Note :** Ton app stocke déjà les messages dans Supabase, donc tu peux toujours récupérer l'historique depuis l'app si besoin.

---

## 🚀 Prochaines étapes (optionnel)

Si tu veux une **persistence** entre redémarrages n8n :

1. Utilise l'historique depuis ton app (Supabase `messages` / `conversations`)
2. Passe l'historique dans le trigger n8n
3. Utilise un **Chat Memory Manager** pour injecter l'historique
4. Garde CHARLIE sans mémoire n8n (ou avec Window Buffer)

Voir `FIX_CHARLIE_MEMOIRE_POSTGRES.md` pour plus de détails.
