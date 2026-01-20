# 🔧 Résolution : Erreur "Token Gmail invalide"

## ❌ Problème

Vous recevez l'erreur :
```
Token Gmail invalide. Reconnectez votre compte Gmail dans Paramètres > Intégrations.
```

**Cause :** Il n'y a pas de connexion OAuth Gmail configurée pour votre tenant.

---

## ✅ Solution : Connecter Gmail

### Étape 1 : Aller dans Paramètres > Intégrations

1. Connectez-vous à votre application
2. Allez dans **Paramètres** (icône ⚙️ dans la sidebar)
3. Cliquez sur l'onglet **"Intégrations Gmail"** ou **"Intégrations"**

### Étape 2 : Connecter Gmail

1. Trouvez la section **"Gmail"**
2. Cliquez sur le bouton **"Connecter"** ou **"Connecter Gmail"**
3. Vous serez redirigé vers Google pour autoriser l'accès
4. Autorisez l'application à :
   - ✅ Envoyer des emails en votre nom
   - ✅ Lire les emails (optionnel)

### Étape 3 : Vérifier la connexion

Après connexion, vous devriez voir :
- ✅ Statut : **Connecté**
- ✅ Email : Votre adresse Gmail
- ✅ Date de connexion

---

## 🔍 Vérification rapide

Si après avoir connecté Gmail, vous voyez toujours l'erreur :

1. **Vérifiez que Gmail est bien connecté :**
   - Paramètres > Intégrations > Gmail
   - Le statut doit être "Connecté" (vert)

2. **Si le token est expiré :**
   - Cliquez sur **"Rafraîchir"** ou **"Reconnecter"**
   - Réautorisez l'accès si demandé

3. **Si rien ne fonctionne :**
   - Déconnectez Gmail
   - Reconnectez Gmail
   - Réessayez d'envoyer un devis

---

## 📝 Note importante

**Actuellement, vous avez seulement Google Calendar connecté.** Il faut aussi connecter **Gmail** séparément car ce sont deux services différents.

- ✅ **Google Calendar** : Pour synchroniser les RDV
- ❌ **Gmail** : **NON CONNECTÉ** → C'est pour ça que vous avez l'erreur

---

## 🎯 Résultat attendu

Après avoir connecté Gmail, l'envoi de devis devrait fonctionner sans erreur.

Si vous avez toujours des problèmes, vérifiez dans Supabase que la connexion existe :
```sql
SELECT * FROM oauth_connections 
WHERE tenant_id = 'votre-tenant-id' 
  AND provider = 'google' 
  AND service = 'gmail';
```
