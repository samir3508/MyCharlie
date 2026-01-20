# 📱 Webhook WhatsApp - Informations

## 🔍 Où se trouve le webhook WhatsApp

### Route API : `/api/whatsapp/webhook`

**Fichier :** `src/app/api/whatsapp/webhook/route.ts`

**URL complète :** `https://mycharlie.fr/api/whatsapp/webhook`

---

## 📋 Configuration actuelle

### GET - Vérification du webhook (challenge)

**Utilisé par :** WhatsApp pour vérifier que le webhook est valide

**Token de vérification :** `charlie_whatsapp_2024`

**Configuration WhatsApp :**
- **Verify Token :** `charlie_whatsapp_2024`
- **Callback URL :** `https://mycharlie.fr/api/whatsapp/webhook`

---

### POST - Réception des messages

**Fonctionnalité actuelle :**
- ✅ Reçoit les messages WhatsApp entrants
- ✅ Traite les messages texte
- ✅ Répond avec des messages automatiques (basiques)
- ❌ **N'EST PAS** connecté à N8N ou LEO Chat (pour l'instant)

---

## ⚠️ État actuel du webhook

Le webhook existe **MAIS** :

1. ❌ **N'appelle PAS N8N** - Les messages WhatsApp ne sont pas envoyés à N8N
2. ❌ **N'appelle PAS LEO Chat** - Les messages ne passent pas par LEO
3. ✅ **Répond avec des réponses automatiques basiques** uniquement

**Exemple de réponses automatiques actuelles :**
- "devis" ou "facture" → "Je vais vérifier vos documents. Un instant svp !"
- "paiement" → "Pour le paiement, utilisez le lien envoyé par email."
- "rdv" → "Pour prendre RDV, contactez directement votre artisan."
- etc.

---

## 🔗 Comment connecter le webhook à N8N/LEO

### Option 1 : Modifier le webhook pour appeler LEO Chat

Dans `src/app/api/whatsapp/webhook/route.ts`, fonction `processTextMessage` :

```typescript
// Après réception du message, appeler LEO Chat
async function processTextMessage(from: string, body: string, messageId: string) {
  // ... code actuel ...

  // APPELER LEO CHAT (à ajouter)
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leo/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: body,
        tenantId: await getTenantIdFromPhone(from), // À implémenter
        conversationId: null,
        isWhatsApp: true,
        whatsappPhone: from
      })
    })
    
    const result = await response.json()
    // Envoyer la réponse via WhatsApp (Twilio ou WhatsApp Business API)
    await sendWhatsAppMessage(from, result.response)
  } catch (error) {
    console.error('Erreur appel LEO Chat:', error)
  }
}
```

### Option 2 : Modifier le webhook pour appeler N8N directement

```typescript
async function processTextMessage(from: string, body: string, messageId: string) {
  // Récupérer tenant_id depuis le numéro WhatsApp
  const tenantId = await getTenantIdFromPhone(from)
  
  // Appeler le webhook N8N
  const n8nWebhookUrl = await getN8NWebhookUrl(tenantId)
  
  const response = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: {
        message: body,
        From: `whatsapp:${from}`
      },
      context: {
        tenant_id: tenantId,
        is_whatsapp: true,
        whatsapp_phone: from
      }
    })
  })
}
```

---

## 🔍 Vérifier si le webhook est actif

### Test 1 : Vérification GET (challenge)

```bash
curl "https://mycharlie.fr/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=charlie_whatsapp_2024&hub.challenge=test123"
```

**Résultat attendu :** `test123` (texte brut)

### Test 2 : Envoi d'un message POST (simulation)

```bash
curl -X POST https://mycharlie.fr/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "1234567890",
            "phone_number_id": "1234567890"
          },
          "messages": [{
            "from": "33612345678",
            "id": "msg123",
            "timestamp": "1234567890",
            "type": "text",
            "text": { "body": "bonjour" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

**Résultat attendu :** `{"status":"received"}`

---

## ⚠️ Problèmes identifiés

### 1. Pas de sauvegarde en base de données

La fonction `saveMessage()` ne fait que logger :
```typescript
async function saveMessage(...) {
  console.log(`Message sauvegardé: ...`) // ❌ Pas de vraie sauvegarde
}
```

### 2. Pas d'envoi de réponse

Les réponses automatiques sont générées mais **ne sont pas envoyées** via WhatsApp.

### 3. Pas de connexion au tenant

Il n'y a pas de fonction pour récupérer `tenant_id` depuis le numéro WhatsApp.

---

## ✅ Ce qui fonctionne

- ✅ Webhook reçoit les messages WhatsApp
- ✅ Parse correctement les messages texte
- ✅ Génère des réponses automatiques basiques
- ✅ Gère les statuts de messages

---

## 🔧 Ce qu'il faut ajouter pour connecter à N8N/LEO

1. **Récupérer tenant_id depuis le numéro WhatsApp**
   - Lier le numéro WhatsApp au tenant dans la table `tenants.whatsapp_phone`

2. **Appeler LEO Chat ou N8N**
   - Envoyer le message à l'API LEO Chat ou au webhook N8N

3. **Recevoir la réponse de LEO/N8N**
   - Traiter la réponse de LEO ou N8N

4. **Envoyer la réponse via WhatsApp**
   - Utiliser Twilio ou WhatsApp Business API pour envoyer la réponse

---

## 📝 Résumé

**Le webhook WhatsApp existe** mais **n'est PAS connecté** à N8N ou LEO Chat actuellement.

Il répond uniquement avec des messages automatiques basiques.

Pour le connecter à N8N/LEO, il faut modifier `processTextMessage()` pour appeler l'API LEO Chat ou le webhook N8N.
