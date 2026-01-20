# 📋 GUIDE SIMPLE : Quel fichier dans quel nœud N8N

## 🎯 Résumé rapide

Dans votre workflow N8N, vous avez **2 nœuds à modifier** :

1. **Nœud "Code in JavaScript"** → Utilise le fichier : `N8N_CODE_DETECTER_TENANT_WHATSAPP_SIMPLIFIE.js`
2. **Nœud "Extraction info global"** → Utilise le fichier : `N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js`

---

## 📍 Étape par étape

### ÉTAPE 1 : Modifier le nœud "Code in JavaScript"

**🎯 Objectif** : Ce nœud détecte le tenant (client) à partir du numéro WhatsApp

**📍 Dans N8N** :
1. Ouvrez votre workflow : https://n8n.srv1271213.hstgr.cloud/workflow/etyxzpstONz6ShroGoEUe
2. Cliquez sur le nœud **"Code in JavaScript"** (celui qui reçoit les messages WhatsApp)
3. Dans la zone de code JavaScript, **sélectionnez tout** (Ctrl+A ou Cmd+A)
4. **Supprimez** tout le code existant
5. **Ouvrez** le fichier : `/Users/adam/Appli BB LEO copie/my-leo-saas/docs/N8N_CODE_DETECTER_TENANT_WHATSAPP_SIMPLIFIE.js`
6. **Copiez tout le contenu** de ce fichier (Ctrl+A puis Ctrl+C)
7. **Collez** dans le nœud N8N (Ctrl+V)
8. Cliquez sur **"Save"** ou **"Execute Node"** pour tester

**✅ Résultat attendu** : Ce nœud va maintenant détecter automatiquement le tenant à partir du numéro WhatsApp

---

### ÉTAPE 2 : Modifier le nœud "Extraction info global"

**🎯 Objectif** : Ce nœud récupère le tenant_id détecté et l'utilise pour lier les données au bon client

**📍 Dans N8N** :
1. Dans le même workflow, cliquez sur le nœud **"Extraction info global"** (celui qui bloque actuellement)
2. Dans la zone de code JavaScript, **sélectionnez tout** (Ctrl+A ou Cmd+A)
3. **Supprimez** tout le code existant
4. **Ouvrez** le fichier : `/Users/adam/Appli BB LEO copie/my-leo-saas/docs/N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js`
5. **Copiez tout le contenu** de ce fichier (Ctrl+A puis Ctrl+C)
6. **Collez** dans le nœud N8N (Ctrl+V)
7. Cliquez sur **"Save"** ou **"Execute Node"** pour tester

**✅ Résultat attendu** : Ce nœud ne bloquera plus et utilisera le bon tenant_id pour chaque client

---

## 🔍 Comment trouver les nœuds dans N8N ?

### Nœud "Code in JavaScript"
- C'est le nœud qui vient **juste après** le trigger WhatsApp
- Il contient du code JavaScript qui fait des requêtes à Supabase
- Il cherche le tenant dans la base de données

### Nœud "Extraction info global"
- C'est le nœud qui **bloque actuellement** (reste en chargement)
- Il vient **après** "Code in JavaScript" dans le flux
- Il extrait des informations et les enregistre dans Supabase

---

## 📊 Schéma du flux

```
WhatsApp Trigger
    ↓
Code in JavaScript  ← 📄 N8N_CODE_DETECTER_TENANT_WHATSAPP_SIMPLIFIE.js
    ↓
Extraction du type
    ↓
Switch Audio ou Text
    ↓
Edit Fields
    ↓
Extraction info global  ← 📄 N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js
    ↓
AI Agent
    ↓
Send message
```

---

## ✅ Checklist de vérification

Après avoir modifié les 2 nœuds :

- [ ] Le nœud "Code in JavaScript" contient le nouveau code
- [ ] Le nœud "Extraction info global" contient le nouveau code
- [ ] Les deux nœuds sont sauvegardés
- [ ] Le workflow est activé
- [ ] Un test avec un message WhatsApp a été effectué

---

## 🐛 Si ça ne fonctionne pas

1. **Vérifiez les logs** dans chaque nœud :
   - Dans N8N, cliquez sur le nœud
   - Regardez l'onglet "Output" ou "Execution Log"
   - Cherchez les messages avec ✅ ou ⚠️

2. **Messages à chercher** :
   - `🔑 Utilisation de la clé service role directement dans le code` → ✅ OK
   - `✅ Tenant trouvé: [nom] ([id])` → ✅ Le tenant est détecté
   - `⚠️ Aucun tenant_id trouvé` → ❌ Problème de détection

3. **Vérifiez que les nœuds sont bien connectés** :
   - Le nœud "Code in JavaScript" doit être **avant** "Extraction info global"
   - Les flèches doivent être connectées dans le bon sens

---

## 📝 Résumé ultra-simple

| Nœud N8N | Fichier à utiliser |
|----------|-------------------|
| **Code in JavaScript** | `N8N_CODE_DETECTER_TENANT_WHATSAPP_SIMPLIFIE.js` |
| **Extraction info global** | `N8N_EXTRACTION_INFO_GLOBAL_CORRIGE.js` |

**C'est tout !** Juste 2 fichiers pour 2 nœuds. 🎯
