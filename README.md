# MyCharlie - Logiciel de Gestion BTP avec Agents IA

Application SaaS complète pour artisans du BTP avec 3 agents IA conversationnels (Manager, Charlie, LÉO).

## 🚀 Fonctionnalités principales

### Agents IA
- **Manager** : Router intelligent qui analyse les messages et route vers le bon agent
- **Charlie** : Agent commercial - Gestion clients, devis, factures, relances
- **LÉO** : Agent terrain - Gestion dossiers, RDV, planning, statistiques

### Modules
- **Clients** : CRUD complet avec stats (CA, nb devis/factures)
- **Dossiers** : 13 statuts, vue Kanban, 6 onglets détaillés, journal automatique
- **Devis** : Création, lignes, calculs auto, PDF, envoi Gmail, signature électronique
- **Factures** : Types (acompte/intermédiaire/solde), création depuis devis, relances auto
- **RDV/Agenda** : Vue calendrier, sync Google Calendar
- **Dashboard** : KPIs, graphiques CA, taux conversion

### Intégrations
- **Supabase** : Base de données PostgreSQL avec RLS
- **Google Calendar** : Synchronisation bidirectionnelle
- **Gmail** : Envoi automatique devis/factures avec PDF
- **Twilio** : WhatsApp (messages entrants/sortants)
- **N8N** : Orchestration agents IA

---

## 📋 Prérequis

- Node.js 20+
- npm ou pnpm
- Compte Supabase (gratuit)
- Compte N8N (gratuit)
- Compte Google (pour Gmail/Calendar)
- (Optionnel) Compte Twilio pour WhatsApp

---

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone <votre-repo>
cd my-leo-saas
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env.local` à la racine :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# N8N (Agent LÉO)
N8N_MCP_ENDPOINT=https://votre-n8n.app.n8n.cloud/webhook/votre-webhook-id
N8N_MCP_TOKEN=votre-token-n8n
N8N_MCP_METHOD=chat

# Google OAuth (Gmail + Calendar)
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_REDIRECT_URI=https://votre-domaine.com/api/oauth/google/callback

# Twilio (WhatsApp - Optionnel)
TWILIO_ACCOUNT_SID=votre-account-sid
TWILIO_AUTH_TOKEN=votre-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Email (pour notifications)
RESEND_API_KEY=votre-resend-api-key

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Configurer Supabase

#### A. Créer le projet Supabase

1. Allez sur https://supabase.com/dashboard
2. Créez un nouveau projet
3. Notez votre `Project URL` et `anon key`

#### B. Appliquer les migrations

**Option 1 : Via Supabase CLI (RECOMMANDÉ)**

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Appliquer toutes les migrations
supabase db push
```

**Option 2 : Via Supabase Dashboard**

1. Ouvrez `SQL Editor` dans le dashboard
2. Copiez et exécutez chaque fichier de `supabase/migrations/` dans l'ordre chronologique
3. Commencez par `20260113022327_create_base_tables_tenants_clients.sql`
4. Terminez par `20260123_add_missing_foreign_key_indexes.sql`

#### C. Activer les protections de sécurité

1. Dans `Authentication` → `Policies`
2. Activez **`Check against HaveIBeenPwned`**
3. Configurez la complexité minimale des mots de passe

### 5. Configurer N8N

#### A. Créer compte N8N

1. Allez sur https://n8n.io
2. Créez un compte gratuit
3. Créez un nouveau workflow

#### B. Importer le workflow LÉO

1. Dans N8N, cliquez sur `Import from File`
2. Importez `n8n-workflow-leo-complet.json`
3. Configurez les credentials :
   - **Supabase MCP** : Personal Access Token
   - **Gmail** : OAuth2
   - **Google Calendar** : OAuth2
   - **Twilio** : Account SID + Auth Token

#### C. Activer le workflow

1. Cliquez sur `Activate` (toggle en haut à droite)
2. Copiez le webhook URL
3. Mettez-le dans `.env.local` → `N8N_MCP_ENDPOINT`

### 6. Configurer Google OAuth

#### A. Créer projet Google Cloud

1. Allez sur https://console.cloud.google.com
2. Créez un nouveau projet "MyCharlie"
3. Activez les APIs :
   - Gmail API
   - Google Calendar API

#### B. Créer OAuth Credentials

1. `APIs & Services` → `Credentials`
2. `Create Credentials` → `OAuth 2.0 Client ID`
3. Type : `Web application`
4. Authorized redirect URIs :
   - `http://localhost:3000/api/oauth/google/callback` (dev)
   - `https://votre-domaine.com/api/oauth/google/callback` (prod)
5. Notez le `Client ID` et `Client Secret`

### 7. Lancer l'application

```bash
# Mode développement
npm run dev

# Ouvrir http://localhost:3000
```

---

## 🧪 Tests

### Lancer tous les tests

```bash
npm test
```

### Lancer les tests avec UI

```bash
npm run test:ui
```

### Lancer uniquement les tests de sécurité

```bash
npm run test:security
```

### Lancer uniquement les tests E2E

```bash
npm run test:e2e
```

### Voir la couverture de code

```bash
npm run test:coverage
```

---

## 📦 Déploiement

### Déploiement sur Vercel (RECOMMANDÉ)

1. **Connecter à Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Déployer**
   ```bash
   vercel --prod
   ```

3. **Configurer les variables d'environnement**
   - Dans Vercel Dashboard → Settings → Environment Variables
   - Ajouter toutes les variables de `.env.local`

### Déploiement sur Render

Voir `DEPLOY_INSTRUCTIONS.md` pour les instructions détaillées.

---

## 🏗️ Architecture

```
my-leo-saas/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── (auth)/            # Pages authentification
│   │   ├── (dashboard)/       # Pages principales (protégées)
│   │   └── api/               # API routes
│   ├── components/            # Composants React
│   │   ├── ui/                # shadcn/ui components
│   │   ├── clients/           # Composants clients
│   │   ├── dossiers/          # Composants dossiers
│   │   ├── devis/             # Composants devis
│   │   └── factures/          # Composants factures
│   ├── lib/                   # Utilitaires
│   │   ├── hooks/             # React hooks custom
│   │   ├── supabase/          # Client Supabase
│   │   ├── pdf/               # Génération PDF
│   │   └── mcp/               # Client MCP pour N8N
│   └── types/                 # Types TypeScript
├── supabase/
│   ├── migrations/            # Migrations SQL
│   └── functions/             # Edge Functions
├── tests/
│   ├── security/              # Tests de sécurité
│   └── e2e/                   # Tests end-to-end
├── mcp-server/                # Serveur MCP Supabase
└── docs/                      # Documentation
```

---

## 🔒 Sécurité

### RLS (Row Level Security)
- ✅ Activé sur toutes les tables
- ✅ Isolation tenant stricte
- ✅ Policies optimisées pour performance
- ✅ Fonctions SQL sécurisées avec `SET search_path`

### Authentification
- ✅ Supabase Auth avec sessions sécurisées
- ✅ Protection contre mots de passe compromis
- ✅ OAuth Google pour Gmail/Calendar

### Tests
- ✅ Tests d'isolation tenant
- ✅ Tests E2E workflow complet

---

## 📚 Documentation

- **Guide utilisateur** : `GUIDE_UTILISATEUR.md`
- **Instructions déploiement** : `DEPLOY_INSTRUCTIONS.md`
- **Appliquer corrections sécurité** : `../APPLIQUER_CORRECTIONS_SECURITE.md`
- **Audit complet** : `../AUDIT_COMPLET_VERIFIE_MCP.md`
- **Prompts agents IA** : `docs/LEO_PROMPT_N8N_FINAL.md`, `docs/CHARLIE_PROMPT_N8N_FINAL.md`

---

## 🐛 Résolution de problèmes

### Problème : RLS bloque l'accès aux données

**Solution :**
1. Vérifiez que vous êtes connecté
2. Vérifiez que votre `tenant_id` est correct :
   ```javascript
   const { data: tenant } = await supabase
     .from('tenants')
     .select('*')
     .eq('user_id', user.id)
     .single()
   ```
3. Vérifiez les policies RLS dans Supabase Dashboard

### Problème : PDF ne se génère pas

**Solution :**
1. Vérifiez que `NEXT_PUBLIC_BASE_URL` est correct
2. Vérifiez les logs : `http://localhost:3000/api/pdf/devis/[id]`
3. Vérifiez que le trigger `set_devis_pdf_url` est actif

### Problème : Agents IA ne répondent pas

**Solution :**
1. Vérifiez que N8N est actif
2. Vérifiez `N8N_MCP_ENDPOINT` dans `.env.local`
3. Vérifiez les logs N8N pour erreurs

---

## 🤝 Contribution

### Développement local

```bash
# Créer une branche
git checkout -b feature/ma-fonctionnalite

# Développer et tester
npm run dev
npm test

# Commit et push
git add .
git commit -m "feat: description de la fonctionnalité"
git push origin feature/ma-fonctionnalite
```

### Standards de code

- TypeScript strict
- ESLint pour le linting
- Prettier pour le formatage
- Commits conventionnels (feat:, fix:, docs:, etc.)

---

## 📝 Changelog

Voir `CHANGELOG.md` pour l'historique des versions.

---

## 📞 Support

- Email : support@mycharlie.fr
- Documentation : https://docs.mycharlie.fr
- Issues : https://github.com/votre-org/mycharlie/issues

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Version :** 0.1.0  
**Dernière mise à jour :** 23 janvier 2026
