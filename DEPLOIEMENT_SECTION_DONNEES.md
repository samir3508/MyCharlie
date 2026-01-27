# 🚀 Déploiement de la Section Gestion des Données

## ✅ Modifications effectuées

### 1. Page d'accueil (`src/app/page.tsx`)
- ✅ Ajout d'une section **"Gestion de vos données personnelles"** juste après la FAQ
- ✅ 3 grandes cartes colorées et cliquables :
  - 🗑️ **Supprimer mes données** (orange)
  - 📥 **Accéder à mes données** (bleu)
  - 🛡️ **Politique complète** (violet)
- ✅ Section d'informations avec :
  - Numéro WhatsApp partagé : `+33948353999`
  - Informations sur la sécurité
  - Durée de conservation
  - Contact pour exercer vos droits
- ✅ Lien "Mes données" dans le header avec icône bouclier

### 2. Page Politique de Confidentialité (`src/app/politique-confidentialite/page.tsx`)
- ✅ Section complète sur WhatsApp et agents IA
- ✅ Instructions détaillées pour supprimer les données
- ✅ Instructions détaillées pour accéder aux données
- ✅ Informations sur le numéro WhatsApp partagé
- ✅ Durées de conservation détaillées

## 📍 Emplacement de la section

La section apparaît :
- **Juste après la FAQ** (section "Questions fréquentes")
- **Avant** la section "Et si tu n'avais plus jamais à gérer l'administratif ?"
- **ID de section** : `#gestion-donnees`

## 🔗 Accès direct

- **URL directe** : `https://votre-domaine.fr/#gestion-donnees`
- **Via le menu** : Cliquer sur "Mes données" dans le header
- **En scrollant** : Après la FAQ

## 🚀 Déploiement sur Render

### Option 1 : Déploiement automatique (si Git est connecté)
```bash
# Les changements sont déjà commités
git push origin main
# Render déploiera automatiquement si autoDeploy: true
```

### Option 2 : Déploiement manuel
1. **Aller sur Render Dashboard** : https://dashboard.render.com
2. **Sélectionner votre service** : `my-leo-saas`
3. **Cliquer sur "Manual Deploy"** → "Deploy latest commit"
4. **Attendre la fin du build** (environ 5-10 minutes)

### Option 3 : Vérifier le déploiement
1. Une fois déployé, aller sur votre site
2. Vider le cache : `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
3. Aller sur la page d'accueil
4. Scroller jusqu'à la section FAQ
5. La section "Gestion de vos données personnelles" devrait apparaître juste après

## ✅ Vérification

Après déploiement, vérifier que :
- [ ] La section apparaît après la FAQ
- [ ] Les 3 cartes sont visibles et cliquables
- [ ] Le lien "Mes données" apparaît dans le header
- [ ] Les informations WhatsApp sont présentes
- [ ] Les liens vers la politique de confidentialité fonctionnent

## 🐛 Si la section n'apparaît pas

1. **Vider le cache du navigateur** : `Cmd+Shift+R` ou `Ctrl+Shift+R`
2. **Vérifier l'URL** : S'assurer d'être sur la page d'accueil (`/`)
3. **Vérifier la console** : Ouvrir les DevTools (F12) et vérifier les erreurs
4. **Vérifier le build** : Dans Render, vérifier que le build s'est bien terminé
5. **Vérifier les logs** : Dans Render Dashboard → Logs, vérifier les erreurs

## 📝 Notes

- La section utilise `motion.div` de framer-motion pour l'animation
- Les cartes ont des effets hover pour améliorer l'UX
- La section est responsive (mobile, tablette, desktop)
- Tous les liens pointent vers les bonnes sections de la politique de confidentialité
