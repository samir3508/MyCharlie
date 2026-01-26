# ✅ Résumé : Fix des statuts de dossier automatiques

## 🎯 Problèmes résolus

1. ✅ **Statuts de dossier automatiques** : Les statuts sont maintenant mis à jour automatiquement selon le statut du devis
2. ✅ **Prochaines actions affichées** : La logique détecte correctement les actions à faire
3. ✅ **Synchronisation devis/dossier** : Le dossier suit automatiquement l'évolution du devis

## 🔧 Modifications effectuées

### 1. Trigger PostgreSQL automatique

**Migration :** `auto_update_dossier_statut_from_devis` puis `improve_dossier_statut_trigger_no_override`

**Fonctionnement :**
- ✅ Se déclenche automatiquement quand le statut d'un devis change
- ✅ Met à jour le statut du dossier associé
- ✅ Ne modifie pas les statuts de chantier ou facture (pour éviter de revenir en arrière)

**Mapping des statuts :**
```
devis.statut = 'brouillon' ou 'en_preparation' → dossier.statut = 'devis_en_cours'
devis.statut = 'pret' → dossier.statut = 'devis_pret'
devis.statut = 'envoye' → dossier.statut = 'devis_envoye'
devis.statut = 'accepte' → dossier.statut = 'signe'
devis.statut = 'refuse' → dossier.statut = 'perdu'
devis.statut = 'expire' → dossier.statut = 'perdu'
```

### 2. Amélioration de la logique "Prochaine action"

**Fichier modifié :** `src/components/dossiers/prochaine-action.tsx`

**Améliorations :**
- ✅ Détecte quand un devis est envoyé et affiche "En attente de signature"
- ✅ Gère le temps écoulé depuis l'envoi
- ✅ Suggère de relancer après 7 jours, urgent après 14 jours
- ✅ Fonctionne même si le statut du dossier n'est pas encore synchronisé

**Nouvelles actions :**
- ✅ "En attente de signature" (devis envoyé depuis < 7 jours)
- ✅ "Relancer le client" (devis envoyé depuis 7+ jours)
- ✅ "Relancer le client (URGENT)" (devis envoyé depuis 14+ jours)

### 3. Correction des dossiers existants

**Résultats :**
- ✅ DOS-2026-0002 : `devis_en_cours` (devis en brouillon) ✅
- ✅ DOS-2026-0003 : `chantier_termine` (devis accepté, chantier terminé) ✅

## 🔄 Flow automatique complet

### Scénario 1 : Création et envoi de devis

```
1. Devis créé (statut: brouillon)
   → Trigger → dossier.statut = 'devis_en_cours'
   → Prochaine action : "Envoyer le devis"

2. Devis envoyé (statut: envoye)
   → Trigger → dossier.statut = 'devis_envoye'
   → Prochaine action : "En attente de signature"
```

### Scénario 2 : Signature du devis

```
3. Devis signé (statut: accepte)
   → Trigger → dossier.statut = 'signe'
   → Prochaine action : "Démarrer le chantier"
```

### Scénario 3 : Relance après 7 jours

```
4. Devis envoyé depuis 7+ jours
   → Prochaine action : "Relancer le client"
   → Urgence : normale

5. Devis envoyé depuis 14+ jours
   → Prochaine action : "Relancer le client"
   → Urgence : haute (rouge)
```

## 📊 Vérifications effectuées

### Cohérence des statuts

**Requête de vérification :**
```sql
SELECT 
  d.numero,
  d.statut as dossier_statut,
  dev.statut as devis_statut,
  CASE WHEN d.statut correspond au devis_statut THEN 'OK' ELSE 'INCOHERENT' END
FROM dossiers d
INNER JOIN devis dev ON dev.dossier_id = d.id
```

**Résultat :**
- ✅ Tous les dossiers sont cohérents
- ✅ Aucun dossier avec statut incohérent

## 🎯 Résultat final

### Avant
- ❌ Statuts de dossier bloqués sur `devis_en_cours`
- ❌ Prochaines actions vides
- ❌ Pas de synchronisation automatique

### Après
- ✅ Statuts de dossier mis à jour automatiquement
- ✅ Prochaines actions toujours affichées
- ✅ Synchronisation automatique devis/dossier
- ✅ Protection des statuts de chantier/facture

## 🧪 Tests à effectuer

### Test 1 : Envoi de devis
1. Créer un devis pour un dossier
2. Envoyer le devis via `envoyer-devis`
3. ✅ Vérifier que le dossier passe à `devis_envoye`
4. ✅ Vérifier que la prochaine action affiche "En attente de signature"

### Test 2 : Signature de devis
1. Signer un devis via le lien de signature
2. ✅ Vérifier que le dossier passe à `signe`
3. ✅ Vérifier que la prochaine action affiche "Démarrer le chantier"

### Test 3 : Relance automatique
1. Modifier `date_envoi` d'un devis à il y a 7 jours
2. ✅ Vérifier que la prochaine action affiche "Relancer le client"
3. Modifier `date_envoi` à il y a 14 jours
4. ✅ Vérifier que l'urgence passe à "haute" (rouge)

## 📝 Notes importantes

1. **Le trigger fonctionne en temps réel** : Dès qu'un devis change de statut, le dossier est mis à jour
2. **Le trigger ne modifie pas les statuts avancés** : Les statuts de chantier et facture sont protégés
3. **Les prochaines actions sont calculées dynamiquement** : Basées sur le statut actuel et les dates
4. **La logique fonctionne même si le statut n'est pas synchronisé** : Elle vérifie directement le statut du devis

---

**Date de correction :** 25 janvier 2026  
**Migrations appliquées :** 
- `auto_update_dossier_statut_from_devis`
- `improve_dossier_statut_trigger_no_override`
**Statut :** ✅ Corrigé et automatisation en place
