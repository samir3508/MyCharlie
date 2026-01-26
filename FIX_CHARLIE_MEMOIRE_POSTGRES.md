# Fix : CHARLIE + mémoire Postgres → "messages with role 'tool' must be a response to a preceding message with 'tool_calls'"

## Erreur

```
Bad request - please check your parameters
Invalid parameter: messages with role 'tool' must be a response to a preceding message with 'tool_calls'.
```

Elle apparaît dans le nœud **CHARLIE - Agent Commercial & Administratif** quand une **mémoire Postgres** (Postgres Chat Memory) est connectée en `ai_memory`.

---

## Cause

1. CHARLIE utilise des **outils** (Code Tool : `search-client`, `list-devis`, `envoyer-devis`, etc.). Le modèle envoie des `tool_calls`, reçoit des réponses `role: 'tool'`.
2. La **mémoire Postgres** enregistre tout l’historique, y compris ces messages `tool` et les réponses des outils.
3. Lors d’un **nouveau tour**, n8n recharge l’historique depuis Postgres et l’envoie au modèle (OpenAI, etc.).
4. L’API exige qu’**un message `role: 'tool'` soit toujours immédiatement après un message `assistant` contenant `tool_calls`**, avec les bons `tool_call_id`.  
   Si l’ordre est faux, qu’un message `assistant` avec `tool_calls` a été tronqué, ou que le format stocké ne correspond pas, on obtient cette erreur.

C’est un **problème connu** avec Postgres Chat Memory + agents qui appellent des outils (tool calling) dans n8n.

---

## Obligatoire : mémoire par tenant (par artisan)

La mémoire doit être **séparée par tenant** : chaque artisan a son propre historique. Sinon, les messages des uns et des autres se mélangent.

**Dans toute mémoire (Window Buffer, Postgres, etc.) :**

- **Session Key** = `tenant_id` (ou équivalent selon ton workflow).
- Le `tenant_id` doit venir du **contexte** du message (ex. `body.context.tenant_id`), pas d’un timestamp ni d’une valeur qui change à chaque message.

**Exemples selon ton trigger :**

- Webhook / API qui envoie le message :
  - Session Key : `{{ $json.body.context.tenant_id }}`
- Chat Trigger n8n + détection tenant :
  - Session Key : `{{ $json.body?.context?.tenant_id || $json.context?.tenant_id }}`
- WhatsApp :
  - Session Key : `{{ $json.body.context.tenant_id }}-whatsapp-{{ $json.body.context.whatsapp_phone }}`  
  (ou simplement `tenant_id` si un artisan = un numéro.)

**À vérifier :** le nœud en amont (formatage, détection tenant) doit bien remplir `context.tenant_id` pour que la mémoire soit bien **par artisan**.

---

## Solutions (en gardant mémoire par tenant)

### 1. Window Buffer Memory + Session Key = tenant_id (recommandé)

La **Window Buffer Memory** ne garde en général que les échanges **user / assistant** (texte), pas les messages `tool` ni `tool_calls`. Plus de conflit avec l’API, tout en gardant **un historique par tenant**.

**À faire :**

1. Ouvrir le workflow n8n (Manager, CHARLIE, etc.).
2. Supprimer ou déconnecter le nœud **Memoire Charlie** (Postgres Chat Memory) relié à CHARLIE.
3. Ajouter un nœud **Window Buffer Memory**.
4. **Session Key** : `{{ $json.body.context.tenant_id }}` (ou l’expression qui donne le `tenant_id` dans ton workflow).  
   → Chaque artisan a sa propre fenêtre de messages.
5. Connecter ce nœud à CHARLIE en **ai_memory** à la place de la Postgres.
6. Régler la **taille du buffer** (ex. 10–20 derniers messages).

**Résultat :** pas d’erreur `tool` / `tool_calls`, et **récupération des messages par tenant**.  
**Limite :** la Window Buffer est en mémoire n8n ; elle est perdue au redémarrage de n8n. Entre deux redémarrages, l’historique par artisan est bien conservé.

---

### 2. Pas de mémoire pour CHARLIE

1. Déconnecter **Memoire Charlie** (Postgres) du nœud CHARLIE.
2. Ne connecter **aucune** mémoire en `ai_memory` pour CHARLIE.

Plus d’erreur, mais CHARLIE n’a plus de mémoire du tout. On ne **récupère** plus les messages côté n8n.

---

### 3. Postgres + persistence : contourner l’erreur et garder « par tenant »

Si tu veux **garder Postgres** (persistence) et **récupérer les messages par tenant** :

- **Session Key** Postgres = `tenant_id` (comme ci‑dessus), pour que la mémoire reste **par artisan**.
- En l’état, Postgres + CHARLIE (avec outils) provoque l’erreur `tool` / `tool_calls`.

**Contournement possible :**

1. **Vider** les anciennes sessions CHARLIE dans la table utilisée par Postgres Chat Memory (pour supprimer les séquences `tool` mal formatées).
2. En parallèle, **tester** si une **version récente de n8n** (ou du nœud Postgres Chat Memory) gère mieux les `tool_calls`.  
3. Si l’erreur revient : **basculer CHARLIE sur Window Buffer** (Session Key = `tenant_id`) comme en §1. La « récupération des messages par artisan » se fait alors via la Window Buffer, par tenant, tant que n8n tourne.

---

### 4. Historique depuis ton app (Supabase) + aucun stockage outil en n8n

Ton app stocke déjà les messages dans Supabase (`messages`, `conversations`) **par tenant**.

- Tu peux faire en sorte que le **trigger** n8n (webhook, etc.) reçoive un **historique** pré‑rempli (ex. derniers N messages user/assistant **sans** `tool`), en plus du message courant.
- Le workflow utilise cet historique (p.ex. via **Chat Memory Manager** ou un nœud custom qui pousse ces messages dans le contexte).
- CHARLIE est configuré **sans mémoire** (ou avec une mémoire qui n’enregistre pas les outils).

Comme ça, la **récupération des messages par tenant** se fait depuis ton app ; n8n ne stocke pas de `tool` / `tool_calls`, donc plus d’erreur.  
Cela demande d’adapter le trigger et éventuellement un nœud “mémoire” custom.

---

## Récapitulatif

| Option | Mémoire | Par tenant | Persistence | Erreur `tool` |
|--------|---------|------------|-------------|----------------|
| 1 | **Window Buffer**, Session Key = `tenant_id` | Oui | Non (perdue au restart n8n) | Évitée |
| 2 | **Aucune** | – | – | Évitée |
| 3 | **Postgres**, Session Key = `tenant_id` | Oui | Oui | Risque (connu) |
| 4 | **Historique depuis l’app** (Supabase), pas de mémoire outil | Oui | Oui (dans ton app) | Évitée |

En résumé : pour **récupérer les messages par tenant / par artisan** tout en supprimant l’erreur, utilise la **Window Buffer** avec **Session Key = tenant_id** (§1). Si tu veux en plus de la **persistence** entre redémarrages n8n, il faut passer par l’**historique fourni par ton app** (§4).
