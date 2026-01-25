# 🔐 VARIABLES D'ENVIRONNEMENT - MyCharlie

Ce fichier documente toutes les variables d'environnement requises pour faire fonctionner MyCharlie.

Créez un fichier `.env.local` à la racine du projet avec ces variables.

---

## 📋 Variables requises

### Supabase (OBLIGATOIRE)

```bash
# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co

# Clé publique (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici

# Clé privée (service role key) - NE JAMAIS EXPOSER AU CLIENT
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ici
```

**Où trouver ces clés :**
1. Dashboard Supabase → Settings → API
2. Project URL = `NEXT_PUBLIC_SUPABASE_URL`
3. anon public = `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. service_role secret = `SUPABASE_SERVICE_ROLE_KEY`

---

### N8N - Agent LÉO (OBLIGATOIRE)

```bash
# URL du webhook N8N
N8N_MCP_ENDPOINT=https://votre-n8n.app.n8n.cloud/webhook/votre-webhook-id

# Token d'authentification N8N (optionnel mais recommandé)
N8N_MCP_TOKEN=votre-token-n8n-ici

# Méthode d'appel (ne pas changer)
N8N_MCP_METHOD=chat
```

**Où trouver ces informations :**
1. Dashboard N8N → Workflow LÉO
2. Cliquez sur le node "Chat Trigger" ou "Webhook"
3. Copiez le `Production URL`
4. Pour le token : Settings → Personal Access Tokens

---

### Google OAuth - Gmail + Calendar (OBLIGATOIRE)

```bash
# Client ID Google OAuth
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com

# Client Secret Google OAuth
GOOGLE_CLIENT_SECRET=votre-client-secret-ici

# URL de redirection après OAuth
GOOGLE_REDIRECT_URI=https://votre-domaine.com/api/oauth/google/callback
```

**Comment obtenir ces clés :**
1. Google Cloud Console → APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client ID
3. Type : Web application
4. Authorized redirect URIs :
   - `http://localhost:3000/api/oauth/google/callback` (dev)
   - `https://votre-domaine.com/api/oauth/google/callback` (prod)

---

### Twilio - WhatsApp (OPTIONNEL)

```bash
# Account SID Twilio
TWILIO_ACCOUNT_SID=votre-account-sid-ici

# Auth Token Twilio
TWILIO_AUTH_TOKEN=votre-auth-token-ici

# Numéro WhatsApp Twilio
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Comment obtenir ces clés :**
1. Twilio Console → Account
2. Account SID et Auth Token sur le dashboard
3. WhatsApp Sandbox ou Numéro dédié

---

### Resend - Emails (OPTIONNEL)

```bash
# API Key Resend pour envoi emails
RESEND_API_KEY=votre-resend-api-key-ici
```

**Comment obtenir cette clé :**
1. Resend Dashboard → API Keys
2. Create API Key

---

### Configuration générale

```bash
# Base URL de l'application (pour PDF et signature)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Mode environnement
NODE_ENV=development

# Mode debug (affiche logs détaillés)
NEXT_PUBLIC_DEBUG=false
```

---

## ⚠️ SÉCURITÉ

### Variables à NE JAMAIS exposer au client

Ces variables doivent UNIQUEMENT être utilisées côté serveur :
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `GOOGLE_CLIENT_SECRET`
- ❌ `TWILIO_AUTH_TOKEN`
- ❌ `N8N_MCP_TOKEN`
- ❌ `RESEND_API_KEY`

### Variables publiques (safe)

Ces variables peuvent être exposées au client :
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_BASE_URL`
- ✅ `NEXT_PUBLIC_DEBUG`

---

## 🔍 Vérification

### Vérifier que toutes les variables sont présentes

Lancez l'application et vérifiez la console :

```bash
npm run dev
```

Si des variables manquent, vous verrez des erreurs :
```
❌ Missing NEXT_PUBLIC_SUPABASE_URL
❌ Missing N8N_MCP_ENDPOINT
```

---

## 🚀 Environnements

### Development (local)

Fichier : `.env.local`
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### Staging

Fichier : `.env.staging` (ou variables Vercel)
```bash
NEXT_PUBLIC_BASE_URL=https://staging.mycharlie.fr
NODE_ENV=production
```

### Production

Fichier : `.env.production` (ou variables Vercel)
```bash
NEXT_PUBLIC_BASE_URL=https://mycharlie.fr
NODE_ENV=production
```

---

**Date de création :** 23 janvier 2026  
**Dernière mise à jour :** 23 janvier 2026
