# 🔧 Guide : Correction Extraction des Lignes de Travaux

## Problème

Le nœud **"Extraction info global"** (ou **"Code in JavaScript"**) n'extrait que 2 lignes au lieu de 3 :

**Message reçu :**
```
Remplacement ballon eau chaude 200L → forfait 520 € HT — TVA 10%
Fourniture ballon 200L → 1 unité × 1 080 € HT — TVA 20%
Mise en service → forfait 120 € HT — TVA 10%
```

**Résultat actuel (incorrect) :**
- ❌ travaux[0]: label "L" (devrait être "Remplacement ballon eau chaude 200L")
- ❌ travaux[1]: label "Mise en service" (correct mais manque la ligne 2)
- ❌ Manque "Fourniture ballon 200L"

## Solution

### Étape 1 : Ouvrir le nœud dans n8n

1. Ouvrez votre workflow n8n
2. Trouvez le nœud **"Extraction info global"** ou **"Code in JavaScript"**
3. Cliquez dessus pour éditer le code

### Étape 2 : Localiser la section à corriger

Recherchez dans le code la section **"5) EXTRACTION DES LIGNES DE TRAVAUX"** (Ctrl+F / Cmd+F)

Vous devriez voir ce code **INCORRECT** :

```javascript
// FORFAIT
const forfaitRegex = /([A-Za-zÀ-ÿ\s-]+?)\s*→\s*forfait\s+(\d+(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi;
let match;
while ((match = forfaitRegex.exec(normalizedMsg)) !== null) {
  const label = match[1].trim();
  const prix = parseFloat(match[2].replace(',', '.'));
  const tva = parseInt(match[3], 10);

  if (!lines.find(l => l.label === label && l.unit_price === prix)) {
    lines.push({ label, quantity: 1, unit: 'forfait', unit_price: prix, tva });
  }
}

// QTY × PRICE
const qtyPriceRegex = /([A-Za-zÀ-ÿ\s-]+?)\s*→\s*(\d+(?:[.,]\d+)?)\s+(m²|ml|m|u\.|unité|u)\s*[×xX]\s*(\d+(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi;
while ((match = qtyPriceRegex.exec(normalizedMsg)) !== null) {
  const label = match[1].trim();
  const qty = parseFloat(match[2].replace(',', '.'));
  const unit = match[3];
  const prix = parseFloat(match[4].replace(',', '.'));
  const tva = parseInt(match[5], 10);

  if (!lines.find(l => l.label === label && l.quantity === qty && l.unit_price === prix)) {
    lines.push({ label, quantity: qty, unit, unit_price: prix, tva });
  }
}
```

### Étape 3 : Remplacer par le code corrigé

**Remplacez TOUTE la section ci-dessus** par ce code **CORRIGÉ** :

```javascript
// FORFAIT
// ✅ CORRECTION : Ajout de 0-9 dans le label pour capturer "200L"
// ✅ CORRECTION : Gestion des espaces dans les montants (ex: "1 080")
const forfaitRegex = /([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*forfait\s+(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi;
let match;
while ((match = forfaitRegex.exec(normalizedMsg)) !== null) {
  const label = match[1].trim();
  // ✅ CORRECTION : Supprimer les espaces dans les montants avant parsing
  const prixStr = match[2].replace(/\s+/g, '').replace(',', '.');
  const prix = parseFloat(prixStr);
  const tva = parseInt(match[3], 10);
  
  if (!isNaN(prix) && !isNaN(tva) && label.length > 0) {
    if (!lines.find(l => l.label === label && l.unit_price === prix)) {
      lines.push({ label, quantity: 1, unit: 'forfait', unit_price: prix, tva });
      console.log(`✅ Forfait extrait: "${label}" - ${prix} € (TVA ${tva}%)`);
    }
  }
}

// QTY × PRICE
// ✅ CORRECTION : Ajout de 0-9 dans le label
// ✅ CORRECTION : Gestion des espaces dans les montants (ex: "1 080")
// ✅ CORRECTION : Ajout de "u" dans les unités
const qtyPriceRegex = /([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s+(m²|ml|m|u\.|unité|u)\s*[×xX]\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi;
while ((match = qtyPriceRegex.exec(normalizedMsg)) !== null) {
  const label = match[1].trim();
  // ✅ CORRECTION : Supprimer les espaces dans les quantités et prix avant parsing
  const qtyStr = match[2].replace(/\s+/g, '').replace(',', '.');
  const qty = parseFloat(qtyStr);
  const unit = match[3];
  const prixStr = match[4].replace(/\s+/g, '').replace(',', '.');
  const prix = parseFloat(prixStr);
  const tva = parseInt(match[5], 10);
  
  if (!isNaN(qty) && !isNaN(prix) && !isNaN(tva) && label.length > 0) {
    if (!lines.find(l => l.label === label && l.quantity === qty && l.unit_price === prix)) {
      lines.push({ label, quantity: qty, unit, unit_price: prix, tva });
      console.log(`✅ Quantité extraite: "${label}" - ${qty} ${unit} × ${prix} € (TVA ${tva}%)`);
    }
  }
}
```

### Étape 4 : Sauvegarder et tester

1. Cliquez sur **"Save"** dans n8n
2. Testez avec votre message :
   ```
   fait moi un Devis pour Pauline Girard, 25 chemin des Vignes, 84100 Orange.
   07 88 42 09 77 – pauline.girard84@gmail.com
   
   Remplacement ballon eau chaude 200L → forfait 520 € HT — TVA 10%
   Fourniture ballon 200L → 1 unité × 1 080 € HT — TVA 20%
   Mise en service → forfait 120 € HT — TVA 10%
   ```

3. Vérifiez dans les logs que les 3 lignes sont bien extraites :
   - ✅ "Remplacement ballon eau chaude 200L"
   - ✅ "Fourniture ballon 200L"
   - ✅ "Mise en service"

## Changements principaux

### 1. Regex Forfait

**Avant :**
```javascript
/([A-Za-zÀ-ÿ\s-]+?)\s*→\s*forfait\s+(\d+(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi
```

**Après :**
```javascript
/([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*forfait\s+(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi
```

**Changements :**
- ✅ `[A-Za-zÀ-ÿ\s-]` → `[A-Za-zÀ-ÿ0-9\s-]` : Autorise les chiffres dans le label (ex: "200L")
- ✅ `(\d+(?:[.,]\d+)?)` → `(\d+(?:\s+\d+)*(?:[.,]\d+)?)` : Gère les espaces dans les montants (ex: "1 080")
- ✅ Ajout de `.replace(/\s+/g, '')` avant parsing pour supprimer les espaces

### 2. Regex Quantité

**Avant :**
```javascript
/([A-Za-zÀ-ÿ\s-]+?)\s*→\s*(\d+(?:[.,]\d+)?)\s+(m²|ml|m|u\.|unité|u)\s*[×xX]\s*(\d+(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi
```

**Après :**
```javascript
/([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s+(m²|ml|m|u\.|unité|u)\s*[×xX]\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi
```

**Changements :**
- ✅ `[A-Za-zÀ-ÿ\s-]` → `[A-Za-zÀ-ÿ0-9\s-]` : Autorise les chiffres dans le label
- ✅ `(\d+(?:[.,]\d+)?)` → `(\d+(?:\s+\d+)*(?:[.,]\d+)?)` : Gère les espaces dans les montants (2 fois : quantité et prix)
- ✅ Ajout de `.replace(/\s+/g, '')` avant parsing pour supprimer les espaces
- ✅ Validation avec `isNaN()` avant d'ajouter la ligne

## Résultat attendu

Après correction, avec votre message, vous devriez obtenir :

```json
{
  "travaux": [
    {
      "label": "Remplacement ballon eau chaude 200L",
      "quantity": 1,
      "unit": "forfait",
      "unit_price": 520,
      "tva": 10
    },
    {
      "label": "Fourniture ballon 200L",
      "quantity": 1,
      "unit": "unité",
      "unit_price": 1080,
      "tva": 20
    },
    {
      "label": "Mise en service",
      "quantity": 1,
      "unit": "forfait",
      "unit_price": 120,
      "tva": 10
    }
  ]
}
```

✅ **3 lignes au lieu de 2 !**

## Fichier de référence

Le code complet corrigé est disponible dans :
- **`CODE_EXTRACTION_INFO_CORRIGE.js`** : Code complet avec toutes les corrections
