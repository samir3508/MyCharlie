# ✅ Déploiement Edge Function `send-devis` - Version 5

## 📋 Résumé

L'Edge Function `send-devis` a été déployée avec succès avec les améliorations suivantes :

1. ✅ **Téléchargement du PDF** : Le PDF est maintenant téléchargé depuis `/api/pdf/devis/{id}`
2. ✅ **PDF en pièce jointe** : Le PDF est encodé en base64 et ajouté en pièce jointe dans l'email
3. ✅ **Récupération complète du devis** : Plus de champs récupérés (date_creation, delai_execution, conditions_paiement, notes, adresse_chantier)
4. ✅ **Vérification du client** : Vérification que le client existe et appartient au même tenant
5. ✅ **Logs améliorés** : Logs détaillés pour le débogage

## 🔍 Vérifications effectuées

### 1. Devis de Samira

**Résultat de la requête SQL :**
- ✅ Devis trouvé : `DV-2026-0001`
- ✅ ID : `2d4f399d-c111-40f6-9262-5d23d0e84e39`
- ✅ Statut : `brouillon`
- ✅ Montant TTC : `290.00€`
- ✅ Client : `Samira Bouzid` (aslambekdaoud@gmail.com)
- ✅ Nombre de lignes : `3`

### 2. Logs Edge Function

**Derniers appels :**
- ✅ Version 3 : Plusieurs appels réussis (200) et quelques erreurs 401 (authentification)
- ✅ Version 4 : Déployée avec succès
- ✅ Version 5 : Déployée avec succès (version actuelle)

## 🚀 Modifications déployées

### Code principal (`index.ts`)

**Ajouts :**
1. Téléchargement du PDF :
   ```typescript
   const pdfUrl = devis.pdf_url || `${APP_URL}/api/pdf/devis/${devis.id}`
   const pdfResponse = await fetch(pdfUrl)
   const pdfBuffer = await pdfResponse.arrayBuffer()
   const pdfBase64 = btoa(binary)
   ```

2. Ajout en pièce jointe :
   ```typescript
   pdfAttachment = {
     filename: `Devis_${devis.numero}.pdf`,
     content: pdfBase64,
     mime_type: 'application/pdf'
   }
   emailPayload.attachments = [pdfAttachment]
   ```

3. Récupération complète du devis :
   ```typescript
   .select(`
     id, numero, titre, montant_ht, montant_tva, montant_ttc,
     pdf_url, signature_token, client_id,
     date_creation, delai_execution, conditions_paiement,
     notes, adresse_chantier
   `)
   ```

4. Vérification du client :
   ```typescript
   .eq('id', devis.client_id)
   .eq('tenant_id', tenant_id)  // Vérification du tenant
   ```

5. Logs de débogage :
   ```typescript
   console.log(`✅ Devis trouvé: ${devis.numero} (${devis.montant_ttc}€ TTC)`)
   console.log(`✅ Client trouvé: ${client.nom_complet} (${client.email})`)
   console.log(`📄 Téléchargement du PDF depuis: ${pdfUrl}`)
   console.log(`✅ PDF téléchargé (${pdfBuffer.byteLength} bytes)`)
   ```

## 🧪 Tests à effectuer

### Test 1 : Envoi direct via n8n Code Tool

```javascript
{
  action: "envoyer-devis",
  payload: {
    devis_id: "2d4f399d-c111-40f6-9262-5d23d0e84e39", // UUID du devis
    recipient_email: "aslambekdaoud@gmail.com"
  },
  tenant_id: "4370c96b-2fda-4c4f-a8b5-476116b8f2fc"
}
```

**Résultat attendu :**
- ✅ Devis récupéré avec succès
- ✅ Client récupéré avec succès
- ✅ PDF téléchargé depuis `/api/pdf/devis/2d4f399d-c111-40f6-9262-5d23d0e84e39`
- ✅ PDF encodé en base64
- ✅ Email envoyé avec PDF en pièce jointe
- ✅ Statut du devis mis à jour à `envoye`

### Test 2 : Via CHARLIE

**Message :** "envoi a samira sont devis par email"

**Workflow attendu :**
1. ✅ CHARLIE appelle `search-client` avec "samira"
2. ✅ CHARLIE trouve Samira Bouzid
3. ✅ CHARLIE appelle `list-devis` avec "samira"
4. ✅ CHARLIE trouve le devis DV-2026-0001
5. ✅ CHARLIE appelle `envoyer-devis` avec l'UUID et l'email
6. ✅ Edge Function télécharge le PDF
7. ✅ Email envoyé avec PDF en pièce jointe

### Test 3 : Vérification de l'email

**Vérifier que l'email reçu contient :**
- ✅ HTML avec le récapitulatif (Montant HT, TVA, TTC)
- ✅ Lien vers le PDF en ligne
- ✅ **PDF en pièce jointe** (`Devis_DV-2026-0001.pdf`)
- ✅ Le PDF s'ouvre correctement et contient les 3 lignes du devis

## 📊 Monitoring

### Logs à surveiller

Dans Supabase Dashboard → Edge Functions → send-devis → Logs :

**Logs attendus :**
```
✅ Devis trouvé: DV-2026-0001 (290€ TTC)
✅ Client trouvé: Samira Bouzid (aslambekdaoud@gmail.com)
📄 Téléchargement du PDF depuis: https://mycharlie.fr/api/pdf/devis/2d4f399d-c111-40f6-9262-5d23d0e84e39
✅ PDF téléchargé (XXXXX bytes)
✅ Email envoyé via API Next.js: {...}
```

**Erreurs possibles :**
- ⚠️ `Impossible de télécharger le PDF: 404` → Vérifier que `/api/pdf/devis/{id}` fonctionne
- ⚠️ `Erreur API send-gmail: 401` → Vérifier la connexion Gmail
- ⚠️ `CLIENT_NOT_FOUND` → Vérifier que le client appartient au même tenant

## 🔧 Configuration

### Variables d'environnement

Dans Supabase Dashboard → Edge Functions → send-devis → Settings :

- ✅ `APP_URL` = `https://mycharlie.fr` (défaut si non défini)
- ✅ `GOOGLE_CLIENT_ID` (optionnel, pour Gmail)
- ✅ `GOOGLE_CLIENT_SECRET` (optionnel, pour Gmail)

### Authentification

L'Edge Function nécessite un header `Authorization: Bearer <token>` avec :
- Service Role Key (recommandé pour les appels depuis n8n)
- OU Anon Key (si RLS permet l'accès)

## ✅ Statut du déploiement

- **Version déployée :** 5
- **Statut :** ACTIVE
- **Date de déploiement :** 25 janvier 2026
- **Hash SHA256 :** `63bf0d9b55e53b9020d6b673cac7883e56a259f6c1000fec652b04bed80329d7`

## 🎯 Prochaines étapes

1. **Tester l'envoi** avec le devis de Samira
2. **Vérifier l'email reçu** (PDF en pièce jointe)
3. **Vérifier les logs** dans Supabase Dashboard
4. **Tester via CHARLIE** avec "envoi a samira sont devis par email"

## 📝 Notes

- Si le PDF n'est pas téléchargé, l'email sera quand même envoyé avec juste le lien vers le PDF
- Les logs détaillés permettront de diagnostiquer rapidement les problèmes
- Le PDF est généré dynamiquement par `/api/pdf/devis/{id}` à chaque envoi

---

**Dernière mise à jour :** 25 janvier 2026  
**Version Edge Function :** 5  
**Statut :** ✅ Déployé et prêt pour les tests
