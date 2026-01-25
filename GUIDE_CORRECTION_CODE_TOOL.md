# 🔧 GUIDE - Correction complète du Code Tool (Recherche par nom)

## Objectif

Corriger le Code Tool pour que **toutes les recherches par nom/prénom fonctionnent** :
- ✅ Clients
- ✅ Devis (par nom client)
- ✅ Factures (par nom client)
- ✅ Dossiers (par nom client)
- ✅ RDV (par nom client)

---

## 🐛 Problème actuel

Charlie cherche "Laurent Petit" mais ne trouve pas les devis, alors qu'ils existent dans Supabase.

**Cause** : La recherche PostgREST avec `ilike.%25Laurent%20Petit%25` ne fonctionne pas toujours avec plusieurs mots.

---

## ✅ Solution

Utiliser **3 stratégies de recherche** dans l'ordre :
1. **Exacte** : `nom_complet=eq.Laurent Petit` (plus rapide)
2. **Partielle** : `nom_complet=ilike.%25Laurent%20Petit%25` (si exacte échoue)
3. **OR** : `or=(nom.ilike.%25Petit%25,prenom.ilike.%25Laurent%25)` (si partielle échoue)

---

## 📋 Étapes d'application

### Étape 1 : Ouvrir le Code Tool dans N8N

1. Ouvrez N8N → Votre workflow
2. Cliquez sur le nœud **"Code Tool"** (ou "Code Tool1")
3. Dans le panneau de droite, section **"JavaScript"**

### Étape 2 : Localiser les sections à remplacer

Dans le code JavaScript, **cherchez** ces sections (utilisez Ctrl+F) :

1. **`case 'search-client':`** (ligne ~900)
2. **`case 'list-devis':`** (ligne ~1100)
3. **`case 'list-factures':`** (ligne ~1800)
4. **`case 'list-rdv':`** (ligne ~2800)

### Étape 3 : Remplacer chaque section

**Pour chaque section, REMPLACEZ tout le `case` jusqu'au `break;` suivant.**

#### 1. Remplacer `search-client`

**CHERCHEZ** (ligne ~900) :
```javascript
case 'search-client': {
  const q = payload.query || payload.search || payload.nom || '';
  if (!q) {
    result = { success: false, error: 'VALIDATION_ERROR', message: 'Requête manquante' };
    break;
  }
  
  let searchField = 'nom_complet';
  if (q.includes('@')) searchField = 'email';
  else if (/^[\d\s\+\-]+$/.test(q)) searchField = 'telephone';
  
  result = await supabaseRequest.call(this, 'clients', 'GET', {
    search: { [searchField]: q },
    limit: 20
  });
  
  if (result.success) {
    result.message = `${result.count} client(s) trouvé(s)`;
    result.clients = result.data;
  }
  break;
}
```

**REMPLACEZ PAR** le code du fichier `CODE_TOOL_CORRIGE_RECHERCHE_COMPLETE.js` section `search-client`

#### 2. Remplacer `list-devis`

**CHERCHEZ** (ligne ~1100) :
```javascript
case 'list-devis': {
  const search = payload.search || ...
  // ... code actuel
  break;
}
```

**REMPLACEZ PAR** le code du fichier `CODE_TOOL_CORRIGE_RECHERCHE_COMPLETE.js` section `list-devis`

#### 3. Remplacer `list-factures`

**CHERCHEZ** (ligne ~1800) :
```javascript
case 'list-factures': {
  // Appeler leo-router pour list-factures
  // ... code actuel
  break;
}
```

**REMPLACEZ PAR** le code du fichier `CODE_TOOL_CORRIGE_RECHERCHE_COMPLETE.js` section `list-factures`

#### 4. Remplacer `list-rdv`

**CHERCHEZ** (ligne ~2800) :
```javascript
case 'list-rdv': {
  result = await supabaseRequest.call(this, 'rdv', 'GET', {
    select: '*,dossiers(titre)',
    order: 'date_heure.asc',
    limit: payload.limit || 50
  });
  // ... code actuel
  break;
}
```

**REMPLACEZ PAR** le code du fichier `CODE_TOOL_CORRIGE_RECHERCHE_COMPLETE.js` section `list-rdv`

### Étape 4 : Sauvegarder

1. **Cliquez sur "Save"** (ou Ctrl+S)
2. **Vérifiez qu'il n'y a pas d'erreurs de syntaxe**
3. Le workflow va recharger automatiquement

---

## 🧪 Tests à effectuer

Après avoir appliqué les corrections, testez ces 4 recherches :

### Test 1 : Recherche client
```
Message: "Cherche le client Laurent Petit"

Résultat attendu :
✅ 1 client(s) trouvé(s)
• Laurent Petit
  Email: aslambekdaoud@gmail.com
  Téléphone: 0663187429
```

### Test 2 : Recherche devis par nom
```
Message: "Liste les devis de Laurent Petit"

Résultat attendu :
✅ 1 devis trouvé(s) pour "Laurent Petit"
📄 DV-2026-0007
• Date : 24/01/2026
• Statut : envoye
• Total : 1880.8€ TTC
```

### Test 3 : Recherche factures par nom
```
Message: "Liste les factures de Amina Ouattara"

Résultat attendu :
✅ X facture(s) trouvée(s) pour "Amina Ouattara"
[Liste des factures]
```

### Test 4 : Recherche RDV par nom
```
Message: "Quels sont les RDV de Laurent Petit ?"

Résultat attendu :
✅ X RDV trouvé(s) pour "Laurent Petit"
[Liste des RDV]
```

---

## 📊 Ce qui a changé

### Avant (❌)
```javascript
// Recherche simple qui échoue avec plusieurs mots
result = await supabaseRequest.call(this, 'clients', 'GET', {
  search: { nom_complet: "Laurent Petit" },  // ❌ Échoue
  limit: 20
});
// Résultat : 0 clients trouvés
```

### Après (✅)
```javascript
// Stratégie 1 : Exacte
result = await supabaseRequest.call(this, 'clients', 'GET', {
  filters: { nom_complet: "Laurent Petit" },  // ✅ Fonctionne
  limit: 20
});

// Si échec, Stratégie 2 : ilike
if (result.count === 0) {
  result = await supabaseRequest.call(this, 'clients', 'GET', {
    search: { nom_complet: "Laurent Petit" },
    limit: 20
  });
}

// Si échec, Stratégie 3 : OR sur nom ET prénom
if (result.count === 0 && search.includes(' ')) {
  // Requête : or=(nom.ilike.%Petit%,prenom.ilike.%Laurent%)
  result = [... requête OR manuelle ...]
}
```

---

## 🎯 Bénéfices

Après correction :
- ✅ Recherche client par nom complet fonctionne
- ✅ Liste devis par nom client fonctionne
- ✅ Liste factures par nom client fonctionne
- ✅ Liste RDV par nom client fonctionne
- ✅ Liste dossiers par nom client fonctionne (déjà fonctionnel)
- ✅ Recherche avec espaces fonctionne
- ✅ Recherche partielle fonctionne (ex: "Laurent" trouve "Laurent Petit")
- ✅ Logs détaillés pour debugging

---

## 🚨 Attention

**Ne modifiez QUE les 4 sections indiquées** :
- `search-client`
- `list-devis`
- `list-factures`
- `list-rdv`

**Ne touchez PAS au reste du code** (Google Calendar, envoi email, etc.)

---

## 📝 Checklist

- [ ] Ouvrir le Code Tool dans N8N
- [ ] Localiser `case 'search-client':`
- [ ] Remplacer par la version corrigée
- [ ] Localiser `case 'list-devis':`
- [ ] Remplacer par la version corrigée
- [ ] Localiser `case 'list-factures':`
- [ ] Remplacer par la version corrigée
- [ ] Localiser `case 'list-rdv':`
- [ ] Remplacer par la version corrigée
- [ ] Sauvegarder le workflow
- [ ] Tester avec "Liste les devis de Laurent Petit"
- [ ] Vérifier que DV-2026-0007 apparaît

---

## 🆘 En cas de problème

Si après le remplacement, vous avez une erreur de syntaxe :

1. **Vérifiez les accolades** : Chaque `case` doit se terminer par `break;}`
2. **Vérifiez les virgules** : Pas de virgule avant le `break;`
3. **Annulez** (Ctrl+Z) et réessayez
4. **Copiez le code complet** du fichier `CODE_TOOL_CORRIGE_RECHERCHE_COMPLETE.js`

---

**Date de création :** 24 janvier 2026  
**Temps estimé :** 15 minutes  
**Criticité :** 🟠 Important - Recherche ne fonctionne pas
