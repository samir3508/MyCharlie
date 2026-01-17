# 🔧 Fix pour l'erreur 404 sur les PDF de devis

## Problème identifié

L'erreur `404 (Not Found)` lors de l'accès à `/api/pdf/devis/[id]` est causée par les **politiques RLS (Row Level Security)** de Supabase qui bloquent l'accès au devis dans la route API.

## Solution

La route API doit utiliser la **`SUPABASE_SERVICE_ROLE_KEY`** qui bypass les RLS policies, au lieu de la `NEXT_PUBLIC_SUPABASE_ANON_KEY` qui est soumise aux RLS.

## Configuration requise

### 1. Obtenir la SERVICE_ROLE_KEY

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez la **`service_role` key** (⚠️ **NE JAMAIS** la partager publiquement !)

### 2. Ajouter la clé dans `.env.local`

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key

# ⚠️ IMPORTANT : Ajoutez cette ligne pour bypasser les RLS dans les routes API
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### 3. Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
npm run dev
```

## Vérification

Une fois configuré, vous devriez voir dans les logs du serveur (terminal) :

```
[PDF ROUTE] Configuration Supabase: {
  url: '✅',
  keyType: 'SERVICE_ROLE_KEY (bypass RLS)'
}
```

Si vous voyez `ANON_KEY (soumis aux RLS)`, cela signifie que la `SUPABASE_SERVICE_ROLE_KEY` n'est pas configurée.

## Sécurité

⚠️ **IMPORTANT** :
- La `SERVICE_ROLE_KEY` **bypass toutes les RLS policies**
- Elle doit **JAMAIS** être exposée côté client (dans le code frontend)
- Elle doit **UNIQUEMENT** être utilisée dans les routes API serveur
- Ne la commitez **JAMAIS** dans Git (elle est déjà dans `.gitignore`)

## Test

1. Créez un nouveau devis
2. Cliquez sur "Imprimer" ou "PDF"
3. Le PDF devrait s'ouvrir sans erreur 404

## Logs de débogage

Si le problème persiste, regardez les logs du serveur. Vous devriez voir :

```
[PDF ROUTE] 🔍 Recherche du devis avec ID: 84a790b4-e246-46a2-bf74-d55a9e11dd08
[PDF ROUTE] Utilise SERVICE_ROLE_KEY: true
[PDF ROUTE] Résultat de la requête: { hasData: true, hasError: false, devisNumero: 'DV-2026-0006' }
[PDF ROUTE] ✅ Devis trouvé: { numero: 'DV-2026-0006', tenant_id: '...' }
```

Si vous voyez `hasData: false`, vérifiez :
1. Que la `SUPABASE_SERVICE_ROLE_KEY` est bien configurée
2. Que le devis existe dans Supabase
3. Que le serveur a été redémarré après l'ajout de la clé
