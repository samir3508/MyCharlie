# Changelog - MyCharlie

Toutes les modifications importantes du projet sont documentées dans ce fichier.

---

## [0.1.0] - 2026-01-23

### 🔒 Sécurité

#### Ajouté
- **Migration 20260123_fix_function_search_path_security.sql**
  - Correction de 13 fonctions SQL avec `SET search_path = public, pg_temp`
  - Prévention des injections SQL via manipulation du search_path
  - Fonctions critiques corrigées : `create_journal_entry`, `handle_new_user`, et 11 autres

- **Migration 20260123_fix_notifications_policy.sql**
  - Correction de la policy `notifications` trop permissive
  - Remplacement de `WITH CHECK (true)` par vérification tenant_id correcte
  - Empêche les violations de données entre tenants

- **Tests de sécurité**
  - Ajout de `tests/security/test-tenant-isolation.test.ts`
  - Tests d'isolation tenant pour 5 tables principales
  - Vérifie qu'un utilisateur ne peut pas accéder aux données d'un autre tenant

#### Documentation
- Guide `ACTIVER_LEAKED_PASSWORD_PROTECTION.md`
- Instructions pour activer la protection contre mots de passe compromis
- Recommandations de complexité minimale des mots de passe

---

### ⚡ Performance

#### Ajouté
- **Migration 20260123_optimize_rls_policies_performance.sql**
  - Optimisation de 7 policies RLS
  - Remplacement de `auth.uid()` par `(SELECT auth.uid())`
  - Amélioration significative des performances (évaluation une seule fois par requête)

- **Migration 20260123_add_missing_foreign_key_indexes.sql**
  - Ajout de 12 index manquants
  - 9 index sur foreign keys (améliore JOINs)
  - 2 index sur colonnes de dates (améliore recherches relances)
  - Index ajoutés : `conversation_state.tenant_id`, `devis.template_condition_paiement_id`, `factures.devis_id`, `factures.dossier_id`, `fiches_visite.rdv_id`, `fiches_visite.tenant_id`, `journal_dossier.tenant_id`, `rdv.client_id`, `relances.tenant_id`, `templates_conditions_paiement.tenant_id`, `devis.date_envoi`, `factures.date_echeance`

---

### 🧪 Tests

#### Ajouté
- **Configuration Vitest**
  - `vitest.config.ts` avec configuration complète
  - `tests/setup.ts` pour charger variables d'environnement
  - Scripts npm : `test`, `test:ui`, `test:security`, `test:e2e`, `test:coverage`

- **Tests E2E**
  - `tests/e2e/workflow-complet.test.ts`
  - 13 tests couvrant le workflow complet :
    - Création client
    - Création dossier
    - Création devis
    - Ajout lignes devis
    - Changement statut devis
    - Création facture
    - Marquer facture payée
    - Création RDV
    - Vérification journal automatique

#### Modifié
- **package.json**
  - Ajout de `vitest` et `@vitest/ui` en devDependencies
  - Ajout de `dotenv` pour charger variables d'environnement dans tests
  - Ajout de 5 scripts de test

---

### 📚 Documentation

#### Ajouté
- **README.md complet**
  - Instructions d'installation détaillées
  - Configuration Supabase, N8N, Google OAuth
  - Architecture du projet
  - Commandes de déploiement
  - Résolution de problèmes

- **GUIDE_UTILISATEUR.md**
  - Guide complet pour utilisateurs finaux
  - Explication de tous les modules
  - Exemples d'utilisation des agents IA
  - Workflow recommandé
  - Astuces et bonnes pratiques

- **VARIABLES_ENVIRONNEMENT.md**
  - Documentation complète de toutes les variables
  - Où trouver chaque clé/token
  - Configuration par environnement (dev/staging/prod)
  - Règles de sécurité

- **IMPLEMENTATION_MANAGER_AGENT.md**
  - Guide d'implémentation du Manager agent router
  - Architecture proposée
  - Configuration N8N étape par étape
  - Tests à effectuer
  - Alternatives possibles

- **PROMPT_MANAGER_AGENT_N8N.md**
  - Prompt système complet pour Manager agent
  - Règles de routage détaillées
  - Exemples de messages pour Charlie vs LÉO
  - Format de sortie JSON

- **APPLIQUER_CORRECTIONS_SECURITE.md**
  - Guide pour appliquer les 4 migrations SQL
  - Instructions via Dashboard ou CLI
  - Vérifications post-application
  - Rollback en cas de problème

- **AUDIT_COMPLET_VERIFIE_MCP.md**
  - Audit complet basé sur données réelles via MCP Supabase
  - Vérification de toutes les tables, policies, triggers
  - Note globale : 8/10
  - Plan d'action priorisé
  - Checklist pré-lancement

---

### 🏗️ Architecture

#### Modifié
- **Architecture documentée**
  - Schéma des fichiers et dossiers dans README.md
  - Explication du rôle de chaque composant
  - Flow de données entre agents IA

---

### 🐛 Corrections

#### Corrections apportées par les migrations
- ✅ 13 fonctions SQL sécurisées contre injection SQL
- ✅ Policy notifications corrigée (isolation tenant)
- ✅ 7 policies RLS optimisées (performances améliorées)
- ✅ 12 index ajoutés (performances améliorées)

---

## [0.0.1] - 2026-01-13 à 2026-01-22

### Ajouté
- Base de données Supabase complète
- Tables : clients, dossiers, devis, factures, rdv, fiches_visite, relances, journal_dossier
- RLS activé sur toutes les tables
- Triggers automatiques pour journal
- Interface utilisateur avec shadcn/ui
- Agents IA : LÉO intégré
- Intégrations : Gmail, Google Calendar, Twilio
- Génération PDF pour devis et factures
- Signature électronique pour devis

---

## Format

Le format de ce changelog est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

### Types de changements
- `Ajouté` : Pour les nouvelles fonctionnalités
- `Modifié` : Pour les modifications de fonctionnalités existantes
- `Déprécié` : Pour les fonctionnalités bientôt supprimées
- `Supprimé` : Pour les fonctionnalités supprimées
- `Corrigé` : Pour les corrections de bugs
- `Sécurité` : En cas de vulnérabilités

---

**Dernière mise à jour :** 23 janvier 2026
