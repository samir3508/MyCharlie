# 🐛 FIX - ERREURS DE CALCUL CHARLIE

## Problème identifié

Charlie (agent N8N) fait **3 erreurs** avec les montants :

### Erreur 1 : Calculs incorrects dans le résumé
**Exemple :** Devis Laurent Breih
```
Charlie annonce : 1708€ HT
Calcul correct : 1688€ HT (980 + 468 + 240)
```

### Erreur 2 : Affichage montant incorrect lors de l'envoi
**Exemple :** Envoi devis DV-2026-0007
```
Charlie affiche : "1078€ TTC"
Montant réel : 1880.8€ TTC
```
→ Charlie prend le montant de la **première ligne** au lieu du **total**

### Erreur 3 : Confusion entre montants des lignes et total
Charlie mélange les montants individuels des lignes avec le montant total du devis.

---

## 🔍 CAUSE

Le problème est dans **le prompt système de Charlie** dans N8N qui :
1. Ne calcule pas correctement les totaux (erreurs arithmétiques)
2. Récupère le mauvais champ lors de l'affichage du montant

---

## ✅ SOLUTION

### Étape 1 : Corriger le calcul des montants dans le prompt

Dans N8N, **modifier le System Message de Charlie** pour ajouter ces instructions :

```markdown
## CALCUL DES MONTANTS - RÈGLES STRICTES

Quand tu calcules un devis, tu DOIS suivre cette méthode EXACTE :

### 1. Calculer chaque ligne séparément

Pour chaque ligne de travaux :
- `total_ht_ligne = quantite × prix_unitaire_ht`
- `total_tva_ligne = total_ht_ligne × (taux_tva / 100)`
- `total_ttc_ligne = total_ht_ligne + total_tva_ligne`

### 2. Additionner toutes les lignes

```javascript
let montant_ht_total = 0
let montant_tva_total = 0

for (const ligne of lignes) {
  const ligne_ht = ligne.quantite * ligne.prix_unitaire_ht
  const ligne_tva = ligne_ht * (ligne.taux_tva / 100)
  
  montant_ht_total += ligne_ht
  montant_tva_total += ligne_tva
}

const montant_ttc_total = montant_ht_total + montant_tva_total
```

### 3. Arrondir correctement

TOUJOURS arrondir à 2 décimales :
```javascript
montant_ht_total = Math.round(montant_ht_total * 100) / 100
montant_tva_total = Math.round(montant_tva_total * 100) / 100
montant_ttc_total = Math.round(montant_ttc_total * 100) / 100
```

### EXEMPLE CORRECT :

Input :
- Ligne 1 : 3 radiateurs × 420€ HT (TVA 20%)
- Ligne 2 : 1 forfait × 390€ HT (TVA 10%)
- Ligne 3 : 1 programmateur × 260€ HT (TVA 20%)

Calculs :
```
Ligne 1 : 3 × 420 = 1260€ HT × 1.20 = 1512€ TTC (TVA 252€)
Ligne 2 : 1 × 390 = 390€ HT × 1.10 = 429€ TTC (TVA 39€)
Ligne 3 : 1 × 260 = 260€ HT × 1.20 = 312€ TTC (TVA 52€)

TOTAL HT  = 1260 + 390 + 260 = 1910€
TOTAL TVA = 252 + 39 + 52   = 343€
TOTAL TTC = 1512 + 429 + 312 = 2253€
```

OU simplement : `TOTAL TTC = TOTAL HT + TOTAL TVA = 1910 + 343 = 2253€`

### ⚠️ ATTENTION

- Ne JAMAIS additionner les TVA avec des taux différents AVANT de calculer
- Calculer ligne par ligne, PUIS additionner
- Vérifier : `Total TTC = Total HT + Total TVA`
```

---

### Étape 2 : Corriger l'affichage du montant lors de l'envoi

Dans le **prompt système de Charlie**, ajouter cette instruction :

```markdown
## AFFICHAGE DES MONTANTS

Quand tu affiches le montant d'un devis ou d'une facture :
1. Utilise TOUJOURS le champ `montant_ttc` du devis (PAS d'une ligne)
2. Si le devis n'a pas encore de lignes, montant_ttc = 0
3. Si le devis a des lignes, utilise le total calculé

### Exemple CORRECT :

```
✅ DEVIS CRÉÉ AVEC SUCCÈS !
📄 Numéro : DV-2026-0007
💰 Montant : {{devis.montant_ttc}} € TTC
```

### Exemple INCORRECT :

```
❌ Montant : {{lignes[0].total_ttc}} € TTC  // NE PAS FAIRE
```

### Code de vérification :

Avant d'afficher le montant, ajoute ce check :
```javascript
// Vérifier que c'est bien le total du devis
const montant_affiche = devis.montant_ttc  // ✅ Correct
// PAS lignes[0].total_ttc  // ❌ Incorrect
```
```

---

### Étape 3 : Ajouter une fonction de validation dans N8N

**Créer un nœud "Code" juste avant l'affichage du montant** :

```javascript
// Nœud : Valider Montant Devis
const devis = $input.item.json.devis
const lignes = $input.item.json.lignes || []

// Calculer le total correct à partir des lignes
let montant_ht_calcule = 0
let montant_tva_calcule = 0

for (const ligne of lignes) {
  const ligne_ht = ligne.quantite * ligne.prix_unitaire_ht
  const ligne_tva = ligne_ht * (ligne.taux_tva / 100)
  
  montant_ht_calcule += ligne_ht
  montant_tva_calcule += ligne_tva
}

// Arrondir
montant_ht_calcule = Math.round(montant_ht_calcule * 100) / 100
montant_tva_calcule = Math.round(montant_tva_calcule * 100) / 100
const montant_ttc_calcule = Math.round((montant_ht_calcule + montant_tva_calcule) * 100) / 100

// Comparer avec le montant du devis
const montant_db = devis.montant_ttc || 0

// Log pour debug
console.log('💰 Montant DB:', montant_db)
console.log('💰 Montant calculé:', montant_ttc_calcule)
console.log('💰 Différence:', Math.abs(montant_db - montant_ttc_calcule))

// Si différence > 1€, warning
if (Math.abs(montant_db - montant_ttc_calcule) > 1) {
  console.warn('⚠️ ATTENTION : Différence de montant détectée !')
  console.warn('DB:', montant_db, 'Calculé:', montant_ttc_calcule)
}

// Retourner avec montant correct
return {
  json: {
    ...devis,
    montant_ht: montant_ht_calcule,
    montant_tva: montant_tva_calcule,
    montant_ttc: montant_ttc_calcule,
    lignes: lignes
  }
}
```

---

### Étape 4 : Créer un Edge Function pour recalculer les montants

**Fichier** : `supabase/functions/recalculate-devis-totals/index.ts`

```typescript
/**
 * Edge Function: Recalculer les totaux d'un devis
 * À appeler après ajout/modification/suppression de lignes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Seule la méthode POST est autorisée')
  }

  try {
    const { devis_id, tenant_id } = await req.json()

    // Récupérer toutes les lignes du devis
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_devis')
      .select('quantite, prix_unitaire_ht, tva_pct')
      .eq('devis_id', devis_id)

    if (lignesError) throw lignesError

    // Calculer les totaux
    let montant_ht = 0
    let montant_tva = 0

    for (const ligne of lignes) {
      const ligne_ht = ligne.quantite * ligne.prix_unitaire_ht
      const ligne_tva = ligne_ht * (ligne.tva_pct / 100)
      
      montant_ht += ligne_ht
      montant_tva += ligne_tva
    }

    // Arrondir à 2 décimales
    montant_ht = Math.round(montant_ht * 100) / 100
    montant_tva = Math.round(montant_tva * 100) / 100
    const montant_ttc = Math.round((montant_ht + montant_tva) * 100) / 100

    // Mettre à jour le devis
    const { data: updatedDevis, error: updateError } = await supabase
      .from('devis')
      .update({
        montant_ht,
        montant_tva,
        montant_ttc
      })
      .eq('id', devis_id)
      .eq('tenant_id', tenant_id)
      .select()
      .single()

    if (updateError) throw updateError

    return successResponse({
      devis: updatedDevis,
      montant_ht,
      montant_tva,
      montant_ttc
    })
  } catch (error) {
    console.error('Error recalculating devis totals:', error)
    return errorResponse(500, 'CALCULATION_ERROR', error.message)
  }
})
```

---

### Étape 5 : Modifier les Edge Functions existantes

**Dans `add-ligne-devis/index.ts`, après l'insertion de la ligne** :

```typescript
// Après avoir ajouté la ligne, recalculer les totaux
const recalculateUrl = `${baseUrl}/functions/v1/recalculate-devis-totals`
await fetch(recalculateUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': authHeader,
  },
  body: JSON.stringify({
    devis_id: devis_id,
    tenant_id: tenant_id
  })
})
```

**Répéter pour** :
- `update-ligne-devis/index.ts`
- `delete-ligne-devis/index.ts`
- `finalize-devis/index.ts`

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Devis simple
```
Message : "Fais un devis pour Martin avec 1000€ HT TVA 20%"

Résultat attendu :
- Total HT : 1000€
- TVA : 200€
- Total TTC : 1200€
```

### Test 2 : Devis avec plusieurs lignes TVA différentes
```
Message : "Fais un devis pour Dupont avec :
- Rénovation 980€ HT TVA 10%
- Création 6 prises 6×78€ HT TVA 10%
- Fourniture 240€ HT TVA 20%"

Résultat attendu :
- Total HT : 1688€ (980 + 468 + 240)
- TVA : 192.8€ (98 + 46.8 + 48)
- Total TTC : 1880.8€
```

### Test 3 : Envoi devis
```
Message : "Envoie le devis DV-2026-0007"

Résultat attendu :
Email affiche : "Montant : 1880.8€ TTC"
PAS : "Montant : 1078€ TTC"
```

---

## 📊 VÉRIFICATION DANS SUPABASE

Après avoir créé un devis, vérifier dans Supabase SQL Editor :

```sql
-- Vérifier les totaux du devis
SELECT 
  d.numero,
  d.montant_ht as devis_ht,
  d.montant_tva as devis_tva,
  d.montant_ttc as devis_ttc,
  SUM(l.total_ht) as lignes_ht,
  SUM(l.total_tva) as lignes_tva,
  SUM(l.total_ttc) as lignes_ttc
FROM devis d
LEFT JOIN lignes_devis l ON l.devis_id = d.id
WHERE d.numero = 'DV-2026-0007'
GROUP BY d.id, d.numero, d.montant_ht, d.montant_tva, d.montant_ttc;

-- Si devis_ht != lignes_ht, il y a un problème de calcul
```

---

## ✅ CHECKLIST D'APPLICATION

- [ ] Modifier le System Message de Charlie dans N8N (ajout règles calcul)
- [ ] Modifier le System Message de Charlie dans N8N (ajout règles affichage)
- [ ] Créer le nœud "Code - Valider Montant" dans N8N
- [ ] Créer l'Edge Function `recalculate-devis-totals`
- [ ] Modifier `add-ligne-devis` pour appeler recalculate
- [ ] Modifier `update-ligne-devis` pour appeler recalculate
- [ ] Modifier `delete-ligne-devis` pour appeler recalculate
- [ ] Tester avec Test 1 (devis simple)
- [ ] Tester avec Test 2 (plusieurs lignes TVA différentes)
- [ ] Tester avec Test 3 (envoi email)
- [ ] Vérifier dans Supabase que totaux = somme lignes

---

## 🎯 RÉSULTAT ATTENDU

Après application de ces corrections :
- ✅ Charlie calcule correctement tous les montants
- ✅ Charlie affiche le bon montant total lors de l'envoi
- ✅ Les montants en DB correspondent à la somme des lignes
- ✅ Pas de confusion entre montant ligne et montant total

---

**Date de création :** 24 janvier 2026  
**Temps estimé :** 2-3 heures  
**Criticité :** 🔴 URGENT - Bug critique calculs financiers
