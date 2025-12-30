# Edge Functions LÉO - Documentation API

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée
Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée
Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée
Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée

Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée



Architecture modulaire pour les Edge Functions utilisées par l'agent IA LÉO via n8n.

## Configuration

### Variables d'environnement

Ajouter dans Supabase Dashboard → Edge Functions → Secrets :

- `LEO_API_SECRET` : Secret partagé entre n8n et Supabase pour l'authentification Bearer Token

### Authentification

Toutes les requêtes doivent inclure un header `Authorization` :

```
Authorization: Bearer <LEO_API_SECRET>
```

## Endpoints

### POST /search-client

Recherche un client par email, téléphone, ou nom/prénom.

**Request:**
```json
{
  "tenant_id": "uuid",
  "query": "nom ou email ou téléphone"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 client(s) trouvé(s)",
  "data": {
    "clients": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "adresse_facturation": "123 Rue Example",
        "type": "particulier"
      }
    ]
  }
}
```

**Priorité de recherche:**
1. Email (si query contient `@`)
2. Téléphone (si query contient au moins 8 chiffres)
3. Nom/prénom (recherche fuzzy)

---

### POST /create-client

Crée un nouveau client avec validation et vérification de doublons.

**Request:**
```json
{
  "tenant_id": "uuid",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "adresse_facturation": "123 Rue Example, 75001 Paris",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "type": "particulier",
  "notes": "Client VIP"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": {
    "client_id": "uuid",
    "created": true,
    "client": {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "adresse_facturation": "123 Rue Example, 75001 Paris",
      "type": "particulier"
    }
  }
}
```

**Erreurs possibles:**
- `409 DUPLICATE_CLIENT` : Un client avec cet email ou téléphone existe déjà

---

### POST /create-devis

Crée un devis (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-devis`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "titre": "Devis rénovation",
  "description": "Rénovation complète",
  "adresse_chantier": "123 Rue Example, 75001 Paris",
  "delai_execution": "10 jours",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "devis_id": "uuid",
    "numero": "DV-2025-012",
    "template_paiement_id": "uuid"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- Le template de paiement est sélectionné avec un montant par défaut (sera mis à jour lors de la finalisation)

---

### POST /add-ligne-devis

Ajoute une ou plusieurs lignes à un devis existant.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    },
    {
      "designation": "Enduit",
      "quantite": 30,
      "unite": "m²",
      "prix_unitaire_ht": 15.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 2,
    "montants": {
      "ht": 1700.0,
      "tva": 170.0,
      "ttc": 1870.0
    }
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch pour de meilleures performances
- L'ordre est géré automatiquement (continue après la dernière ligne existante)

---

### POST /finalize-devis

Finalise un devis en calculant les totaux globaux et en sélectionnant le template de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis finalisé avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "template_paiement_id": "uuid",
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 NO_LIGNES` : Le devis ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Sélectionne automatiquement le template de conditions de paiement selon le montant TTC
- Met à jour le devis avec les totaux et le template

---

### POST /send-devis

Envoie un devis par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Devis envoyé par email",
  "data": {
    "devis_id": "uuid",
    "sent_at": "2025-01-15T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas
- `400 INVALID_STATUS` : Le devis ne peut pas être envoyé (déjà accepté/refusé)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoye` et la date d'envoi
- La génération PDF et l'envoi réel seront implémentés plus tard

---

## Exemples d'utilisation

### Workflow complet de création de devis

```bash
# 1. Rechercher le client
curl -X POST https://<project>.supabase.co/functions/v1/search-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "query": "jean.dupont@example.com"}'

# 2. Créer le client si non trouvé
curl -X POST https://<project>.supabase.co/functions/v1/create-client \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "adresse_facturation": "123 Rue Example"
  }'

# 3. Créer le devis
curl -X POST https://<project>.supabase.co/functions/v1/create-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "adresse_chantier": "123 Rue Example",
    "delai_execution": "10 jours"
  }'

# 4. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 5. Finaliser le devis
curl -X POST https://<project>.supabase.co/functions/v1/finalize-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "devis_id": "uuid"}'

# 6. Envoyer le devis (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-devis \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "devis_id": "uuid",
    "method": "email"
  }'
```

---

## Endpoints Factures

### POST /create-facture

Crée une facture (sans lignes). Les lignes doivent être ajoutées via `/add-ligne-facture`.

**Request:**
```json
{
  "tenant_id": "uuid",
  "client_id": "uuid",
  "devis_id": "uuid (optionnel)",
  "titre": "Facture rénovation",
  "description": "Facture pour travaux",
  "date_emission": "2025-01-18 (optionnel, défaut: aujourd'hui)",
  "date_echeance": "2025-02-17 (optionnel, défaut: date_emission + 30 jours)",
  "notes": "Urgent"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture créée avec succès",
  "data": {
    "facture_id": "uuid",
    "numero": "FAC-2025-001",
    "date_emission": "2025-01-18",
    "date_echeance": "2025-02-17"
  }
}
```

**Erreurs possibles:**
- `404 CLIENT_NOT_FOUND` : Le client spécifié n'existe pas
- `404 DEVIS_NOT_FOUND` : Le devis spécifié n'existe pas (si devis_id fourni)

**Notes:**
- Le titre et la description sont générés automatiquement si manquants
- La date d'émission est aujourd'hui si absente
- La date d'échéance est date_emission + 30 jours par défaut

---

### POST /add-ligne-facture

Ajoute une ou plusieurs lignes à une facture existante.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "lignes": [
    {
      "designation": "Peinture murs",
      "description_detaillee": "Peinture acrylique mat",
      "quantite": 50,
      "unite": "m²",
      "prix_unitaire_ht": 25.0,
      "tva_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "1 ligne(s) ajoutée(s) avec succès",
  "data": {
    "lignes_created": 1,
    "montants": {
      "ht": 1250.0,
      "tva": 125.0,
      "ttc": 1375.0
    }
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas

**Notes:**
- Les montants (HT, TVA, TTC) sont calculés automatiquement pour chaque ligne
- Les lignes sont insérées en batch
- L'ordre est géré automatiquement

---

### POST /finalize-facture

Finalise une facture en calculant les totaux globaux.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture finalisée avec succès",
  "data": {
    "montants": {
      "ht": 3200.0,
      "tva": 320.0,
      "ttc": 3520.0
    },
    "statut": "brouillon"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 NO_LIGNES` : La facture ne contient aucune ligne

**Notes:**
- Calcule les totaux globaux à partir de toutes les lignes
- Met à jour la facture avec les totaux

---

### POST /send-facture

Envoie une facture par email ou WhatsApp (optionnel - pour l'instant met juste à jour le statut).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture envoyée par email",
  "data": {
    "facture_id": "uuid",
    "sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com",
    "statut": "envoyee"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : La facture ne peut pas être envoyée (déjà payée)
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Met à jour le statut à `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### POST /mark-facture-paid

Marque une facture comme payée et enregistre la date de paiement.

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "date_paiement": "2025-01-18 (optionnel, défaut: aujourd'hui)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Facture marquée comme payée avec succès",
  "data": {
    "facture_id": "uuid",
    "statut": "payee",
    "date_paiement": "2025-01-18"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 ALREADY_PAID` : La facture est déjà marquée comme payée

**Notes:**
- Met à jour le statut à `payee`
- Enregistre la date de paiement

---

### POST /send-relance

Envoie une relance pour une facture en retard (optionnel).

**Request:**
```json
{
  "tenant_id": "uuid",
  "facture_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com",
  "recipient_phone": "0612345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Relance envoyée par email",
  "data": {
    "facture_id": "uuid",
    "relance_sent_at": "2025-01-18T10:30:00.000Z",
    "method": "email",
    "recipient": "client@example.com"
  }
}
```

**Erreurs possibles:**
- `404 FACTURE_NOT_FOUND` : La facture spécifiée n'existe pas
- `400 INVALID_STATUS` : Impossible d'envoyer une relance (facture payée)
- `400 NOT_OVERDUE` : La date d'échéance n'est pas encore dépassée
- `400 MISSING_EMAIL` : Email manquant pour envoi par email
- `400 MISSING_PHONE` : Téléphone manquant pour envoi par WhatsApp

**Notes:**
- Vérifie que la date d'échéance est dépassée
- Met à jour le statut à `en_retard` si la facture était `envoyee`
- La génération PDF et l'envoi réel seront implémentés plus tard

---

### Workflow complet de création de facture

```bash
# 1. Créer la facture
curl -X POST https://<project>.supabase.co/functions/v1/create-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "client_id": "uuid",
    "date_emission": "2025-01-18"
  }'

# 2. Ajouter les lignes
curl -X POST https://<project>.supabase.co/functions/v1/add-ligne-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "lignes": [
      {
        "designation": "Peinture",
        "quantite": 50,
        "unite": "m²",
        "prix_unitaire_ht": 25.0,
        "tva_pct": 10
      }
    ]
  }'

# 3. Finaliser la facture
curl -X POST https://<project>.supabase.co/functions/v1/finalize-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'

# 4. Envoyer la facture (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/send-facture \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid",
    "facture_id": "uuid",
    "method": "email"
  }'

# 5. Marquer comme payée (optionnel)
curl -X POST https://<project>.supabase.co/functions/v1/mark-facture-paid \
  -H "Authorization: Bearer <LEO_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "facture_id": "uuid"}'
```

## Codes d'erreur

- `UNAUTHORIZED` : Token manquant ou invalide
- `VALIDATION_ERROR` : Erreur de validation des données (Zod)
- `CLIENT_NOT_FOUND` : Client introuvable
- `DEVIS_NOT_FOUND` : Devis introuvable
- `FACTURE_NOT_FOUND` : Facture introuvable
- `DUPLICATE_CLIENT` : Client déjà existant
- `FOREIGN_KEY_VIOLATION` : Violation de contrainte de clé étrangère
- `NO_LIGNES` : Aucune ligne dans le devis/facture
- `INVALID_STATUS` : Statut invalide pour l'opération demandée
- `ALREADY_PAID` : Facture déjà payée
- `NOT_OVERDUE` : Date d'échéance non dépassée
- `DATABASE_ERROR` : Erreur de base de données
- `METHOD_NOT_ALLOWED` : Méthode HTTP non autorisée