# 🎯 PLAN D'ALIGNEMENT AVEC LA VISION

## ✅ CE QUI EST DÉJÀ PARFAIT

1. ✅ **Client → Dossier** : Fonctionne
2. ✅ **Dossier = Colonne vertébrale** : Tout est lié au dossier
3. ✅ **Mises à jour automatiques** : Statuts se mettent à jour automatiquement
4. ✅ **Pas d'IA client** : Les clients ne créent rien, c'est l'artisan
5. ✅ **Flow complet** : Contact → Visite → Devis → Facture → Paiement

---

## 🔴 ACTIONS NÉCESSAIRES

### **1. Ajouter les statuts manquants : `chantier_en_cours` et `chantier_termine`**

**Pourquoi :**
- Ta vision inclut la phase "chantier" entre devis accepté et facture
- Actuellement, on passe directement de `signe` (devis accepté) à `facture_a_creer`
- Il manque l'étape "travaux en cours" et "travaux terminés"

**Actions :**

#### A. Migration Supabase
```sql
-- Ajouter les nouveaux statuts dans l'enum
ALTER TYPE dossier_statut ADD VALUE 'chantier_en_cours';
ALTER TYPE dossier_statut ADD VALUE 'chantier_termine';
```

#### B. Mise à jour TypeScript
- `src/types/database.ts` : Ajouter les statuts dans le type `dossiers.statut`

#### C. Mise à jour Kanban
- `src/components/dossiers/dossier-kanban.tsx` : Ajouter une colonne "Chantiers" si nécessaire

---

### **2. Mettre à jour la logique "Prochaine action"**

**Flow actuel :**
```
devis_accepte (signe) → facture_a_creer
```

**Flow vision :**
```
devis_accepte (signe) → chantier_en_cours → chantier_termine → facture_a_creer
```

**Actions :**

#### A. Après acceptation devis
- **Actuel :** Prochaine action = "Créer la facture"
- **Vision :** Prochaine action = "Démarrer le chantier" → passe à `chantier_en_cours`

#### B. Pendant le chantier
- **Nouveau :** Prochaine action = "Terminer le chantier" → passe à `chantier_termine`

#### C. Après chantier terminé
- **Nouveau :** Prochaine action = "Créer la facture" → passe à `facture_a_creer`

**Fichiers à modifier :**
- `src/components/dossiers/prochaine-action.tsx` : Ajouter la logique chantier

---

### **3. Simplifier l'affichage (optionnel mais recommandé)**

**Actuel :** Statuts très granulaires (rdv_planifie, rdv_confirme, devis_en_cours, devis_pret, etc.)

**Vision :** Statuts plus simples (visite_planifiee, devis_a_faire, devis_envoye, etc.)

**Solution :** 
- Garder la granularité en base (meilleur suivi)
- Créer une fonction de mapping pour l'affichage à l'artisan
- Afficher les statuts "vision" dans l'UI, garder les statuts détaillés en base

**Fichiers à créer/modifier :**
- `src/lib/utils/dossiers.ts` : Fonction `getStatutVision(statut: string)`
- Utiliser cette fonction dans les composants d'affichage

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### **Phase 1 : Ajout des statuts chantier** 🔴

- [ ] Migration Supabase : Ajouter `chantier_en_cours` et `chantier_termine`
- [ ] `src/types/database.ts` : Mettre à jour le type `dossiers.statut`
- [ ] `src/components/dossiers/dossier-kanban.tsx` : Ajouter colonne "Chantiers" (optionnel)
- [ ] `src/lib/utils/dossiers.ts` : Ajouter labels pour les nouveaux statuts

### **Phase 2 : Logique prochaine action** 🔴

- [ ] `src/components/dossiers/prochaine-action.tsx` : 
  - [ ] Après `signe` (devis accepté) → "Démarrer le chantier"
  - [ ] Si `chantier_en_cours` → "Terminer le chantier"
  - [ ] Si `chantier_termine` → "Créer la facture"
- [ ] `src/lib/hooks/use-dossiers.ts` : Ajouter mutation pour passer à `chantier_en_cours`
- [ ] `src/app/(dashboard)/dossiers/[id]/page.tsx` : Ajouter boutons "Démarrer chantier" / "Terminer chantier"

### **Phase 3 : Simplification affichage (optionnel)** 💡

- [ ] `src/lib/utils/dossiers.ts` : Créer fonction `getStatutVision()`
- [ ] Utiliser cette fonction dans les composants d'affichage
- [ ] Tester que l'affichage est plus simple pour l'artisan

---

## 🎯 FLOW FINAL ALIGNÉ AVEC TA VISION

```
1. Client contacte → Dossier créé (statut: contact_recu/nouveau)
   ↓
2. Artisan demande visite → RDV créé (statut: rdv_planifie/visite_planifiee)
   ↓
3. Client confirme → RDV confirmé (statut: rdv_confirme/visite_planifiee)
   ↓
4. Visite réalisée → Fiche créée (statut: visite_realisee)
   ↓
5. Devis créé (statut: devis_en_cours/devis_a_faire)
   ↓
6. Devis envoyé (statut: devis_envoye)
   ↓
7. Devis accepté (statut: signe/devis_accepte)
   ↓
8. 🆕 Chantier démarré (statut: chantier_en_cours) ← NOUVEAU
   ↓
9. 🆕 Chantier terminé (statut: chantier_termine) ← NOUVEAU
   ↓
10. Facture créée (statut: facture_a_creer)
   ↓
11. Facture envoyée (statut: facture_envoyee)
   ↓
12. Paiement reçu (statut: facture_payee/paye)
```

---

## 🚀 PRIORITÉS

### **URGENT (pour aligner avec la vision) :**
1. 🔴 Ajouter `chantier_en_cours` et `chantier_termine`
2. 🔴 Mettre à jour la logique prochaine action
3. 🔴 Ajouter les boutons "Démarrer chantier" / "Terminer chantier"

### **IMPORTANT (amélioration UX) :**
4. 💡 Simplifier l'affichage des statuts (mapping vision)
5. 💡 Distinguer visuellement LÉO vs CHARLIE dans l'UI

---

## 📝 NOTES IMPORTANTES

1. **Garder la granularité en base** : Les statuts détaillés (rdv_planifie, rdv_confirme, devis_en_cours, devis_pret) sont utiles pour le suivi. On peut les garder et juste mapper pour l'affichage.

2. **Rétrocompatibilité** : Les dossiers existants continueront de fonctionner. On ajoute juste de nouveaux statuts possibles.

3. **Migration progressive** : On peut migrer les dossiers existants avec `signe` vers `chantier_en_cours` ou `chantier_termine` selon leur état.

---

**Prêt à implémenter ?** 🚀
