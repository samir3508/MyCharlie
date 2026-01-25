# Fix anti-boucle – Workflow My Team V1 (n8n)

Le workflow tournait en rond pendant plus de 2 minutes car le **Manager** (ou Charlie/Léo) rappelait des outils en boucle au lieu de s’arrêter après une réponse.

## 1. Limiter les itérations du Manager (obligatoire)

1. Ouvre le workflow **My Team V1** dans n8n.
2. Clique sur le nœud **AI Agent** (Manager).
3. Onglet **Settings** (roue dentée) ou **Options**.
4. Trouve **Max Iterations** (ou **Max iterations**).
5. Mets **8** (ou 10 max).  
   – Par défaut c’est 10. Si tu l’avais augmenté, redescends à 8–10.  
   – Ça force un stop même si le modèle veut continuer à appeler des outils.

## 2. Renforcer le prompt du Manager – règle STOP

Dans le **System Message** du nœud **AI Agent** (Manager), ajoute ce bloc **tout en haut**, juste après la ligne « RÈGLE ABSOLUE » :

```
🛑 LIMITE ANTI-BOUCLE – À RESPECTER EN PREMIER
• Tu n’appelles qu’UN SEUL outil (Charlie OU Léo) par message utilisateur.
• Dès que Charlie ou Léo te renvoie sa réponse, tu la retransmets telle quelle à l’utilisateur et tu t’arrêtes.
• Tu ne rappelles jamais un outil. Tu n’appelles pas les deux agents. Tu n’ajoutes pas de texte avant/après.
• Si tu as déjà reçu la réponse de l’outil → tu l’affiches et tu stop. Aucun nouvel appel.
```

Tu peux le coller tel quel en préambule du system message actuel.

## 3. Mettre à jour le Code Tool (Charlie et Léo)

Le fichier `CODE_TOOL_N8N_COMPLET_FINAL.js` a été corrigé (bloc dupliqué « RÉCUPÉRATION ET VALIDATION » supprimé).

1. Ouvre `CODE_TOOL_N8N_COMPLET_FINAL.js` dans ton projet.
2. Copie tout le contenu.
3. Dans n8n, ouvre le **Code Tool** de **CHARLIE** (sous-agent) → remplace le code par ce nouveau contenu.
4. Fais de même pour le **Code Tool1** de **LÉO** (même code pour les deux).

## 4. Vérifier les sous-agents (Charlie, Léo)

Si les nœuds **CHARLIE** et **LÉO** (Agent Tool) ont une option **Max Iterations** :

- Mets **12** (ou 15 max) pour chacun.  
- Ça permet quelques appels d’outils (ex. search-client → create-devis → …) sans boucle infinie.

## 5. Connexions mémoire

- **Memoire Charlie** : doit être connectée en **ai_memory** au nœud **CHARLIE**.  
  Dans ton export, elle pointait vers `[]` ; reconnecte-la au sous-agent Charlie.
- **Memoire Manager** : reste connectée au **Manager** (AI Agent).

## Résumé des changements

| Élément | Action |
|--------|--------|
| Manager | Max Iterations = 8 |
| Manager | Ajout du bloc STOP en tête du system message |
| Code Tool (Charlie + Léo) | Remplacer par `CODE_TOOL_N8N_COMPLET_FINAL.js` à jour |
| Charlie / Léo | Max Iterations = 12 si l’option existe |
| Memoire Charlie | Connectée à CHARLIE |

Après ces modifications, relance une exécution (ex. un message WhatsApp). Si ça tourne encore trop longtemps, vérifie l’exécution en **Debug** pour voir quel nœud boucle (Manager vs Charlie vs Léo).
