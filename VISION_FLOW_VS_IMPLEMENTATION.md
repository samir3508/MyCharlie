# 🎯 VISION FLOW vs IMPLÉMENTATION ACTUELLE

## 📊 COMPARAISON DES STATUTS

### **VISION (Flow idéal) :**

```
1. nouveau
2. visite_a_planifier
3. visite_planifiee
4. visite_realisee
5. devis_a_faire
6. devis_envoye
7. en_attente_client
8. devis_accepte
9. chantier_en_cours
10. chantier_termine
11. facture_envoyee
12. paiement_en_attente
13. paye
14. perdu / abandonne
```

### **IMPLÉMENTATION ACTUELLE :**

```
1. contact_recu
2. qualification
3. rdv_a_planifier
4. rdv_planifie
5. rdv_confirme
6. visite_realisee
7. devis_en_cours
8. devis_pret
9. devis_envoye
10. en_negociation
11. signe
12. perdu
13. annule
14. facture_a_creer
15. facture_envoyee
16. facture_en_retard
17. facture_payee
```

---

## 🔄 MAPPING DES STATUTS (Vision → Actuel)

| Vision | Actuel | Action nécessaire |
|--------|--------|-------------------|
| `nouveau` | `contact_recu` ou `qualification` | ✅ OK (équivalent) |
| `visite_a_planifier` | `rdv_a_planifier` | ✅ OK (équivalent) |
| `visite_planifiee` | `rdv_planifie` | ✅ OK (équivalent) |
| `visite_realisee` | `visite_realisee` | ✅ OK (identique) |
| `devis_a_faire` | `devis_en_cours` | ⚠️ À renommer ou mapper |
| `devis_envoye` | `devis_envoye` | ✅ OK (identique) |
| `en_attente_client` | `devis_envoye` | ⚠️ Manquant (peut utiliser `devis_envoye`) |
| `devis_accepte` | `signe` | ⚠️ À renommer ou mapper |
| `chantier_en_cours` | ❌ **MANQUANT** | 🔴 À ajouter |
| `chantier_termine` | ❌ **MANQUANT** | 🔴 À ajouter |
| `facture_envoyee` | `facture_envoyee` | ✅ OK (identique) |
| `paiement_en_attente` | `facture_envoyee` | ⚠️ Manquant (peut utiliser `facture_envoyee`) |
| `paye` | `facture_payee` | ⚠️ À renommer ou mapper |
| `perdu` | `perdu` | ✅ OK (identique) |
| `abandonne` | `annule` | ✅ OK (équivalent) |

---

## 🎯 POINTS CLÉS DE LA VISION

### **1. Agents distincts : LÉO vs CHARLIE**

**VISION :**
- **LÉO** : Gère calendrier, RDV, visites, organisation
- **CHARLIE** : Gère devis, factures, paiements

**ACTUEL :**
- Pas de distinction claire dans l'UI
- Tout est dans le même système

**ACTION :** 
- ✅ Garder la logique actuelle (tout fonctionne)
- 💡 Ajouter des badges/indicateurs visuels pour distinguer les actions LÉO vs CHARLIE

---

### **2. Flow simplifié et linéaire**

**VISION :**
```
Client → Dossier → Visite → Devis → Facture → Paiement
```

**ACTUEL :**
```
Client → Dossier → RDV → Fiche Visite → Devis → Facture → Paiement
```

**DIFFÉRENCE :**
- Vision : Plus simple, moins de statuts intermédiaires
- Actuel : Plus granulaire (rdv_planifie, rdv_confirme, devis_en_cours, devis_pret)

**ACTION :**
- ✅ L'implémentation actuelle est plus précise (meilleure pour le suivi)
- 💡 On peut simplifier l'affichage pour l'artisan (grouper certains statuts)

---

### **3. Statuts manquants dans la vision**

**MANQUANTS :**
- `chantier_en_cours` : Après acceptation devis, pendant les travaux
- `chantier_termine` : Travaux terminés, avant facturation

**ACTION :**
- 🔴 **À AJOUTER** dans la base de données
- 🔴 **À IMPLÉMENTER** dans les hooks et composants

---

### **4. Pas d'IA client (important)**

**VISION :**
> "Les clients ne parlent PAS à l'IA. L'artisan crée tout."

**ACTUEL :**
- ✅ Déjà le cas : Les clients ne créent pas de dossiers directement
- ✅ L'artisan crée via l'interface
- ✅ Les clients peuvent seulement confirmer un créneau (via lien)

**ACTION :**
- ✅ OK, pas de changement nécessaire

---

## 🔧 PLAN D'ALIGNEMENT

### **PHASE 1 : Ajouter les statuts manquants** 🔴

```sql
-- Ajouter dans database.ts et migration Supabase
'chantier_en_cours'  -- Après devis_accepte, pendant travaux
'chantier_termine'    -- Travaux terminés, avant facture
```

**Fichiers à modifier :**
- `src/types/database.ts` : Ajouter les statuts
- Migration Supabase : Ajouter les valeurs dans l'enum
- `src/components/dossiers/dossier-kanban.tsx` : Ajouter colonnes si nécessaire

---

### **PHASE 2 : Mapper les statuts pour l'affichage** 💡

Créer une fonction de mapping pour afficher les statuts "vision" à l'artisan :

```typescript
// src/lib/utils/dossiers.ts
export function getStatutVision(statut: string): string {
  const mapping: Record<string, string> = {
    'contact_recu': 'nouveau',
    'qualification': 'nouveau',
    'rdv_a_planifier': 'visite_a_planifier',
    'rdv_planifie': 'visite_planifiee',
    'rdv_confirme': 'visite_planifiee', // RDV confirmé = visite planifiée
    'visite_realisee': 'visite_realisee',
    'devis_en_cours': 'devis_a_faire',
    'devis_pret': 'devis_a_faire',
    'devis_envoye': 'devis_envoye',
    'en_negociation': 'en_attente_client',
    'signe': 'devis_accepte',
    'chantier_en_cours': 'chantier_en_cours',
    'chantier_termine': 'chantier_termine',
    'facture_a_creer': 'chantier_termine', // Avant facture
    'facture_envoyee': 'facture_envoyee',
    'facture_en_retard': 'paiement_en_attente',
    'facture_payee': 'paye',
    'perdu': 'perdu',
    'annule': 'abandonne'
  }
  return mapping[statut] || statut
}
```

---

### **PHASE 3 : Mise à jour automatique des statuts** 🔄

**Quand passer à `chantier_en_cours` ?**
- Après `devis_accepte` (signe)
- Quand l'artisan démarre les travaux

**Quand passer à `chantier_termine` ?**
- Quand l'artisan termine les travaux
- Avant de créer la facture

**Fichiers à modifier :**
- `src/lib/hooks/use-devis.ts` : Après acceptation devis, proposer "Démarrer chantier"
- `src/components/dossiers/prochaine-action.tsx` : Ajouter logique pour `chantier_en_cours` → `chantier_termine`

---

### **PHASE 4 : Simplifier l'affichage Kanban** 📊

**Vision :** Colonnes simplifiées
```
Nouveaux | Visites | Devis | Chantiers | Factures | Payés | Perdus
```

**Actuel :** Colonnes détaillées
```
Nouveaux | RDV | Visite | Devis | Gagnés | Perdus
```

**ACTION :**
- Garder la granularité en base (meilleur suivi)
- Simplifier l'affichage Kanban pour l'artisan (grouper visuellement)

---

## ✅ CE QUI EST DÉJÀ BON

1. ✅ **Client → Dossier** : Déjà implémenté
2. ✅ **Dossier = Colonne vertébrale** : Déjà implémenté
3. ✅ **Mises à jour automatiques** : Déjà implémenté
4. ✅ **Fiche de visite** : Déjà implémenté
5. ✅ **Devis → Facture** : Déjà implémenté
6. ✅ **Relances automatiques** : Déjà implémenté
7. ✅ **Journal/historique** : Déjà implémenté
8. ✅ **Pas d'IA client** : Déjà le cas

---

## 🚀 ACTIONS PRIORITAIRES

### **URGENT (pour aligner avec la vision) :**

1. 🔴 **Ajouter `chantier_en_cours` et `chantier_termine`**
   - Migration Supabase
   - Types TypeScript
   - Hooks et composants

2. 🔴 **Mettre à jour la logique de prochaine action**
   - Après `devis_accepte` → "Démarrer chantier"
   - Après `chantier_en_cours` → "Terminer chantier"
   - Après `chantier_termine` → "Créer facture"

3. 💡 **Simplifier l'affichage Kanban**
   - Grouper visuellement les statuts similaires
   - Afficher les statuts "vision" à l'artisan

---

## 📝 RÉSUMÉ

**Ce qui fonctionne déjà :**
- ✅ Flow complet Client → Dossier → Visite → Devis → Facture → Paiement
- ✅ Mises à jour automatiques
- ✅ Dossier = colonne vertébrale

**Ce qui manque :**
- 🔴 Statuts `chantier_en_cours` et `chantier_termine`
- 🔴 Logique pour gérer la phase "chantier" (entre devis accepté et facture)

**Ce qui peut être amélioré :**
- 💡 Simplifier l'affichage pour l'artisan (statuts "vision")
- 💡 Distinguer visuellement LÉO vs CHARLIE dans l'UI

---

**Prochaine étape :** Implémenter les statuts `chantier_en_cours` et `chantier_termine` ?
