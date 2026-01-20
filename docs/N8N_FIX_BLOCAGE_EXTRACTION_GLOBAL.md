# 🔧 Correction du Blocage du Nœud "Extraction info global"

## 🐛 Problème Identifié

Le nœud **"Extraction info global"** reste bloqué et charge indéfiniment. Cela empêche le workflow de fonctionner correctement et toutes les demandes sont liées au même tenant.

### Causes identifiées :

1. **`$('Code in JavaScript')` bloque** : Le nœud "Extraction info global" utilise `$('Code in JavaScript')` qui peut bloquer si le nœud précédent n'a pas terminé ou s'il y a un problème avec la référence
2. **Le nœud "Code in JavaScript" ne trouve pas le tenant** : Le tenant_id est vide dans la sortie, probablement à cause de :
   - Variable d'environnement `SUPABASE_SERVICE_ROLE_KEY` non configurée
   - Syntaxe PostgREST incorrecte pour les wildcards
3. **Le tenant_id n'est pas propagé dans le flux** : Les données passent par plusieurs nœuds avant d'arriver à "Extraction info global"

## ✅ Solutions

### 1. Corriger le nœud "Extraction info global" (PRIORITAIRE)

**Fichier** : `/Users/adam/Appli BB LEO copie/my-leo-saas/docs/N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js`

**Changements principaux** :
- ✅ **SUPPRESSION de `$('Code in JavaScript')`** qui peut bloquer
- ✅ Utilise uniquement `$input.all()` pour récupérer les données
- ✅ Plus robuste et ne bloque plus

**À faire** :
1. Ouvrir le workflow N8N
2. Sélectionner le nœud **"Extraction info global"**
3. Remplacer tout le code par le contenu du fichier `N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js` (version mise à jour)
4. Sauvegarder

### 2. Corriger le nœud "Code in JavaScript" (PRIORITAIRE)

**Fichier** : `/Users/adam/Appli BB LEO copie/my-leo-saas/docs/N8N_CODE_DETECTER_TENANT_WHATSAPP_SIMPLIFIE.js`

**Changements principaux** :
- ✅ Syntaxe PostgREST corrigée : utilise `%25` (encodage URL de `%`) pour les wildcards
- ✅ Clé service role en fallback si `$env` n'est pas disponible
- ✅ Recherche exacte d'abord, puis wildcard
- ✅ Gestion d'erreurs améliorée

**À faire** :
1. Ouvrir le workflow N8N
2. Sélectionner le nœud **"Code in JavaScript"**
3. Remplacer tout le code par le contenu du fichier `N8N_CODE_DETECTER_TENANT_WHATSAPP_SIMPLIFIE.js`
4. Sauvegarder

### 3. Vérifier la variable d'environnement (OBLIGATOIRE)

**Dans n8n** :
1. Aller dans **Settings > Environment Variables**
2. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configurée avec la valeur :
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1NjYzNywiZXhwIjoyMDgzODMyNjM3fQ.3OR8IDsOtr8g854NlVOM_Lp1kuJhuKIuo8zNZGM4Fuo
   ```
3. Si elle n'existe pas, l'ajouter
4. Redémarrer le workflow après modification

**⚠️ Note** : Le code simplifié inclut un fallback avec la clé directement dans le code, mais il est préférable d'utiliser la variable d'environnement.

## 🔍 Vérification dans Supabase

Le numéro WhatsApp `33745108883` correspond au tenant :
- **ID** : `4370c96b-2fda-4c4f-a8b5-476116b8f2fc`
- **Company Name** : `nos artisan`
- **whatsapp_phone** : `+33745108883`
- **phone** : `0745108567`

## 📋 Checklist de Vérification

### Avant de tester :

- [x] ✅ Pas besoin de variable d'environnement (clé directement dans le code)
- [ ] Le nœud "Code in JavaScript" est placé **AVANT** "Extraction info global" dans le flux
- [ ] Les numéros WhatsApp sont bien enregistrés dans la table `tenants` (colonnes `whatsapp_phone` ou `phone`)

### Après les modifications :

1. **Tester avec le numéro `33745108883`** :
   - Le nœud "Code in JavaScript" doit loguer : `✅ Tenant trouvé: nos artisan (4370c96b-2fda-4c4f-a8b5-476116b8f2fc)`
   - Le nœud "Extraction info global" doit loguer : `✅ Tenant_id trouvé dans context: 4370c96b-2fda-4c4f-a8b5-476116b8f2fc`
   - Le nœud ne doit **PAS** bloquer

2. **Vérifier les logs** :
   - Si vous voyez `🔑 Utilisation de la clé service role directement dans le code` → ✅ La clé est bien utilisée
   - Si vous voyez `⚠️ Aucun tenant_id trouvé dans le contexte précédent !` → Le nœud "Code in JavaScript" n'a pas détecté le tenant
   - Si vous voyez `✅ Tenant trouvé` → ✅ Le tenant est bien détecté
   - Si le nœud bloque toujours → Vérifier que vous avez bien supprimé `$('Code in JavaScript')`

3. **Vérifier la sortie** :
   - Dans la sortie de "Extraction info global", `context.tenant_id` doit être `4370c96b-2fda-4c4f-a8b5-476116b8f2fc` (pas vide, pas le fallback)
   - Le nœud doit se terminer rapidement (pas de blocage)

## 🎯 Comment Lier Chaque Demande au Bon Client/Tenant

### Workflow Correct :

1. **WhatsApp Trigger** → Reçoit le message avec le numéro WhatsApp (`33745108883`)

2. **Code in JavaScript** → 
   - Extrait le numéro WhatsApp
   - Cherche le tenant dans Supabase avec ce numéro
   - Place le `tenant_id` dans `context.tenant_id`
   - **Sortie** : `{ context: { tenant_id: "4370c96b-2fda-4c4f-a8b5-476116b8f2fc", ... } }`

3. **Extraction du type** → Passe les données (avec `context.tenant_id`)

4. **Switch Audio ou Text** → Passe les données (avec `context.tenant_id`)

5. **Edit Fields** → Passe les données (avec `context.tenant_id`)

6. **Extraction info global** → 
   - Récupère le `tenant_id` depuis `$input.all()` (pas de `$()` qui bloque)
   - Place le `tenant_id` dans `body.context.tenant_id`
   - **Sortie** : `{ body: { context: { tenant_id: "4370c96b-2fda-4c4f-a8b5-476116b8f2fc", ... } } }`

7. **AI Agent** → Utilise le `tenant_id` pour toutes les opérations (création client, devis, etc.)

### Points Critiques :

- ✅ **Le `tenant_id` doit être propagé dans TOUT le flux** : Chaque nœud doit passer le `tenant_id` au suivant
- ✅ **Le nœud "Code in JavaScript" doit trouver le tenant** : Sinon, tous les messages seront sans tenant
- ✅ **Le nœud "Extraction info global" ne doit PAS bloquer** : Utiliser uniquement `$input.all()`, pas `$()`

## 🚨 Points Critiques

1. **✅ Pas besoin de variable d'environnement** : La clé service role est directement dans le code
   - Le code utilise la clé hardcodée : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Fonctionne même sans compte payant n8n
   - Pas besoin d'aller dans Settings > Environment Variables

2. **Ordre des nœuds** : Le nœud "Code in JavaScript" doit être **AVANT** "Extraction info global"

3. **Format des numéros** : Les numéros dans Supabase doivent être au format :
   - `+33745108883` (avec +33)
   - `0745108883` (format français)
   - `33745108883` (sans le +)

4. **Ne pas utiliser `$()` qui bloque** : Utiliser uniquement `$input.all()` dans "Extraction info global"

## 📝 Notes Techniques

### Syntaxe PostgREST pour les wildcards :

- `column=ilike.value` → Recherche exacte (case-insensitive)
- `column=ilike.%25value%25` → `LIKE '%value%'` (contient la valeur) - `%25` est l'encodage URL de `%`
- `column=eq.value` → Égalité exacte

### Pourquoi `$('Code in JavaScript')` bloque :

Dans n8n, `$()` peut accéder à n'importe quel nœud précédent, mais :
- Si le nœud n'a pas terminé, cela peut bloquer
- Si le nœud a une erreur, cela peut bloquer
- Si le nœud n'est pas directement connecté dans le flux, cela peut bloquer

**Solution** : Utiliser uniquement `$input.all()` qui récupère les données du nœud précédent directement connecté.

## 🎯 Résultat Attendu

Après les corrections :
- ✅ Le nœud "Extraction info global" ne bloque plus
- ✅ Chaque numéro WhatsApp détecte automatiquement son tenant
- ✅ Plus de fallback hardcodé
- ✅ Les logs montrent clairement quel tenant est détecté
- ✅ Le workflow utilise le bon `tenant_id` pour toutes les opérations
- ✅ Chaque demande est liée au bon client/tenant selon le numéro WhatsApp
