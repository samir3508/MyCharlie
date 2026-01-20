# 🔍 Diagnostic : Connexion Gmail ne fonctionne pas

## Problème
Le bouton "Connecter" reste visible après avoir essayé de se connecter, avec l'erreur `error=unknown` dans l'URL.

## Étapes de diagnostic

### 1. Vérifier les logs serveur

Après avoir cliqué sur "Connecter" et être redirigé avec `error=unknown`, vérifiez les logs de votre application :

**Si vous utilisez Vercel :**
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Ouvrez votre projet
3. Allez dans **Deployments** → Cliquez sur le dernier déploiement
4. Onglet **Functions** → Cherchez `/api/auth/google/callback`
5. Regardez les logs pour voir l'erreur exacte

**Si vous utilisez Render :**
1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Ouvrez votre service
3. Onglet **Logs**
4. Cherchez les lignes avec `❌ Erreur callback OAuth`

### 2. Vérifier les variables d'environnement

Les logs devraient afficher :
- `GOOGLE_CLIENT_ID: SET` ou `MISSING`
- `GOOGLE_CLIENT_SECRET: SET` ou `MISSING`
- `SUPABASE_SERVICE_KEY: SET` ou `MISSING`

**Si une variable est `MISSING`, vous devez la configurer :**

#### Dans Vercel :
1. Settings → Environment Variables
2. Ajoutez :
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = Votre Client ID depuis Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` = Votre Client Secret depuis Google Cloud Console
   - `SUPABASE_SERVICE_ROLE_KEY` = Votre service role key depuis Supabase

#### Dans Render :
1. Environment
2. Ajoutez les mêmes variables

### 3. Vérifier la base de données

Vérifiez si une connexion a été créée malgré l'erreur :

```sql
SELECT * FROM oauth_connections 
WHERE tenant_id = 'votre_tenant_id' 
AND provider = 'google' 
AND service = 'gmail'
ORDER BY created_at DESC;
```

Si une connexion existe mais `is_active = false`, c'est qu'il y a eu une erreur.

### 4. Vérifier Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Ouvrez votre OAuth 2.0 Client ID
4. Vérifiez que **Authorized redirect URIs** contient :
   - `https://mycharlie.fr/api/auth/google/callback`
5. **PAS** `http://localhost:3000/api/auth/google/callback` (supprimez-le si présent)

### 5. Tester manuellement

Ouvrez la console du navigateur (F12) et regardez les erreurs quand vous cliquez sur "Connecter".

## Erreurs courantes et solutions

### Erreur : "GOOGLE_CLIENT_ID: MISSING"
**Solution :** Configurez `NEXT_PUBLIC_GOOGLE_CLIENT_ID` dans les variables d'environnement

### Erreur : "GOOGLE_CLIENT_SECRET: MISSING"
**Solution :** Configurez `GOOGLE_CLIENT_SECRET` dans les variables d'environnement

### Erreur : "SUPABASE_SERVICE_KEY: MISSING"
**Solution :** Configurez `SUPABASE_SERVICE_ROLE_KEY` dans les variables d'environnement

### Erreur : "redirect_uri_mismatch"
**Solution :** Vérifiez que `https://mycharlie.fr/api/auth/google/callback` est bien dans Google Cloud Console

### Erreur : "invalid_grant"
**Solution :** Le code OAuth a expiré. Réessayez de vous connecter.

### Erreur : "db_error" ou erreur Supabase
**Solution :** Vérifiez que la table `oauth_connections` existe et que les permissions RLS sont correctes.

## Après avoir corrigé

1. **Redéployez l'application** après avoir modifié les variables d'environnement
2. **Attendez 5-10 minutes** après avoir modifié Google Cloud Console
3. **Réessayez** de vous connecter
4. **Vérifiez les logs** si ça ne fonctionne toujours pas
