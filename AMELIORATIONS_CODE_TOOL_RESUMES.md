# ✅ Améliorations Code Tool n8n - Résumés et Prochaines Actions

## 📋 Résumé des améliorations

Le Code Tool a été amélioré pour retourner des **résumés structurés** et des **prochaines actions** pour que CHARLIE puisse :
1. Afficher des résumés clairs (initial, global, final)
2. Proposer les prochaines actions possibles
3. Retrouver facilement les factures/devis créés pour les actions suivantes

---

## 🆕 Nouvelles fonctionnalités

### 1. Fonctions Helper pour Résumés

Ajout de 3 fonctions helper avant le switch :

- **`getNextActions(context)`** : Génère les prochaines actions possibles selon le contexte (devis/facture, statut, etc.)
- **`formatDevisSummary(devis, client, lignes)`** : Formate un résumé structuré pour un devis
- **`formatFactureSummary(facture, client, devis, lignes)`** : Formate un résumé structuré pour une facture
- **`enrichResultWithSummary(result, type, data)`** : Enrichit un résultat avec un résumé structuré

### 2. Structure des Résumés

Chaque résumé contient :

```javascript
{
  type: 'devis' | 'facture',
  id: 'uuid',
  numero: 'DV-2026-0001',
  statut: 'brouillon' | 'pret' | 'envoye' | ...,
  client: {
    id: 'uuid',
    nom_complet: 'Nom Prénom',
    email: 'email@example.com',
    telephone: '06...',
    adresse: '...'
  },
  travaux: [
    {
      designation: '...',
      quantite: 1,
      unite: 'forfait',
      prix_unitaire_ht: 260,
      tva_pct: 10,
      total_ht: 260
    }
  ],
  montants: {
    ht: 770,
    tva: 86,
    ttc: 856
  },
  conditions: {
    adresse_chantier: '...',
    delai_execution: '15 jours'
  },
  pdf_url: 'https://...',
  next_actions: [
    {
      label: 'Envoyer le devis par email',
      action: 'envoyer-devis',
      devis_id: 'uuid',
      numero: 'DV-2026-0001'
    },
    {
      label: 'Créer une facture d\'acompte',
      action: 'creer-facture-depuis-devis',
      devis_id: 'uuid',
      type: 'acompte'
    }
  ]
}
```

---

## 🔧 Améliorations par Action

### ✅ `create-devis`

**Avant :**
```javascript
{
  success: true,
  message: "✅ Devis DV-2026-0001 créé",
  devis: { ... }
}
```

**Après :**
```javascript
{
  success: true,
  message: "✅ Devis DV-2026-0001 créé avec succès",
  devis: { ... },
  devis_id: "uuid",
  devis_numero: "DV-2026-0001",
  client_id: "uuid",
  dossier_id: "uuid",
  summary: {
    type: 'devis',
    id: 'uuid',
    numero: 'DV-2026-0001',
    statut: 'brouillon',
    client: { ... },
    travaux: [],
    montants: { ht: 0, tva: 0, ttc: 0 },
    conditions: { ... },
    next_actions: [ ... ]
  }
}
```

### ✅ `creer-facture-depuis-devis`

**Améliorations :**
1. Récupère la facture complète avec client, devis, lignes après création
2. Retourne un résumé structuré avec toutes les infos
3. Inclut les IDs nécessaires pour les prochaines actions :
   - `facture_id`, `facture_numero`
   - `client_id`
   - `devis_id`, `devis_numero`

**Exemple de réponse :**
```javascript
{
  success: true,
  message: "✅ Facture FAC-2026-001-A créée avec succès",
  facture: { ... },
  facture_id: "uuid",
  facture_numero: "FAC-2026-001-A",
  client_id: "uuid",
  devis_id: "uuid",
  devis_numero: "DV-2026-0001",
  summary: {
    type: 'facture',
    id: 'uuid',
    numero: 'FAC-2026-001-A',
    statut: 'envoyee',
    client: { ... },
    devis: { id: 'uuid', numero: 'DV-2026-0001' },
    travaux: [ ... ],
    montants: { ht: 770, tva: 86, ttc: 856 },
    pdf_url: 'https://...',
    next_actions: [
      {
        label: 'Envoyer la facture par email',
        action: 'envoyer-facture',
        facture_id: 'uuid',
        numero: 'FAC-2026-001-A'
      },
      {
        label: 'Marquer comme payée',
        action: 'mark-facture-paid',
        facture_id: 'uuid'
      }
    ]
  }
}
```

### ✅ `get-facture`

**Améliorations :**
1. **Détection améliorée des numéros** : Reconnaît maintenant `FA-`, `FAC-`, `FACT-` et formats génériques
2. **Recherche exacte puis partielle** : Essaie d'abord recherche exacte, puis partielle si nécessaire
3. **Résumé structuré** : Retourne un résumé complet avec toutes les infos
4. **IDs pour prochaines actions** : Inclut `facture_id`, `facture_numero`, `client_id`, `devis_id`, `devis_numero`

**Exemple :**
```javascript
{
  success: true,
  message: "✅ Facture FAC-2026-001-A trouvée",
  facture: { ... },
  facture_id: "uuid",
  facture_numero: "FAC-2026-001-A",
  client_id: "uuid",
  devis_id: "uuid",
  devis_numero: "DV-2026-0001",
  pdf_url: "https://...",
  summary: { ... }
}
```

### ✅ `list-factures`

**Améliorations :**
1. **Recherche par numéro améliorée** :
   - Recherche exacte d'abord (`numero=eq.FAC-2026-001-A`)
   - Si rien trouvé, recherche partielle (`numero=ilike.%FAC-2026-001-A%`)
   - Reconnaît `FA-`, `FAC-`, `FACT-` et formats génériques
2. **Résumés pour chaque facture** : Chaque facture dans la liste a un `summary` avec toutes les infos
3. **IDs inclus** : Chaque facture inclut `facture_id`, `facture_numero`, `client_id`, `devis_id`, etc.

**Exemple :**
```javascript
{
  success: true,
  message: "1 facture(s) trouvée(s)",
  data: [
    {
      id: "uuid",
      numero: "FAC-2026-001-A",
      ...,
      summary: { ... },
      facture_id: "uuid",
      facture_numero: "FAC-2026-001-A",
      client_id: "uuid",
      devis_id: "uuid",
      devis_numero: "DV-2026-0001"
    }
  ],
  count: 1,
  factures: [ ... ]
}
```

---

## 🎯 Prochaines Actions Générées

Les prochaines actions sont générées automatiquement selon le contexte :

### Pour un Devis

**Si statut = `brouillon` :**
- Finaliser le devis
- Ajouter des lignes

**Si statut = `pret` ou `finalise` :**
- Envoyer le devis par email
- Créer une facture d'acompte

**Si statut = `envoye` :**
- Créer une facture d'acompte
- Voir le devis

### Pour une Facture

**Toujours :**
- Envoyer la facture par email
- (Si non payée) Marquer comme payée

**Si facture envoyée et échéance dépassée :**
- Envoyer une relance

---

## 📝 Utilisation par CHARLIE

CHARLIE peut maintenant :

1. **Afficher des résumés structurés** :
   - Résumé initial de la demande
   - Résumé global avant création
   - Résumé final après création

2. **Proposer les prochaines actions** :
   - Utiliser `result.summary.next_actions` pour afficher les options
   - Chaque action contient `action`, `label`, et les IDs nécessaires

3. **Retrouver facilement les éléments créés** :
   - Utiliser `result.facture_id`, `result.devis_id`, etc. pour les actions suivantes
   - Les numéros sont aussi disponibles : `result.facture_numero`, `result.devis_numero`

4. **Rechercher les factures efficacement** :
   - La recherche par numéro fonctionne maintenant même avec `FAC-2026-001-A`
   - Recherche exacte puis partielle pour plus de robustesse

---

## 🔍 Exemple de Workflow Complet

### 1. Création de devis
```javascript
create-devis { client_id: "...", ... }
→ Retourne: devis_id, devis_numero, summary avec next_actions
```

### 2. Ajout de lignes
```javascript
add-ligne-devis { devis_id: result.devis_id, ... }
```

### 3. Finalisation
```javascript
finalize-devis { devis_id: result.devis_id }
```

### 4. Envoi
```javascript
envoyer-devis { devis_id: result.devis_id }
```

### 5. Création facture
```javascript
creer-facture-depuis-devis { devis_id: result.devis_id, type: 'acompte' }
→ Retourne: facture_id, facture_numero, summary avec next_actions
```

### 6. Envoi facture
```javascript
// CHARLIE peut utiliser result.facture_id ou result.facture_numero
envoyer-facture { facture_id: result.facture_id }
// OU
get-facture { facture_id: "FAC-2026-001-A" } // Recherche par numéro fonctionne maintenant
→ Puis envoyer-facture avec l'ID récupéré
```

---

## ⚠️ Notes importantes

1. **Les résumés sont optionnels** : Si une action échoue ou si les données ne sont pas disponibles, le résultat fonctionne toujours sans le résumé
2. **Les IDs sont toujours inclus** : Même sans résumé, les IDs (`facture_id`, `devis_id`, etc.) sont toujours disponibles pour les actions suivantes
3. **Recherche robuste** : La recherche par numéro essaie toujours recherche exacte puis partielle pour maximiser les chances de trouver l'élément

---

## 🚀 Prochaines étapes possibles

1. Ajouter un case `envoyer-facture` similaire à `envoyer-devis`
2. Améliorer `get-devis` pour retourner aussi un résumé structuré
3. Ajouter des résumés pour les clients et dossiers
4. Créer des résumés globaux pour les listes (ex: "X factures trouvées pour ce client")
