# 🔍 ANALYSE : Délai d'exécution vs Délais de paiement

## 📋 Problème identifié

Les **délais d'exécution** (date de début des travaux) sont confondus avec les **délais de paiement** (dates d'échéance des factures) dans le système.

## 🎯 Concepts distincts

### 1. **Délai d'exécution** (`devis.delai_execution`)
- **Type** : `TEXT` (champ libre)
- **Signification** : Quand l'artisan va **commencer les travaux**
- **Exemples** : "10 jours", "1 mois", "2 semaines après acceptation"
- **Stockage** : Table `devis`, colonne `delai_execution`
- **Usage** : Information affichée sur le devis pour le client

### 2. **Délais de paiement** (`templates_conditions_paiement.delai_*`)
- **Type** : `INTEGER` (nombre de jours)
- **Signification** : Nombre de jours **après l'émission de la facture** pour calculer la date d'échéance
- **Champs** :
  - `delai_acompte` : Délai en jours pour l'acompte (ex: 0 = à la signature)
  - `delai_intermediaire` : Délai en jours pour le paiement intermédiaire (ex: 15 jours)
  - `delai_solde` : Délai en jours pour le solde (ex: 30 jours)
- **Stockage** : Table `templates_conditions_paiement`
- **Usage** : Calcul automatique des dates d'échéance lors de la création de factures

## 🔗 Relation actuelle

```
devis
├── delai_execution (TEXT) → "Quand commencer les travaux ?"
└── template_condition_paiement_id (UUID)
    └── templates_conditions_paiement
        ├── delai_acompte (INTEGER) → "Jours après émission pour acompte"
        ├── delai_intermediaire (INTEGER) → "Jours après émission pour intermédiaire"
        └── delai_solde (INTEGER) → "Jours après émission pour solde"
```

**Ces deux concepts sont INDÉPENDANTS** :
- Le délai d'exécution n'a **aucun impact** sur les dates d'échéance des factures
- Les délais de paiement du template n'ont **aucun impact** sur quand l'artisan commence les travaux

## ✅ Logique correcte actuelle

### Calcul des dates d'échéance (dans `create-facture-from-devis/index.ts`)

```typescript
// ✅ CORRECT : Utilise les délais du template, PAS delai_execution
if (type === 'acompte') {
  dateEcheance = new Date(today)
  dateEcheance.setDate(dateEcheance.getDate() + (template.delai_acompte || 0))
} else if (type === 'intermediaire') {
  dateEcheance = new Date(today)
  dateEcheance.setDate(dateEcheance.getDate() + (template.delai_intermediaire || 15))
} else { // solde
  dateEcheance = new Date(today)
  dateEcheance.setDate(dateEcheance.getDate() + (template.delai_solde || 30))
}
```

**✅ Cette logique est CORRECTE** : Les dates d'échéance sont calculées à partir de la date d'émission + les délais du template.

## ❌ Problèmes potentiels identifiés

### 1. **Interface de personnalisation**
Si dans l'interface de personnalisation d'un devis, l'utilisateur voit :
- Un champ "Délai d'exécution" (correct)
- Des champs pour modifier les délais de paiement du template (incorrect si cela modifie le template global)

**Solution** : S'assurer que la personnalisation d'un devis ne modifie PAS le template global, mais seulement le devis spécifique.

### 2. **Affichage confus dans les prompts/docs**
Dans certains prompts (ex: `PROMPT_LEO_POUR_N8N_COMPLET.md`), il y a peut-être une confusion dans la façon dont les délais sont présentés.

### 3. **Validation ou calculs incorrects**
Si quelque part dans le code, `delai_execution` est utilisé pour calculer des dates d'échéance, c'est une erreur.

## 🔍 Vérifications à faire

### 1. Chercher les usages incorrects de `delai_execution`

```bash
# Chercher où delai_execution est utilisé pour calculer des dates
grep -r "delai_execution.*date\|date.*delai_execution" --include="*.ts" --include="*.tsx" --include="*.js"
```

### 2. Vérifier les formulaires de personnalisation
- Le formulaire de devis (`devis-form.tsx`) permet-il de modifier les délais du template ?
- Si oui, cela modifie-t-il le template global ou seulement le devis ?

### 3. Vérifier les prompts IA
- Les prompts pour LÉO/CHARLIE expliquent-ils correctement la différence ?
- Y a-t-il des instructions qui confondent les deux concepts ?

## 📝 Recommandations

### 1. **Clarifier la documentation**
Ajouter des commentaires explicites dans le code pour distinguer :
- `delai_execution` = Date de début des travaux (information pour le client)
- `delai_*` du template = Délais pour les échéances de paiement (calcul automatique)

### 2. **Séparer les champs dans l'interface**
Dans le formulaire de devis, bien séparer visuellement :
- **Section "Exécution"** : Délai d'exécution (quand commencer)
- **Section "Paiement"** : Conditions de paiement (basées sur le template, non modifiables dans le devis)

### 3. **Vérifier les prompts IA**
S'assurer que les prompts pour LÉO/CHARLIE expliquent clairement :
- `delai_execution` est une information textuelle libre
- Les délais de paiement viennent du template et sont utilisés pour calculer les dates d'échéance

## 🎯 Action immédiate

1. **Vérifier** : Y a-t-il un endroit dans le code où `delai_execution` est utilisé pour calculer des dates d'échéance ?
2. **Vérifier** : L'interface permet-elle de modifier les délais du template depuis un devis ?
3. **Clarifier** : Les prompts IA distinguent-ils bien les deux concepts ?

---

**Date de création** : 2026-01-23  
**Statut** : Analyse en cours
