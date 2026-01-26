# 🔧 Instructions : Mise à jour du prompt CHARLIE dans n8n

## 🎯 Problème résolu

CHARLIE demandait l'email au lieu de le chercher automatiquement quand l'utilisateur disait "envoi a samira sont devis par email".

## ✅ Solution

Ajout d'une règle dans le prompt de CHARLIE pour qu'il cherche automatiquement :
1. Le client (avec `search-client`)
2. Les devis du client (avec `list-devis`)
3. L'email du client (dans les données du client trouvé)

## 📝 Instructions pour mettre à jour dans n8n

### Étape 1 : Ouvrir le workflow n8n

1. Aller dans n8n
2. Ouvrir le workflow qui contient le nœud "CHARLIE - Agent Commercial & Administratif"
3. Cliquer sur le nœud "CHARLIE - Agent Commercial & Administratif"

### Étape 2 : Mettre à jour le System Message

1. Dans les paramètres du nœud, trouver le champ "System Message"
2. Chercher la section `## 🚨🚨🚨 WORKFLOW ENVOI EMAIL - RÈGLE ABSOLUE 🚨🚨🚨`
3. Remplacer cette section par le contenu suivant :

```markdown
## 🚨🚨🚨 WORKFLOW ENVOI EMAIL - RÈGLE ABSOLUE 🚨🚨🚨

### ⚠️ CRITIQUE : `envoyer-devis` envoie DIRECTEMENT l'email via Gmail

**`envoyer-devis` envoie maintenant l'email directement depuis la boîte Gmail de l'utilisateur connecté.**

### ⚠️ RÈGLE CRITIQUE : CHERCHER AUTOMATIQUEMENT LE CLIENT ET SON EMAIL

**Si l'utilisateur demande d'envoyer un devis avec seulement le nom du client (sans email ni numéro de devis), TU DOIS :**

1. **Chercher automatiquement le client** avec `search-client` :
   ```javascript
   {
     action: "search-client",
     payload: { query: "nom_du_client" },
     tenant_id: "..."
   }
   ```

2. **Si client trouvé, chercher ses devis** avec `list-devis` :
   ```javascript
   {
     action: "list-devis",
     payload: { search: "nom_du_client", limit: 10 },
     tenant_id: "..."
   }
   ```

3. **Si plusieurs devis trouvés** :
   - Afficher la liste des devis avec leurs numéros et statuts
   - Demander à l'utilisateur quel devis envoyer
   - OU utiliser le devis le plus récent si l'utilisateur n'a pas précisé

4. **Si un seul devis trouvé OU devis spécifié** :
   - Utiliser l'email du client trouvé (client.email)
   - Appeler `envoyer-devis` avec le devis_id (UUID) et l'email du client

**❌ NE JAMAIS demander l'email si le client est trouvé dans la base de données !**

**✅ TOUJOURS chercher le client et son email automatiquement avant de demander !**

### Workflow simplifié :

**ÉTAPE 0 : Si seulement le nom du client est fourni (SANS email ni numéro de devis)**

```javascript
// 1. Chercher le client
{
  action: "search-client",
  payload: { query: "nom_du_client" },
  tenant_id: "..."
}

// 2. Chercher les devis du client
{
  action: "list-devis",
  payload: { search: "nom_du_client", limit: 10 },
  tenant_id: "..."
}

// 3. Si devis trouvé, utiliser l'email du client et l'UUID du devis
```

**ÉTAPE 1 : Appeler `envoyer-devis`**

```javascript
{
  action: "envoyer-devis",
  payload: {
    devis_id: "DV-2026-0002",  // ou UUID (OBLIGATOIRE)
    recipient_email: "client@example.com"  // optionnel, utilise l'email du client si non fourni
  },
  tenant_id: "97c62509-84ff-4e87-8ba9-c3095b7fd30f"
}
```

**Ce que fait `envoyer-devis` :**
1. ✅ Récupère le devis complet avec les infos client
2. ✅ Compose le message email (sujet + corps HTML)
3. ✅ Télécharge le PDF du devis
4. ✅ **Envoie l'email via l'API Gmail** (utilise la connexion Gmail de l'utilisateur)
5. ✅ Met à jour automatiquement le statut du devis (`envoye`) et `date_envoi`
```

### Étape 3 : Ajouter l'exemple dans la section des exemples

1. Chercher la section `### Exemple 2 : Envoi de devis`
2. Ajouter après cette section :

```markdown
### Exemple 2B : Envoi de devis (SANS email, recherche automatique) ⚠️

```
User: "envoi a samira sont devis par email"

Charlie:
[Appel search-client avec query: "samira"]
[Appel list-devis avec search: "samira"]

✅ J'ai trouvé Samira Bouzid et son devis DV-2026-0001.

[Appel envoyer-devis avec devis_id: "UUID-du-devis", recipient_email: "aslambekdaoud@gmail.com"]

✅ Email envoyé avec succès !

📄 Document : Devis DV-2026-0001
👤 Destinataire : Samira Bouzid (aslambekdaoud@gmail.com)
💰 Montant : 290€ TTC
📧 Envoyé depuis : votre-email@gmail.com

Le client recevra un email avec le PDF en pièce jointe.
```

**⚠️ IMPORTANT :**
- Si plusieurs devis trouvés → Afficher la liste et demander lequel envoyer
- Si un seul devis trouvé → L'envoyer automatiquement avec l'email du client
- Si aucun devis trouvé → Informer l'utilisateur qu'aucun devis n'existe pour ce client
- Si client non trouvé → Demander si l'utilisateur veut créer le client d'abord
```

### Étape 4 : Sauvegarder et tester

1. Sauvegarder le workflow n8n
2. Tester avec : "envoi a samira sont devis par email"
3. Vérifier que CHARLIE :
   - Cherche automatiquement le client "Samira"
   - Trouve le devis DV-2026-0001
   - Utilise l'email du client (aslambekdaoud@gmail.com)
   - Envoie le devis sans demander l'email

## 📋 Checklist

- [ ] Section "WORKFLOW ENVOI EMAIL" mise à jour avec la règle de recherche automatique
- [ ] Exemple 2B ajouté dans la section des exemples
- [ ] Workflow sauvegardé dans n8n
- [ ] Test effectué avec "envoi a samira sont devis par email"
- [ ] CHARLIE cherche automatiquement le client et son email
- [ ] CHARLIE envoie le devis sans demander l'email

## 🎯 Résultat attendu

Quand l'utilisateur dit "envoi a samira sont devis par email", CHARLIE doit :
1. ✅ Chercher automatiquement le client "Samira" avec `search-client`
2. ✅ Chercher les devis de Samira avec `list-devis`
3. ✅ Utiliser l'email du client trouvé (aslambekdaoud@gmail.com)
4. ✅ Envoyer le devis avec `envoyer-devis` sans demander l'email

**Date de mise à jour :** 25 janvier 2026
