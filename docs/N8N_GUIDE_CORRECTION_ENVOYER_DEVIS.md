# 🔧 Guide : Corriger l'erreur "NOT_FOUND" pour envoyer-devis

## 🐛 Problème

Quand vous appelez `envoyer-devis` avec un numéro de devis (ex: `DV-2026-0023`), vous obtenez :

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Devis DV-2026-0023 non trouvé"
}
```

## ✅ Solution

Le problème vient de la syntaxe de recherche dans le **Code Tool**. Il faut corriger la fonction `supabaseRequest`.

## 📝 Étapes de correction

### 1. Ouvrir le workflow N8N

1. Allez sur votre instance N8N : `https://n8n.srv1129094.hstgr.cloud/`
2. Ouvrez le workflow concerné
3. Localisez le nœud **"Code Tool"** (ou **"Code Tool1"**)

### 2. Modifier le code

1. **Double-cliquez** sur le nœud "Code Tool"
2. Dans l'onglet **"JavaScript"**, recherchez la fonction `supabaseRequest`
3. Localisez la section **"Recherche"** (environ ligne 200-210)

Vous devriez voir quelque chose comme :

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

### 3. Remplacer par le code corrigé

**Remplacez** cette section par :

```javascript
// Recherche
if (options.search) {
  for (const [key, value] of Object.entries(options.search)) {
    if (value) {
      // Détecter si c'est un numéro de devis/facture/dossier (format: DV-YYYY-XXXX, FA-YYYY-XXXX, etc.)
      const isNumero = key === 'numero' || 
                      (typeof value === 'string' && value.match(/^(DV|FA|DOS|FAC)-/));
      
      if (isNumero) {
        // Recherche exacte pour les numéros (identifiants uniques)
        queryParams.push(`${key}=eq.${encodeURIComponent(value)}`);
        console.log(`🔍 Recherche exacte (eq) pour ${key}: ${value}`);
      } else {
        // Recherche "contient" pour les textes
        queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
        console.log(`🔍 Recherche partielle (ilike) pour ${key}: ${value}`);
      }
    }
  }
}
```

### 4. Sauvegarder

1. Cliquez sur **"Save"** dans le nœud
2. **Activez** le workflow si nécessaire
3. **Testez** avec l'action `envoyer-devis`

## 🧪 Test

Testez avec cette requête :

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

## 📌 Explication

### Pourquoi ça ne marchait pas ?

La syntaxe `ilike.*value*` n'est **pas reconnue par PostgREST**. 

### Pourquoi cette correction fonctionne ?

1. **Pour les numéros** (DV-2026-0023, FA-2026-0001, etc.) :
   - Utilise `eq` (recherche exacte) car ce sont des identifiants uniques
   - Plus rapide et plus précise

2. **Pour les textes** (noms, descriptions, etc.) :
   - Utilise `ilike.%25value%25` (syntaxe PostgREST correcte)
   - `%25` = `%` encodé en URL (pour LIKE '%value%')

## 🔍 Vérification

Après la correction, dans les logs N8N, vous devriez voir :

```
🔍 Recherche exacte (eq) pour numero: DV-2026-0023
✅ Devis trouvé
📧 Email envoyé avec succès
```

Au lieu de :

```
❌ Devis DV-2026-0023 non trouvé
```

## 📚 Fichiers de référence

- `N8N_FIX_ENVOYER_DEVIS_NOT_FOUND.md` : Documentation détaillée du problème
- `N8N_CODE_TOOL_CORRECTION_RECHERCHE.js` : Code de correction complet
