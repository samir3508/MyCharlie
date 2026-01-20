# 🔧 Correction : Erreur "NOT_FOUND" lors de l'envoi de devis

## 🐛 Problème

Lors de l'appel de l'action `envoyer-devis` avec un numéro de devis (ex: `DV-2026-0023`), l'erreur suivante est retournée :

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Devis DV-2026-0023 non trouvé"
}
```

## 🔍 Cause

Le problème vient de la fonction `supabaseRequest` dans le **Code Tool** qui utilise une syntaxe incorrecte pour les recherches `ilike` dans PostgREST.

### Code actuel (INCORRECT) :

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

Cette syntaxe `ilike.*value*` n'est **pas reconnue par PostgREST**.

### Syntaxe PostgREST correcte :

Pour une recherche "contient", PostgREST attend :
- `column=ilike.%25value%25` (où `%25` est l'encodage URL de `%`)

Pour une recherche exacte (recommandé pour les numéros de devis), utiliser :
- `column=eq.value`

## ✅ Solution

### Option 1 : Recherche exacte (RECOMMANDÉ pour les numéros)

Pour les numéros de devis (identifiants uniques), utiliser une recherche exacte avec `eq` :

```javascript
// Recherche
if (options.search) {
  for (const [key, value] of Object.entries(options.search)) {
    if (value) {
      // Pour les numéros (identifiants uniques), utiliser eq
      // Pour les recherches textuelles, utiliser ilike avec %25
      if (key === 'numero' || key === 'id' || value.match(/^(DV|FA|DOS|FAC)-/)) {
        // Recherche exacte pour les numéros
        queryParams.push(`${key}=eq.${encodeURIComponent(value)}`);
      } else {
        // Recherche "contient" pour les textes
        queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
      }
    }
  }
}
```

### Option 2 : Correction de la syntaxe ilike

Si vous voulez garder `ilike` pour les recherches textuelles :

```javascript
// Recherche
if (options.search) {
  for (const [key, value] of Object.entries(options.search)) {
    if (value) {
      // Syntaxe PostgREST correcte : %25 = % encodé en URL
      queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
    }
  }
}
```

## 📝 Correction à appliquer dans le Code Tool

Dans le nœud **"Code Tool"** du workflow N8N, localisez la fonction `supabaseRequest` et remplacez la section "Recherche" par :

```javascript
// Recherche
if (options.search) {
  for (const [key, value] of Object.entries(options.search)) {
    if (value) {
      // Détecter si c'est un numéro de devis/facture/dossier (format: DV-YYYY-XXXX, FA-YYYY-XXXX, etc.)
      const isNumero = key === 'numero' || value.match(/^(DV|FA|DOS|FAC)-/);
      
      if (isNumero) {
        // Recherche exacte pour les numéros (identifiants uniques)
        queryParams.push(`${key}=eq.${encodeURIComponent(value)}`);
      } else {
        // Recherche "contient" pour les textes (syntaxe PostgREST correcte)
        queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
      }
    }
  }
}
```

## 🧪 Test

Après la correction, testez avec :

```json
{
  "action": "envoyer-devis",
  "payload": {
    "devis_id": "DV-2026-0023",
    "recipient_email": "adlbapp4@gmail.com"
  },
  "tenant_id": "4370c96b-2fda-4c4f-a8b5-476116b8f2fc"
}
```

Le devis devrait être trouvé et l'email envoyé avec succès.

## 📌 Notes importantes

1. **Recherche exacte vs recherche partielle** :
   - `eq` : Recherche exacte (recommandé pour les identifiants comme les numéros de devis)
   - `ilike.%25value%25` : Recherche "contient" (pour les recherches textuelles)

2. **Encodage URL** :
   - `%` doit être encodé en `%25` dans les URLs
   - `encodeURIComponent(value)` encode déjà la valeur, mais les `%` autour doivent être encodés séparément

3. **Performance** :
   - Les recherches exactes (`eq`) sont plus rapides que les recherches partielles (`ilike`)
   - Pour les numéros de devis, toujours utiliser `eq`

## 🔗 Références

- [Documentation PostgREST - Operators](https://postgrest.org/en/stable/api.html#operators)
- [Documentation PostgREST - Pattern Matching](https://postgrest.org/en/stable/api.html#pattern-matching)
