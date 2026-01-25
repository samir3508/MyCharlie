# 🔄 FLOW COMPLET DU SYSTÈME LÉO - Guide Complet

## 📋 Vue d'ensemble

**LÉO** est un SaaS de gestion pour artisans avec **le DOSSIER comme colonne vertébrale**. Tout est lié au dossier : clients, RDV, fiches de visite, devis, factures, relances.

---

## 🏗️ ARCHITECTURE : Le Dossier = Colonne Vertébrale

```
┌─────────────────────────────────────────────────────────────┐
│                    DOSSIER (Colonne vertébrale)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  CLIENT  │  │    RDV    │  │  FICHE   │  │  DEVIS   │   │
│  │          │  │           │  │  VISITE  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ FACTURES │  │ RELANCES │  │ JOURNAL  │                  │
│  │          │  │          │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLOW COMPLET : Du Contact au Paiement

### **ÉTAPE 1 : Contact Initial** 📞

**Statut dossier :** `contact_recu` ou `qualification`

**Ce qui se passe :**
- Un client contacte l'artisan (WhatsApp, Instagram, appel, email, site web, bouche-à-oreille)
- Un **DOSSIER** est créé avec :
  - `client_id` : lien vers le client (créé automatiquement si n'existe pas)
  - `statut: 'contact_recu'` ou `'qualification'`
  - `source` : origine du contact
  - `montant_estime` : estimation rapide
  - `date_contact` : date du premier contact

**Prochaine action :** "Planifier un RDV"

---

### **ÉTAPE 2 : Planification RDV** 📅

**Statut dossier :** `rdv_a_planifier` → `rdv_planifie` → `rdv_confirme`

**Ce qui se passe :**

#### 2.1 Création du RDV
- L'artisan crée un **RDV** lié au dossier
- Le RDV contient :
  - `dossier_id` : lien vers le dossier
  - `client_id` : lien vers le client
  - `date_heure` : date et heure du rendez-vous
  - `type_rdv` : 'visite', 'appel', 'chantier', 'reunion', 'signature', 'autre'
  - `statut: 'planifie'` ou `'confirme'`

**Mise à jour automatique du dossier :**
- Si RDV créé avec `statut: 'planifie'` → dossier passe à `rdv_planifie`
- Si RDV créé avec `statut: 'confirme'` → dossier passe à `rdv_confirme`

#### 2.2 Client confirme le créneau
- Le client clique sur le lien de confirmation (via `/api/confirm-creneau`)
- Le RDV passe à `statut: 'confirme'`
- **Mise à jour automatique :** dossier passe à `rdv_confirme`

**Prochaine action :** "Préparer la visite" (si RDV dans le futur)

---

### **ÉTAPE 3 : Visite Réalisée** 🏠

**Statut dossier :** `visite_realisee`

**Ce qui se passe :**

#### 3.1 RDV réalisé
- L'artisan marque le RDV comme `statut: 'realise'`
- **Mise à jour automatique :** dossier passe à `visite_realisee`

#### 3.2 Création de la Fiche de Visite
- L'artisan crée une **FICHE DE VISITE** liée au dossier
- La fiche contient :
  - `dossier_id` : lien vers le dossier
  - `rdv_id` : lien vers le RDV (optionnel)
  - Informations de la visite (observations, mesures, photos, etc.)
  - `devis_a_faire_avant` : date limite pour créer le devis (J+3 par défaut)

**Mise à jour automatique du dossier :**
- Si **PAS de devis accepté** ET statut ≠ `signe` → dossier passe à `visite_realisee`
- Si devis déjà accepté → statut reste `signe` (ne pas écraser)

**Prochaine action :** "Créer le devis" (si pas de devis) ou "Finaliser le devis" (si devis en brouillon)

---

### **ÉTAPE 4 : Création du Devis** 📝

**Statut dossier :** `devis_en_cours` → `devis_pret` → `devis_envoye`

**Ce qui se passe :**

#### 4.1 Création du devis
- L'artisan crée un **DEVIS** lié au dossier
- Le devis contient :
  - `dossier_id` : lien vers le dossier
  - `client_id` : lien vers le client
  - `statut: 'brouillon'`
  - Lignes de devis (désignation, quantité, prix unitaire, TVA)
  - Montants (HT, TVA, TTC)

**Mise à jour automatique du dossier :**
- Dossier passe à `devis_en_cours`
- `devis_cree: true`

#### 4.2 Devis prêt
- L'artisan finalise le devis → `statut: 'pret'`
- **Mise à jour automatique :** dossier passe à `devis_pret`

#### 4.3 Envoi du devis
- L'artisan envoie le devis au client (via n8n workflow `envoyer-devis`)
- Le devis passe à `statut: 'envoye'`
- `date_envoi` est automatiquement remplie
- **Mise à jour automatique :** dossier passe à `devis_envoye`

**Prochaine action :** 
- "Envoyer le devis" (si statut = `pret`)
- "Relancer le client" (si devis envoyé depuis +7 jours)

---

### **ÉTAPE 5 : Acceptation du Devis** ✅

**Statut dossier :** `signe`

**Ce qui se passe :**

#### 5.1 Client accepte le devis
- Le client signe le devis (via lien de signature)
- Le devis passe à `statut: 'accepte'`
- `date_acceptation` est automatiquement remplie

**Mise à jour automatique du dossier :**
- Dossier passe à `signe`

**Prochaine action :** "Créer la facture" (si pas de facture)

---

### **ÉTAPE 6 : Création des Factures** 💰

**Statut dossier :** `facture_a_creer` → `facture_envoyee`

**Ce qui se passe :**

#### 6.1 Création de la facture
- L'artisan crée une **FACTURE** liée au devis accepté
- La facture peut être :
  - **Acompte** : si template de paiement avec `pourcentage_acompte > 0`
  - **Intermédiaire** : si template avec `pourcentage_intermediaire > 0`
  - **Solde** : si template avec `pourcentage_solde > 0`
- La facture contient :
  - `devis_id` : lien vers le devis accepté
  - `dossier_id` : lien vers le dossier (via le devis)
  - `statut: 'brouillon'` ou `'envoyee'`
  - Montants calculés automatiquement selon le template

**Mise à jour automatique du dossier :**
- Dossier passe à `facture_a_creer` (si première facture)
- Puis `facture_envoyee` (quand facture envoyée)

#### 6.2 Envoi de la facture
- La facture est envoyée au client
- `statut: 'envoyee'`
- `date_emission` et `date_echeance` sont définies

**Prochaine action :** 
- "Relancer le paiement" (si facture en retard)
- Attendre le paiement

---

### **ÉTAPE 7 : Paiement de la Facture** 💳

**Statut dossier :** `facture_payee`

**Ce qui se passe :**

#### 7.1 Facture payée
- L'artisan marque la facture comme `statut: 'payee'`
- `date_paiement` est automatiquement remplie

**Mise à jour automatique :**

1. **Devis :**
   - Si **toutes les factures** du devis sont payées → devis passe à `statut: 'paye'`

2. **Dossier :**
   - Si **toutes les factures** du dossier sont payées → dossier passe à `facture_payee`

3. **Relances :**
   - Toutes les relances planifiées pour cette facture sont automatiquement annulées (`statut: 'annule'`)

**Prochaine action :** Aucune (dossier terminé)

---

## 🔄 MISE À JOUR AUTOMATIQUE DES STATUTS

### **Règles automatiques :**

#### **RDV → Dossier**
| Action RDV | Statut RDV | Statut Dossier |
|-----------|------------|----------------|
| Création RDV | `planifie` | `rdv_planifie` |
| Création RDV | `confirme` | `rdv_confirme` |
| Client confirme créneau | `confirme` | `rdv_confirme` |
| RDV réalisé | `realise` | `visite_realisee` |

**Fichiers :**
- `src/lib/hooks/use-rdv.ts` : `useCreateRdv()`, `useUpdateRdv()`
- `src/app/api/confirm-creneau/route.ts` : confirmation client

---

#### **Fiche de Visite → Dossier**
| Action | Condition | Statut Dossier |
|--------|-----------|----------------|
| Création fiche | Pas de devis accepté ET statut ≠ `signe` | `visite_realisee` |
| Création fiche | Devis déjà accepté OU statut = `signe` | **Ne change pas** (reste `signe`) |

**Fichier :** `src/lib/hooks/use-fiches-visite.ts` : `useCreateFicheVisite()`

---

#### **Devis → Dossier**
| Action Devis | Statut Devis | Statut Dossier |
|--------------|--------------|---------------|
| Création devis | `brouillon` | `devis_en_cours` (+ `devis_cree: true`) |
| Devis prêt | `pret` | `devis_pret` |
| Devis envoyé | `envoye` | `devis_envoye` |
| Devis accepté | `accepte` | `signe` |

**Fichiers :**
- `src/lib/hooks/use-devis.ts` : `useCreateDevis()`
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : création via n8n

---

#### **Facture → Devis → Dossier**
| Action Facture | Condition | Statut Devis | Statut Dossier |
|----------------|-----------|--------------|---------------|
| Facture payée | Toutes factures payées | `paye` | `facture_payee` |
| Facture créée | Première facture | - | `facture_a_creer` |
| Facture envoyée | - | - | `facture_envoyee` |

**Fichiers :**
- `src/lib/hooks/use-factures.ts` : `useUpdateFactureStatus()`
- `src/lib/utils/factures.ts` : `checkAndUpdateDevisStatus()`

---

## 📊 STATUTS POSSIBLES

### **Dossier** (17 statuts)
```
contact_recu          → Qualification
qualification         → Qualification
rdv_a_planifier       → Planification RDV
rdv_planifie          → RDV planifié
rdv_confirme          → RDV confirmé par client
visite_realisee       → Visite faite (fiche créée)
devis_en_cours        → Devis en création
devis_pret            → Devis prêt à envoyer
devis_envoye          → Devis envoyé au client
en_negociation        → Négociation en cours
signe                 → Devis accepté/signé
perdu                 → Dossier perdu
annule                → Dossier annulé
facture_a_creer       → Facture à créer
facture_envoyee       → Facture envoyée
facture_en_retard     → Facture en retard
facture_payee         → Toutes factures payées
```

### **RDV** (6 statuts)
```
planifie  → RDV planifié
confirme  → RDV confirmé par client
en_cours  → RDV en cours
realise   → RDV réalisé
annule    → RDV annulé
reporte   → RDV reporté
```

### **Devis** (7 statuts)
```
brouillon      → Devis en brouillon
en_preparation → Devis en préparation
pret           → Devis prêt à envoyer
envoye         → Devis envoyé au client
accepte        → Devis accepté/signé
refuse         → Devis refusé
expire         → Devis expiré
```

### **Facture** (4 statuts)
```
brouillon  → Facture en brouillon
envoyee     → Facture envoyée
payee       → Facture payée
en_retard   → Facture en retard
```

---

## 🎯 PROCHAINE ACTION (Intelligence du système)

Le système calcule automatiquement la **prochaine action** pour chaque dossier selon cette priorité :

### **Priorité 1 : Factures en retard** 🔴
- Si facture `en_retard` OU facture `envoyee` avec `date_echeance` passée
- **Action :** "Relancer le paiement"
- **Urgence :** `urgente`

### **Priorité 2 : Devis signé sans facture** 🟠
- Si devis `accepte` ou `signe` ET aucune facture
- **Action :** "Créer la facture"
- **Urgence :** `haute`

### **Priorité 3 : Visite réalisée** 🟡
- Si `statut = visite_realisee` OU fiche de visite existe
- **Sous-cas 3.1 :** Pas de devis → **Action :** "Créer le devis"
- **Sous-cas 3.2 :** Devis en brouillon → **Action :** "Finaliser le devis"
- **Sous-cas 3.3 :** Devis prêt → **Action :** "Envoyer le devis"
- **Sous-cas 3.4 :** Devis envoyé depuis +7 jours → **Action :** "Relancer le client"

### **Priorité 4 : Devis prêt** 🔵
- Si devis `pret` (cas général, pas visite réalisée)
- **Action :** "Envoyer le devis"
- **Urgence :** `normale`

### **Priorité 5 : Devis envoyé** 🟣
- Si devis `envoye` depuis +7 jours
- **Action :** "Relancer le client"
- **Urgence :** `normale`

### **Priorité 6 : RDV à planifier** 🟣
- Si `statut = contact_recu` ou `qualification` ou `rdv_a_planifier` ET pas de RDV
- **Action :** "Planifier un RDV"
- **Urgence :** `normale`

### **Priorité 7 : RDV confirmé** 🟢
- Si RDV `confirme` ET date dans le futur ET **PAS de fiche de visite**
- **Action :** "Préparer la visite"
- **Urgence :** `normale`
- **Note :** Si fiche de visite existe, on ne propose pas cette action (visite déjà faite)

**Fichier :** `src/components/dossiers/prochaine-action.tsx`

---

## 📧 RELANCES AUTOMATIQUES

### **Relances Devis**
- Déclenchées par n8n workflows
- Si devis envoyé depuis +7 jours → relance automatique
- Types : email, WhatsApp, SMS, appel

### **Relances Factures**
- Déclenchées automatiquement si facture en retard
- Annulées automatiquement si facture payée
- Types : email, WhatsApp, SMS, appel

**Table :** `relances`
- `facture_id` : lien vers la facture
- `devis_id` : lien vers le devis
- `type` : 'email', 'whatsapp', 'sms', 'call'
- `statut` : 'planifie', 'envoye', 'reussi', 'echoue'

---

## 🔗 RELATIONS ENTRE TABLES

### **Schéma de relations :**

```
tenants (1) ──┐
              │
              ├──> clients (N)
              │      │
              │      ├──> dossiers (N) ──┐
              │      │                    │
              │      └──> devis (N)       │
              │      └──> factures (N)     │
              │                            │
              ├──> rdv (N) ───────────────┤
              │      │                     │
              │      └──> dossiers (1) ────┤
              │                            │
              ├──> fiches_visite (N) ──────┤
              │      │                     │
              │      └──> dossiers (1) ────┤
              │                            │
              ├──> relances (N)            │
              │      │                     │
              │      ├──> factures (1)     │
              │      └──> devis (1)        │
              │                            │
              └──> journal_dossier (N) ────┘
                     │
                     └──> dossiers (1)
```

### **Clés étrangères principales :**

- `dossiers.client_id` → `clients.id`
- `rdv.dossier_id` → `dossiers.id`
- `rdv.client_id` → `clients.id`
- `fiches_visite.dossier_id` → `dossiers.id`
- `fiches_visite.rdv_id` → `rdv.id` (optionnel)
- `devis.dossier_id` → `dossiers.id`
- `devis.client_id` → `clients.id`
- `factures.devis_id` → `devis.id`
- `factures.dossier_id` → `dossiers.id` (via devis)
- `relances.facture_id` → `factures.id`
- `relances.devis_id` → `devis.id`
- `journal_dossier.dossier_id` → `dossiers.id`

---

## 🤖 AUTOMATISATION N8N

### **Workflows principaux :**

1. **`envoyer-devis`**
   - Envoie le devis par email (via Gmail OAuth)
   - Met à jour `devis.statut = 'envoye'`
   - Met à jour `devis.date_envoi`
   - Met à jour `dossier.statut = 'devis_envoye'`

2. **`create-devis`** (via Code Tool)
   - Crée un devis depuis n8n
   - Met à jour `dossier.statut = 'devis_en_cours'`
   - Met à jour `dossier.devis_cree = true`

3. **Relances automatiques**
   - Déclenchées par cron jobs
   - Envoient des relances pour devis/factures en retard

**Fichier :** `CODE_TOOL_N8N_COMPLET_FINAL.js`

---

## 📱 INTERFACE UTILISATEUR

### **Vues principales :**

1. **Dashboard Dossiers** (`/dossiers`)
   - Liste des dossiers avec filtres
   - Vue Kanban (Nouveaux, RDV, Visite, Devis, Gagnés, Perdus)
   - Vue Timeline
   - Stats globales

2. **Détail Dossier** (`/dossiers/[id]`)
   - **Onglet Overview :**
     - Carte "Résumé du dossier" (stats RDV, Fiches, Devis, Factures, montants)
     - Carte "Prochaine action" (action prioritaire avec bouton)
     - Timeline du dossier
   - **Onglet RDV :** Liste des RDV liés
   - **Onglet Fiches :** Liste des fiches de visite
   - **Onglet Devis :** Liste des devis
   - **Onglet Factures :** Liste des factures
   - **Onglet Journal :** Historique des actions

3. **Module RDV** (`/rdv`)
   - Agenda (Aujourd'hui, Semaine, Mois)
   - Liste des RDV
   - Création/modification RDV

4. **Module Devis** (`/devis`)
   - Liste des devis
   - Vue Kanban (Brouillon, En prépa, Envoyé, Accepté, Refusé)
   - Vue Timeline
   - Détail devis avec signature client

5. **Module Factures** (`/factures`)
   - Liste des factures
   - Création facture depuis devis accepté

---

## 🔍 POINTS CLÉS À RETENIR

1. **Le DOSSIER est la colonne vertébrale** : Tout est lié au dossier
2. **Mises à jour automatiques** : Les statuts se mettent à jour automatiquement selon les actions
3. **Prochaine action intelligente** : Le système calcule toujours la prochaine action prioritaire
4. **Journal automatique** : Toutes les actions sont enregistrées dans `journal_dossier` (via triggers Supabase)
5. **Relances automatiques** : Les relances sont planifiées et annulées automatiquement
6. **Intégration n8n** : Les workflows n8n déclenchent les actions (envoi devis, relances, etc.)

---

## 🛠️ FICHIERS CLÉS

### **Hooks React Query (mises à jour automatiques) :**
- `src/lib/hooks/use-dossiers.ts` : Gestion dossiers
- `src/lib/hooks/use-rdv.ts` : Gestion RDV + mise à jour dossier
- `src/lib/hooks/use-fiches-visite.ts` : Gestion fiches + mise à jour dossier
- `src/lib/hooks/use-devis.ts` : Gestion devis + mise à jour dossier
- `src/lib/hooks/use-factures.ts` : Gestion factures + mise à jour devis/dossier

### **Composants UI :**
- `src/components/dossiers/prochaine-action.tsx` : Calcul prochaine action
- `src/components/dossiers/dossier-kanban.tsx` : Vue Kanban dossiers

### **API Routes :**
- `src/app/api/confirm-creneau/route.ts` : Confirmation créneau client
- `src/app/api/email/send-gmail/route.ts` : Envoi email via Gmail OAuth

### **n8n Code Tool :**
- `CODE_TOOL_N8N_COMPLET_FINAL.js` : Toutes les opérations CRUD + logique métier

---

## ✅ CHECKLIST DE VALIDATION

Pour vérifier qu'un dossier fonctionne correctement :

- [ ] Dossier créé avec `client_id` valide
- [ ] RDV créé → dossier passe à `rdv_planifie` ou `rdv_confirme`
- [ ] Client confirme créneau → dossier passe à `rdv_confirme`
- [ ] RDV réalisé → dossier passe à `visite_realisee`
- [ ] Fiche de visite créée → dossier reste `visite_realisee` (si pas de devis accepté)
- [ ] Devis créé → dossier passe à `devis_en_cours`
- [ ] Devis envoyé → dossier passe à `devis_envoye`
- [ ] Devis accepté → dossier passe à `signe`
- [ ] Facture créée → dossier passe à `facture_a_creer`
- [ ] Facture payée → si toutes payées, dossier passe à `facture_payee`
- [ ] Prochaine action affichée correctement selon l'état du dossier
- [ ] Journal dossier enregistre toutes les actions

---

**Dernière mise à jour :** 25 janvier 2026
