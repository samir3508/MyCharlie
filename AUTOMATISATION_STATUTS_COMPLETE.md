# ✅ Automatisation Complète des Statuts

## 🎯 Objectif

Tous les statuts se mettent à jour **automatiquement** selon les actions, **sans modification du code applicatif**.

## 🔍 Analyse MCP Supabase (appliquée)

- **Triggers existants** : `trigger_update_dossier_statut_from_devis` sur `devis` déjà présent. Aucun trigger facture → dossier, rdv → dossier, fiche → dossier, ni BEFORE INSERT sur dossiers.
- **Tables** : `dossiers`, `devis`, `factures`, `rdv`, `fiches_visite` avec `statut`, `dossier_id` / `devis_id` conformes. `fiches_visite` a bien `dossier_id`.
- **Cohérence** : Migration alignée sur l’existant (mêmes statuts devis/facture/rdv que le schéma). Logique « toutes factures payées » corrigée : au moins une facture **et** toutes payées → `facture_payee` (évite 0 facture → payée).
- **Application** : Migration appliquée via MCP Supabase `apply_migration` (nom `auto_update_all_statuts`), enregistrée en base.

## 🔧 Solution : Triggers PostgreSQL

Tous les statuts sont gérés par des **triggers PostgreSQL** qui se déclenchent automatiquement lors des INSERT/UPDATE.

---

## 📋 Mapping Automatique des Statuts

### 1. **Dossier → selon Devis**

| Statut Devis | → | Statut Dossier |
|--------------|---|----------------|
| `brouillon` ou `en_preparation` | → | `devis_en_cours` |
| `pret` | → | `devis_pret` |
| `envoye` | → | `devis_envoye` |
| `accepte` | → | `signe` |
| `refuse` ou `expire` | → | `perdu` |

**Trigger :** `trigger_update_dossier_statut_from_devis`  
**Fonction :** `update_dossier_statut_from_devis()`

---

### 2. **Dossier → selon Facture**

| Statut Facture | → | Statut Dossier |
|----------------|---|----------------|
| `envoyee` | → | `facture_envoyee` |
| `en_retard` | → | `facture_en_retard` |
| `payee` (si TOUTES les factures payées) | → | `facture_payee` |

**Trigger :** `trigger_update_dossier_statut_from_facture`  
**Fonction :** `update_dossier_statut_from_facture()`

---

### 3. **Dossier → selon RDV**

| Statut RDV | → | Statut Dossier |
|------------|---|----------------|
| `planifie` (si dossier en `contact_recu`/`qualification`) | → | `rdv_planifie` |
| `confirme` | → | `rdv_confirme` |
| `realise` | → | `visite_realisee` |
| `annule` ou `reporte` (si dossier en `rdv_planifie`/`rdv_confirme`) | → | `rdv_a_planifier` |

**Trigger :** `trigger_update_dossier_statut_from_rdv`  
**Fonction :** `update_dossier_statut_from_rdv()`

---

### 4. **Dossier → selon Fiche Visite**

| Action | → | Statut Dossier |
|--------|---|----------------|
| Fiche de visite créée (si dossier en `rdv_confirme`/`rdv_planifie`) | → | `visite_realisee` |

**Trigger :** `trigger_update_dossier_statut_from_fiche_visite`  
**Fonction :** `update_dossier_statut_from_fiche_visite()`

---

### 5. **Dossier → Création automatique**

| Contexte | → | Statut Dossier |
|----------|---|----------------|
| Dossier créé sans statut | → | `contact_recu` (par défaut) |

**Trigger :** `trigger_auto_set_dossier_statut_on_create`  
**Fonction :** `auto_set_dossier_statut_on_create()`

---

## 🔄 Flow Automatique Complet

### Scénario 1 : Création Client + Dossier

```
1. Client créé
2. Dossier créé automatiquement
   → Trigger → statut = 'contact_recu' ✅
```

### Scénario 2 : Envoi de Créneaux

```
1. RDV créé avec statut = 'planifie'
   → Trigger → dossier.statut = 'rdv_planifie' ✅
```

### Scénario 3 : Client Confirme le Créneau

```
1. RDV mis à jour avec statut = 'confirme'
   → Trigger → dossier.statut = 'rdv_confirme' ✅
```

### Scénario 4 : Création Devis

```
1. Devis créé avec statut = 'brouillon'
   → Trigger → dossier.statut = 'devis_en_cours' ✅
```

### Scénario 5 : Envoi Devis

```
1. Devis mis à jour avec statut = 'envoye'
   → Trigger → dossier.statut = 'devis_envoye' ✅
```

### Scénario 6 : Signature Devis

```
1. Devis mis à jour avec statut = 'accepte'
   → Trigger → dossier.statut = 'signe' ✅
```

### Scénario 7 : Création Facture

```
1. Facture créée avec statut = 'brouillon'
   → Pas de changement (brouillon)
```

### Scénario 8 : Envoi Facture

```
1. Facture mise à jour avec statut = 'envoyee'
   → Trigger → dossier.statut = 'facture_envoyee' ✅
```

### Scénario 9 : Paiement Facture (toutes payées)

```
1. Facture mise à jour avec statut = 'payee'
2. Vérification : toutes les factures du dossier sont payées
   → Trigger → dossier.statut = 'facture_payee' ✅
```

---

## 🛡️ Protection contre les Retours en Arrière

Les triggers sont **intelligents** et ne reviennent pas en arrière :

- ✅ Si dossier = `signe` → Ne revient pas à `devis_envoye`
- ✅ Si dossier = `chantier_en_cours` → Ne revient pas à `devis_*`
- ✅ Si dossier = `facture_payee` → Ne revient pas à `facture_envoyee`

**Exception :** RDV annulé peut revenir de `rdv_confirme` → `rdv_a_planifier` (logique métier)

---

## 📝 Migration SQL

**Fichier créé :** `supabase/migrations/20260127_auto_update_all_statuts.sql`

**Contenu :**
- ✅ Fonction `update_dossier_statut_from_devis()` (améliorée)
- ✅ Fonction `update_dossier_statut_from_facture()` (nouvelle)
- ✅ Fonction `update_dossier_statut_from_rdv()` (nouvelle)
- ✅ Fonction `update_dossier_statut_from_fiche_visite()` (nouvelle)
- ✅ Fonction `auto_set_dossier_statut_on_create()` (nouvelle)
- ✅ Tous les triggers associés

---

## 🚀 Déploiement

### ✅ Déjà appliqué via MCP Supabase

La migration **`auto_update_all_statuts`** (version `20260127002931`) a été appliquée via le **MCP Supabase** (`apply_migration`). Elle est enregistrée dans `supabase_migrations.schema_migrations`.

**Triggers vérifiés en base :**
- `trigger_update_dossier_statut_from_devis` (devis)
- `trigger_update_dossier_statut_from_facture` (factures)
- `trigger_update_dossier_statut_from_rdv` (rdv)
- `trigger_update_dossier_statut_from_fiche_visite` (fiches_visite)
- `trigger_auto_set_dossier_statut_on_create` (dossiers)

### Option manuelle : Via Supabase Dashboard

1. Aller dans **SQL Editor**
2. Copier le contenu de `supabase/migrations/20260127_auto_update_all_statuts.sql`
3. Exécuter

### Option : Via Supabase CLI (si projet lié)

```bash
cd my-leo-saas
supabase link --project-ref <ref>
supabase db push
```

---

## ✅ Résultat

**Aucune modification de code nécessaire !**

Les statuts se mettent à jour **automatiquement** via les triggers PostgreSQL :

- ✅ Création dossier → `contact_recu`
- ✅ Création RDV `planifie` → `rdv_planifie`
- ✅ RDV `confirme` → `rdv_confirme`
- ✅ Création devis → `devis_en_cours`
- ✅ Devis `envoye` → `devis_envoye`
- ✅ Devis `accepte` → `signe`
- ✅ Facture `envoyee` → `facture_envoyee`
- ✅ Toutes factures `payee` → `facture_payee`

**Tout est automatique ! 🎉**
