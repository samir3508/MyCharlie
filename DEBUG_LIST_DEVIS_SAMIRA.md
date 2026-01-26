# 🔍 Debug : Pourquoi `list-devis` ne récupère pas les devis de Samira ?

## 📋 Problème identifié

L'utilisateur a signalé que CHARLIE n'arrive pas à récupérer les devis du client "Samira" après avoir trouvé le client avec `search-client`.

## ✅ Vérifications effectuées

### 1. Le client existe bien dans la base de données

```sql
SELECT id, nom_complet, email FROM clients 
WHERE nom_complet ILIKE '%samira%' OR prenom ILIKE '%samira%';
```

**Résultat :**
- ✅ Client trouvé : `Samira Bouzid`
- ✅ ID : `3b525de5-e68f-4a33-ac81-71bf4c7ed892`
- ✅ Email : `aslambekdaoud@gmail.com`

### 2. Le devis existe bien et est lié au client

```sql
SELECT d.id, d.numero, d.statut, d.client_id, c.nom_complet
FROM devis d
INNER JOIN clients c ON d.client_id = c.id
WHERE c.id = '3b525de5-e68f-4a33-ac81-71bf4c7ed892';
```

**Résultat :**
- ✅ Devis trouvé : `DV-2026-0001`
- ✅ ID devis : `2d4f399d-c111-40f6-9262-5d23d0e84e39`
- ✅ Statut : `brouillon`
- ✅ Montant : 290€ TTC
- ✅ Client ID correspond bien : `3b525de5-e68f-4a33-ac81-71bf4c7ed892`

### 3. Le code de `list-devis` semble correct

Le code dans `CODE_TOOL_N8N_COMPLET_FINAL.js` :
1. ✅ Cherche le client par nom (stratégies multiples : exacte, ilike, OR)
2. ✅ Si client trouvé, récupère les `client_id`
3. ✅ Cherche les devis avec `filters: { client_id: clientIds[0] }`
4. ✅ Utilise `supabaseRequest` qui construit correctement la requête

## 🔍 Hypothèses sur le problème

### Hypothèse 1 : CHARLIE n'appelle pas `list-devis`

**Symptôme :** CHARLIE trouve le client avec `search-client` mais ne fait pas le deuxième appel à `list-devis`.

**Solution :** Améliorer le prompt de CHARLIE pour être plus explicite sur l'ordre des appels.

### Hypothèse 2 : CHARLIE appelle `list-devis` avec un mauvais paramètre

**Symptôme :** CHARLIE appelle `list-devis` mais avec un paramètre incorrect (ex: `query` au lieu de `search`).

**Solution :** Le prompt a été mis à jour pour utiliser `search` dans le payload.

### Hypothèse 3 : Le filtre `client_id` ne fonctionne pas correctement

**Symptôme :** `list-devis` est appelé mais retourne 0 résultats même si des devis existent.

**Solution :** Ajout de logs de débogage dans le code pour voir ce qui se passe.

## ✅ Modifications apportées

### 1. Amélioration du prompt de CHARLIE

**Fichier :** `PROMPT_CHARLIE_FINAL_COMPLET.md`

**Changements :**
- ✅ Ajout d'étapes numérotées et explicites
- ✅ Instruction claire d'attendre la réponse de chaque étape
- ✅ Exemple détaillé avec les réponses réelles de l'API
- ✅ Rappel d'utiliser l'UUID (`id`) du devis, pas le `numero`

### 2. Ajout de logs de débogage

**Fichier :** `CODE_TOOL_N8N_COMPLET_FINAL.js`

**Changements :**
- ✅ Logs pour voir combien de clients sont trouvés
- ✅ Logs pour voir les `client_id` extraits
- ✅ Logs pour voir le résultat de la recherche de devis
- ✅ Logs pour vérifier si des données sont retournées

### 3. Exemple amélioré dans le prompt

**Fichier :** `PROMPT_CHARLIE_FINAL_COMPLET.md`

**Changements :**
- ✅ Exemple complet avec les vraies réponses de l'API
- ✅ Montre clairement l'UUID vs le numéro
- ✅ Montre la structure exacte des réponses

## 🧪 Tests à effectuer

### Test 1 : Vérifier que `list-devis` fonctionne directement

Dans n8n, tester directement :
```javascript
{
  action: "list-devis",
  payload: { search: "samira", limit: 10 },
  tenant_id: "4370c96b-2fda-4c4f-a8b5-476116b8f2fc"
}
```

**Résultat attendu :**
```json
{
  "success": true,
  "count": 1,
  "data": [{
    "id": "2d4f399d-c111-40f6-9262-5d23d0e84e39",
    "numero": "DV-2026-0001",
    "statut": "brouillon",
    "montant_ttc": 290.00,
    "clients": {
      "email": "aslambekdaoud@gmail.com"
    }
  }]
}
```

### Test 2 : Vérifier les logs dans n8n

Après avoir testé avec CHARLIE, vérifier les logs du nœud Code Tool pour voir :
1. Si `list-devis` est appelé
2. Si les clients sont trouvés
3. Si les devis sont trouvés
4. Les messages de log ajoutés

### Test 3 : Tester le workflow complet

1. Envoyer : "envoi a samira sont devis par email"
2. Vérifier que CHARLIE :
   - ✅ Appelle `search-client` avec "samira"
   - ✅ Appelle `list-devis` avec "samira"
   - ✅ Utilise l'UUID du devis (pas le numéro)
   - ✅ Appelle `envoyer-devis` avec l'UUID et l'email

## 📝 Instructions pour mettre à jour

1. **Mettre à jour le prompt de CHARLIE dans n8n** :
   - Copier le nouveau prompt depuis `PROMPT_CHARLIE_FINAL_COMPLET.md`
   - Remplacer le System Message du nœud "CHARLIE - Agent Commercial & Administratif"

2. **Mettre à jour le Code Tool dans n8n** :
   - Copier le code depuis `CODE_TOOL_N8N_COMPLET_FINAL.js`
   - Remplacer le code du nœud Code Tool

3. **Tester** :
   - Envoyer : "envoi a samira sont devis par email"
   - Vérifier les logs
   - Vérifier que le devis est bien envoyé

## 🎯 Résultat attendu

Quand l'utilisateur dit "envoi a samira sont devis par email" :

1. ✅ CHARLIE appelle `search-client` avec "samira"
2. ✅ CHARLIE trouve Samira Bouzid avec son email
3. ✅ CHARLIE appelle `list-devis` avec "samira"
4. ✅ CHARLIE trouve le devis DV-2026-0001 (UUID: `2d4f399d-c111-40f6-9262-5d23d0e84e39`)
5. ✅ CHARLIE appelle `envoyer-devis` avec l'UUID et l'email
6. ✅ Le devis est envoyé par email

**Aucune demande d'email ne doit être faite à l'utilisateur !**

---

**Date :** 25 janvier 2026  
**Statut :** En attente de test
