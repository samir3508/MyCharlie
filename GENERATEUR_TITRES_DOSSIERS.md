# 🎯 Générateur de Titres pour Dossiers

## 📋 Fonctionnalité

Fonction intelligente pour générer automatiquement des titres valides et descriptifs pour les dossiers.

## 🚀 Utilisation

### Dans le code TypeScript/Next.js

```typescript
import { genererTitreAutomatique } from '@/lib/utils/titres'

const titre = genererTitreAutomatique({
  type_travaux: 'Rénovation cuisine',
  adresse_chantier: '12 rue de la Paix, 75001 Paris',
  clients: {
    nom_complet: 'Jean Dupont',
    nom: 'Dupont',
    prenom: 'Jean'
  },
  description: 'Rénovation complète de la cuisine avec carrelage et peinture',
  statut: 'contact_recu'
})

// Résultat: "Rénovation cuisine - Jean Dupont"
```

### Dans le Code Tool n8n

```javascript
// Exemple dans create-devis ou create-client
const dossierTitle = genererTitreAutomatique({
  type_travaux: payload.type_travaux || null,
  adresse_chantier: client.adresse_facturation || null,
  clients: {
    nom_complet: `${client.prenom} ${client.nom}`.trim(),
    nom: client.nom,
    prenom: client.prenom
  },
  description: payload.description || null,
  statut: 'contact_recu'
})
```

## 🎨 Logique de Génération

La fonction suit une **hiérarchie de priorités** :

### Priorité 1 : Type de travaux + Client
```
"Rénovation cuisine - Jean Dupont"
```

### Priorité 2 : Type de travaux + Ville
```
"Rénovation salle de bain - Paris"
```

### Priorité 3 : Type de travaux seul
```
"Peinture"
```

### Priorité 4 : Extraction depuis description
Si le type de travaux n'est pas fourni, la fonction cherche dans la description :
- Cherche des mots-clés (cuisine, salle de bain, peinture, etc.)
- Génère un titre basé sur ce qui est trouvé

### Priorité 5 : Client + "Travaux"
```
"Travaux Jean Dupont"
```

### Priorité 6 : Ville + "Travaux"
```
"Travaux Paris"
```

### Priorité 7 : Basé sur le statut
```
"Nouveau contact"
"Projet en qualification"
"RDV à planifier"
```

### Par défaut
```
"Nouveau dossier"
```

## 🔧 Types de Travaux Reconnus

La fonction normalise automatiquement les types de travaux courants :

| Entrée | Sortie normalisée |
|--------|------------------|
| `cuisine` | `Rénovation cuisine` |
| `salle de bain`, `sdb` | `Rénovation salle de bain` |
| `peinture` | `Peinture` |
| `carrelage` | `Carrelage` |
| `parquet` | `Pose parquet` |
| `plomberie` | `Travaux plomberie` |
| `électricité` | `Travaux électricité` |
| `isolation` | `Isolation` |
| `chauffage` | `Installation chauffage` |
| `fenêtre`, `fenetre` | `Remplacement fenêtres` |
| `porte` | `Remplacement portes` |
| `toit`, `toiture` | `Travaux toiture` |
| `façade`, `facade` | `Rénovation façade` |
| `terrasse` | `Aménagement terrasse` |
| `balcon` | `Aménagement balcon` |
| `extension` | `Extension` |
| `rénovation`, `renovation` | `Rénovation` |
| `construction` | `Construction` |
| `aménagement`, `amenagement` | `Aménagement` |
| `décoration`, `decoration` | `Décoration` |

## 📍 Extraction de la Ville

La fonction extrait automatiquement la ville depuis l'adresse :

- **Avec code postal** : `"12 rue de la Paix, 75001 Paris"` → `"Paris"`
- **Sans code postal** : `"12 rue de la Paix, Paris"` → `"Paris"`
- **Premier élément** : `"12 rue de la Paix"` → `"12 rue de la Paix"`

## ✅ Avantages

1. **Intelligent** : Utilise toutes les informations disponibles
2. **Normalisé** : Formate les types de travaux de manière cohérente
3. **Descriptif** : Génère des titres clairs et informatifs
4. **Flexible** : Fonctionne même avec peu d'informations
5. **Professionnel** : Format adapté pour les dossiers BTP

## 🔄 Intégration

### Dans `create-devis` (Code Tool n8n)

```javascript
// Lors de la création automatique d'un dossier
const dossierTitle = genererTitreAutomatique({
  type_travaux: null, // À remplir depuis les lignes de devis si possible
  adresse_chantier: client.adresse_facturation || client.adresse_chantier,
  clients: {
    nom_complet: `${client.prenom} ${client.nom}`.trim(),
    nom: client.nom,
    prenom: client.prenom
  },
  description: null,
  statut: 'contact_recu'
})
```

### Dans `create-client` (Code Tool n8n)

```javascript
// Si un dossier est créé automatiquement
const dossierTitle = genererTitreAutomatique({
  type_travaux: null,
  adresse_chantier: adresse_facturation,
  clients: {
    nom_complet: `${prenom} ${nom}`.trim(),
    nom: nom,
    prenom: prenom
  },
  description: null,
  statut: 'contact_recu'
})
```

## 📝 Notes

- Les titres générés sont **toujours valides** (pas de caractères bizarres)
- La fonction peut être utilisée pour **améliorer** des titres existants
- Compatible avec la fonction `ameliorerTitre()` existante
