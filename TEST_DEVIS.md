# Test d'accès aux devis - Instructions

## Le problème identifié

Les devis **existent bien dans Supabase**, mais les **politiques RLS (Row Level Security)** empêchent l'accès si vous n'êtes pas correctement connecté.

## Test rapide à faire

1. **Ouvrez votre navigateur** sur votre application (http://localhost:3000 ou http://localhost:3003)
2. **Connectez-vous** avec votre compte `ad@gmail.com`
3. **Ouvrez la console du navigateur** (F12 ou clic droit → Inspecter → Console)
4. **Copiez et collez ce code** dans la console :

```javascript
// Test 1: Vérifier la session
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Vérifier la session
const { data: session } = await supabase.auth.getSession()
console.log('Session:', session)

// Test 2: Vérifier l'accès aux devis
const { data: devis, error } = await supabase
  .from('devis')
  .select('id, numero, statut, tenant_id')
  .limit(3)

if (error) {
  console.error('❌ Erreur:', error)
} else {
  console.log('✅ Devis trouvés:', devis)
}

// Test 3: Vérifier le tenant
const { data: user } = await supabase.auth.getUser()
if (user.user) {
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.user.id)
    .single()
  
  console.log('Tenant:', tenant)
  console.log('Tenant Error:', tenantError)
}
```

## Solutions possibles

### Solution 1 : Reconnexion
Si vous n'êtes pas connecté ou si votre session a expiré :
1. Déconnectez-vous
2. Reconnectez-vous avec `ad@gmail.com`

### Solution 2 : Vérifier le user_id du tenant
Le tenant dans Supabase doit avoir le bon `user_id` :
- Tenant ID: `97c62509-84ff-4e87-8ba9-c3095b7fd30f`
- User ID attendu: `f10f1ec2-8652-486a-818c-b7acb8567bbb`

Si ce n'est pas le cas, exécutez dans Supabase SQL Editor :

```sql
UPDATE tenants
SET user_id = 'f10f1ec2-8652-486a-818c-b7acb8567bbb'
WHERE id = '97c62509-84ff-4e87-8ba9-c3095b7fd30f';
```

### Solution 3 : Vérifier les variables d'environnement
Assurez-vous que `.env.local` contient :
```
NEXT_PUBLIC_SUPABASE_URL=votre_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé
```

## Informations de débogage

### Devis existants dans Supabase :
- DV-2026-0001 (ID: eee75463-eb76-4e43-b3c2-7f51e23095d9)
- DV-2026-0002 (ID: 86b6960f-3a8b-4beb-a03d-cd52a0cb327d)
- DV-2026-0003 (ID: e8189f73-516e-4fc3-bc5b-acd89ef3dd7f)
- DV-2026-0004 (ID: 956ef554-659b-4716-8f55-2ac599054790)

Tous ont :
- tenant_id: `97c62509-84ff-4e87-8ba9-c3095b7fd30f`
- template_condition_paiement_id: `ed30c85b-3d3d-4639-b741-adcabdf24895`
- statut: `brouillon`

### RLS Policies actives :
- **SELECT** : `tenant_id = get_user_tenant_id()`
- **INSERT** : `tenant_id = get_user_tenant_id()`
- **UPDATE** : `tenant_id = get_user_tenant_id()`
- **DELETE** : `tenant_id = get_user_tenant_id()`

La fonction `get_user_tenant_id()` retourne :
```sql
SELECT id FROM tenants WHERE user_id = auth.uid() LIMIT 1;
```

## Que faire ensuite ?

1. **Testez dans la console** du navigateur
2. **Partagez-moi les résultats** que vous voyez
3. Si ça ne marche toujours pas, je désactiverai temporairement les RLS pour identifier le problème exact
