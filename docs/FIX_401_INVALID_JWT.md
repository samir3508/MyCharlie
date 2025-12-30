# 🔧 Fix : Erreur 401 "Invalid JWT"

## 🚨 Problème

L'erreur est passée de 404 à 401 "Invalid JWT", ce qui signifie :
1. ✅ Le mapping fonctionne (l'action est bien convertie en `create-facture-from-devis`)
2. ❌ Mais l'authentification échoue

## ✅ Solutions appliquées

### 1. Création de la fonction `validateAuth`

Le fichier `supabase/functions/_shared/auth.ts` était vide. J'ai créé la fonction `validateAuth` qui :
- Vérifie la présence du header `Authorization`
- Extrait le token Bearer
- Compare avec `LEO_API_SECRET` depuis les variables d'environnement Supabase

### 2. Mise à jour du Code Tool

Le Code Tool utilise maintenant le token hardcodé directement (car pas d'abonnement N8N pour les variables d'environnement) :

```javascript
const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
```

### 3. Correction de la faute de frappe

Dans l'image, je vois que `type: "acompt"` au lieu de `"acompte"`. Le prompt LÉO a été mis à jour pour rappeler que le type doit être EXACTEMENT `"acompte"`, `"intermediaire"` ou `"solde"`.

## 📋 Actions à faire

### 1. Vérifier le secret `LEO_API_SECRET` dans Supabase

1. Supabase Dashboard → Edge Functions → Settings → Secrets
2. Vérifier que `LEO_API_SECRET` existe et correspond au token utilisé dans N8N
3. Si le secret n'existe pas ou est différent, le mettre à jour

### 2. Mettre à jour le Code Tool

1. Ouvrir N8N → Workflow "LÉO Complet"
2. Trouver le nœud "Code Tool"
3. Remplacer le code par le contenu de `docs/N8N_CODE_TOOL_MIS_A_JOUR.txt`
4. Sauvegarder

### 3. Corriger la faute de frappe dans le prompt LÉO

Le prompt LÉO a été mis à jour pour rappeler que le type doit être EXACTEMENT `"acompte"` (pas "acompt").

## 🔍 Diagnostic

Si l'erreur 401 persiste après ces modifications :

**Note :** Le token est maintenant hardcodé dans le Code Tool car N8N nécessite un abonnement pour les variables d'environnement.

Si l'erreur 401 persiste après ces modifications :

1. **Vérifier les logs Supabase** :
   - Edge Functions → `create-facture-from-devis` → Logs
   - Chercher les messages d'erreur d'authentification

2. **Tester le token manuellement** :
   ```bash
   curl -X POST https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1/create-facture-from-devis \
     -H "Authorization: Bearer VOTRE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tenant_id": "f117dc59-1cef-41c3-91a3-8c12d47f6bfb",
       "devis_id": "UUID_DU_DEVIS",
       "type": "acompte"
     }'
   ```

3. **Vérifier que le secret est bien configuré** :
   - Supabase Dashboard → Edge Functions → Settings → Secrets
   - Le secret `LEO_API_SECRET` doit exister

## 🎯 Prochaines étapes

1. ✅ `auth.ts` créé et déployé
2. ✅ Code Tool mis à jour avec token hardcodé (pas de variables d'environnement N8N)
3. ⏳ **Vérifier que `LEO_API_SECRET` est configuré dans Supabase Dashboard**
4. ⏳ **Mettre à jour le Code Tool dans N8N avec le code de `docs/N8N_CODE_TOOL_FINAL.txt`**
5. ⏳ **Tester à nouveau la création de facture**



## 🚨 Problème

L'erreur est passée de 404 à 401 "Invalid JWT", ce qui signifie :
1. ✅ Le mapping fonctionne (l'action est bien convertie en `create-facture-from-devis`)
2. ❌ Mais l'authentification échoue

## ✅ Solutions appliquées

### 1. Création de la fonction `validateAuth`

Le fichier `supabase/functions/_shared/auth.ts` était vide. J'ai créé la fonction `validateAuth` qui :
- Vérifie la présence du header `Authorization`
- Extrait le token Bearer
- Compare avec `LEO_API_SECRET` depuis les variables d'environnement Supabase

### 2. Mise à jour du Code Tool

Le Code Tool utilise maintenant le token hardcodé directement (car pas d'abonnement N8N pour les variables d'environnement) :

```javascript
const LEO_API_SECRET = 'bfcce0dca821fbf3d0f0303e90710bf7b24882d8418f276ee30fe7906ba0bf22';
```

### 3. Correction de la faute de frappe

Dans l'image, je vois que `type: "acompt"` au lieu de `"acompte"`. Le prompt LÉO a été mis à jour pour rappeler que le type doit être EXACTEMENT `"acompte"`, `"intermediaire"` ou `"solde"`.

## 📋 Actions à faire

### 1. Vérifier le secret `LEO_API_SECRET` dans Supabase

1. Supabase Dashboard → Edge Functions → Settings → Secrets
2. Vérifier que `LEO_API_SECRET` existe et correspond au token utilisé dans N8N
3. Si le secret n'existe pas ou est différent, le mettre à jour

### 2. Mettre à jour le Code Tool

1. Ouvrir N8N → Workflow "LÉO Complet"
2. Trouver le nœud "Code Tool"
3. Remplacer le code par le contenu de `docs/N8N_CODE_TOOL_MIS_A_JOUR.txt`
4. Sauvegarder

### 3. Corriger la faute de frappe dans le prompt LÉO

Le prompt LÉO a été mis à jour pour rappeler que le type doit être EXACTEMENT `"acompte"` (pas "acompt").

## 🔍 Diagnostic

Si l'erreur 401 persiste après ces modifications :

**Note :** Le token est maintenant hardcodé dans le Code Tool car N8N nécessite un abonnement pour les variables d'environnement.

Si l'erreur 401 persiste après ces modifications :

1. **Vérifier les logs Supabase** :
   - Edge Functions → `create-facture-from-devis` → Logs
   - Chercher les messages d'erreur d'authentification

2. **Tester le token manuellement** :
   ```bash
   curl -X POST https://zhemkkukhxspakxvrmlr.supabase.co/functions/v1/create-facture-from-devis \
     -H "Authorization: Bearer VOTRE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tenant_id": "f117dc59-1cef-41c3-91a3-8c12d47f6bfb",
       "devis_id": "UUID_DU_DEVIS",
       "type": "acompte"
     }'
   ```

3. **Vérifier que le secret est bien configuré** :
   - Supabase Dashboard → Edge Functions → Settings → Secrets
   - Le secret `LEO_API_SECRET` doit exister

## 🎯 Prochaines étapes

1. ✅ `auth.ts` créé et déployé
2. ✅ Code Tool mis à jour avec token hardcodé (pas de variables d'environnement N8N)
3. ⏳ **Vérifier que `LEO_API_SECRET` est configuré dans Supabase Dashboard**
4. ⏳ **Mettre à jour le Code Tool dans N8N avec le code de `docs/N8N_CODE_TOOL_FINAL.txt`**
5. ⏳ **Tester à nouveau la création de facture**

