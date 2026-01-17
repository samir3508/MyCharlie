# 🔧 Solution : Erreur "Invalid login credentials"

## 🐛 Problème

Vous recevez l'erreur "Invalid login credentials" lors de la tentative de connexion.

## ✅ Solutions

### Solution 1 : Réinitialiser le mot de passe via Supabase Dashboard

**Si vous avez accès à Supabase Dashboard :**

1. Allez sur **Supabase Dashboard** → **Authentication** → **Users**
2. Trouvez votre utilisateur (email)
3. Cliquez sur les **3 points** à droite de l'utilisateur
4. Sélectionnez **"Send password reset email"**
5. Vérifiez votre boîte mail (et spam)
6. Cliquez sur le lien dans l'email
7. Créez un nouveau mot de passe
8. Connectez-vous avec le nouveau mot de passe

### Solution 2 : Utiliser la page "Mot de passe oublié"

1. Allez sur la page de connexion
2. Cliquez sur **"Oublié ?"** à côté du champ mot de passe
3. Entrez votre email
4. Attendez au moins **12 secondes** si vous avez déjà fait une demande
5. Vérifiez votre boîte mail (et spam)
6. Cliquez sur le lien dans l'email
7. Créez un nouveau mot de passe

### Solution 3 : Créer un nouveau compte

Si vous ne vous souvenez plus de votre mot de passe et que la réinitialisation ne fonctionne pas :

1. Allez sur `/register`
2. Créez un nouveau compte avec un **nouvel email**
3. Vérifiez votre boîte mail pour confirmer l'email
4. Connectez-vous avec le nouveau compte

### Solution 4 : Vérifier que l'email est correct

**Utilisateurs existants dans la base :**
- `ddvcontact35@gmail.com` (créé le 17/01/2026)
- `ad@gmail.com` (créé le 13/01/2026)

Vérifiez que vous utilisez **exactement** l'un de ces emails (sans faute de frappe).

## 🔍 Vérifications

### 1. Vérifier l'orthographe de l'email

- Pas d'espace avant/après
- Pas de majuscules/minuscules incorrectes
- Pas de caractères spéciaux mal tapés

### 2. Vérifier le mot de passe

- Attention à la casse (majuscules/minuscules)
- Attention aux caractères spéciaux
- Pas d'espace au début ou à la fin

### 3. Vérifier que l'email est confirmé

Tous les utilisateurs existants ont confirmé leur email, donc ce n'est pas le problème.

## 🐛 Si rien ne fonctionne

### Option 1 : Réinitialiser via Supabase Dashboard (recommandé)

C'est la méthode la plus fiable :

1. **Supabase Dashboard** → **Authentication** → **Users**
2. Trouvez votre utilisateur
3. **"Send password reset email"**
4. Vérifiez votre boîte mail
5. Suivez le lien

### Option 2 : Créer un nouveau compte de test

Pour tester rapidement :

1. Créez un nouveau compte avec un email de test
2. Confirmez l'email
3. Connectez-vous

## 📋 Checklist

- [ ] Email correctement orthographié
- [ ] Mot de passe correct (casse, caractères spéciaux)
- [ ] Pas d'espace avant/après l'email ou le mot de passe
- [ ] Email confirmé (tous les utilisateurs existants sont confirmés)
- [ ] Tenté de réinitialiser le mot de passe
- [ ] Vérifié les spams pour l'email de réinitialisation
- [ ] Attendu 12 secondes entre les tentatives de réinitialisation

## 💡 Solution rapide

**Pour débloquer rapidement :**

1. Allez sur Supabase Dashboard
2. Authentication → Users
3. Trouvez votre utilisateur
4. Cliquez sur "Send password reset email"
5. Vérifiez votre boîte mail
6. Créez un nouveau mot de passe
7. Connectez-vous
