# 📧 Configuration Gmail OAuth pour MyCharlie

## 🔑 URLs à mettre dans Google Cloud Console

### ⚠️ IMPORTANT : Utiliser le domaine de PRODUCTION

Les URLs doivent pointer vers **`https://mycharlie.fr/`** et **PAS** vers `localhost` !

### 1. Authorized JavaScript origins

Mettez l'URL de base de votre application MyCharlie **SANS** le chemin :

```
https://mycharlie.fr
```

**Important :**
- Pas de `/` à la fin
- Pas de chemin (pas `/dashboard`, etc.)
- Juste le domaine avec `https://`
- **PAS** `http://localhost:3000` ❌

### 2. Authorized redirect URIs

Mettez l'URL de callback OAuth de MyCharlie :

```
https://mycharlie.fr/auth/callback
```

**Important :**
- C'est le chemin standard pour OAuth dans Next.js/Supabase
- Commence par `/auth/callback`
- Le domaine doit être `https://mycharlie.fr`
- **PAS** `http://localhost:3000/auth/callback` ❌

## 📋 Récapitulatif

Dans **Google Cloud Console** > **APIs & Services** > **Credentials** > **OAuth 2.0 Client IDs** :

### Authorized JavaScript origins
```
https://mycharlie.fr
```

### Authorized redirect URIs
```
https://mycharlie.fr/auth/callback
```

## 🔧 Étapes détaillées dans Google Cloud Console

### Étape 1 : Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet (ou créez-en un)
3. Allez dans **APIs & Services** > **Credentials**

### Étape 2 : Créer ou modifier un OAuth 2.0 Client ID

1. Cliquez sur **Create Credentials** > **OAuth client ID**
   - OU si vous en avez déjà un, cliquez dessus pour le modifier

2. **Application type** : Choisissez **Web application**

3. **Name** : Donnez un nom (ex: "MyCharlie Gmail OAuth")

4. **Authorized JavaScript origins** :
   - Cliquez sur **+ ADD URI**
   - Ajoutez : `https://mycharlie.fr`
   - ⚠️ **SUPPRIMEZ** `http://localhost:3000` s'il existe

5. **Authorized redirect URIs** :
   - Cliquez sur **+ ADD URI**
   - Ajoutez : `https://mycharlie.fr/auth/callback`
   - ⚠️ **SUPPRIMEZ** `http://localhost:3000/auth/callback` s'il existe

6. Cliquez sur **SAVE**

### Étape 3 : Récupérer les identifiants

Après avoir sauvegardé, vous verrez :
- **Client ID** : Copiez-le
- **Client Secret** : Copiez-le

Ces identifiants doivent être configurés dans votre application MyCharlie.

## 🔐 Configuration dans MyCharlie

### Si vous utilisez Supabase Auth

Les identifiants OAuth doivent être configurés dans **Supabase Dashboard** :

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers**
4. Trouvez **Google** et activez-le
5. Entrez :
   - **Client ID (for OAuth)** : Votre Client ID depuis Google Cloud Console
   - **Client Secret (for OAuth)** : Votre Client Secret depuis Google Cloud Console
6. **Redirect URL** : Doit être `https://mycharlie.fr/auth/callback`
7. Sauvegardez

### Si vous utilisez directement Next.js

Les identifiants doivent être dans votre `.env.local` :

```env
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
NEXTAUTH_URL=https://mycharlie.fr
```

## ✅ Vérification

Après configuration :

1. Allez sur `https://mycharlie.fr/`
2. Essayez de vous connecter avec Gmail
3. Vous devriez être redirigé vers Google pour autoriser
4. Après autorisation, vous devriez être redirigé vers `https://mycharlie.fr/auth/callback` (et **PAS** vers localhost)

## 🐛 Si ça ne fonctionne pas

### Erreur : "redirect_uri_mismatch"

Cela signifie que l'URL de redirection dans Google Cloud Console ne correspond pas à celle utilisée par l'application.

**Solution :**
1. Vérifiez que vous avez bien ajouté `https://mycharlie.fr/auth/callback` dans **Authorized redirect URIs**
2. Vérifiez que vous avez **supprimé** `http://localhost:3000/auth/callback` s'il existe
3. Attendez quelques minutes (les changements peuvent prendre du temps à se propager)
4. Réessayez

### Erreur : "ERR_CONNECTION_REFUSED" sur localhost

Cela signifie que l'application essaie encore de rediriger vers localhost.

**Solution :**
1. Vérifiez que dans Google Cloud Console, vous avez bien `https://mycharlie.fr/auth/callback` et **PAS** `http://localhost:3000/auth/callback`
2. Vérifiez que dans Supabase Dashboard (si vous utilisez Supabase), l'URL de redirection est bien `https://mycharlie.fr/auth/callback`
3. Vérifiez que dans votre `.env.local` (si vous utilisez Next.js directement), `NEXTAUTH_URL` est bien `https://mycharlie.fr` et **PAS** `http://localhost:3000`

## 📝 Notes importantes

- ⚠️ **Ne mettez JAMAIS** `localhost` dans les URLs de production
- ⚠️ Les changements dans Google Cloud Console peuvent prendre **5-10 minutes** à se propager
- ⚠️ Si vous testez en local, vous pouvez garder `localhost:3000` comme URL supplémentaire, mais pour la production, utilisez toujours `https://mycharlie.fr`
