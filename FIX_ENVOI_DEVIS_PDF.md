# 🔧 Fix : Email vide lors de l'envoi de devis

## 📋 Problème identifié

L'utilisateur a signalé que :
1. L'email envoyé est vide
2. Il n'y a pas de devis dans l'email
3. Le code ne récupère pas le devis correctement

## 🔍 Analyse

### Problème 1 : Pas de PDF en pièce jointe

L'Edge Function `send-devis` envoyait seulement un **lien vers le PDF** dans l'email HTML, mais ne téléchargeait pas le PDF pour l'ajouter en pièce jointe.

### Problème 2 : Récupération incomplète du devis

Le devis était récupéré avec seulement quelques champs, sans vérifier que toutes les données nécessaires sont présentes.

## ✅ Modifications apportées

### 1. Ajout du PDF en pièce jointe

**Fichier :** `supabase/functions/send-devis/index.ts`

**Changements :**
- ✅ Téléchargement du PDF depuis `/api/pdf/devis/${devis.id}`
- ✅ Encodage du PDF en base64
- ✅ Ajout du PDF en pièce jointe dans l'email via le paramètre `attachments`

**Code ajouté :**
```typescript
// Télécharger le PDF du devis pour l'ajouter en pièce jointe
let pdfAttachment = null
try {
  const pdfUrl = devis.pdf_url || `${APP_URL}/api/pdf/devis/${devis.id}`
  console.log(`📄 Téléchargement du PDF depuis: ${pdfUrl}`)
  
  const pdfResponse = await fetch(pdfUrl)
  if (pdfResponse.ok) {
    const pdfBuffer = await pdfResponse.arrayBuffer()
    const pdfBytes = new Uint8Array(pdfBuffer)
    
    // Encoder en base64 (compatible Deno)
    let binary = ''
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i])
    }
    const pdfBase64 = btoa(binary)
    
    pdfAttachment = {
      filename: `Devis_${devis.numero}.pdf`,
      content: pdfBase64,
      mime_type: 'application/pdf'
    }
    console.log(`✅ PDF téléchargé (${pdfBuffer.byteLength} bytes)`)
  }
} catch (pdfError) {
  console.error('❌ Erreur lors du téléchargement du PDF:', pdfError)
  // On continue quand même, l'email sera envoyé avec juste le lien
}

// Ajouter le PDF en pièce jointe si disponible
if (pdfAttachment) {
  emailPayload.attachments = [pdfAttachment]
}
```

### 2. Amélioration de la récupération du devis

**Fichier :** `supabase/functions/send-devis/index.ts`

**Changements :**
- ✅ Récupération de plus de champs du devis (date_creation, delai_execution, conditions_paiement, notes, adresse_chantier)
- ✅ Vérification que le client existe et appartient au même tenant
- ✅ Ajout de logs pour le débogage

**Code modifié :**
```typescript
// Récupérer le devis avec toutes ses relations
const { data: devis, error: devisError } = await supabase
  .from('devis')
  .select(`
    id,
    numero,
    titre,
    montant_ht,
    montant_tva,
    montant_ttc,
    pdf_url,
    signature_token,
    client_id,
    date_creation,
    delai_execution,
    conditions_paiement,
    notes,
    adresse_chantier
  `)
  .eq('id', devis_id)
  .eq('tenant_id', tenant_id)
  .single()

// Récupérer le client avec vérification du tenant
const { data: client, error: clientError } = await supabase
  .from('clients')
  .select('id, nom, prenom, nom_complet, email, telephone, adresse_facturation')
  .eq('id', devis.client_id)
  .eq('tenant_id', tenant_id)
  .single()
```

## 🧪 Tests à effectuer

### Test 1 : Vérifier que le PDF est généré

1. Aller sur `/api/pdf/devis/{devis_id}` dans le navigateur
2. Vérifier que le PDF s'affiche correctement
3. Vérifier que le PDF contient bien les lignes du devis

### Test 2 : Tester l'envoi de devis

1. Dans n8n, tester avec :
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

2. Vérifier dans les logs de l'Edge Function :
   - ✅ "Devis trouvé: DV-2026-0001"
   - ✅ "Client trouvé: Samira Bouzid"
   - ✅ "PDF téléchargé (X bytes)"
   - ✅ "Email envoyé via API Next.js"

3. Vérifier l'email reçu :
   - ✅ L'email contient le HTML avec le récapitulatif
   - ✅ Le PDF est en pièce jointe
   - ✅ Le PDF s'ouvre correctement

### Test 3 : Tester avec CHARLIE

1. Envoyer : "envoi a samira sont devis par email"
2. Vérifier que CHARLIE :
   - ✅ Appelle `search-client` avec "samira"
   - ✅ Appelle `list-devis` avec "samira"
   - ✅ Trouve le devis DV-2026-0001
   - ✅ Appelle `envoyer-devis` avec l'UUID et l'email
3. Vérifier l'email reçu

## 📝 Instructions pour déployer

### 1. Déployer l'Edge Function

```bash
cd my-leo-saas
supabase functions deploy send-devis
```

### 2. Vérifier les variables d'environnement

Dans Supabase Dashboard → Edge Functions → send-devis → Settings :
- ✅ `APP_URL` = `https://mycharlie.fr`
- ✅ `GOOGLE_CLIENT_ID` (si nécessaire)
- ✅ `GOOGLE_CLIENT_SECRET` (si nécessaire)

### 3. Tester

Utiliser les tests ci-dessus pour vérifier que tout fonctionne.

## 🎯 Résultat attendu

Quand l'utilisateur dit "envoi a samira sont devis par email" :

1. ✅ CHARLIE trouve Samira et son devis
2. ✅ CHARLIE appelle `envoyer-devis` avec l'UUID et l'email
3. ✅ L'Edge Function `send-devis` :
   - Récupère le devis complet
   - Récupère le client
   - Télécharge le PDF depuis `/api/pdf/devis/{id}`
   - Encode le PDF en base64
   - Envoie l'email avec le PDF en pièce jointe
4. ✅ Le client reçoit un email avec :
   - Le HTML avec le récapitulatif du devis
   - Le PDF en pièce jointe (`Devis_DV-2026-0001.pdf`)
   - Un lien vers le PDF en ligne
   - Un lien de signature (si disponible)

## ⚠️ Notes importantes

1. **Si le PDF n'est pas généré** : Vérifier que le devis a bien des lignes (`lignes_devis`)
2. **Si l'email est vide** : Vérifier les logs de l'Edge Function pour voir où ça bloque
3. **Si le PDF est vide** : Vérifier que `/api/pdf/devis/{id}` fonctionne correctement
4. **Si l'email n'est pas envoyé** : Vérifier la connexion Gmail dans Paramètres > Intégrations

---

**Date :** 25 janvier 2026  
**Statut :** En attente de déploiement et test
