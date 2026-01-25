# 🐛 FIX - Recherche client par nom dans Code Tool

## Problème identifié

Charlie ne trouve pas les devis pour "Laurent Petit" alors qu'ils existent dans Supabase.

**Cause** : La recherche `search-client` avec plusieurs mots (nom + prénom) ne fonctionne pas correctement avec la syntaxe PostgREST `ilike.%25Laurent%20Petit%25`.

**Exemple :**
```
User: "Liste les devis de Laurent Petit"
Code Tool: search-client { query: "Laurent Petit" }
PostgREST: nom_complet=ilike.%25Laurent%20Petit%25
Résultat: 0 clients trouvés ❌
```

---

## 🔍 Vérification dans Supabase

Le client et le devis existent bien :

```sql
-- Client trouvé
Laurent Petit (ID: 0ecd49c0-978d-41fc-b56d-eee88083d2f9)
Email: aslambekdaoud@gmail.com

-- Devis trouvé
DV-2026-0007 lié à Laurent Petit
Montant: 1078€ (bug séparé - voir FIX_CHARLIE_CALCULS_MONTANTS.md)
```

**La recherche SQL manuelle fonctionne**, donc le problème est dans le Code Tool.

---

## ✅ SOLUTION 1 : Corriger la recherche dans le Code Tool

### Dans le Code Tool (nœud dans N8N), section `search-client` :

**REMPLACER** la ligne actuelle :
```javascript
result = await supabaseRequest.call(this, 'clients', 'GET', {
  search: { [searchField]: q },  // ❌ Ne fonctionne pas avec plusieurs mots
  limit: 20
});
```

**PAR** :
```javascript
// Essayer d'abord une recherche exacte (plus rapide)
result = await supabaseRequest.call(this, 'clients', 'GET', {
  filters: { [searchField]: q },  // Recherche exacte
  limit: 20
});

// Si aucun résultat avec recherche exacte, essayer une recherche partielle
if (!result.success || result.count === 0) {
  // Pour la recherche partielle, utiliser search
  result = await supabaseRequest.call(this, 'clients', 'GET', {
    search: { [searchField]: q },
    limit: 20
  });
}

// Si toujours aucun résultat et que q contient un espace (nom + prénom)
// Essayer de chercher par nom OU prénom séparément
if ((!result.success || result.count === 0) && q.includes(' ')) {
  const parts = q.trim().split(/\s+/);
  const prenom = parts[0];
  const nom = parts.slice(1).join(' ');
  
  console.log(`🔍 Recherche séparée : prenom="${prenom}", nom="${nom}"`);
  
  // Construire l'URL manuellement avec OR
  const url = `${REST_URL}/clients?tenant_id=eq.${tenant_id}&or=(nom.ilike.%25${encodeURIComponent(nom)}%25,prenom.ilike.%25${encodeURIComponent(prenom)}%25,nom_complet.ilike.%25${encodeURIComponent(q)}%25)&select=*&limit=20`;
  
  try {
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: headers,
      returnFullResponse: true
    });
    
    const statusCode = (response && response.statusCode) || 200;
    const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
    
    if (statusCode >= 200 && statusCode < 300 && Array.isArray(data)) {
      result = {
        success: true,
        data: data,
        count: data.length
      };
    }
  } catch (err) {
    console.warn('Erreur recherche OR:', err);
  }
}
```

---

## ✅ SOLUTION 2 : Utiliser list-devis avec recherche directe (PLUS SIMPLE)

**Dans le prompt Charlie**, ajouter cette instruction :

```markdown
## RECHERCHE DE DEVIS PAR NOM CLIENT - WORKAROUND

Si la recherche avec `list-devis` + `search: nom_client` retourne 0 résultat :

1. ✅ **D'ABORD** : Appeler `search-client` avec le nom
2. ✅ **SI CLIENT TROUVÉ** : Récupérer le `client_id`
3. ✅ **ENSUITE** : Appeler `list-devis` avec `filters: { client_id: "uuid-du-client" }`

**Exemple :**
```javascript
// Étape 1 : Chercher le client
{
  action: "search-client",
  payload: { query: "Laurent Petit" },
  tenant_id: "..."
}
// Réponse : { clients: [{ id: "0ecd49c0-...", nom_complet: "Laurent Petit" }] }

// Étape 2 : Chercher les devis avec le client_id
{
  action: "list-devis",
  payload: { 
    client_id: "0ecd49c0-978d-41fc-b56d-eee88083d2f9"  // ✅ Utiliser le client_id
  },
  tenant_id: "..."
}
```

**⚠️ NE PAS utiliser `search` si la recherche par nom échoue, utiliser `client_id` directement.**
```

---

## ✅ SOLUTION 3 : Tester la recherche manuellement

**Dans Supabase SQL Editor**, testez cette requête pour voir si PostgREST fonctionne :

```sql
-- Recherche avec ILIKE (devrait fonctionner)
SELECT *
FROM clients
WHERE tenant_id = '4370c96b-2fda-4c4f-a8b5-476116b8f2fc'
  AND nom_complet ILIKE '%Laurent%'
LIMIT 10;

-- Recherche avec plusieurs mots
SELECT *
FROM clients
WHERE tenant_id = '4370c96b-2fda-4c4f-a8b5-476116b8f2fc'
  AND (
    nom_complet ILIKE '%Laurent%' 
    OR nom ILIKE '%Petit%'
    OR prenom ILIKE '%Laurent%'
  )
LIMIT 10;
```

Si ces requêtes fonctionnent, le problème est dans l'encodage PostgREST du Code Tool.

---

## 🎯 SOLUTION IMMÉDIATE (WORKAROUND)

**En attendant le fix du Code Tool** :

Dites à Charlie de chercher par **email** au lieu du nom :

```
User: "Liste les devis de aslambekdaoud@gmail.com"
```

OU cherchez par **numéro de devis** :

```
User: "Affiche le devis DV-2026-0007"
```

Ces 2 méthodes fonctionnent car :
- Email = recherche exacte (pas d'espace)
- Numéro = recherche exacte (pas d'espace)

---

## 📝 CHECKLIST D'APPLICATION

- [ ] Modifier le Code Tool (section search-client)
- [ ] Ajouter la logique de recherche séparée (prenom + nom)
- [ ] Ajouter l'instruction dans le prompt Charlie
- [ ] Tester avec "Liste les devis de Laurent Petit"
- [ ] Vérifier que le résultat retourne bien DV-2026-0007

---

## 🧪 TEST APRÈS FIX

```
User: "Liste les devis de Laurent Petit"

Résultat attendu :
📄 Devis DV-2026-0007
• Date : 24/01/2026
• Statut : envoye
• Total : 1880.8€ TTC  ✅ (après fix des calculs)
```

---

**Date de création :** 24 janvier 2026  
**Criticité :** 🟠 Important - Recherche ne fonctionne pas  
**Temps estimé :** 30 minutes
