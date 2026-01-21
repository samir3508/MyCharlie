# 📋 ANALYSE : MODULE DOSSIER vs CAHIER DES CHARGES

**Date :** 21 janvier 2026  
**Contexte :** Transformation du module Dossier selon le cahier des charges métier BTP + IA

---

## ✅ CE QUI EXISTE DÉJÀ

### 1. Structure de base
- ✅ Table `dossiers` dans Supabase avec tous les champs nécessaires
- ✅ Relations avec `clients`, `rdv`, `devis`, `fiches_visite`
- ✅ Hooks React Query (`useDossiers`, `useDossier`, `useUpdateDossier`)
- ✅ Actions N8N pour créer/gérer les dossiers

### 2. Interface utilisateur
- ✅ Page liste des dossiers (`/dossiers/page.tsx`)
  - Vue Kanban avec colonnes par statut
  - Vue Liste
  - Recherche par titre/nom client/numéro
  - Statistiques (taux de conversion)

- ✅ Page détail d'un dossier (`/dossiers/[id]/page.tsx`)
  - Bloc identité (numéro, client, adresse chantier, type projet, source, priorité)
  - Bloc statut (modifiable)
  - Onglets :
    - ✅ Vue d'ensemble
    - ✅ RDV (liste des RDV liés)
    - ✅ Fiches (fiches de visite)
    - ✅ Devis (liste des devis)
    - ✅ Journal (timeline)
  - Sidebar avec infos client
  - Actions rapides (Planifier RDV, Créer fiche visite, Créer devis)

### 3. Statuts existants
```
contact_recu, qualification, rdv_a_planifier, rdv_planifie, 
rdv_confirme, visite_realisee, devis_en_cours, devis_pret, 
devis_envoye, en_negociation, signe, perdu, annule
```

---

## ❌ CE QUI MANQUE (selon le cahier des charges)

### 1. VUES FILTRÉES dans la liste des dossiers

**Manque :**
- 🔹 Nouveaux dossiers (Contact reçu / À qualifier)
- 🔹 RDV à venir (avec date & heure)
- 🔹 Visites réalisées – Devis à faire
- 🔹 Devis envoyés – en attente
- 🔹 Factures à créer (Devis signé, Facture absente)
- 🔹 Factures en retard ⚠️
- 🔹 Dossiers clôturés

**Actuellement :** Seulement vue Kanban par statut général

---

### 2. STATUTS manquants ou à aligner

**Statuts du cahier des charges :**
```
Phase avant chantier:
1. Contact reçu ✅
2. À qualifier → correspond à "qualification" ✅
3. RDV à planifier ✅
4. RDV confirmé ✅
5. Visite réalisée ✅

Phase devis:
6. Devis en préparation → "devis_en_cours" ✅
7. Devis envoyé ✅
8. Devis signé → "signe" ✅
9. Devis perdu → "perdu" ✅

Phase facturation:
10. Facture à créer ❌ MANQUE
11. Facture envoyée ❌ MANQUE
12. Facture en retard ❌ MANQUE
13. Facture payée ✅ → pourrait être "signe" + facture payée
```

**Action requise :** Ajouter les statuts de facturation ou créer une logique basée sur l'état des factures.

---

### 3. BLOC "PROCHAINE ACTION" (CRUCIAL)

**Manque complètement :**

Le cahier des charges insiste sur ce bloc qui doit afficher :
- Prochaine action à faire
- Date limite
- Qui doit agir (artisan / IA)

**Exemples :**
- "Créer le devis avant le 18/01"
- "Relancer le client avant le 20/01"
- "Créer la facture d'acompte"

**Logique à implémenter :**
- Basée sur le statut du dossier
- Basée sur les dates (RDV, relances, échéances)
- Basée sur les éléments manquants (devis non créé, facture absente)

---

### 4. ONGLET FACTURES dans le détail

**Manque :** Onglet dédié aux factures dans `/dossiers/[id]/page.tsx`

**Contenu attendu :**
- Liste des factures liées au dossier
- Montant, date émission, date échéance
- Statut paiement
- Actions : Créer facture depuis devis, Envoyer, Relancer, Marquer payée

**Actuellement :** Les factures ne sont pas affichées dans le détail du dossier.

---

### 5. ONGLET "RELANCES & ALERTES IA"

**Manque complètement :**

**Contenu attendu :**
- Relances devis prévues
- Relances facture prévues
- Alertes :
  - Devis non créé après visite
  - Paiement en retard
  - Action oubliée

**Fonctionnalité :** Automatique, l'artisan décide ou valide.

---

### 6. JOURNAL automatique complet

**Existe partiellement :** Le journal existe mais doit être automatique.

**Événements à enregistrer automatiquement :**
- ✅ Création dossier
- ❌ RDV confirmé (doit être automatique)
- ❌ Visite réalisée (doit être automatique)
- ❌ Devis envoyé (doit être automatique)
- ❌ Relance envoyée (doit être automatique)
- ❌ Paiement reçu (doit être automatique)
- ❌ Changement de statut (doit être automatique)

**Action requise :** Créer des triggers Supabase ou des webhooks N8N pour enregistrer automatiquement tous les événements.

---

### 7. ACTIONS RAPIDES toujours visibles

**Existe partiellement :** Actions rapides existent mais pas toutes.

**Manque :**
- ✅ Créer devis (existe)
- ❌ Envoyer devis (manque)
- ❌ Créer facture (manque)
- ❌ Relancer (manque)
- ❌ Clôturer dossier (manque)

**Action requise :** Ajouter ces boutons dans un bloc toujours visible (sticky ou dans la sidebar).

---

### 8. AUTOMATISATIONS IA

**Manque complètement :**

**Fonctionnalités attendues :**
- Surveiller les statuts
- Détecter les oublis
- Déclencher les workflows
- Alerter l'artisan
- Automatiser le suivi

**Exemples concrets :**
- Si visite réalisée depuis 3 jours sans devis → Alerte "Créer le devis"
- Si devis envoyé depuis 7 jours sans réponse → Proposer relance
- Si facture en retard → Alerte automatique
- Si devis signé sans facture → Alerte "Créer la facture"

**Action requise :** Créer des workflows N8N + logique dans le frontend pour afficher les alertes.

---

## 🎯 PLAN D'ACTION PRIORISÉ

### PHASE 1 : FONDATIONS (Urgent)
1. ✅ Aligner les statuts avec le cahier des charges
   - Ajouter "facture_a_creer", "facture_envoyee", "facture_en_retard"
   - Migration Supabase

2. ✅ Créer le bloc "Prochaine action"
   - Composant React
   - Logique de calcul basée sur statut + dates + éléments manquants
   - Intégration dans la page détail

3. ✅ Ajouter l'onglet Factures dans le détail
   - Récupérer les factures liées au dossier
   - Afficher liste avec statuts
   - Actions (créer, envoyer, relancer, marquer payée)

### PHASE 2 : VUES FILTRÉES (Important)
4. ✅ Créer les vues filtrées dans la liste
   - Nouveaux dossiers
   - RDV à venir
   - Visites réalisées – Devis à faire
   - Devis envoyés – en attente
   - Factures à créer
   - Factures en retard
   - Dossiers clôturés

### PHASE 3 : AUTOMATISATIONS (Essentiel)
5. ✅ Journal automatique
   - Triggers Supabase pour enregistrer les événements
   - Webhooks N8N pour les actions externes

6. ✅ Onglet Relances & Alertes IA
   - Composant React
   - Logique de détection des oublis
   - Affichage des alertes
   - Actions proposées

7. ✅ Actions rapides complètes
   - Envoyer devis
   - Créer facture
   - Relancer
   - Clôturer dossier

### PHASE 4 : IA & WORKFLOWS (Avancé)
8. ✅ Workflows N8N pour automatisations
   - Détection oublis
   - Relances automatiques
   - Alertes intelligentes

9. ✅ Intégration LEO pour suggestions
   - LEO analyse le dossier
   - Propose les prochaines actions
   - Génère les alertes contextuelles

---

## 📊 MATRICE DE CORRESPONDANCE

| Cahier des charges | État actuel | Priorité | Complexité |
|-------------------|-------------|----------|------------|
| Vues filtrées | ❌ Manque | Haute | Moyenne |
| Statuts alignés | ⚠️ Partiel | Haute | Faible |
| Bloc Prochaine action | ❌ Manque | **Critique** | Moyenne |
| Onglet Factures | ❌ Manque | Haute | Faible |
| Onglet Relances IA | ❌ Manque | Moyenne | Élevée |
| Journal automatique | ⚠️ Partiel | Moyenne | Moyenne |
| Actions rapides | ⚠️ Partiel | Moyenne | Faible |
| Automatisations IA | ❌ Manque | Moyenne | Élevée |

---

## 🚀 PROCHAINES ÉTAPES RECOMMANDÉES

**Option 1 : Transformation complète**
- Implémenter toutes les phases dans l'ordre
- Durée estimée : 2-3 semaines
- Résultat : Module dossier 100% conforme au cahier des charges

**Option 2 : MVP rapide**
- Phase 1 uniquement (fondations)
- Durée estimée : 3-5 jours
- Résultat : Module fonctionnel avec les éléments critiques

**Option 3 : Maquette d'interface**
- Créer les maquettes Figma/design
- Valider avec l'artisan
- Puis implémenter

---

## 💡 RECOMMANDATION

**Je recommande l'Option 2 (MVP rapide) :**
1. C'est le plus rapide à mettre en production
2. Les éléments critiques (Prochaine action, Factures) sont les plus impactants
3. Permet de valider l'approche avant d'investir dans les automatisations

**Ensuite, Option 3 (Maquette) :**
- Pour valider l'UX avec l'artisan
- S'assurer que l'interface correspond à ses attentes
- Ajuster avant de développer les phases 2-4

---

**Prêt à commencer ?** 🚀
