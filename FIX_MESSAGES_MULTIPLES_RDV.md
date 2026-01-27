# 🔧 Fix : Messages multiples lors de la confirmation d'un RDV

## ❌ Problème

Quand un client confirme un créneau (clique sur le lien dans l'email), **plusieurs messages de confirmation sont envoyés** :
- Au client (plusieurs fois)
- À l'artisan (plusieurs fois)

**Cause :** `/api/confirm-creneau` envoie les emails ET appelle le webhook n8n qui déclenche LÉO, qui peut aussi envoyer des emails.

---

## ✅ Solution appliquée

### 1. Ajout d'un flag dans le contexte webhook

Dans `/api/confirm-creneau/route.ts`, j'ai ajouté des flags pour indiquer que les emails ont déjà été envoyés :

```typescript
creneau_confirmation: {
  // ... autres champs
  emails_already_sent: true,
  client_email_sent: true,
  artisan_email_sent: true
}
```

### 2. Modifier le prompt de LÉO

**Dans n8n, modifier le prompt de LÉO** pour qu'il vérifie ces flags avant d'envoyer des emails :

**Ajouter dans le prompt de LÉO :**

```
⚠️ IMPORTANT : Si `creneau_confirmation.emails_already_sent === true` :
- ❌ NE PAS envoyer d'email au client (déjà envoyé)
- ❌ NE PAS envoyer d'email à l'artisan (déjà envoyé)
- ✅ Juste informer que le RDV a été créé et que les confirmations ont été envoyées
```

---

## 🔍 Vérification

Après modification :

1. **Client confirme un créneau** (clique sur le lien)
2. **`/api/confirm-creneau`** :
   - ✅ Envoie 1 email au client
   - ✅ Envoie 1 email à l'artisan
   - ✅ Appelle webhook n8n avec `emails_already_sent: true`
3. **LÉO reçoit le webhook** :
   - ✅ Vérifie `emails_already_sent`
   - ✅ NE renvoie PAS d'emails
   - ✅ Juste informe que le RDV est créé

**Résultat :** 1 seul email au client, 1 seul email à l'artisan.

---

## 📝 Action requise dans n8n

**Modifier le prompt de LÉO** pour ajouter cette vérification :

```
⚠️ RÈGLE CRITIQUE : Emails déjà envoyés

Si `body.context.creneau_confirmation.emails_already_sent === true` :
- ❌ NE PAS appeler `confirm-rdv` ou envoyer des emails
- ❌ NE PAS renvoyer de confirmation au client
- ❌ NE PAS renvoyer de notification à l'artisan
- ✅ Juste informer : "Le RDV a été créé et les confirmations ont été envoyées au client et à l'artisan."

Les emails ont déjà été envoyés par `/api/confirm-creneau`, ne pas les renvoyer.
```

---

## 🎯 Résumé

**Problème :** Doublons d'emails car `/api/confirm-creneau` envoie les emails ET le webhook n8n peut aussi les envoyer.

**Solution :** 
1. ✅ Flag `emails_already_sent` ajouté dans le contexte webhook
2. ⚠️ **À faire** : Modifier le prompt de LÉO pour vérifier ce flag avant d'envoyer des emails
