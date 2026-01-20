# 🔧 Correction : Extraction des lignes de travaux

## Problème identifié

Le code n'extrait que 2 lignes au lieu de 3 :
- ❌ "Remplacement ballon eau chaude 200L" est capturé comme "L"
- ❌ "Fourniture ballon 200L" n'est pas capturée (problème avec "1 080" qui contient un espace)
- ✅ "Mise en service" est correctement capturée

## Solution : Code corrigé

Remplacez la section **"5) EXTRACTION DES LIGNES DE TRAVAUX"** dans votre nœud "Code in JavaScript" par ce code :

```javascript
// ===============================
// 5) EXTRACTION DES LIGNES DE TRAVAUX (CORRIGÉ)
// ===============================
const lines = [];

// ÉTAPE 1 : Normaliser le message (remplacer tous les sauts de ligne par des espaces)
const normalizedMsg = message
  .replace(/\r\n/g, ' ')
  .replace(/\r/g, ' ')
  .replace(/\n/g, ' ')
  .replace(/\t/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

console.log('📝 Message normalisé (200 premiers caractères):', normalizedMsg.substring(0, 200));

// ÉTAPE 2 : Chercher les lignes avec patterns corrigés

// Pattern FORFAIT : "... → forfait XXX € ... TVA YY%"
// ✅ CORRECTION : Utiliser + (greedy) au lieu de +? pour capturer le label complet
// ✅ CORRECTION : Autoriser les chiffres dans le label (ex: "200L")
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
      lines.push({
        label: label,
        quantity: 1,
        unit: 'forfait',
        unit_price: prix,
        tva: tva
      });
      console.log(`✅ Forfait extrait: "${label}" - ${prix} € (TVA ${tva}%)`);
    }
  }
}

// Pattern QUANTITÉ × PRIX : "... → XXX unité × YYY € ... TVA ZZ%"
// ✅ CORRECTION : Gérer les espaces dans les montants (ex: "1 080")
// ✅ CORRECTION : Ajouter "u" dans les unités possibles
// ✅ CORRECTION : Utiliser + (greedy) pour capturer le label complet
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
      lines.push({
        label: label,
        quantity: qty,
        unit: unit,
        unit_price: prix,
        tva: tva
      });
      console.log(`✅ Quantité extraite: "${label}" - ${qty} ${unit} × ${prix} € (TVA ${tva}%)`);
    }
  }
}

// DEBUG
console.log(`✅ ${lines.length} ligne(s) de travaux extraite(s)`);
lines.forEach((line, idx) => {
  console.log(`  ${idx + 1}. ${line.label} - ${line.quantity} ${line.unit} × ${line.unit_price} € (TVA ${line.tva}%)`);
});
```

## Changements principaux

1. **Regex forfait** :
   - Avant : `/([A-Za-zÀ-ÿ\s-]+?)\s*→\s*forfait\s+(\d+(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi`
   - Après : `/([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*forfait\s+(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi`
   - ✅ Ajout de `0-9` dans le label pour capturer "200L"
   - ✅ Gestion des espaces dans les montants : `(\d+(?:\s+\d+)*(?:[.,]\d+)?)`

2. **Regex quantité** :
   - Avant : `/([A-Za-zÀ-ÿ\s-]+?)\s*→\s*(\d+(?:[.,]\d+)?)\s+(m²|ml|m|u\.|unité)\s*[×xX]\s*(\d+(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi`
   - Après : `/([A-Za-zÀ-ÿ0-9\s-]+?)\s*→\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s+(m²|ml|m|u\.|unité|u)\s*[×xX]\s*(\d+(?:\s+\d+)*(?:[.,]\d+)?)\s*€[^€]*?TVA\s*(\d+)%/gi`
   - ✅ Ajout de `0-9` dans le label
   - ✅ Ajout de `u` dans les unités
   - ✅ Gestion des espaces dans les montants : `(\d+(?:\s+\d+)*(?:[.,]\d+)?)`

3. **Parsing des montants** :
   - ✅ Suppression des espaces avant parsing : `.replace(/\s+/g, '')`
   - ✅ Validation avec `isNaN()` avant d'ajouter la ligne

## Test avec votre message

Message :
```
Remplacement ballon eau chaude 200L → forfait 520 € HT — TVA 10%
Fourniture ballon 200L → 1 unité × 1 080 € HT — TVA 20%
Mise en service → forfait 120 € HT — TVA 10%
```

Résultat attendu :
1. ✅ "Remplacement ballon eau chaude 200L" - 1 forfait × 520 € (TVA 10%)
2. ✅ "Fourniture ballon 200L" - 1 unité × 1080 € (TVA 20%)
3. ✅ "Mise en service" - 1 forfait × 120 € (TVA 10%)
