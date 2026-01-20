# 🔧 Fix : SUPABASE_SERVICE_ROLE_KEY manquante sur Render

## Problème
L'erreur `supabaseKey is required` apparaît même si la variable est définie dans Render.

## Solutions

### 1. Vérifier le nom exact de la variable

Dans Render, la variable doit s'appeler **EXACTEMENT** :
```
SUPABASE_SERVICE_ROLE_KEY
```

**⚠️ Vérifiez qu'il n'y a pas :**
- D'espaces avant/après
- De fautes de frappe
- De majuscules/minuscules incorrectes

### 2. Vérifier l'environnement

Dans Render, quand vous ajoutez une variable, vous devez sélectionner l'environnement :
- ✅ **Production** (pour le service en production)
- ✅ **Preview** (si vous utilisez des previews)

Assurez-vous que la variable est bien dans **Production**.

### 3. Redémarrer le service

Après avoir ajouté/modifié une variable d'environnement dans Render :

1. Allez dans votre service
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
   - OU
3. Faites un **Redeploy** du dernier déploiement

**⚠️ IMPORTANT :** Les changements de variables d'environnement nécessitent un redéploiement pour être pris en compte.

### 4. Vérifier toutes les variables nécessaires

Assurez-vous que ces variables sont **TOUTES** présentes dans Render :

```
NEXT_PUBLIC_SUPABASE_URL=https://lawllirgeisuvanbvkcr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
NEXT_PUBLIC_APP_URL=https://mycharlie.fr
```

### 5. Vérifier via les logs

Après redéploiement, regardez les logs quand vous cliquez sur "Connecter" Gmail. Vous devriez voir :

```
[Google OAuth Callback] Variables check:
  - SUPABASE_SERVICE_KEY: SET (eyJhbGciOiJIUzI1NiIsInR5cCI6...)
```

Si vous voyez `MISSING`, la variable n'est pas accessible.

## Checklist

- [ ] Variable `SUPABASE_SERVICE_ROLE_KEY` existe dans Render
- [ ] Variable est dans l'environnement **Production**
- [ ] Nom de la variable est **EXACTEMENT** `SUPABASE_SERVICE_ROLE_KEY` (pas d'espaces)
- [ ] Service a été **redéployé** après ajout/modification de la variable
- [ ] Toutes les autres variables sont aussi présentes
- [ ] Logs montrent `SET` et non `MISSING` pour `SUPABASE_SERVICE_KEY`

## Test

1. Redéployez le service dans Render
2. Attendez que le déploiement soit terminé
3. Allez sur `https://mycharlie.fr/settings/integrations`
4. Cliquez sur "Connecter" pour Gmail
5. Regardez les logs Render pour voir si `SUPABASE_SERVICE_KEY: SET` apparaît
