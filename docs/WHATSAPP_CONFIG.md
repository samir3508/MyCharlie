# Configuration WhatsApp Business API pour Charlie

## 📋 Variables d'environnement à ajouter

Ajoute ces variables dans ton fichier `.env.local` :

```bash
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=EAAaZCuHHLgQYBQVvZA33z0Fk1m8UZAetnBezzmpCxnSVmdCOQp7L5pVXSofObsR43v7t7jhHo7s6c8AIajrXmkpMDxzOISwZBJLbo0Ek0qLTAiLKgdbICVZBBkf0AFPHqC8QuojzqtJjSZCNGOvHQXQ36wM5gDY2LpnfZCwqE1ZBGmNKnxj9C8xdZAZBGdlndJ0sDE9Hibk2AJx1eiVGZAC2ITgHzcFKZCJvXur2O4O1cEYpmiIYZCXOFSfnlaj8suF7JX1rODluhke90gXucOP7PatqN14YA
WHATSAPP_PHONE_NUMBER_ID=965754179945375
```

## 🚀 Utilisation dans l'application

### Importer le service

```typescript
import { whatsappService, sendDevisWhatsApp } from '@/lib/whatsapp'
```

### Exemples d'utilisation

#### 1. Envoyer une notification de devis prêt

```typescript
// Après avoir créé un devis
await sendDevisWhatsApp(
  '0612345678',           // Téléphone du client
  'Thomas Girard',        // Nom du client
  'DV-2026-023',          // Numéro du devis
  'https://mycharlie.onrender.com/sign/abc123'  // Lien de signature
)
```

#### 2. Envoyer une notification de facture

```typescript
import { sendFactureWhatsApp } from '@/lib/whatsapp'

await sendFactureWhatsApp(
  '0612345678',           // Téléphone du client
  'Thomas Girard',        // Nom du client
  'FAC-2026-001',         // Numéro de facture
  '1250.50',              // Montant
  '2026-02-08'            // Date d'échéance
)
```

#### 3. Envoyer une relance

```typescript
import { sendRelanceWhatsApp } from '@/lib/whatsapp'

await sendRelanceWhatsApp(
  '0612345678',           // Téléphone du client
  'Thomas Girard',        // Nom du client
  'FAC-2026-001',         // Numéro de facture
  '1250.50'               // Montant
)
```

## 📱 Messages types disponibles

### 📋 Devis prêt à signer
- Informe le client qu'un devis est prêt
- Inclut le lien de signature direct
- Format professionnel avec emojis

### ⏰ Rappel devis
- Rappel automatique pour devis non signé
- Lien de signature inclus
- Message amical de rappel

### ✅ Confirmation de signature
- Confirme que le devis a été signé
- Message de remerciement
- Informe des prochaines étapes

### 🧾 Notification de facture
- Informe qu'une facture a été envoyée
- Affiche le montant et la date d'échéance
- Invite au paiement

### ⚠️ Relance de facture
- Rappel de facture impayée
- Montant dû clairement affiché
- Invitation à contacter si besoin

## 🔧 Intégration avec n8n

### Dans ton workflow n8n

1. **Node send-devis** → Change le statut
2. **Node Function** → Génère le lien de signature
3. **Node Gmail** → Envoie l'email
4. **Node HTTP Request** → Appelle l'API WhatsApp

#### Configuration du node HTTP Request pour WhatsApp

```javascript
// Dans un node Function n8n
const devisData = JSON.parse(items[0].json.response);
const signatureLink = `https://mycharlie.onrender.com/sign/${devisData.data.devis.signature_token}`;

return [{
  json: {
    to: devisData.data.devis.client.telephone,
    clientName: devisData.data.devis.client.nom_complet,
    devisNumero: devisData.data.devis.numero,
    signatureLink: signatureLink
  }
}];
```

Puis dans un node HTTP Request :
- **URL**: `https://ton-api.com/whatsapp/send-devis`
- **Méthode**: POST
- **Body**: Les données du client

## 🛠️ Test de l'API

### Test avec curl (comme ton exemple)

```bash
curl -i -X POST \
  https://graph.facebook.com/v22.0/965754179945375/messages \
  -H 'Authorization: Bearer EAAaZCuHHLgQYBQVvZA33z0Fk1m8UZAetnBezzmpCxnSVmdCOQp7L5pVXSofObsR43v7t7jhHo7s6c8AIajrXmkpMDxzOISwZBJLbo0Ek0qLTAiLKgdbICVZBBkf0AFPHqC8QuojzqtJjSZCNGOvHQXQ36wM5gDY2LpnfZCwqE1ZBGmNKnxj9C8xdZAZBGdlndJ0sDE9Hibk2AJx1eiVGZAC2ITgHzcFKZCJvXur2O4O1cEYpmiIYZCXOFSfnlaj8suF7JX1rODluhke90gXucOP7PatqN14YA' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp", 
    "to": "33745108883", 
    "type": "template", 
    "template": { 
      "name": "hello_world", 
      "language": { "code": "en_US" } 
    } 
  }'
```

## ✅ Checklist de déploiement

- [ ] Ajouter les variables d'environnement WhatsApp
- [ ] Tester l'envoi de messages
- [ ] Intégrer dans le workflow n8n
- [ ] Tester les différents types de messages
- [ ] Vérifier la réception sur WhatsApp

## 🎯 Résultat attendu

Une fois configuré, Charlie pourra :
- ✅ Envoyer automatiquement les liens de signature par WhatsApp
- ✅ Envoyer les factures et rappels
- Communiquer efficacement avec les clients
- ✅ Suivi automatique des paiements

**Les clients recevront les notifications directement sur WhatsApp !** 📱✨
