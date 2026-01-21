# 📘 CAHIER DES CHARGES COMPLET - Logiciel BTP + IA

**Version :** 2.0  
**Date :** Janvier 2026  
**Application :** MyCharlie - Logiciel de gestion pour artisans BTP avec agents IA

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du système](#2-architecture-du-système)
3. [Les agents IA](#3-les-agents-ia)
4. [Modules fonctionnels](#4-modules-fonctionnels)
5. [Module DOSSIER - Cœur du système](#5-module-dossier---cœur-du-système)
6. [Workflows et automatisations](#6-workflows-et-automatisations)
7. [Intégrations](#7-intégrations)
8. [Interface utilisateur](#8-interface-utilisateur)
9. [Sécurité et multi-tenant](#9-sécurité-et-multi-tenant)

---

## 1. VUE D'ENSEMBLE

### 🎯 Vision du produit

**MyCharlie** est un logiciel de gestion complet pour artisans et entreprises du BTP, intégrant des agents IA conversationnels pour automatiser les tâches administratives et le suivi commercial.

### 🎯 Objectifs principaux

1. **Simplifier la gestion quotidienne** : Réduire le temps passé sur l'administration
2. **Automatiser les processus** : Devis, factures, relances, planification
3. **Intelligence contextuelle** : Agents IA qui comprennent et anticipent les besoins
4. **Traçabilité complète** : Tous les événements enregistrés automatiquement

### 👥 Public cible

- Artisans indépendants (plomberie, électricité, maçonnerie, etc.)
- Petites entreprises BTP (2-10 personnes)
- Gestionnaires de chantiers

### 💡 Valeur ajoutée

- ✅ **Gain de temps** : 70% de réduction du temps administratif
- ✅ **Moins d'erreurs** : Automatisation des calculs et vérifications
- ✅ **Meilleur suivi** : Vue d'ensemble de tous les projets en cours
- ✅ **Relances automatiques** : Récupération de paiements plus rapide

---

## 2. ARCHITECTURE DU SYSTÈME

### 🏗️ Stack technique

```
Frontend:    Next.js 16 + React + TypeScript + Tailwind CSS
Backend:     Next.js API Routes + Supabase Edge Functions
Base de données: PostgreSQL (Supabase)
IA:          Anthropic Claude (via N8N)
Orchestration: N8N Workflows
Intégrations: Google Calendar, Gmail, Twilio (WhatsApp)
```

### 📊 Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR (Artisan)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ WhatsApp │  │   Web    │  │   Email  │  │   SMS    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │      N8N WORKFLOWS            │
        │  ┌────────────────────────┐   │
        │  │   Manager (Router)     │   │
        │  │  Analyse + Routage     │   │
        │  └──────┬────────┬────────┘   │
        │         │        │            │
        │  ┌──────▼───┐  ┌─▼────────┐   │
        │  │ Charlie  │  │   LÉO    │   │
        │  │ Commercial│  │  Terrain │   │
        │  └──────┬───┘  └─┬────────┘   │
        │         │        │            │
        │  ┌──────▼────────▼────────┐   │
        │  │   Code Tool (Actions)  │   │
        │  └────────┬───────────────┘   │
        └───────────┼───────────────────┘
                    │
        ┌───────────▼───────────────┐
        │      SUPABASE             │
        │  • PostgreSQL Database    │
        │  • Edge Functions         │
        │  • RLS (Sécurité)         │
        │  • Storage (PDF)          │
        └───────────┬───────────────┘
                    │
        ┌───────────▼───────────────┐
        │   INTÉGRATIONS            │
        │  • Google Calendar        │
        │  • Gmail API              │
        │  • Twilio (WhatsApp)      │
        └───────────────────────────┘
```

### 🔄 Flux de données

1. **Réception** : L'artisan envoie un message (WhatsApp/Web/Email)
2. **Routage** : Le Manager analyse et route vers Charlie ou LÉO
3. **Traitement** : L'agent IA traite la demande via Code Tool
4. **Action** : Opérations CRUD sur Supabase
5. **Réponse** : L'artisan reçoit une réponse claire et actionnable

---

## 3. LES AGENTS IA

### 🤖 Le Manager (Agent Router)

**Rôle :** Routeur intelligent qui analyse les demandes et les dirige vers l'agent approprié.

**Fonctionnalités :**
- Analyse sémantique des messages
- Détection d'intention (commercial vs terrain)
- Routage vers Charlie ou LÉO
- Agrégation des réponses

**Critères de routage :**

**→ Charlie (Commercial/Administratif) :**
- Mots-clés : "devis", "facture", "client", "créer", "envoyer", "modifier"
- Actions : Création/modification de devis, factures, clients
- Exemples :
  - "Fais un devis pour M. Martin"
  - "Envoie la facture FA-2026-0001"
  - "Crée un client nommé Dupont"

**→ LÉO (Terrain/Projets) :**
- Mots-clés : "rdv", "rendez-vous", "visite", "dossier", "planning", "organise"
- Actions : Création/modification de RDV, dossiers, suivi de projets
- Exemples :
  - "J'ai quoi de prévu demain ?"
  - "Organise une visite avec Aline Dupuis"
  - "Crée un dossier pour M. Martin"

---

### 👔 Charlie - Agent Commercial & Administratif

**Rôle :** Gère toute la partie commerciale et administrative de l'activité.

**Spécialités :**
- Gestion des clients
- Création et suivi des devis
- Gestion des factures
- Envoi d'emails professionnels
- Relances de paiement

#### 📋 Capacités détaillées

##### 1. Gestion des clients

**Actions disponibles :**
- `create-client` : Créer un nouveau client
- `search-client` : Rechercher un client (nom, email, téléphone)
- `list-clients` : Lister tous les clients
- `get-client` : Récupérer les détails d'un client
- `update-client` : Modifier les informations d'un client
- `delete-client` : Supprimer un client

**Fonctionnalités automatiques :**
- ⚠️ **CRÉATION AUTOMATIQUE DE DOSSIER** : Lors de la création d'un client, un dossier est automatiquement créé
  - Numéro : `DOS-YYYY-XXXX` (généré automatiquement)
  - Statut initial : `contact_recu`
  - Lié au client créé

##### 2. Gestion des devis

**Actions disponibles :**
- `create-devis` : Créer un nouveau devis
- `add-ligne-devis` : Ajouter des lignes au devis
- `update-ligne-devis` : Modifier une ligne de devis
- `delete-ligne-devis` : Supprimer une ligne
- `finalize-devis` : Finaliser le devis (calculs automatiques, génération PDF)
- `get-devis` : Récupérer un devis (par ID ou numéro)
- `list-devis` : Lister les devis (avec recherche par nom, numéro)
- `update-devis` : Modifier un devis
- `delete-devis` : Supprimer un devis
- `envoyer-devis` : Envoyer le devis par email (Gmail API)

**Workflow de création :**
1. Vérification si le client existe
2. Si non trouvé → Création du client + dossier automatique
3. Création du devis (lié au dossier)
4. Ajout des lignes de travaux
5. Calcul automatique (HT, TVA, TTC)
6. Génération du PDF
7. Stockage de l'URL PDF dans Supabase

**Recherche avancée :**
- Recherche par numéro de devis
- Recherche par nom/prénom du client
- Recherche par client_id
- Support des numéros (format DV-YYYY-XXXX) et UUIDs

##### 3. Gestion des factures

**Actions disponibles :**
- `creer-facture-depuis-devis` : Créer une facture à partir d'un devis signé
- `create-facture` : Créer une facture manuellement
- `add-ligne-facture` : Ajouter des lignes à la facture
- `update-ligne-facture` : Modifier une ligne
- `delete-ligne-facture` : Supprimer une ligne
- `finalize-facture` : Finaliser la facture
- `get-facture` : Récupérer une facture
- `list-factures` : Lister les factures
- `send-facture` : Envoyer la facture par email
- `mark-facture-paid` : Marquer comme payée
- `send-relance` : Envoyer une relance de paiement

**Types de factures :**
- Facture d'acompte
- Facture intermédiaire
- Facture de solde

##### 4. Envoi d'emails

**Intégration Gmail API :**
- Envoi direct depuis la boîte Gmail de l'artisan
- Pièces jointes PDF (devis, factures)
- Templates d'emails professionnels
- Mise à jour automatique des statuts après envoi
- Rafraîchissement automatique des tokens OAuth

**Emails automatiques :**
- Confirmation de devis
- Relances de paiement
- Notifications de factures

#### 🎯 Règles de fonctionnement de Charlie

1. **Questions avant création** : Charlie pose toujours des questions si des informations manquent
2. **Résumés obligatoires** : Affichage d'un résumé initial et final avant/après création
3. **Vérification des doublons** : Vérifie s'il existe déjà des devis pour un client avant d'en créer un nouveau
4. **Valeurs par défaut intelligentes** : Utilise des valeurs par défaut pour les champs non spécifiés
5. **Traçabilité** : Toutes les actions sont enregistrées dans le journal du dossier

---

### 🏗️ LÉO - Agent Suivi Terrain & Projets

**Rôle :** Gère le suivi terrain, la planification des visites et l'organisation des projets.

**Spécialités :**
- Gestion des dossiers
- Planification des RDV
- Suivi des visites
- Organisation du planning
- Statistiques et analyses

#### 📋 Capacités détaillées

##### 1. Gestion des dossiers

**Actions disponibles :**
- `create-dossier` : Créer un nouveau dossier
- `list-dossiers` : Lister les dossiers (avec recherche par nom, numéro)
- `get-dossier` : Récupérer un dossier

**Note importante :**
- Les dossiers sont **créés automatiquement** lors de la création d'un client par Charlie
- LÉO peut créer des dossiers supplémentaires si nécessaire (ex: projet distinct)

##### 2. Gestion des RDV

**Actions disponibles :**
- `create-rdv` : Créer un rendez-vous
- `list-rdv` : Lister les RDV (avec filtres par date, statut)

**Intégration Google Calendar :**
- ⚠️ **PRIORITÉ ABSOLUE** : Pour les questions de planning, LÉO utilise Google Calendar MCP en premier
- Liste les événements directement depuis Google Calendar
- Plus fiable et à jour que Supabase
- Fallback vers `list-rdv` si Google Calendar ne retourne rien

**Fonctionnalités automatiques :**
- Création d'événement dans Google Calendar lors de la création d'un RDV
- Synchronisation bidirectionnelle
- Gestion des conflits de créneaux

##### 3. Gestion des visites

**Fiches de visite :**
- Création après une visite chantier
- Description technique des travaux
- Photos et notes vocales
- Liée automatiquement au dossier

##### 4. Statistiques

**Actions disponibles :**
- `stats` : Obtenir des statistiques globales
  - Nombre de dossiers actifs
  - Taux de conversion devis → facture
  - CA par période
  - RDV à venir

#### 🎯 Règles de fonctionnement de LÉO

1. **Recherche automatique** : LÉO cherche TOUJOURS les informations avant de créer un RDV
2. **Valeurs par défaut intelligentes** : Utilise des valeurs par défaut (durée, type, adresse)
3. **Pas de questions inutiles** : Ne demande que les informations vraiment manquantes
4. **Priorité Google Calendar** : Pour les questions de planning, utilise Google Calendar en premier

---

## 4. MODULES FONCTIONNELS

### 👥 Module CLIENTS

**Fonctionnalités :**
- Création, modification, suppression de clients
- Recherche avancée (nom, email, téléphone)
- Liste avec tri et filtres
- Détails complets (historique devis/factures)
- Création automatique de dossier à la création

**Données gérées :**
- Informations personnelles (nom, prénom, email, téléphone)
- Adresses (chantier, facturation)
- Statistiques (CA total, nombre de devis/factures)
- Historique des interactions

**Interface :**
- Page liste : `/clients`
- Page détail : `/clients/[id]`
- Page édition : `/clients/[id]/edit`

---

### 📄 Module DEVIS

**Fonctionnalités :**
- Création de devis avec lignes détaillées
- Calculs automatiques (HT, TVA, TTC)
- Génération PDF automatique
- Envoi par email (Gmail API)
- Recherche par numéro, nom client
- Statuts : brouillon, en préparation, prêt, envoyé, signé, perdu

**Workflow :**
1. Création du devis (lié au client et dossier)
2. Ajout des lignes de travaux
3. Finalisation (calculs + PDF)
4. Envoi au client
5. Suivi de signature

**Interface :**
- Page liste : `/devis`
- Page détail : `/devis/[id]`
- Page création : `/devis/nouveau`
- Page édition : `/devis/[id]/edit`

---

### 💳 Module FACTURES

**Fonctionnalités :**
- Création depuis un devis signé (automatique)
- Création manuelle
- Calculs automatiques
- Génération PDF
- Envoi par email
- Relances automatiques
- Suivi des paiements
- Statuts : brouillon, envoyée, en retard, payée

**Types de factures :**
- Acompte (à partir du devis signé)
- Intermédiaire (suivis de chantier)
- Solde (fin de travaux)

**Interface :**
- Page liste : `/factures`
- Page détail : `/factures/[id]`
- Page création : `/factures/nouveau`
- Page édition : `/factures/[id]/edit`

---

### 📅 Module AGENDA / RDV

**Fonctionnalités :**
- Vue jour, semaine, mois
- Création de RDV (visite, appel, réunion)
- Confirmation automatique client (email)
- Notification artisan (in-app + email)
- Synchronisation Google Calendar
- Statuts : planifié, confirmé, réalisé, annulé

**Intégrations :**
- Google Calendar (synchronisation bidirectionnelle)
- Gmail (envoi confirmations)
- Notifications in-app

**Interface :**
- Page agenda : `/rdv`
- Page détail : `/rdv/[id]`

**Fonctionnalités automatiques :**
- Création d'événement Google Calendar
- Envoi email confirmation client
- Notification artisan
- Mise à jour du statut du dossier

---

### 📋 Module FICHES DE VISITE

**Fonctionnalités :**
- Création après visite chantier
- Description technique
- Contraintes et mesures
- Photos (stockage Supabase)
- Notes vocales
- Liée au dossier

**Interface :**
- Page liste : `/fiches-visite`

---

### 🔔 Module RELANCES

**Fonctionnalités :**
- Configuration des templates de relance
- Relances automatiques (selon échéances)
- Suivi des relances envoyées
- Types : email, SMS, WhatsApp

**Templates configurables :**
- Relance 1 (J+7 après envoi)
- Relance 2 (J+14)
- Relance 3 (J+30)

**Interface :**
- Page configuration : `/relances`

---

### 📊 Module STATISTIQUES

**Fonctionnalités :**
- Dashboard avec KPIs
- CA par période
- Taux de conversion
- Nombre de dossiers actifs
- Graphiques et analyses

**Interface :**
- Page dashboard : `/dashboard`

---

## 5. MODULE DOSSIER - CŒUR DU SYSTÈME

### 🎯 Philosophie du module

**Le dossier est le cœur central du système** : Tout tourne autour du dossier.

**Principes :**
- Rien n'existe sans dossier
- Tout est rattaché au dossier
- Le dossier représente 1 client + 1 projet + 1 cycle complet
- Cycle : De la première demande jusqu'au paiement final

### 👁️ Vue de l'artisan

Quand un artisan ouvre un dossier, il doit :
- ✅ **Comprendre où il en est** : Statut clair
- ✅ **Savoir quoi faire maintenant** : Prochaine action affichée
- ✅ **Ne rien oublier** : Alertes et rappels automatiques
- ✅ **Ne rien ressaisir** : Données automatiquement liées
- ✅ **Avoir une vision claire & chronologique** : Timeline automatique

### 🧠 Rôle de l'IA dans le module dossier

L'agent IA (LÉO) est là pour :
- 🔍 **Surveiller** : Statuts, dates, échéances
- 🔔 **Rappeler** : Actions à faire, relances
- 📞 **Relancer** : Clients, paiements
- 📋 **Ordonner** : Prioriser les actions
- ⚠️ **Alerter** : Problèmes, retards, oublis

---

### 📋 STRUCTURE DU MODULE DOSSIER

#### 1️⃣ LISTE DES DOSSIERS (Vues principales)

**Vues standard disponibles :**

##### 🔹 Tous les dossiers actifs
- Affichage : Client, Type de projet, Statut, Prochaine action, Urgence, Montant estimé
- Vue Kanban ou Liste

##### 🔹 Nouveaux dossiers
- Statut : `contact_recu` / `qualification`
- Dossiers récemment créés

##### 🔹 RDV à venir
- Dossiers avec RDV confirmé
- Affichage : Date & heure du RDV

##### 🔹 Visites réalisées – Devis à faire
- Visite réalisée ✅
- Devis non créé ❌
- Alerte : "Devis à créer rapidement"

##### 🔹 Devis envoyés – en attente
- Devis envoyé ✅
- Non signé ⏳
- Affichage : Date d'envoi, jours d'attente

##### 🔹 Factures à créer
- Devis signé ✅
- Facture absente ❌
- Action rapide : "Créer facture"

##### 🔹 Factures en retard ⚠️
- Paiement non reçu
- Échéance dépassée
- Affichage : Jours de retard, montant

##### 🔹 Dossiers clôturés
- Facture payée ✅
- Projet terminé

**Interface :**
- Page liste avec onglets : `/dossiers`

---

#### 2️⃣ FICHE DÉTAILLÉE D'UN DOSSIER

**Structure en blocs :**

##### 🧾 BLOC 1 – IDENTITÉ DU DOSSIER
- Numéro de dossier (DOS-YYYY-XXXX)
- Client (nom, téléphone, email) avec lien
- Adresse chantier
- Type de projet (rénovation, neuf, dépannage)
- Urgence (basse, normale, haute, urgente)
- Source (artisan, recommandation, site web)
- Responsable (artisan)

##### 🚦 BLOC 2 – STATUT GLOBAL DU DOSSIER

**Statuts complets (obligatoires) :**

**Phase avant chantier :**
1. `contact_recu` - Contact reçu
2. `qualification` - À qualifier
3. `rdv_a_planifier` - RDV à planifier
4. `rdv_confirme` - RDV confirmé
5. `visite_realisee` - Visite réalisée

**Phase devis :**
6. `devis_en_cours` - Devis en préparation
7. `devis_envoye` - Devis envoyé
8. `signe` - Devis signé
9. `perdu` - Devis perdu

**Phase facturation :**
10. `facture_a_creer` - Facture à créer
11. `facture_envoyee` - Facture envoyée
12. `facture_en_retard` - Facture en retard
13. `facture_payee` - Facture payée ✅

**Le statut détermine :**
- Les actions possibles
- Les alertes IA
- Les automatisations actives

##### 🧭 BLOC 3 – PROCHAINE ACTION (CRUCIAL)

**Affichage dynamique :**
- **Prochaine action à faire** : Texte clair
- **Date limite** : Si applicable
- **Qui doit agir** : Artisan / IA
- **Bouton d'action directe** : Lien vers l'action

**Exemples :**
- "Créer le devis avant le 18/01" → Bouton "Créer devis"
- "Relancer le paiement" → Bouton "Relancer"
- "Créer la facture d'acompte" → Bouton "Créer facture"

**Logique de calcul :**
1. Vérifier les factures en retard → Urgence maximale
2. Vérifier devis signé sans facture → Action haute priorité
3. Vérifier visite réalisée sans devis → Action normale/haute
4. Vérifier devis envoyé depuis 7+ jours → Relance recommandée
5. Vérifier RDV à venir → Préparation nécessaire

**Composant :** `ProchaineAction` (automatique, calculé en temps réel)

---

#### 3️⃣ ONGLETS DU DOSSIER

##### 📅 ONGLET RENDEZ-VOUS
**Contenu :**
- Liste des RDV liés au dossier
- Date / heure
- Type (visite, appel, réunion)
- Statut RDV
- Adresse
- Notes

**Fonctions :**
- Créer RDV (lien vers création)
- Modifier RDV (lien vers édition)
- Annuler RDV
- Liens cliquables vers détail RDV

**Actions automatiques :**
- Confirmation auto client
- Rappels automatiques (J-1, Jour J)

##### 🏗️ ONGLET FICHE DE VISITE
**Contenu :**
- Liste des fiches de visite
- Description technique
- Contraintes
- Mesures
- Photos
- Date de visite

**Fonctions :**
- Créer fiche de visite
- Modifier fiche
- Mobile-friendly

**Actions automatiques :**
- Liée automatiquement au dossier
- Déclenche statut "Visite réalisée"

##### 📄 ONGLET DEVIS
**Contenu :**
- Liste des devis liés au dossier
- Statut devis
- Date création
- Date envoi
- Montant TTC

**Fonctions :**
- Créer devis (lien)
- Liens cliquables vers détail devis
- Générer PDF
- Envoyer devis
- Relances automatiques
- Suivi signature

##### 💳 ONGLET FACTURES
**Contenu :**
- Liste des factures liées
- Montant
- Date émission
- Date échéance
- Statut paiement
- Mise en évidence des factures en retard (rouge)

**Fonctions :**
- Créer facture depuis devis (lien)
- Envoyer facture
- Relancer paiement
- Marquer comme payée
- Liens cliquables vers détail facture

##### 🔁 ONGLET RELANCES & ALERTES IA
**Contenu (visible uniquement par l'artisan) :**

**Relances prévues :**
- Relances devis prévues (si devis envoyé depuis 7+ jours)
- Relances facture prévues (si échéance dans 3 jours)

**Alertes :**
- ⚠️ Devis non créé (visite réalisée depuis 3+ jours)
- ⚠️ Paiement en retard (facture échue)
- ⚠️ Action oubliée (changement de statut manquant)

**Fonctionnalité :**
- Tout est automatique
- L'artisan décide ou valide
- Suggestions contextuelles de LÉO

**Composant :** `RelancesAlertes` (calculé en temps réel)

##### 📚 ONGLET JOURNAL (TIMELINE)
**Contenu :**
- Historique chronologique automatique
- Entrées triées par date (plus récent en premier)

**Événements enregistrés automatiquement :**
- 📝 Création dossier
- 📅 RDV confirmé
- 🏗️ Visite réalisée
- 📄 Devis envoyé
- 📞 Relance envoyée
- 💰 Paiement reçu
- 🔄 Changement de statut

**Format :**
- Date et heure
- Type d'événement (icône)
- Titre
- Contenu détaillé
- Auteur (système / artisan / IA)

**Traçabilité :**
- Preuve de toutes les actions
- Audit complet
- Vision claire de l'historique

**Fonctionnement :**
- ✅ **JOURNAL AUTOMATIQUE** : Triggers Supabase enregistrent tous les événements
- Aucune saisie manuelle requise
- Métadonnées JSONB pour détails supplémentaires

---

#### 4️⃣ ACTIONS RAPIDES (Toujours visibles)

**Boutons d'actions rapides en haut de la page dossier :**

##### ➕ Créer devis
- Lien vers `/devis/nouveau?dossier_id=XXX`
- Visible si statut permet la création

##### 📤 Envoyer devis
- Visible si devis prêt (statut `brouillon` ou `en_preparation`)
- Envoie le devis par email
- Met à jour le statut à `envoye`

##### 💳 Créer facture
- Visible si devis signé (`accepte` ou `signe`) et aucune facture existante
- Crée la facture depuis le devis signé
- Redirige vers la page facture

##### 🔁 Relancer
- Visible si facture envoyée et échéance proche/dépassée
- Envoie une relance de paiement
- Lien vers gestion des relances

##### 🗂️ Clôturer dossier
- Visible si statut n'est pas `facture_payee`
- Marque le dossier comme clôturé
- Met le statut à `facture_payee`

**Implémentation :**
- Bloc sticky en haut de page
- Actions contextuelles (affichées selon l'état du dossier)
- Handlers React avec mutations React Query

---

### 🔄 Journal automatique

**Objectif :** Enregistrer automatiquement tous les événements dans le journal du dossier.

**Triggers Supabase actifs :**

1. **`trigger_journal_dossiers`**
   - Création de dossier → Entrée "Dossier créé"
   - Changement de statut → Entrée "Statut modifié" (ancien → nouveau)

2. **`trigger_journal_rdv`**
   - RDV créé → Entrée "RDV planifié"
   - RDV confirmé → Entrée "RDV confirmé"
   - RDV modifié → Entrée "RDV modifié"

3. **`trigger_journal_fiches_visite`**
   - Fiche créée → Entrée "Visite réalisée"

4. **`trigger_journal_devis`**
   - Devis créé → Entrée "Devis créé"
   - Devis envoyé → Entrée "Devis envoyé"
   - Devis signé → Entrée "Devis signé"

5. **`trigger_journal_factures`**
   - Facture créée → Entrée "Facture créée"
   - Facture envoyée → Entrée "Facture envoyée"
   - Paiement reçu → Entrée "Paiement reçu"

6. **`trigger_journal_relances`**
   - Relance envoyée → Entrée "Relance envoyée"

**Fonction :** `create_journal_entry()` (PL/pgSQL)
- Analyse le type d'événement
- Construit le titre et contenu
- Enregistre avec métadonnées JSONB
- Auteur : `systeme` (automatique)

**Avantages :**
- ✅ Traçabilité complète
- ✅ Aucune saisie manuelle
- ✅ Historique fiable
- ✅ Audit automatique

---

## 6. WORKFLOWS ET AUTOMATISATIONS

### 🔄 Workflows N8N

#### Workflow principal : Manager → Charlie/LÉO

```
Webhook (WhatsApp/Web) 
  → Extraction informations
  → Manager (Analyse + Routage)
    → Charlie (Commercial)
    → LÉO (Terrain)
  → Code Tool (Actions CRUD)
  → Supabase
  → Réponse formatée
  → Envoi réponse
```

#### Workflow : Création automatique de dossier

```
Charlie: create-client
  → Client créé
  → Trigger Supabase détecte création
  → Création automatique dossier
    → Numéro généré
    → Statut: contact_recu
    → Lié au client
  → Entrée journal: "Dossier créé"
```

#### Workflow : Confirmation RDV client

```
Client clique lien confirmation
  → API /api/confirm-creneau
  → Vérification créneau disponible
  → Création RDV dans Supabase
  → Création événement Google Calendar
  → Envoi email confirmation client
  → Notification artisan (in-app + email)
  → Entrée journal: "RDV confirmé"
```

#### Workflow : Relances automatiques

```
Tâche planifiée N8N (quotidienne)
  → Détection factures échues
  → Détection devis sans réponse (7+ jours)
  → Création relances planifiées
  → Suggestions dans interface
  → Artisan valide ou ignore
```

---

### 🤖 Automatisations IA

#### Surveillance automatique

**LÉO surveille en permanence :**
- Statuts des dossiers
- Dates d'échéance
- RDV à venir
- Actions manquantes

**Alertes générées :**
- ⚠️ Visite réalisée depuis 3+ jours sans devis
- ⚠️ Devis envoyé depuis 7+ jours sans réponse
- ⚠️ Facture échue depuis 15+ jours
- ⚠️ RDV à venir dans 24h (rappel)

#### Suggestions contextuelles

**LÉO propose des actions :**
- "Créer le devis maintenant ?"
- "Relancer le client pour le devis DV-2026-0015 ?"
- "Créer la facture d'acompte pour le dossier DOS-2026-0001 ?"

#### Organisation automatique

**Priorisation intelligente :**
- Urgence calculée selon dates et statuts
- Actions triées par priorité
- Suggestions personnalisées selon l'historique

---

## 7. INTÉGRATIONS

### 📅 Google Calendar

**Utilisation :**
- Synchronisation bidirectionnelle des RDV
- LÉO utilise Google Calendar en priorité pour le planning
- Création automatique d'événements lors de création RDV
- Conflits de créneaux détectés

**OAuth :**
- Connexion via OAuth 2.0
- Tokens stockés dans `oauth_connections`
- Rafraîchissement automatique

### 📧 Gmail API

**Utilisation :**
- Envoi direct d'emails depuis la boîte Gmail
- Pièces jointes PDF (devis, factures)
- Templates professionnels
- Envoi confirmations RDV

**OAuth :**
- Connexion via OAuth 2.0
- Tokens stockés dans `oauth_connections`
- Rafraîchissement automatique

### 💬 WhatsApp (Twilio)

**Utilisation :**
- Réception de messages WhatsApp
- Envoi de réponses via Twilio
- Conversation naturelle avec les agents IA

**Configuration :**
- Webhook Twilio configuré dans N8N
- Messages routés vers le Manager
- Réponses formatées et envoyées

---

## 8. INTERFACE UTILISATEUR

### 🎨 Design System

**Framework :** Next.js + Tailwind CSS + shadcn/ui

**Composants principaux :**
- Sidebar de navigation
- Cards pour contenus
- Badges pour statuts
- Buttons avec variants
- Tabs pour organisation
- Modals pour actions

### 📱 Responsive

**Support :**
- Desktop (taille principale)
- Tablet (adaptation)
- Mobile (interface simplifiée)

### 🎯 Navigation principale

**Structure du menu :**

```
Général
  ├─ Tableau de bord
  └─ Clients

Charlie — Devis & Factures
  ├─ Devis
  ├─ Factures
  └─ Relances

Léo — Suivi Commercial
  ├─ Dossiers (NEW)
  ├─ Agenda RDV (NEW)
  └─ Fiches visite (NEW)

Outils
  ├─ Import / Export
  ├─ Intégrations Gmail
  └─ Paramètres
```

### 🔔 Notifications

**Système de notifications :**
- Badge sur l'icône cloche (nombre non lues)
- Dropdown avec notifications récentes
- Page complète `/notifications`
- Types : RDV confirmé, paiement reçu, relance prévue

---

## 9. SÉCURITÉ ET MULTI-TENANT

### 🔐 Architecture multi-tenant

**Principe :**
- Chaque artisan = 1 tenant
- Isolation complète des données
- `tenant_id` dans toutes les tables

### 🛡️ Row Level Security (RLS)

**Supabase RLS :**
- Politiques de sécurité sur toutes les tables
- Filtrage automatique par `tenant_id`
- Impossible d'accéder aux données d'un autre tenant

**Exemple de politique :**
```sql
CREATE POLICY "Users can only see their own data"
ON dossiers FOR SELECT
USING (tenant_id = auth.uid());
```

### 🔑 Authentification

**Méthode :**
- Supabase Auth (email/password)
- OAuth Google (pour intégrations)
- Tokens JWT pour API

### 📊 Isolation des données

**Toutes les requêtes :**
- Filtrent automatiquement par `tenant_id`
- Impossible de bypasser (RLS au niveau DB)
- Audit des accès possible

---

## 📊 STATISTIQUES DU SYSTÈME

### 📈 Métriques clés

**Base de données :**
- ~15 tables principales
- Relations complexes (clients → dossiers → devis → factures)
- Journal automatique avec historique complet

**Edge Functions :**
- 33+ fonctions Supabase
- Router central (`leo-router`)
- CRUD complet pour tous les modules

**Agents IA :**
- 3 agents (Manager, Charlie, LÉO)
- Code Tool partagé (N8N_TOOL_CHARLIE_LEO_V3.js)
- Workflows N8N orchestrés

**Interface :**
- 20+ pages principales
- Composants réutilisables
- Design system cohérent

---

## 🚀 ROADMAP FUTURE

### 🔮 Fonctionnalités prévues

#### Phase 1 : Consolidation
- ✅ Module Dossier complet
- ✅ Journal automatique
- ✅ Actions rapides
- ✅ Alertes IA

#### Phase 2 : Automatisation avancée
- 📅 Planification automatique de RDV (IA)
- 📧 Templates d'emails personnalisés
- 💬 Chatbot client (WhatsApp)
- 📊 Analytics avancés

#### Phase 3 : IA générative
- 🤖 Génération automatique de devis (depuis photos)
- 📝 Rédaction automatique de descriptions
- 💡 Suggestions de prix intelligentes
- 🔍 Analyse prédictive (taux de conversion)

---

## 📝 CONCLUSION

**MyCharlie** est un système complet de gestion pour artisans BTP, intégrant :

✅ **Agents IA conversationnels** (Manager, Charlie, LÉO)  
✅ **Automatisation complète** (devis, factures, RDV, relances)  
✅ **Module Dossier centralisé** avec journal automatique  
✅ **Intégrations** (Google Calendar, Gmail, WhatsApp)  
✅ **Interface moderne** et intuitive  
✅ **Sécurité multi-tenant** robuste  

**L'objectif :** Permettre aux artisans de se concentrer sur leur métier en automatisant toute l'administration.

---

**Document généré le :** Janvier 2026  
**Version :** 2.0  
**Auteur :** Équipe MyCharlie
