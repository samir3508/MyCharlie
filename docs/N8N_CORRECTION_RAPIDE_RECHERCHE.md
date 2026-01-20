# 🔧 Correction rapide : Section Recherche dans supabaseRequest

## 📍 Localisation

Dans le **Code Tool** de votre workflow N8N, cherchez la fonction `supabaseRequest` et localisez la section **"Recherche"** (environ ligne 200-210).

## ❌ Code actuel (INCORRECT)

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

## ✅ Code corrigé (à copier)

**Remplacez** la section ci-dessus par :

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
          // Recherche "contient" pour les textes (syntaxe PostgREST correcte)
          queryParams.push(`${key}=ilike.%25${encodeURIComponent(value)}%25`);
          console.log(`🔍 Recherche partielle (ilike) pour ${key}: ${value}`);
        }
      }
    }
  }
```

## 📝 Instructions

1. **Ouvrez** le nœud "Code Tool" dans votre workflow N8N
2. **Recherchez** la fonction `supabaseRequest` (Ctrl+F / Cmd+F)
3. **Localisez** la section `// Recherche` (environ ligne 200-210)
4. **Sélectionnez** les lignes de la section "Recherche" (de `// Recherche` jusqu'à la fermeture du `}`)
5. **Remplacez** par le code corrigé ci-dessus
6. **Sauvegardez** le workflow
7. **Testez** avec `envoyer-devis` et le numéro `DV-2026-0023`

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

## 🔍 Vérification

Dans les logs N8N, vous devriez voir :

```
🔍 Recherche exacte (eq) pour numero: DV-2026-0023
✅ Devis trouvé
📧 Email envoyé avec succès
```

Au lieu de :

```
❌ Devis DV-2026-0023 non trouvé
```
