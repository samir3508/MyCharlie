# Configuration Support Client

## Variables d'environnement à ajouter dans `.env.local`

```bash
# Configuration Support Client
RESEND_API_KEY=ta_cle_resend_api
SUPPORT_EMAIL=ddvcontact35@gmail.com

# Optionnel: Webhooks pour backup
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TON/SLACK/WEBHOOK
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/TON/DISCORD/WEBHOOK
```

## Coordonnées affichées

### 📞 Téléphone
`01 23 45 67 89`

### 📧 Email
`support@monentreprise.com`

## Étapes de configuration

### 1. Créer un compte Resend
1. Va sur https://resend.com
2. Crée un compte gratuit
3. Récupère ta clé API
4. Ajoute `RESEND_API_KEY=ta_cle` dans `.env.local`

### 2. Configurer l'email de réception
- Les notifications seront envoyées à : `ddvcontact35@gmail.com`
- C'est cet email qui recevra les notifications de support

### 3. Optionnel: Configurer Slack/Discord
- Crée des webhooks dans Slack/Discord
- Ajoute les URLs dans `.env.local` pour backup automatique

## Fonctionnalités

✅ **Popup de support flottant** (en bas à droite)
✅ **Formulaire avec validation**
✅ **Envoi d'email immédiat** (via Resend)
✅ **Backup Slack** (si configuré)
✅ **Backup Discord** (si configuré)
✅ **Informations contextuelles** (URL, navigateur, timestamp)
✅ **Design responsive et moderne**

## Utilisation

Le bouton de support apparaît automatiquement dans toutes les pages de l'application.

Les clients peuvent :
- Remplir le formulaire
- Appeler directement au 01 23 45 67 89
- Envoyer un email directement à support@monentreprise.com

## Personnalisation

Pour modifier les coordonnées affichées :
1. Modifie le fichier `src/components/support-popup.tsx`
2. Change les informations dans la section des contacts
3. Modifie l'email dans `src/app/api/support/contact/route.ts`
