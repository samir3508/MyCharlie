# 🔧 Intégration : Détecter le Tenant depuis WhatsApp dans n8n

## 🎯 Objectif

Ajouter un nœud **Code** qui détecte automatiquement le `tenant_id` à partir du numéro WhatsApp qui envoie le message, au lieu d'utiliser un tenant hardcodé.

## 📋 Structure du Workflow Modifié

```
[Chat Trigger]
    ↓
[Find Tenant by WhatsApp Phone] ← NOUVEAU NŒUD
    ↓
[Check Message Type]
    ↓
[Format Text/Audio Message]
    ↓
... (reste du workflow)
```

## ✅ Étapes d'Intégration

### Étape 1 : Ajouter le nœud Code

1. **Ouvrez votre workflow n8n** dans l'éditeur
2. **Déconnectez** temporairement le "Check Message Type" du "Chat Trigger"
3. **Ajoutez un nœud Code** entre le "Chat Trigger" et "Check Message Type"
   - Cliquez sur le "+" à côté du "Chat Trigger"
   - Cherchez "Code" dans les nœuds
   - Sélectionnez **"Code"**

### Étape 2 : Configurer le nœud Code

**Nom du nœud :** `Find Tenant by WhatsApp Phone`

**Code JavaScript :** Copiez le code depuis `docs/N8N_CODE_DETECTER_TENANT_WHATSAPP.js`

Ou collez directement ce code :

```javascript
// Code complet disponible dans docs/N8N_CODE_DETECTER_TENANT_WHATSAPP.js
```

### Étape 3 : Connecter les nœuds

1. **Connectez** : Chat Trigger → Find Tenant by WhatsApp Phone
2. **Connectez** : Find Tenant by WhatsApp Phone → Check Message Type

### Étape 4 : Vérifier la configuration Supabase

**IMPORTANT :** Le code utilise `$env.SUPABASE_SERVICE_ROLE_KEY` pour accéder à Supabase.

1. Dans n8n, allez dans **Settings** → **Environment Variables**
2. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configuré
3. Si ce n'est pas le cas, ajoutez-le :
   ```
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_supabase
   ```

## 🔍 Comment ça fonctionne ?

### 1. Extraction du numéro WhatsApp

Le code essaie plusieurs chemins pour trouver le numéro :
- `input.From`
- `input.body.From`
- `input.contacts[0].wa_id`
- `input.body.contacts[0].wa_id`
- `input.body.from`
- `input.body.metadata.phone`

### 2. Nettoyage du numéro

Le numéro est nettoyé pour :
- Enlever les préfixes (`whatsapp:`, `tel:`, etc.)
- Enlever les espaces et caractères spéciaux
- Normaliser le format (ajouter `+33` si numéro français)

**Exemples :**
- `whatsapp:+33612345678` → `+33612345678`
- `0612345678` → `+33612345678`
- `33612345678` → `+33612345678`

### 3. Recherche dans Supabase

Le code cherche le tenant dans la table `tenants` en utilisant :
- Le champ `whatsapp_phone`
- Le champ `phone`

Il essaie plusieurs variations du numéro pour maximiser les chances de trouver.

### 4. Ajout au contexte

Si un tenant est trouvé, le `tenant_id` est ajouté à `context.tenant_id` et passé au reste du workflow.

## 🧪 Test

### Test 1 : Vérifier que le nœud fonctionne

1. **Envoyez un message WhatsApp** depuis un numéro lié à un tenant
2. **Ouvrez l'exécution du workflow** dans n8n
3. **Cliquez sur le nœud "Find Tenant by WhatsApp Phone"**
4. **Vérifiez les logs** :
   - ✅ `Numéro WhatsApp extrait: ...`
   - ✅ `Numéro nettoyé: ...`
   - ✅ `Tenant trouvé: [nom] ([id])` OU `Tenant détecté: [nom] ([id])`

### Test 2 : Vérifier que le tenant_id est passé

1. **Ouvrez le nœud suivant** (Check Message Type ou Format Text Message)
2. **Vérifiez les données d'entrée** :
   ```json
   {
     "context": {
       "tenant_id": "uuid-du-tenant",  ← Doit être présent !
       "tenant_name": "Nom de l'entreprise",
       "tenant_found": true,
       "whatsapp_phone_cleaned": "+33612345678"
     }
   }
   ```

### Test 3 : Vérifier avec plusieurs tenants

1. **Envoyez un message depuis un numéro WhatsApp différent** (tenant différent)
2. **Vérifiez que le bon `tenant_id` est détecté**

## ⚠️ Dépannage

### Problème : Le tenant n'est pas trouvé

**Causes possibles :**

1. **Le numéro WhatsApp n'est pas dans la base de données**
   - Vérifiez dans Supabase que le tenant a bien un `whatsapp_phone` ou `phone` configuré
   - Exécutez : `SELECT id, company_name, whatsapp_phone, phone FROM tenants;`

2. **Le format du numéro ne correspond pas**
   - Vérifiez les logs du nœud pour voir le numéro nettoyé
   - Vérifiez dans Supabase le format exact du numéro stocké

3. **La variable d'environnement `SUPABASE_SERVICE_ROLE_KEY` n'est pas configurée**
   - Vérifiez dans Settings → Environment Variables

### Problème : Le workflow utilise toujours le même tenant

**Vérifications :**

1. Le nœud "Find Tenant by WhatsApp Phone" est bien **placé après le Chat Trigger** et **avant Check Message Type**
2. Le nœud est bien **connecté** (flèches vertes)
3. Le code a bien été copié sans erreurs

### Problème : Erreur dans le nœud Code

**Vérifications :**

1. Le code JavaScript est correct (pas d'erreur de syntaxe)
2. La variable `$env.SUPABASE_SERVICE_ROLE_KEY` existe dans n8n
3. L'URL Supabase est correcte dans le code : `https://lawllirgeisuvanbvkcr.supabase.co`

## 📊 Logs et Debugging

Le code génère des logs dans la console n8n :

- `📱 Numéro WhatsApp extrait:` - Le numéro brut extrait
- `🧹 Numéro nettoyé:` - Le numéro après nettoyage
- `🔍 Recherche tenant avec:` - Chaque variation du numéro testée
- `✅ Tenant trouvé:` - Tenant trouvé avec succès
- `⚠️ Aucun tenant trouvé` - Aucun tenant trouvé avec le numéro

**Pour voir les logs :**
1. Ouvrez l'exécution du workflow
2. Cliquez sur le nœud "Find Tenant by WhatsApp Phone"
3. Regardez les logs en bas de l'écran

## 🔄 Mise à jour des autres nœuds

Une fois le nœud "Find Tenant by WhatsApp Phone" ajouté, les nœuds suivants peuvent utiliser :

```javascript
const tenantId = input.context?.tenant_id || '';
```

Au lieu de :

```javascript
const tenantId = input.context?.tenant_id || 'f117dc59-1cef-41c3-91a3-8c12d47f6bfb';
```

## ✅ Résultat attendu

Après l'intégration, chaque message WhatsApp devrait automatiquement :
1. ✅ Détecter le numéro WhatsApp de l'expéditeur
2. ✅ Chercher le tenant correspondant dans Supabase
3. ✅ Passer le bon `tenant_id` au reste du workflow
4. ✅ Chaque tenant reçoit les bonnes données (clients, devis, factures, etc.)

---

**Fichiers associés :**
- `docs/N8N_CODE_DETECTER_TENANT_WHATSAPP.js` - Code complet du nœud
- `docs/N8N_DETECTER_TENANT_WHATSAPP.md` - Documentation technique détaillée
