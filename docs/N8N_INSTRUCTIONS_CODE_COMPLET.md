# 📋 INSTRUCTIONS : Code Complet Corrigé pour N8N Code Tool

## ⚠️ IMPORTANT

Le code complet fait **plusieurs milliers de lignes**. Il n'est pas pratique de créer un fichier avec tout le code.

## ✅ SOLUTION : Appliquer la correction directement

### Étape 1 : Ouvrir votre Code Tool dans N8N

1. Ouvrez votre workflow N8N
2. Trouvez le nœud **"Code Tool"**
3. Cliquez dessus pour éditer le code

### Étape 2 : Localiser la section à corriger

1. Dans le code, recherchez la fonction `supabaseRequest` (Ctrl+F / Cmd+F)
2. Localisez la section `// Recherche` (environ ligne 200-210)
3. Vous devriez voir ce code **INCORRECT** :

```javascript
  // Recherche
  if (options.search) {
    for (const [key, value] of Object.entries(options.search)) {
      if (value) {
        queryParams.push(`${key}=ilike.*${encodeURIComponent(value)}*`);  // ❌ INCORRECT
      }
    }
  }
```

### Étape 3 : Remplacer par le code corrigé

**Remplacez** la section ci-dessus par ce code **CORRECT** :

```javascript
  // Recherche
  if (options.search) {
    for (const [key, value] of Object.entries(options.search)) {
      if (value) {
        // Détecter si c'est un numéro de devis/facture/dossier (format: DV-YYYY-XXXX, FA-YYYY-XXXX, etc.)
        // Les numéros sont des identifiants uniques, donc on utilise une recherche exacte (eq)
        const isNumero = key === 'numero' || 
                        (typeof value === 'string' && value.match(/^(DV|FA|DOS|FAC)-/));
        
        if (isNumero) {
          // Recherche exacte pour les numéros (identifiants uniques)
          // Syntaxe PostgREST : column=eq.value
          queryParams.push(`${key}=eq.${encodeURIComponent(value)}`);
          console.log(`🔍 Recherche exacte (eq) pour ${key}: ${value}`);
        } else {
          // Recherche "contient" pour les textes
          // Syntaxe PostgREST correcte : column=ilike.%25value%25
          // %25 est l'encodage URL de % (pour LIKE '%value%')
          queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
          console.log(`🔍 Recherche partielle (ilike) pour ${key}: ${value}`);
        }
      }
    }
  }
```

### Étape 4 : Sauvegarder et tester

1. Cliquez sur **"Save"** dans N8N
2. Testez avec l'action `envoyer-devis` et un numéro de devis (ex: `DV-2026-0023`)

## 📁 Fichiers de référence

- **`N8N_CODE_TOOL_CORRECTION_RECHERCHE.js`** : Contient uniquement la section corrigée
- **`N8N_CORRECTION_RAPIDE_RECHERCHE.md`** : Guide rapide avec avant/après
- **`N8N_GUIDE_CORRECTION_ENVOYER_DEVIS.md`** : Guide détaillé complet

## 🎯 Résumé

**Une seule ligne à changer** dans tout votre code :
- ❌ **Avant** : `queryParams.push(\`\${key}=ilike.*\${encodeURIComponent(value)}*\`);`
- ✅ **Après** : Utilisez le code corrigé ci-dessus qui détecte automatiquement les numéros et utilise `eq` pour les identifiants uniques

C'est tout ! 🎉
