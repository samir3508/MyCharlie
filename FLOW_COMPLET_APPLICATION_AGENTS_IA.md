# 🚀 FLOW COMPLET DE L'APPLICATION - Agents IA, Automatisations, Tout

## 📋 Vue d'ensemble

**MyCharlie** est un SaaS de gestion pour artisans du BTP avec **2 agents IA** :
- **LÉO** : Gère calendrier, RDV, visites, organisation
- **CHARLIE** : Gère devis, factures, paiements, relances

**Architecture :**
- **Frontend** : Next.js 16 (React, TypeScript)
- **Backend** : Supabase (PostgreSQL + Edge Functions)
- **Automatisation** : n8n (workflows)
- **IA** : OpenAI (via n8n AI Agent)
- **Communication** : WhatsApp (Twilio), Email (Gmail OAuth)

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard  │  │   Dossiers   │  │   Devis      │          │
│  │   Factures   │  │   RDV        │  │   Clients    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ API Routes
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │ Edge Funcs   │  │   Storage    │          │
│  │  (Database)  │  │  (Serverless) │  │   (PDFs)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Webhooks / API
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATISATION (n8n)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Agent LÉO   │  │ Agent CHARLIE│  │  Workflows   │          │
│  │  (OpenAI)    │  │  (OpenAI)    │  │  Automatiques│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Integrations
                            │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   WhatsApp   │  │    Gmail     │  │   OpenAI     │
│   (Twilio)   │  │   (OAuth)    │  │   (GPT-4)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🤖 LES AGENTS IA

### **1. LÉO - Agent Organisation & Calendrier**

**Rôle :**
- Gère le calendrier et les RDV
- Organise les visites
- Confirme les créneaux avec les clients
- Envoie les rappels

**Où il intervient :**
- **Workflow n8n** : `LÉO - Agent IA BTP avec leo-router`
- **Point d'entrée** : `/api/leo/chat` (Next.js API route)
- **Communication** : WhatsApp, Interface web

**Capacités :**
- Créer des RDV
- Confirmer des créneaux
- Envoyer des rappels
- Répondre aux questions sur le calendrier

**Outils disponibles :**
- `Code_Tool` : Accès à Supabase (CRUD complet)
- `execute_sql` : Requêtes SQL directes
- `Postgres Chat Memory` : Mémoire conversationnelle

**Exemple de conversation :**
```
Artisan : "Organise une visite pour M. Dupont demain à 14h"
LÉO : "Je vais créer le RDV et envoyer un email de confirmation"
  → Crée le RDV dans Supabase
  → Envoie email au client
  → Met à jour le dossier à 'rdv_planifie'
```

---

### **2. CHARLIE - Agent Devis & Factures**

**Rôle :**
- Prépare les devis (70-80% pré-rempli)
- Rédige les factures
- Envoie les documents
- Suit les paiements
- Gère les relances

**Où il intervient :**
- **Workflow n8n** : Workflow dédié Charlie (via Code Tool)
- **Actions** : `create-devis`, `envoyer-devis`, `create-facture`
- **Communication** : Via n8n workflows, pas de chat direct

**Capacités :**
- Lire les fiches de visite
- Générer des devis pré-remplis
- Calculer les montants (HT, TVA, TTC)
- Envoyer les devis par email
- Créer les factures depuis devis accepté
- Gérer les relances automatiques

**Exemple d'utilisation :**
```
Artisan : "Crée un devis pour le dossier DOS-2026-0001"
Charlie (via Code Tool) :
  → Lit la fiche de visite
  → Prépare le devis (lignes, montants)
  → Crée le devis dans Supabase
  → Met à jour le dossier à 'devis_en_cours'
```

---

## 🔄 FLOW COMPLET : Du Contact au Paiement

### **ÉTAPE 1 : Contact Initial** 📞

**Acteurs :** Client → Artisan

**Ce qui se passe :**
1. Client contacte l'artisan (WhatsApp, appel, email, etc.)
2. Artisan crée un **DOSSIER** dans l'interface
3. Système crée automatiquement le **CLIENT** si n'existe pas
4. Dossier créé avec :
   - `statut: 'contact_recu'` ou `'qualification'`
   - `source` : origine du contact
   - `montant_estime` : estimation rapide

**Fichiers concernés :**
- `src/lib/hooks/use-dossiers.ts` : `useCreateDossier()`
- `src/app/(dashboard)/dossiers/page.tsx` : Interface création

**Prochaine action :** "Planifier un RDV"

---

### **ÉTAPE 2 : Planification RDV** 📅

**Acteurs :** Artisan → LÉO (Agent IA) → Client

**Ce qui se passe :**

#### 2.1 Création du RDV
1. Artisan crée un **RDV** dans l'interface ou demande à LÉO
2. Si via LÉO :
   - LÉO reçoit la demande via `/api/leo/chat`
   - LÉO appelle `Code_Tool` avec action `create-rdv`
   - RDV créé dans Supabase
3. RDV contient :
   - `dossier_id` : lien vers le dossier
   - `client_id` : lien vers le client
   - `date_heure` : date et heure
   - `statut: 'planifie'` ou `'confirme'`

**Mise à jour automatique :**
- Dossier passe à `rdv_planifie` ou `rdv_confirme`

#### 2.2 Envoi de confirmation au client
1. LÉO génère un lien de confirmation unique
2. Lien envoyé par email (via Gmail OAuth) ou WhatsApp (via Twilio)
3. Client clique sur le lien → `/api/confirm-creneau`
4. Système :
   - Met à jour RDV : `statut = 'confirme'`
   - Met à jour dossier : `statut = 'rdv_confirme'`

**Fichiers concernés :**
- `src/lib/hooks/use-rdv.ts` : `useCreateRdv()`, `useUpdateRdv()`
- `src/app/api/confirm-creneau/route.ts` : Confirmation client
- `src/app/api/leo/chat/route.ts` : Interface LÉO
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Action `create-rdv`

**Prochaine action :** "Préparer la visite"

---

### **ÉTAPE 3 : Visite Réalisée** 🏠

**Acteurs :** Artisan (sur le terrain)

**Ce qui se passe :**

#### 3.1 RDV réalisé
1. Artisan marque le RDV comme `statut: 'realise'` dans l'interface
2. **Mise à jour automatique :**
   - Hook `useUpdateRdv()` détecte le changement
   - Dossier passe à `visite_realisee`

#### 3.2 Création de la Fiche de Visite
1. Artisan crée une **FICHE DE VISITE** dans l'interface
2. Fiche contient :
   - Observations
   - Mesures
   - Photos
   - Contraintes
   - `devis_a_faire_avant` : J+3 par défaut
3. **Mise à jour automatique :**
   - Hook `useCreateFicheVisite()` vérifie les conditions
   - Si pas de devis accepté → Dossier passe à `visite_realisee`
   - Si devis déjà accepté → Statut reste `signe` (protection)

**Fichiers concernés :**
- `src/lib/hooks/use-rdv.ts` : `useUpdateRdv()` (ligne 313-315)
- `src/lib/hooks/use-fiches-visite.ts` : `useCreateFicheVisite()` (ligne 117-152)

**Prochaine action :** "Créer le devis" ou "Envoyer le devis"

---

### **ÉTAPE 4 : Création du Devis** 📝

**Acteurs :** Artisan → CHARLIE (Agent IA)

**Ce qui se passe :**

#### 4.1 Création du devis
1. Artisan clique "Créer devis" dans l'interface
2. Ou demande à LÉO/CHARLIE via chat
3. Système crée un **DEVIS** :
   - `dossier_id` : lien vers le dossier
   - `client_id` : lien vers le client
   - `statut: 'brouillon'`
   - Lignes de devis (désignation, quantité, prix, TVA)
   - Montants calculés automatiquement

**Mise à jour automatique :**
- Dossier passe à `devis_en_cours`
- `devis_cree: true`

#### 4.2 Préparation par CHARLIE (optionnel)
- CHARLIE peut lire la fiche de visite
- CHARLIE pré-remplit le devis (70-80%)
- Artisan finalise et envoie

**Fichiers concernés :**
- `src/lib/hooks/use-devis.ts` : `useCreateDevis()` (ligne 256-268)
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Action `create-devis` (ligne 826-916)
- `src/app/(dashboard)/devis/new/page.tsx` : Interface création

**Prochaine action :** "Envoyer le devis"

---

### **ÉTAPE 5 : Envoi du Devis** 📤

**Acteurs :** Artisan → n8n Workflow → Gmail

**Ce qui se passe :**

1. Artisan clique "Envoyer le devis"
2. Système appelle le workflow n8n `envoyer-devis`
3. Workflow n8n :
   - Met à jour devis : `statut = 'envoye'`, `date_envoi = aujourd'hui`
   - Appelle Edge Function Supabase `send-devis`
   - Edge Function appelle `/api/email/send-gmail`
   - API Next.js :
     - Récupère token Gmail OAuth (ou refresh si expiré)
     - Envoie email avec PDF du devis
     - Met à jour `oauth_connections.last_error` si erreur
4. **Mise à jour automatique :**
   - Dossier passe à `devis_envoye`

**Fichiers concernés :**
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Action `envoyer-devis` (ligne 1000+)
- `supabase/functions/send-devis/index.ts` : Edge Function
- `src/app/api/email/send-gmail/route.ts` : API Gmail OAuth
- `src/lib/hooks/use-devis.ts` : `useUpdateDevisStatus()`

**Prochaine action :** "Relancer le client" (si +7 jours sans réponse)

---

### **ÉTAPE 6 : Acceptation du Devis** ✅

**Acteurs :** Client → Système

**Ce qui se passe :**

1. Client reçoit le devis par email
2. Client clique sur le lien de signature
3. Client signe le devis (via `/api/sign/[token]`)
4. Système :
   - Met à jour devis : `statut = 'accepte'`, `date_acceptation = aujourd'hui`
   - Met à jour dossier : `statut = 'signe'`
   - Génère PDF signé

**Fichiers concernés :**
- `src/app/api/sign/[token]/route.ts` : Signature client
- `src/lib/hooks/use-devis.ts` : Mise à jour statut

**Prochaine action :** "Démarrer le chantier"

---

### **ÉTAPE 7 : Chantier** 🔨

**Acteurs :** Artisan

**Ce qui se passe :**

#### 7.1 Démarrer le chantier
1. Artisan clique "Démarrer le chantier"
2. Système met à jour dossier : `statut = 'chantier_en_cours'`

#### 7.2 Terminer le chantier
1. Artisan clique "Terminer le chantier"
2. Système met à jour dossier : `statut = 'chantier_termine'`

**Fichiers concernés :**
- `src/app/(dashboard)/dossiers/[id]/page.tsx` : Boutons "Démarrer/Terminer chantier"
- `src/lib/hooks/use-dossiers.ts` : `useUpdateDossier()`

**Prochaine action :** "Créer la facture"

---

### **ÉTAPE 8 : Création des Factures** 💰

**Acteurs :** Artisan → CHARLIE (Agent IA)

**Ce qui se passe :**

1. Artisan clique "Créer facture" (depuis devis accepté)
2. Système crée une **FACTURE** :
   - `devis_id` : lien vers le devis accepté
   - `dossier_id` : lien vers le dossier (via devis)
   - Montants calculés selon template de paiement :
     - Acompte (si `pourcentage_acompte > 0`)
     - Intermédiaire (si `pourcentage_intermediaire > 0`)
     - Solde (si `pourcentage_solde > 0`)
3. **Mise à jour automatique :**
   - Dossier passe à `facture_a_creer` (si première facture)
   - Puis `facture_envoyee` (quand envoyée)

**Fichiers concernés :**
- `src/lib/hooks/use-factures.ts` : `useCreateFactureFromDevis()`
- `src/app/(dashboard)/factures/new/page.tsx` : Interface création

**Prochaine action :** "Relancer le paiement" (si en retard)

---

### **ÉTAPE 9 : Paiement de la Facture** 💳

**Acteurs :** Artisan

**Ce qui se passe :**

1. Artisan marque la facture comme `statut: 'payee'`
2. `date_paiement` est automatiquement remplie
3. **Mise à jour automatique :**
   - Si toutes les factures du devis payées → Devis passe à `statut: 'paye'`
   - Si toutes les factures du dossier payées → Dossier passe à `facture_payee`
   - Toutes les relances planifiées sont annulées

**Fichiers concernés :**
- `src/lib/hooks/use-factures.ts` : `useUpdateFactureStatus()` (ligne 189-225)
- `src/lib/utils/factures.ts` : `checkAndUpdateDevisStatus()`

**Prochaine action :** Aucune (dossier terminé)

---

## 🔄 AUTOMATISATIONS N8N

### **Workflow 1 : Agent LÉO (Chat)**

**Déclencheur :** Chat Trigger (WhatsApp ou Web)

**Flow :**
```
1. Message reçu (texte ou audio)
   ↓
2. Format message pour LÉO
   ↓
3. Extraction d'infos (client, travaux)
   ↓
4. AI Agent LÉO (OpenAI)
   - Utilise Code_Tool pour accéder à Supabase
   - Utilise Postgres Chat Memory pour contexte
   ↓
5. Format réponse
   ↓
6. Envoi réponse (WhatsApp ou Web)
```

**Fichiers :**
- `n8n-workflow-leo-complet.json` : Configuration workflow
- `src/app/api/leo/chat/route.ts` : API route Next.js
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Outil Code pour LÉO

---

### **Workflow 2 : Envoi Devis**

**Déclencheur :** Action `envoyer-devis` (via Code Tool)

**Flow :**
```
1. Code Tool appelle action 'envoyer-devis'
   ↓
2. Met à jour devis : statut = 'envoye'
   ↓
3. Appelle Edge Function Supabase 'send-devis'
   ↓
4. Edge Function appelle /api/email/send-gmail
   ↓
5. API Next.js :
   - Récupère token Gmail OAuth
   - Refresh token si expiré
   - Envoie email avec PDF
   ↓
6. Met à jour dossier : statut = 'devis_envoye'
```

**Fichiers :**
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Action `envoyer-devis`
- `supabase/functions/send-devis/index.ts` : Edge Function
- `src/app/api/email/send-gmail/route.ts` : API Gmail

---

### **Workflow 3 : Relances Automatiques**

**Déclencheur :** Schedule (tous les matins à 8h) ou Webhook (manuel)

**Flow :**
```
1. Récupère tenants à notifier
   ↓
2. Pour chaque tenant :
   - Récupère factures en retard
   - Récupère devis envoyés depuis +7 jours
   ↓
3. Pour chaque relance :
   - Récupère infos client (email, téléphone)
   - Parse snapshot (contexte)
   - AI Agent génère message de relance
   - Demande confirmation à l'artisan
   ↓
4. Si confirmé :
   - Envoie par WhatsApp (Twilio) OU
   - Envoie par Email (Gmail)
   ↓
5. Enregistre la relance dans Supabase
```

**Fichiers :**
- `docs/N8N_RELANCES_WORKFLOW_SETUP.md` : Configuration
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Actions relances

---

## 🔗 INTÉGRATIONS

### **1. Supabase (Backend)**

**Rôle :**
- Base de données PostgreSQL
- Edge Functions (serverless)
- Storage (PDFs)
- RLS (Row Level Security) pour isolation multi-tenant

**Tables principales :**
- `tenants` : Entreprises
- `clients` : Clients
- `dossiers` : Dossiers (colonne vertébrale)
- `rdv` : Rendez-vous
- `fiches_visite` : Fiches de visite
- `devis` : Devis
- `factures` : Factures
- `relances` : Relances
- `oauth_connections` : Connexions Gmail OAuth
- `n8n_chat_histories` : Historique conversations LÉO

**Edge Functions :**
- `send-devis` : Envoi devis par email
- `update-devis-statut` : Mise à jour statut devis
- `mark-facture-paid` : Marquer facture payée

---

### **2. n8n (Automatisation)**

**Rôle :**
- Workflows automatisés
- Agents IA (LÉO et CHARLIE)
- Intégrations externes (Twilio, Gmail, OpenAI)

**Workflows principaux :**
1. **Agent LÉO** : Chat conversationnel
2. **Envoi devis** : Automatisation envoi
3. **Relances** : Automatisation relances
4. **Rappels RDV** : Envoi rappels

**Code Tool :**
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Point d'entrée unique pour toutes les opérations CRUD
- Actions disponibles : `create-client`, `create-devis`, `envoyer-devis`, `create-facture`, etc.

---

### **3. Gmail OAuth (Email)**

**Rôle :**
- Envoi d'emails (devis, factures, relances)

**Flow :**
```
1. Artisan connecte son compte Gmail (OAuth)
   ↓
2. Token stocké dans oauth_connections
   ↓
3. Quand envoi email :
   - Récupère token depuis Supabase
   - Refresh token si expiré
   - Envoie email via Gmail API
   ↓
4. Met à jour last_error si erreur
```

**Fichiers :**
- `src/app/api/email/send-gmail/route.ts` : API Gmail OAuth
- `src/app/(dashboard)/settings/integrations/page.tsx` : Interface connexion

---

### **4. Twilio (WhatsApp)**

**Rôle :**
- Envoi de messages WhatsApp
- Communication avec LÉO

**Flow :**
```
1. Message WhatsApp reçu
   ↓
2. Webhook Twilio → n8n Chat Trigger
   ↓
3. LÉO traite le message
   ↓
4. Réponse envoyée via Twilio
```

---

### **5. OpenAI (IA)**

**Rôle :**
- Agents IA LÉO et CHARLIE
- Génération de réponses conversationnelles
- Préparation de devis

**Configuration :**
- Modèle : GPT-4
- Mémoire : PostgreSQL (n8n_chat_histories)
- Outils : Code Tool (accès Supabase)

---

## 📊 MISE À JOUR AUTOMATIQUE DES STATUTS

### **Règles automatiques :**

| Action | Fichier | Ligne | Résultat |
|--------|---------|-------|----------|
| RDV créé `planifie` | `use-rdv.ts` | 258 | Dossier → `rdv_planifie` |
| RDV créé `confirme` | `use-rdv.ts` | 256 | Dossier → `rdv_confirme` |
| Client confirme créneau | `confirm-creneau/route.ts` | 150+ | Dossier → `rdv_confirme` |
| RDV → `realise` | `use-rdv.ts` | 314 | Dossier → `visite_realisee` |
| Fiche visite créée | `use-fiches-visite.ts` | 143 | Dossier → `visite_realisee` (si conditions OK) |
| Devis créé | `use-devis.ts` | 263 | Dossier → `devis_en_cours` |
| Devis envoyé | `CODE_TOOL_N8N` | 1000+ | Dossier → `devis_envoye` |
| Devis accepté | `sign/[token]/route.ts` | - | Dossier → `signe` |
| Chantier démarré | `dossiers/[id]/page.tsx` | 160 | Dossier → `chantier_en_cours` |
| Chantier terminé | `dossiers/[id]/page.tsx` | 170 | Dossier → `chantier_termine` |
| Facture créée | `use-factures.ts` | - | Dossier → `facture_a_creer` |
| Facture payée (toutes) | `use-factures.ts` | 204 | Dossier → `facture_payee` |

---

## 🎯 PROCHAINE ACTION (Intelligence du système)

Le système calcule automatiquement la **prochaine action** pour chaque dossier selon cette priorité :

1. **Factures en retard** (urgent) → "Relancer le paiement"
2. **Devis signé sans facture** (haute) → "Créer la facture"
3. **Chantier en cours** → "Terminer le chantier"
4. **Chantier terminé** → "Créer la facture"
5. **Devis accepté** → "Démarrer le chantier"
6. **Visite réalisée sans devis** → "Créer le devis"
7. **Devis créé** → "Envoyer le devis"
8. **Devis envoyé +7 jours** → "Relancer le client"
9. **RDV à planifier** → "Planifier un RDV"
10. **RDV confirmé** → "Préparer la visite"

**Fichier :** `src/components/dossiers/prochaine-action.tsx`

---

## 🔄 FLOW VISUEL COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT CONTACTE ARTISAN                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ARTISAN CRÉE DOSSIER (Interface)               │
│              Statut : contact_recu                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ARTISAN DEMANDE RDV (Interface ou LÉO)              │
│         LÉO crée RDV via Code Tool                          │
│         Statut : rdv_planifie                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         CLIENT CONFIRME CRÉNEAU (Lien email/WhatsApp)            │
│         /api/confirm-creneau                                    │
│         Statut : rdv_confirme                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ARTISAN RÉALISE VISITE (Sur terrain)                  │
│         Marque RDV comme 'realise'                            │
│         Crée fiche de visite                                  │
│         Statut : visite_realisee                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ARTISAN CRÉE DEVIS (Interface)                        │
│         CHARLIE peut pré-remplir (70-80%)                    │
│         Statut : devis_en_cours                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ARTISAN ENVOIE DEVIS                                  │
│         n8n workflow → Edge Function → Gmail API             │
│         Statut : devis_envoye                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         CLIENT SIGNE DEVIS (Lien email)                      │
│         /api/sign/[token]                                    │
│         Statut : signe                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ARTISAN DÉMARRE CHANTIER                              │
│         Statut : chantier_en_cours                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ARTISAN TERMINE CHANTIER                              │
│         Statut : chantier_termine                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ARTISAN CRÉE FACTURE (Depuis devis accepté)          │
│         CHARLIE génère facture                               │
│         Statut : facture_a_creer → facture_envoyee           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         CLIENT PAYE FACTURE                                   │
│         Artisan marque comme payee                            │
│         Si toutes payées → Statut : facture_payee            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOSSIER TERMINÉ ✅                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ FICHIERS CLÉS PAR MODULE

### **Frontend (Next.js)**
- `src/app/(dashboard)/dossiers/` : Module dossiers
- `src/app/(dashboard)/rdv/` : Module RDV
- `src/app/(dashboard)/devis/` : Module devis
- `src/app/(dashboard)/factures/` : Module factures
- `src/app/(dashboard)/clients/` : Module clients

### **Hooks React Query**
- `src/lib/hooks/use-dossiers.ts` : Gestion dossiers
- `src/lib/hooks/use-rdv.ts` : Gestion RDV
- `src/lib/hooks/use-fiches-visite.ts` : Gestion fiches
- `src/lib/hooks/use-devis.ts` : Gestion devis
- `src/lib/hooks/use-factures.ts` : Gestion factures

### **API Routes**
- `src/app/api/leo/chat/route.ts` : Interface LÉO
- `src/app/api/confirm-creneau/route.ts` : Confirmation créneau
- `src/app/api/email/send-gmail/route.ts` : Envoi email Gmail
- `src/app/api/sign/[token]/route.ts` : Signature devis

### **Composants**
- `src/components/dossiers/prochaine-action.tsx` : Calcul prochaine action
- `src/components/dossiers/dossier-kanban.tsx` : Vue Kanban

### **n8n Code Tool**
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Point d'entrée unique CRUD

### **Supabase**
- `supabase/functions/send-devis/` : Edge Function envoi devis
- Migrations : `supabase/migrations/`

---

## ✅ RÉSUMÉ ULTRA SIMPLE

1. **Client contacte** → Artisan crée dossier
2. **LÉO organise** → RDV planifié et confirmé
3. **Visite réalisée** → Fiche créée
4. **CHARLIE prépare** → Devis créé et envoyé
5. **Client signe** → Devis accepté
6. **Chantier** → Démarré puis terminé
7. **CHARLIE génère** → Facture créée et envoyée
8. **Client paie** → Facture payée
9. **Dossier clôturé** → Tout est terminé

**Tout est automatique** : Les statuts se mettent à jour, les prochaines actions sont calculées, les relances sont planifiées.

---

**Dernière mise à jour :** 25 janvier 2026
