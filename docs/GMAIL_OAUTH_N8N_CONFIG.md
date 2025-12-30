# 📧 Configuration Gmail OAuth pour N8N

## 🔑 URLs à mettre dans Google Cloud Console

### 1. Authorized JavaScript origins

Mettez l'URL de base de votre instance n8n **SANS** le chemin :

```
https://n8n.srv1129094.hstgr.cloud
```

**Important :**
- Pas de `/` à la fin
- Pas de chemin (pas `/workflow`, etc.)
- Juste le domaine avec `https://`

### 2. Authorized redirect URIs

Mettez l'URL de callback OAuth de n8n :

```
https://n8n.srv1129094.hstgr.cloud/rest/oauth2-credential/callback
```

**Important :**
- C'est le chemin standard pour OAuth dans n8n
- Commence toujours par `/rest/oauth2-credential/callback`
- Le domaine doit correspondre à votre instance n8n

## 📋 Récapitulatif

Dans Google Cloud Console > Create OAuth client ID :

### Authorized JavaScript origins
```
https://n8n.srv1129094.hstgr.cloud
```

### Authorized redirect URIs
```
https://n8n.srv1129094.hstgr.cloud/rest/oauth2-credential/callback
```

## 🔧 Configuration dans n8n

Une fois les URLs configurées dans Google Cloud Console :

1. Dans n8n, créez une nouvelle **Credential** de type **"Gmail OAuth2 API"**
2. Cliquez sur "Connect my account"
3. Vous serez redirigé vers Google pour autoriser
4. Après autorisation, la credential sera configurée

## 🔐 Scopes Gmail nécessaires

Pour **envoyer des emails** (MVP), vous avez besoin d'**un seul scope** :

### ✅ Scope recommandé pour n8n :

**`https://www.googleapis.com/auth/gmail.send`**

OU (si `gmail.send` n'est pas disponible) :

**`https://www.googleapis.com/auth/gmail.modify`** ✅

### ❌ Scopes inutiles pour juste envoyer :

- ❌ `gmail.compose` (pas nécessaire si vous avez `gmail.modify`)
- ❌ `gmail.addons.current.action.compose` (pour les add-ons Gmail uniquement)
- ❌ `gmail.readonly` (pour lire les emails, pas nécessaire pour envoyer)
- ❌ `https://mail.google.com/` (scope trop large, accès complet)

### 💡 Recommandation MVP

**Cochez uniquement : `https://www.googleapis.com/auth/gmail.modify`**

Ce scope permet de :
- ✅ Composer des emails
- ✅ Envoyer des emails
- ✅ Gérer les brouillons

C'est suffisant pour envoyer les devis et factures par email via n8n.

## 📝 Note

Si votre URL n8n est différente (pas `n8n.srv1129094.hstgr.cloud`), remplacez par votre URL réelle dans les deux champs ci-dessus.


## 🔑 URLs à mettre dans Google Cloud Console

### 1. Authorized JavaScript origins

Mettez l'URL de base de votre instance n8n **SANS** le chemin :

```
https://n8n.srv1129094.hstgr.cloud
```

**Important :**
- Pas de `/` à la fin
- Pas de chemin (pas `/workflow`, etc.)
- Juste le domaine avec `https://`

### 2. Authorized redirect URIs

Mettez l'URL de callback OAuth de n8n :

```
https://n8n.srv1129094.hstgr.cloud/rest/oauth2-credential/callback
```

**Important :**
- C'est le chemin standard pour OAuth dans n8n
- Commence toujours par `/rest/oauth2-credential/callback`
- Le domaine doit correspondre à votre instance n8n

## 📋 Récapitulatif

Dans Google Cloud Console > Create OAuth client ID :

### Authorized JavaScript origins
```
https://n8n.srv1129094.hstgr.cloud
```

### Authorized redirect URIs
```
https://n8n.srv1129094.hstgr.cloud/rest/oauth2-credential/callback
```

## 🔧 Configuration dans n8n

Une fois les URLs configurées dans Google Cloud Console :

1. Dans n8n, créez une nouvelle **Credential** de type **"Gmail OAuth2 API"**
2. Cliquez sur "Connect my account"
3. Vous serez redirigé vers Google pour autoriser
4. Après autorisation, la credential sera configurée

## 🔐 Scopes Gmail nécessaires

Pour **envoyer des emails** (MVP), vous avez besoin d'**un seul scope** :

### ✅ Scope recommandé pour n8n :

**`https://www.googleapis.com/auth/gmail.send`**

OU (si `gmail.send` n'est pas disponible) :

**`https://www.googleapis.com/auth/gmail.modify`** ✅

### ❌ Scopes inutiles pour juste envoyer :

- ❌ `gmail.compose` (pas nécessaire si vous avez `gmail.modify`)
- ❌ `gmail.addons.current.action.compose` (pour les add-ons Gmail uniquement)
- ❌ `gmail.readonly` (pour lire les emails, pas nécessaire pour envoyer)
- ❌ `https://mail.google.com/` (scope trop large, accès complet)

### 💡 Recommandation MVP

**Cochez uniquement : `https://www.googleapis.com/auth/gmail.modify`**

Ce scope permet de :
- ✅ Composer des emails
- ✅ Envoyer des emails
- ✅ Gérer les brouillons

C'est suffisant pour envoyer les devis et factures par email via n8n.

## 📝 Note

Si votre URL n8n est différente (pas `n8n.srv1129094.hstgr.cloud`), remplacez par votre URL réelle dans les deux champs ci-dessus.
