# 🔧 Correction de la Détection du Tenant dans N8N

## 🐛 Problème Identifié

Le workflow N8N lie tous les utilisateurs au même tenant (`97c62509-84ff-4e87-8ba9-c3095b7fd30f`) au lieu de détecter le tenant correct selon le numéro WhatsApp.

### Causes identifiées :

1. **Nœud "Code in JavaScript"** : Utilise `$http.get` qui n'existe pas dans n8n → doit utiliser `this.helpers.httpRequest`
2. **Nœud "Extraction info global"** : Utilise un fallback hardcodé au lieu de récupérer le tenant détecté
3. **Syntaxe PostgREST** : La requête Supabase utilise une syntaxe incorrecte pour les wildcards

## ✅ Solutions

### 1. Corriger le nœud "Code in JavaScript"

**Fichier** : `/Users/adam/Appli BB LEO copie/my-leo-saas/docs/N8N_CODE_DETECTER_TENANT_WHATSAPP_CORRIGE.js`

**Changements principaux** :
- ✅ Utilise `this.helpers.httpRequest` au lieu de `$http.get`
- ✅ Syntaxe PostgREST corrigée : `ilike.*value*` pour les wildcards
- ✅ Recherche exacte d'abord, puis avec wildcards
- ✅ Gestion robuste des variations de numéros (avec/sans +33, avec/sans +)

**À faire** :
1. Ouvrir le workflow N8N
2. Sélectionner le nœud **"Code in JavaScript"**
3. Remplacer tout le code par le contenu du fichier `N8N_CODE_DETECTER_TENANT_WHATSAPP_CORRIGE.js`
4. Sauvegarder

### 2. Corriger le nœud "Extraction info global"

**Fichier** : `/Users/adam/Appli BB LEO copie/my-leo-saas/docs/N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js`

**Changements principaux** :
- ✅ Récupère le `tenant_id` depuis le nœud "Code in JavaScript" via `$('Code in JavaScript')`
- ✅ Fallback sur `$input.all()` si la référence directe ne fonctionne pas
- ✅ **SUPPRESSION du fallback hardcodé** : Plus de valeur par défaut
- ✅ Logs détaillés pour le débogage

**À faire** :
1. Ouvrir le workflow N8N
2. Sélectionner le nœud **"Extraction info global"**
3. Remplacer tout le code par le contenu du fichier `N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js`
4. Sauvegarder

## 🔍 Vérification dans Supabase

Le numéro WhatsApp `33745108883` correspond au tenant :
- **ID** : `4370c96b-2fda-4c4f-a8b5-476116b8f2fc`
- **Company Name** : `nos artisan`
- **whatsapp_phone** : `+33745108883`
- **phone** : `0745108567`

## 📋 Checklist de Vérification

### Avant de tester :

- [ ] Variable d'environnement `SUPABASE_SERVICE_ROLE_KEY` configurée dans n8n
- [ ] Le nœud "Code in JavaScript" est placé **AVANT** "Extraction info global"
- [ ] Les numéros WhatsApp sont bien enregistrés dans la table `tenants` (colonnes `whatsapp_phone` ou `phone`)

### Après les modifications :

1. **Tester avec le numéro `33745108883`** :
   - Le nœud "Code in JavaScript" doit loguer : `✅ Tenant trouvé: nos artisan (4370c96b-2fda-4c4f-a8b5-476116b8f2fc)`
   - Le nœud "Extraction info global" doit loguer : `✅ Tenant_id trouvé via $('Code in JavaScript') dans context: 4370c96b-2fda-4c4f-a8b5-476116b8f2fc`

2. **Vérifier les logs** :
   - Si vous voyez `⚠️ Aucun tenant_id trouvé dans le contexte précédent !` → Le nœud "Code in JavaScript" n'a pas détecté le tenant
   - Si vous voyez `⚠️ SUPABASE_SERVICE_ROLE_KEY non configuré` → Configurer la variable d'environnement

3. **Vérifier la sortie** :
   - Dans la sortie de "Extraction info global", `context.tenant_id` doit être `4370c96b-2fda-4c4f-a8b5-476116b8f2fc` (pas vide, pas le fallback)

## 🚨 Points Critiques

1. **Variable d'environnement** : `SUPABASE_SERVICE_ROLE_KEY` doit être configurée dans n8n
   - Aller dans **Settings > Environment Variables**
   - Ajouter : `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd2xsaXJnZWlzdXZhbmJ2a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1NjYzNywiZXhwIjoyMDgzODMyNjM3fQ.3OR8IDsOtr8g854NlVOM_Lp1kuJhuKIuo8zNZGM4Fuo`

2. **Ordre des nœuds** : Le nœud "Code in JavaScript" doit être **AVANT** "Extraction info global"

3. **Format des numéros** : Les numéros dans Supabase doivent être au format :
   - `+33745108883` (avec +33)
   - `0745108883` (format français)
   - `33745108883` (sans le +)

## 📝 Notes Techniques

### Syntaxe PostgREST pour les wildcards :

- `column=ilike.value` → Recherche exacte (case-insensitive)
- `column=ilike.*value*` → `LIKE '%value%'` (contient la valeur)
- `column=ilike.value*` → `LIKE 'value%'` (commence par)
- `column=ilike.*value` → `LIKE '%value'` (finit par)

### Variations de numéros testées :

Pour `33745108883` :
1. `+33745108883` (format international avec +)
2. `0745108883` (format français avec 0)
3. `33745108883` (sans préfixe)
4. `33745108883` (sans le +)

## 🎯 Résultat Attendu

Après les corrections :
- ✅ Chaque numéro WhatsApp détecte automatiquement son tenant
- ✅ Plus de fallback hardcodé
- ✅ Les logs montrent clairement quel tenant est détecté
- ✅ Le workflow utilise le bon `tenant_id` pour toutes les opérations
