# 🔍 Debug : Erreur 404 lors de l'envoi de devis

## 📋 Problème identifié

Lors de l'appel à `envoyer-devis`, l'Edge Function `send-devis` retourne une erreur **404**.

**Erreur :**
```
Request failed with status code 404
```

**Logs Supabase :**
- Version 5 : `POST | 404 | https://lawllirgeisuvanbvkcr.supabase.co/functions/v1/send-devis`
- Version 3 : `POST | 200` (fonctionnait avant)

## 🔍 Analyse

### 1. Vérification de l'Edge Function

**Statut :**
- ✅ Edge Function `send-devis` version 5 est **ACTIVE**
- ✅ URL : `https://lawllirgeisuvanbvkcr.supabase.co/functions/v1/send-devis`
- ✅ Déployée avec succès

### 2. Vérification de l'appel

**Code dans `CODE_TOOL_N8N_COMPLET_FINAL.js` :**
```javascript
const edgeFunctionUrl = `${CONFIG.SUPABASE_URL}/functions/v1/send-devis`;
// CONFIG.SUPABASE_URL = 'https://lawllirgeisuvanbvkcr.supabase.co'
// URL complète = 'https://lawllirgeisuvanbvkcr.supabase.co/functions/v1/send-devis'
```

**Headers :**
```javascript
{
  'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json'
}
```

**Body :**
```javascript
{
  tenant_id: "4370c96b-2fda-4c4f-a8b5-476116b8f2fc",
  devis_id: "2d4f399d-c111-40f6-9262-5d23d0e84e39",
  method: "email",
  recipient_email: "aslambekdaoud@gmail.com"
}
```

### 3. Causes possibles

1. **Problème d'authentification** : Le token `SUPABASE_SERVICE_KEY` n'est peut-être pas valide
2. **Problème de format de requête** : Le format de la requête HTTP n'est peut-être pas correct
3. **Problème de déploiement** : La version 5 n'est peut-être pas encore complètement déployée
4. **Problème de routing** : L'URL n'est peut-être pas correcte

## ✅ Solutions appliquées

### 1. Amélioration de la gestion d'erreur

**Fichier modifié :** `CODE_TOOL_N8N_COMPLET_FINAL.js`

**Changements :**
- ✅ Ajout de logs détaillés pour diagnostiquer
- ✅ Gestion spécifique de l'erreur 404
- ✅ Utilisation de `returnFullResponse: true` et `ignoreHttpStatusErrors: true`
- ✅ Meilleure extraction du status code et du body

**Code ajouté :**
```javascript
console.log(`📧 Appel Edge Function: ${edgeFunctionUrl}`);
console.log(`📧 Payload:`, { tenant_id, devis_id: devisUUID, method, recipient_email });

const edgeResponse = await this.helpers.httpRequest({
  method: 'POST',
  url: edgeFunctionUrl,
  headers: {
    'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: { ... },
  returnFullResponse: true,
  ignoreHttpStatusErrors: true
});

const statusCode = (edgeResponse && edgeResponse.statusCode) || (edgeResponse && edgeResponse.status) || 200;
const responseData = typeof edgeResponse.body === 'string' 
  ? (edgeResponse.body ? JSON.parse(edgeResponse.body) : {}) 
  : edgeResponse.body;

console.log(`📧 Réponse Edge Function:`, {
  statusCode,
  success: responseData?.success,
  error: responseData?.error,
  message: responseData?.message
});
```

### 2. Message d'erreur amélioré

**Avant :**
```
email non envoyé: Request failed with status code 404
```

**Après :**
```
email non envoyé: Edge Function send-devis non trouvée (404). Vérifiez que l'Edge Function est bien déployée.
```

## 🧪 Tests à effectuer

### Test 1 : Vérifier l'URL de l'Edge Function

Dans n8n, tester directement l'appel HTTP :
```javascript
{
  method: 'POST',
  url: 'https://lawllirgeisuvanbvkcr.supabase.co/functions/v1/send-devis',
  headers: {
    'Authorization': 'Bearer [SERVICE_KEY]',
    'Content-Type': 'application/json'
  },
  body: {
    tenant_id: '4370c96b-2fda-4c4f-a8b5-476116b8f2fc',
    devis_id: '2d4f399d-c111-40f6-9262-5d23d0e84e39',
    method: 'email',
    recipient_email: 'aslambekdaoud@gmail.com'
  }
}
```

### Test 2 : Vérifier les logs

Dans n8n, après l'appel, vérifier les logs du nœud Code Tool pour voir :
- ✅ L'URL appelée
- ✅ Le payload envoyé
- ✅ Le status code retourné
- ✅ Le body de la réponse

### Test 3 : Vérifier l'authentification

Vérifier que `CONFIG.SUPABASE_SERVICE_KEY` est bien défini et valide dans n8n.

## 🔧 Solutions possibles

### Solution 1 : Vérifier la clé d'authentification

Dans n8n, vérifier que la variable d'environnement `SUPABASE_SERVICE_ROLE_KEY` est bien définie et correspond à la clé dans le code.

### Solution 2 : Vérifier le format de la requête

L'Edge Function attend :
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "email@example.com"
}
```

### Solution 3 : Vérifier que l'Edge Function est accessible

Tester directement avec curl :
```bash
curl -X POST \
  https://lawllirgeisuvanbvkcr.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer [SERVICE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "4370c96b-2fda-4c4f-a8b5-476116b8f2fc",
    "devis_id": "2d4f399d-c111-40f6-9262-5d23d0e84e39",
    "method": "email",
    "recipient_email": "aslambekdaoud@gmail.com"
  }'
```

## 📝 Notes importantes

1. **Le statut du devis est mis à jour** même si l'email échoue (c'est normal)
2. **Le trigger PostgreSQL mettra à jour le dossier** automatiquement quand le devis passe à `envoye`
3. **Les logs améliorés** permettront de mieux diagnostiquer le problème

## 🎯 Prochaines étapes

1. **Tester à nouveau** avec les logs améliorés
2. **Vérifier les logs** dans n8n pour voir exactement ce qui se passe
3. **Vérifier l'authentification** (SERVICE_KEY)
4. **Tester directement l'Edge Function** avec curl ou Postman

---

**Date :** 25 janvier 2026  
**Statut :** 🔍 En cours de diagnostic
