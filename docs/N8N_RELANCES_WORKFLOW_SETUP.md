# 🔄 Configuration N8N pour Relances avec LEO

## Vue d'ensemble

Votre workflow actuel se déclenche tous les matins à 8h. Nous allons :
1. **Garder le trigger Schedule existant** (8h du matin)
2. **Ajouter un Webhook Trigger** pour recevoir les demandes manuelles
3. **Ajouter Twilio** pour envoyer via WhatsApp
4. **Ajouter Gmail** pour envoyer via email
5. **Corriger la récupération des emails/téléphones** dans les requêtes

## Architecture du Workflow

```
[Schedule Trigger 8h] ──┐
                        ├──> [Get Tenants To Notify] ──> [Loop Over Items]
[Webhook Trigger] ──────┘                              │
                                                        │
                                                        ├──> [Get Relances Snapshot]
                                                        │
                                                        ├──> [Get Client Info (email + phone)] ⚠️ NOUVEAU
                                                        │
                                                        ├──> [Parse Snapshot]
                                                        │
                                                        ├──> [OpenAI Chat Model]
                                                        │
                                                        ├──> [Postgres Chat Memory]
                                                        │
                                                        ├──> [If User Confirmed?] ⚠️ NOUVEAU
                                                        │         │
                                                        │         ├─> OUI ──> [Split by Method]
                                                        │         │              │
                                                        │         │              ├──> [Twilio WhatsApp] ──> [Send to WhatsApp]
                                                        │         │              │
                                                        │         │              └──> [Gmail] ──> [Send Email]
                                                        │         │
                                                        │         └─> NON ──> [Send Confirmation Request to LEO Chat]
                                                        │
                                                        └──> [Leo - Résumé Relances]
```

## Étape 1: Ajouter le Webhook Trigger

1. Dans votre workflow N8N, **cliquez sur le "+"** à côté du "Schedule Trigger"
2. Cherchez **"Webhook"** dans les nodes
3. Sélectionnez **"Webhook"** → **"When called"**
4. Configurez :
   - **HTTP Method**: POST
   - **Path**: `/relances/send` (ou le chemin que vous voulez)
   - **Response Mode**: "Respond to Webhook" (choisir "Last Node" après)

## Étape 2: Ajouter le Node "Get Client Info" pour récupérer email et téléphone

**IMPORTANT**: Ce node doit être ajouté APRÈS "Get Relances Snapshot" et AVANT "Parse Snapshot"

### Configuration du node "Execute Query" - Get Client Info

1. Ajoutez un node **"Postgres"** → **"Execute Query"**
2. Nommez-le **"Get Client Info"**
3. Configuration :

**Credential**: Postgres supabase (le même que vos autres nodes)

**Query**:
```sql
SELECT 
  c.id as client_id,
  c.nom_complet,
  c.email,
  c.telephone,
  f.id as facture_id,
  f.numero as facture_numero,
  f.montant_ttc,
  f.date_echeance,
  r.snapshot as relances_snapshot
FROM factures f
JOIN clients c ON f.client_id = c.id
CROSS JOIN LATERAL get_relances_snapshot(f.tenant_id::text) AS r(snapshot)
WHERE f.tenant_id = '{{ $json["tenant_id"] }}'
AND f.statut IN ('envoyee', 'en_retard')
AND f.date_echeance < CURRENT_DATE
ORDER BY f.date_echeance ASC
LIMIT 10;
```

**Input Data** (depuis le Loop Over Items):
- Utilisez `{{ $json["tenant_id"] }}` depuis le loop

**Output**: 
```json
{
  "client_id": "uuid",
  "nom_complet": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "telephone": "+33612345678",
  "facture_id": "uuid",
  "facture_numero": "FAC-2024-001",
  "montant_ttc": 1500.00,
  "date_echeance": "2024-12-20",
  "relances_snapshot": "{...JSON snapshot...}"
}
```

## Étape 3: Modifier "Parse Snapshot" pour inclure email et téléphone

Après "Get Client Info", modifiez le node "Parse Snapshot" pour enrichir les données :

### Configuration "Function" ou "Code" node

Ajoutez un node **"Code"** → **"JavaScript"** nommé **"Enrich Relances Data"** :

```javascript
// Recevoir les données du node précédent
const clientData = $input.item.json;

// Parse le snapshot si c'est une string, sinon utiliser directement
let snapshot = clientData.relances_snapshot;
if (typeof snapshot === 'string') {
  try {
    snapshot = JSON.parse(snapshot);
  } catch (e) {
    snapshot = {};
  }
}

// Enrichir avec les informations client
const enrichedData = {
  ...clientData,
  client_email: clientData.email,
  client_phone: clientData.telephone,
  client_name: clientData.nom_complet,
  relances: snapshot.relances || [],
  factures: snapshot.factures || [],
};

return enrichedData;
```

## Étape 4: Ajouter la confirmation utilisateur (optionnel)

Si vous voulez demander confirmation à l'utilisateur avant d'envoyer :

### Node "IF" - Check User Confirmation

1. Ajoutez un node **"IF"**
2. Condition :
   - **Value 1**: `{{ $json["user_confirmed"] }}` ou `{{ $json["auto_send"] }}`
   - **Operation**: equals
   - **Value 2**: `true`

Cela permet de séparer :
- Les relances automatiques (8h) → `auto_send: true`
- Les relances manuelles (webhook) → nécessite confirmation

## Étape 5: Ajouter Twilio pour WhatsApp

### Configuration Twilio Node

1. Ajoutez un node **"Twilio"** (installez depuis le marketplace si nécessaire)
2. Configurez les credentials Twilio :
   - **Account SID**: Votre Twilio Account SID
   - **Auth Token**: Votre Twilio Auth Token
   - **From**: Votre numéro WhatsApp Twilio (format: whatsapp:+14155238886)

3. **Operation**: "Send Message"
4. Configuration du message :

**To**: `{{ $json["client_phone"] }}` (format: whatsapp:+33612345678)

**Message Body**:
```
Bonjour {{ $json["client_name"] }},

Je vous contacte concernant votre facture {{ $json["facture_numero"] }} d'un montant de {{ $json["montant_ttc"] }} €.

La date d'échéance était le {{ $json["date_echeance"] }}.

Pourriez-vous nous confirmer le règlement ou nous contacter si vous avez des questions ?

Merci,
{{ $json["company_name"] }}
```

**Media URL** (optionnel, pour joindre le PDF de la facture):
- Vous pouvez générer le PDF et l'uploader, puis passer l'URL ici

## Étape 6: Ajouter Gmail pour Email

### Configuration Gmail Node

1. Ajoutez un node **"Gmail"** (installez depuis le marketplace si nécessaire)
2. Configurez les credentials Gmail (OAuth2)
3. **Operation**: "Send Email"

**To**: `{{ $json["client_email"] }}`

**Subject**: `Relance - Facture {{ $json["facture_numero"] }}`

**Email Body** (HTML ou Text):
```html
Bonjour {{ $json["client_name"] }},

Je vous contacte concernant votre facture <strong>{{ $json["facture_numero"] }}</strong> d'un montant de <strong>{{ $json["montant_ttc"] }} €</strong>.

La date d'échéance était le {{ $json["date_echeance"] }}.

Pourriez-vous nous confirmer le règlement ou nous contacter si vous avez des questions ?

Cordialement,<br>
{{ $json["company_name"] }}
```

**Attachments** (optionnel):
- Générer le PDF de la facture et l'attacher

## Étape 7: Split par méthode d'envoi

### Node "Switch" - Split by Method

Ajoutez un node **"Switch"** pour séparer WhatsApp et Email :

**Mode**: "Rules"

**Rules**:
1. **Rule 1**: 
   - **Value**: `{{ $json["method"] }}` ou `{{ $json["send_method"] }}`
   - **Operation**: equals
   - **Output**: "whatsapp" → Connecté à Twilio
   
2. **Rule 2**:
   - **Value**: `{{ $json["method"] }}`
   - **Operation**: equals  
   - **Output**: "email" → Connecté à Gmail

3. **Default**: Les deux (si vous voulez envoyer par les deux canaux)

## Étape 8: Configuration du Webhook pour recevoir les réponses

### Webhook Request Format

Votre API frontend doit envoyer à ce webhook :

```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "whatsapp" | "email" | "both",
  "user_confirmed": true,
  "template_relance_id": "uuid (optionnel)"
}
```

### Modifier le node "Parse Snapshot" pour accepter les deux inputs

Utilisez un node **"Merge"** pour combiner :
- Données du Schedule Trigger (automatique)
- Données du Webhook (manuel)

**Mode**: "Merge By Index" ou "Merge By Key"

## Étape 9: Enregistrer la relance dans Supabase

Après l'envoi réussi (Twilio ou Gmail), ajoutez un node pour enregistrer :

### Node "Execute Query" - Save Relance

```sql
INSERT INTO relances (
  tenant_id,
  facture_id,
  type,
  methode,
  statut,
  date_envoi,
  message,
  created_at
) VALUES (
  '{{ $json["tenant_id"] }}',
  '{{ $json["facture_id"] }}',
  'facture_en_retard',
  '{{ $json["method"] }}',
  'envoye',
  NOW(),
  '{{ $json["message"] }}',
  NOW()
);
```

## Étape 10: Envoyer la réponse dans la conversation LEO

Pour que la notification arrive dans la conversation WhatsApp avec LEO :

### Option A: Utiliser le même système de messages LEO

Ajoutez un node qui envoie un message dans la conversation LEO :

**Node "HTTP Request"** :
- **Method**: POST
- **URL**: Votre endpoint LEO chat (ex: `http://localhost:3000/api/leo/chat`)
- **Body**:
```json
{
  "message": "Relance envoyée pour la facture {{ $json["facture_numero"] }}",
  "conversationId": "{{ $json["conversation_id"] }}",
  "tenantId": "{{ $json["tenant_id"] }}"
}
```

### Option B: Utiliser Twilio directement vers la conversation LEO

Si vous avez le numéro WhatsApp du tenant, envoyez la notification :

```javascript
// Dans un node Code
const notification = `✅ Relance envoyée pour la facture ${$json.facture_numero} au client ${$json.client_name}`;

return {
  ...$json,
  notification_message: notification,
  send_to_tenant: true
};
```

Puis connectez à Twilio pour envoyer cette notification au tenant.

## Configuration complète du Workflow

### Ordre des nodes :

1. **Schedule Trigger** (8h) + **Webhook Trigger** (manuel)
2. **Merge** (combiner les deux triggers)
3. **Get Tenants To Notify**
4. **Loop Over Items**
5. **Get Relances Snapshot**
6. **Get Client Info** ⚠️ **NOUVEAU** (récupère email + téléphone)
7. **Enrich Relances Data** ⚠️ **NOUVEAU** (ajoute email/phone aux données)
8. **Parse Snapshot**
9. **OpenAI Chat Model**
10. **Postgres Chat Memory**
11. **IF User Confirmed**
    - **YES** → **Switch by Method**
      - **whatsapp** → **Twilio WhatsApp**
      - **email** → **Gmail Send**
    - **NO** → **Send Confirmation to LEO** (optionnel)
12. **Save Relance to DB**
13. **Send Notification to LEO Chat**
14. **Leo - Résumé Relances**

## Variables d'environnement nécessaires

Dans N8N Settings → Environment Variables :

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
LEO_CHAT_API_URL=https://your-domain.com/api/leo/chat
```

## Test du Workflow

### Test 1: Schedule Trigger (8h)
1. Déclenchez manuellement le Schedule Trigger
2. Vérifiez que "Get Client Info" récupère bien email et téléphone
3. Vérifiez que les données enrichies contiennent `client_email` et `client_phone`

### Test 2: Webhook Trigger
1. Envoyez une requête POST au webhook :
```bash
curl -X POST https://your-n8n.com/webhook/relances/send \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-id",
    "facture_id": "your-facture-id",
    "method": "whatsapp",
    "user_confirmed": true
  }'
```

### Test 3: Twilio WhatsApp
1. Vérifiez que le message arrive bien sur WhatsApp
2. Vérifiez le format du numéro (doit être `whatsapp:+33612345678`)

### Test 4: Gmail
1. Vérifiez que l'email arrive bien dans la boîte du client
2. Vérifiez que le PDF est bien attaché (si configuré)

## Résolution des problèmes

### ❌ Email/téléphone non récupérés

**Problème**: Le node "Get Client Info" ne récupère pas email/telephone

**Solution**: 
1. Vérifiez que la requête SQL fait bien un JOIN sur `clients`
2. Vérifiez que les colonnes `email` et `telephone` existent dans la table `clients`
3. Testez la requête directement dans Supabase SQL Editor

### ❌ Twilio erreur "Invalid phone number"

**Solution**: 
- Assurez-vous que le numéro est au format: `whatsapp:+33612345678`
- Le "+" et l'indicatif pays sont obligatoires

### ❌ Gmail erreur d'authentification

**Solution**:
1. Révoquez et recréez les credentials OAuth2 dans Google Cloud Console
2. Réautorisez l'accès dans N8N

## Prochaines étapes

- [ ] Ajouter le node "Get Client Info"
- [ ] Configurer Twilio
- [ ] Configurer Gmail
- [ ] Ajouter le Webhook Trigger
- [ ] Tester le workflow complet
- [ ] Configurer les notifications dans LEO Chat
