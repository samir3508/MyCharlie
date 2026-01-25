# send-devis

Edge Function qui envoie un devis par email via **Gmail API** (OAuth du tenant).

## Architecture

L'Edge Function appelle l'API Next.js `/api/email/send-gmail` qui a accès aux secrets Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) depuis les variables d'environnement Render.

Cela évite de dupliquer les secrets dans Supabase Edge Functions.

## Déploiement

Déjà déployée sur Supabase (version 3). Pour redéployer :

```bash
supabase functions deploy send-devis
```

## Secrets requis

1. **APP_URL** (obligatoire)  
   URL de l'app Next.js pour appeler `/api/email/send-gmail`.  
   - Dashboard Supabase : **Project Settings** → **Edge Functions** → **Secrets** → Ajouter `APP_URL`.  
   - Ou CLI :  
     ```bash
     supabase secrets set APP_URL=https://mycharlie.fr
     ```

## Prérequis

1. **L'app Next.js doit avoir les secrets Google OAuth sur Render** :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   
2. **Le tenant doit avoir connecté son compte Gmail** dans l'application :
   - Paramètres > Intégrations > Gmail > Connecter
   - La connexion OAuth est stockée dans `oauth_connections` (table Supabase)

## Corps de la requête

```json
{
  "tenant_id": "uuid",
  "devis_id": "uuid",
  "method": "email",
  "recipient_email": "client@example.com"
}
```

- `devis_id` : UUID du devis (le Code Tool convertit `DV-2026-0011` → UUID).
- `method` : `email` ou `whatsapp` (WhatsApp non implémenté).
- `recipient_email` : requis si `method === "email"`.
- `recipient_phone` : requis si `method === "whatsapp"`.

## Réponse succès

```json
{
  "success": true,
  "data": {
    "sent_at": "2026-01-24T20:00:00.000Z",
    "devis": { "id": "...", "numero": "DV-2026-0011", "montant_ttc": 1995 },
    "method": "email",
    "recipient": "client@example.com"
  },
  "message": "Email envoyé à client@example.com"
}
```

## Erreurs possibles

- **400 GMAIL_NOT_CONNECTED** : Gmail non connecté pour ce tenant. Connecter Gmail dans Paramètres > Intégrations.
- **401 GMAIL_TOKEN_INVALID** : Token Gmail invalide ou expiré. Reconnecter Gmail dans Paramètres > Intégrations.
- **502 API_ERROR** : Erreur lors de l'appel à l'API Next.js. Vérifier les logs Render et la connexion OAuth.
- **404 DEVIS_NOT_FOUND** : Devis introuvable ou `tenant_id` incorrect.

## Comment ça fonctionne

1. L'Edge Function récupère le devis et le client depuis Supabase
2. Génère l'email HTML avec lien PDF et signature
3. Appelle l'API Next.js `/api/email/send-gmail` avec les paramètres (tenant_id, to, subject, body, html_body)
4. L'API Next.js récupère la connexion Gmail du tenant depuis `oauth_connections`
5. Rafraîchit automatiquement le token OAuth si nécessaire (via `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` depuis Render)
6. Envoie via Gmail API (`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`)
7. L'Edge Function met à jour le devis (`statut = 'envoye'`, `date_envoi = aujourd'hui`)

**L'email est envoyé depuis la boîte Gmail de l'artisan connecté** (pas depuis un service tiers).

## Avantages de cette architecture

- ✅ Pas besoin de dupliquer les secrets Google OAuth dans Supabase
- ✅ Utilise l'infrastructure Gmail existante de l'app Next.js
- ✅ Réutilise le code de rafraîchissement des tokens déjà testé
- ✅ Plus simple à maintenir
