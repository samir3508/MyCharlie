# Fix : Statut dossier, prochaine action et mémoire après envoi de créneaux

## Problèmes

1. **Statut dossier** : Quand on envoie un email au client avec des créneaux pour organiser un RDV, le statut du dossier ne change pas.
2. **Prochaine action** : « Aucune action urgente requise » s’affiche alors qu’on devrait voir « En attente de confirmation du client ».
3. **Mémoire** : L’IA ne se souvient pas bien des messages précédents (ex. redemande de créer un devis alors qu’on vient d’envoyer les créneaux).

---

## Corrections appliquées

### 1. Prochaine action – « En attente confirmation client »

**Fichier :** `src/components/dossiers/prochaine-action.tsx`

- Nouveau cas : si le dossier a le statut **`rdv_planifie`** et au moins un **RDV planifié** (aucun confirmé) → **« En attente de confirmation client »** avec description du type « Créneaux envoyés – RDV prévu le … En attente du clic du client sur le lien ».
- Bouton « Voir RDV » ou « Agenda RDV » selon le cas.

Pour que ce cas s’affiche, il faut que **le statut soit à jour** et qu’il existe **au moins un RDV planifié** quand on envoie les créneaux (voir § 2).

### 2. Statut dossier quand on envoie les créneaux

Aujourd’hui, l’envoi des créneaux (email avec liens) **ne crée pas de RDV** en base et **ne met pas à jour le dossier**. D’où le statut qui ne bouge pas et la prochaine action inadaptée.

**À faire côté n8n / workflow :**

Quand MyCharlie / LÉO **envoie les créneaux** au client :

1. **Créer un dossier** s’il n’y en a pas (client sans dossier).
2. **Créer un RDV** (`create-rdv`) avec :
   - `dossier_id`, `client_id`
   - `date_heure` = premier créneau envoyé (ou créneau « représentatif »)
   - `statut: 'planifie'`
   - `titre` du type « Visite – attente confirmation client »
3. Le hook `use-rdv` met déjà à jour le dossier en **`rdv_planifie`** à la création d’un RDV avec `statut: 'planifie'`.

Résultat : **statut → `rdv_planifie`**, **prochaine action → « En attente de confirmation client »**.

Quand le client clique sur le lien → `/api/confirm-creneau` crée le RDV confirmé, met le dossier en **`rdv_confirme`**, et la prochaine action passe à « Préparer la visite ».

### 3. Mémoire / contexte chat

**Côté app :** `src/app/api/leo/chat/route.ts`

- Une **conversation par jour** (`whatsapp_phone: todayDate`).
- Les **20 derniers messages** sont chargés et envoyés à LÉO via `history` dans `mcpClient.chat()`.

Donc l’historique **est bien envoyé**. Si l’IA « oublie » :

- Vérifier que le **workflow n8n** (ou MCP) utilise bien le `history` dans l’appel au modèle.
- Augmenter `MAX_HISTORY_LENGTH` (ex. 30) si les conversations sont longues.
- Vérifier **taille du contexte** et **prompt** côté n8n pour ne pas couper ou ignorer l’historique.

---

## Récap

| Élément | Où | Action |
|--------|-----|--------|
| Prochaine action « En attente confirmation » | `prochaine-action.tsx` | ✅ Déjà corrigé |
| Statut dossier à l’envoi de créneaux | n8n / Code Tool | Créer RDV + dossier si besoin, `statut: 'planifie'` |
| Mémoire | Chat API + n8n | Historique envoyé ; vérifier usage dans n8n, éventuellement augmenter `MAX_HISTORY_LENGTH` |

---

## Déploiement UI (Fiches, etc.)

Les changements **Fiches** (onglet enrichi, type, urgence, constat, lien) et **Prochaine action** sont dans le front Next.js.

Pour les voir en prod :

1. **Commit + push** (dossier `my-leo-saas`).
2. **Render** : déploiement auto ou manuel.
3. Vérifier sur **https://mycharlie.fr** :
   - Onglet **Fiches** d’un dossier : date, type, urgence, constat, lien vers la fiche.
   - **Prochaine action** : « En attente de confirmation client » quand RDV planifié sans confirmation.

Si tu ne vois pas le nouveau design, c’est que la version déployée sur Render n’inclut pas encore ces commits.
