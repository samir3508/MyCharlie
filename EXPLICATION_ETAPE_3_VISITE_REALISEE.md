# 🏠 EXPLICATION DÉTAILLÉE : ÉTAPE 3 - VISITE RÉALISÉE

## 📋 Vue d'ensemble

L'étape 3 peut être déclenchée de **2 façons différentes** :

1. **Via le RDV** : L'artisan marque le RDV comme `realise`
2. **Via la Fiche de Visite** : L'artisan crée une fiche de visite

Dans les deux cas, le dossier passe automatiquement à `visite_realisee` (sauf conditions spéciales).

---

## 🔄 MÉTHODE 1 : Via le RDV (Marquer RDV comme "réalisé")

### **Code concerné :**
`src/lib/hooks/use-rdv.ts` → fonction `useUpdateRdv()`

### **Comment ça marche :**

```typescript
// Quand l'artisan met à jour un RDV avec statut = 'realise'
export function useUpdateRdv() {
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      // 1. Mettre à jour le RDV
      const { data } = await supabase
        .from('rdv')
        .update(updates)  // updates.statut = 'realise'
        .eq('id', id)
        .select()
        .single()

      // 2. ⚡ MISE À JOUR AUTOMATIQUE DU DOSSIER
      if (data.dossier_id) {
        if (updates.statut === 'realise') {
          // RDV réalisé → dossier passe à visite_realisee
          await supabase
            .from('dossiers')
            .update({ 
              statut: 'visite_realisee',
              updated_at: new Date().toISOString()
            })
            .eq('id', data.dossier_id)
        }
      }
    }
  })
}
```

### **Flow complet :**

```
1. Artisan ouvre l'agenda RDV
   ↓
2. Artisan clique sur un RDV
   ↓
3. Artisan change le statut : "planifie" → "realise"
   ↓
4. ⚡ HOOK useUpdateRdv() détecte le changement
   ↓
5. ⚡ Mise à jour automatique du dossier :
   - Dossier.statut = 'visite_realisee'
   - Dossier.updated_at = maintenant
   ↓
6. ✅ Dossier mis à jour automatiquement
```

### **Où ça se passe dans l'UI :**
- Page `/rdv` : L'artisan peut changer le statut d'un RDV
- Page `/dossiers/[id]` : Onglet RDV, l'artisan peut marquer un RDV comme réalisé

---

## 🔄 MÉTHODE 2 : Via la Fiche de Visite (Créer une fiche)

### **Code concerné :**
`src/lib/hooks/use-fiches-visite.ts` → fonction `useCreateFicheVisite()`

### **Comment ça marche :**

```typescript
// Quand l'artisan crée une fiche de visite
export function useCreateFicheVisite() {
  return useMutation({
    mutationFn: async (fiche) => {
      // 1. Calculer la date limite pour créer le devis (J+3 par défaut)
      const devisAvant = fiche.devis_a_faire_avant || (() => {
        const date = new Date()
        date.setDate(date.getDate() + 3)  // J+3
        return date.toISOString().split('T')[0]
      })()

      // 2. Créer la fiche de visite
      const { data } = await supabase
        .from('fiches_visite')
        .insert({
          ...fiche,
          tenant_id: tenant.id,
          devis_a_faire_avant: devisAvant,  // Date limite J+3
        })
        .select()
        .single()

      // 3. ⚡ MISE À JOUR AUTOMATIQUE DU DOSSIER (avec protection)
      if (fiche.dossier_id) {
        // ⚠️ VÉRIFICATIONS DE SÉCURITÉ
        // Vérifier si le dossier a déjà un devis accepté
        const { data: existingDevis } = await supabase
          .from('devis')
          .select('statut')
          .eq('dossier_id', fiche.dossier_id)
          .eq('statut', 'accepte')
          .limit(1)
          .single()

        // Vérifier le statut actuel du dossier
        const { data: dossier } = await supabase
          .from('dossiers')
          .select('statut')
          .eq('id', fiche.dossier_id)
          .single()

        // ⚠️ NE PAS ÉCRASER si :
        // 1. Un devis est déjà accepté OU
        // 2. Le statut est déjà "signe"
        const shouldUpdate = !existingDevis && dossier?.statut !== 'signe'

        if (shouldUpdate) {
          await supabase
            .from('dossiers')
            .update({ 
              statut: 'visite_realisee',
              updated_at: new Date().toISOString()
            })
            .eq('id', fiche.dossier_id)
        }
      }
    }
  })
}
```

### **Flow complet :**

```
1. Artisan ouvre un dossier
   ↓
2. Artisan va dans l'onglet "Fiches de visite"
   ↓
3. Artisan clique "Créer une fiche de visite"
   ↓
4. Artisan remplit :
   - Observations
   - Mesures
   - Photos
   - Contraintes
   - etc.
   ↓
5. Artisan enregistre la fiche
   ↓
6. ⚡ HOOK useCreateFicheVisite() :
   - Crée la fiche
   - Calcule devis_a_faire_avant = J+3
   - Vérifie les conditions de sécurité
   ↓
7. ⚡ Mise à jour automatique du dossier :
   - Si PAS de devis accepté ET statut ≠ 'signe'
     → Dossier.statut = 'visite_realisee'
   - Sinon → Ne change PAS le statut (protection)
   ↓
8. ✅ Fiche créée + Dossier mis à jour (si conditions OK)
```

### **Où ça se passe dans l'UI :**
- Page `/dossiers/[id]` : Onglet "Fiches de visite" → Bouton "Créer une fiche"

---

## 🛡️ PROTECTION : Ne pas écraser un statut "signe"

### **Pourquoi cette protection ?**

**Scénario problématique :**
1. Dossier a un devis accepté → statut = `signe`
2. Artisan crée une fiche de visite (par erreur ou pour un autre projet)
3. **SANS protection** : Le dossier repasserait à `visite_realisee` ❌
4. **AVEC protection** : Le statut reste `signe` ✅

### **Code de protection :**

```typescript
// Vérifier si le dossier a déjà un devis accepté
const { data: existingDevis } = await supabase
  .from('devis')
  .select('statut')
  .eq('dossier_id', fiche.dossier_id)
  .eq('statut', 'accepte')
  .limit(1)
  .single()

// Vérifier le statut actuel du dossier
const { data: dossier } = await supabase
  .from('dossiers')
  .select('statut')
  .eq('id', fiche.dossier_id)
  .single()

// Ne mettre à jour que si :
// 1. Pas de devis accepté ET
// 2. Le statut actuel n'est pas déjà "signe"
const shouldUpdate = !existingDevis && dossier?.statut !== 'signe'
```

### **Cas où la mise à jour est BLOQUÉE :**

| Situation | Statut actuel | Devis accepté ? | Mise à jour ? |
|-----------|---------------|-----------------|---------------|
| Normal | `rdv_confirme` | Non | ✅ OUI → `visite_realisee` |
| Protection 1 | `signe` | Oui | ❌ NON (reste `signe`) |
| Protection 2 | `signe` | Non | ❌ NON (reste `signe`) |
| Protection 3 | `devis_envoye` | Oui | ❌ NON (reste `devis_envoye`) |

---

## 🎯 PROCHAINE ACTION APRÈS `visite_realisee`

### **Code concerné :**
`src/components/dossiers/prochaine-action.tsx` → fonction `calculerProchaineAction()`

### **Logique :**

```typescript
// PRIORITÉ 1 : Visite réalisée (fiche de visite existe) → Créer devis
const ficheVisite = (dossier.fiches_visite as any[]) || []
const hasFicheVisite = ficheVisite.length > 0

// Si visite réalisée (statut OU fiche existe) et pas de devis → Créer devis
if ((statut === 'visite_realisee' || hasFicheVisite) && devis.length === 0) {
  const dateVisite = hasFicheVisite && ficheVisite[0]?.created_at 
    ? new Date(ficheVisite[0].created_at) 
    : dossier.updated_at 
      ? new Date(dossier.updated_at) 
      : new Date()
  const joursDepuisVisite = Math.floor((new Date().getTime() - dateVisite.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    action: 'Créer le devis',
    description: `Visite réalisée${joursDepuisVisite > 0 ? ` il y a ${joursDepuisVisite} jour${joursDepuisVisite > 1 ? 's' : ''}` : ' aujourd\'hui'}`,
    urgence: joursDepuisVisite > 3 ? 'haute' : 'normale',
    dateLimite: new Date(dateVisite.getTime() + 3 * 24 * 60 * 60 * 1000), // J+3
    actionButton: {
      label: 'Créer devis',
      href: `/devis/nouveau?dossier_id=${dossier.id}`
    }
  }
}
```

### **Scénarios de prochaine action :**

| Situation | Prochaine action | Urgence |
|-----------|------------------|---------|
| Visite réalisée, pas de devis | "Créer le devis" | Normale (si < 3 jours) |
| Visite réalisée, pas de devis, +3 jours | "Créer le devis" | **Haute** (dépassé) |
| Visite réalisée, devis en brouillon | "Finaliser le devis" | Normale |
| Visite réalisée, devis prêt | "Envoyer le devis" | Normale |

---

## 📊 RÉSUMÉ VISUEL

```
┌─────────────────────────────────────────────────────────┐
│           ÉTAPE 3 : VISITE RÉALISÉE                     │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
   MÉTHODE 1                            MÉTHODE 2
   Via RDV                              Via Fiche
        │                                     │
   RDV.statut = 'realise'          Fiche créée
        │                                     │
        └─────────────────┬─────────────────┘
                          │
              ⚡ MISE À JOUR AUTOMATIQUE
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
   Vérifications                        Conditions
   de sécurité                          OK ?
        │                                     │
   ┌───┴───┐                          ┌───┴───┐
   │  OUI  │                          │  NON  │
   └───┬───┘                          └───┬───┘
       │                                  │
Dossier.statut                    Dossier.statut
= 'visite_realisee'               = reste inchangé
       │                                  │
       └──────────────┬───────────────────┘
                      │
            ✅ PROCHAINE ACTION
                      │
         "Créer le devis" (si pas de devis)
         "Finaliser le devis" (si devis brouillon)
         "Envoyer le devis" (si devis prêt)
```

---

## 🔍 FICHIERS CLÉS

### **1. Mise à jour via RDV :**
- `src/lib/hooks/use-rdv.ts` : Ligne 313-315
  ```typescript
  } else if (updates.statut === 'realise') {
    // RDV réalisé → dossier passe à visite_realisee
    newDossierStatut = 'visite_realisee'
  }
  ```

### **2. Mise à jour via Fiche :**
- `src/lib/hooks/use-fiches-visite.ts` : Ligne 117-152
  - Protection contre écrasement
  - Calcul de `devis_a_faire_avant` (J+3)

### **3. Prochaine action :**
- `src/components/dossiers/prochaine-action.tsx` : Ligne 124-149
  - Détection visite réalisée
  - Calcul urgence selon délai
  - Bouton "Créer devis"

---

## ✅ CHECKLIST DE VALIDATION

Pour vérifier que l'étape 3 fonctionne :

- [ ] RDV marqué comme "realise" → Dossier passe à `visite_realisee`
- [ ] Fiche de visite créée → Dossier passe à `visite_realisee` (si conditions OK)
- [ ] Fiche créée avec devis déjà accepté → Dossier reste `signe` (protection)
- [ ] Prochaine action affichée : "Créer le devis"
- [ ] Date limite calculée : J+3 après la visite
- [ ] Urgence passe à "haute" si +3 jours dépassés

---

**Dernière mise à jour :** 25 janvier 2026
