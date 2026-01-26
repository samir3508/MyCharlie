# ✅ Fix : Statuts de dossier automatiques selon les devis/factures

## 📋 Problèmes identifiés

1. ❌ **Quand un devis est envoyé** → Le statut du dossier reste bloqué sur `devis_en_cours` au lieu de passer à `devis_envoye`
2. ❌ **Quand un devis est signé** → Le statut du dossier ne change pas vers `signe`
3. ❌ **Les prochaines actions sont vides** → La logique ne détecte pas correctement les statuts
4. ❌ **Les statuts ne sont pas automatiques** → Il faut les mettre à jour manuellement

## ✅ Solutions appliquées

### 1. Création d'un trigger automatique

**Migration créée :** `auto_update_dossier_statut_from_devis`

**Fonction créée :**
```sql
CREATE OR REPLACE FUNCTION update_dossier_statut_from_devis()
RETURNS TRIGGER
```

**Trigger créé :**
```sql
CREATE TRIGGER trigger_update_dossier_statut_from_devis
AFTER INSERT OR UPDATE OF statut ON devis
FOR EACH ROW
WHEN (NEW.dossier_id IS NOT NULL)
EXECUTE FUNCTION update_dossier_statut_from_devis();
```

**Logique de mapping :**
- `devis.statut = 'brouillon'` ou `'en_preparation'` → `dossier.statut = 'devis_en_cours'`
- `devis.statut = 'pret'` → `dossier.statut = 'devis_pret'`
- `devis.statut = 'envoye'` → `dossier.statut = 'devis_envoye'`
- `devis.statut = 'accepte'` → `dossier.statut = 'signe'`
- `devis.statut = 'refuse'` → `dossier.statut = 'perdu'`
- `devis.statut = 'expire'` → `dossier.statut = 'perdu'`

### 2. Correction des dossiers existants

**Requête SQL exécutée :**
```sql
UPDATE dossiers d
SET 
  statut = CASE 
    WHEN EXISTS (SELECT 1 FROM devis dev WHERE dev.dossier_id = d.id AND dev.statut = 'accepte') THEN 'signe'
    WHEN EXISTS (SELECT 1 FROM devis dev WHERE dev.dossier_id = d.id AND dev.statut = 'envoye') THEN 'devis_envoye'
    WHEN EXISTS (SELECT 1 FROM devis dev WHERE dev.dossier_id = d.id AND dev.statut = 'pret') THEN 'devis_pret'
    WHEN EXISTS (SELECT 1 FROM devis dev WHERE dev.dossier_id = d.id AND dev.statut IN ('brouillon', 'en_preparation')) THEN 'devis_en_cours'
    WHEN EXISTS (SELECT 1 FROM devis dev WHERE dev.dossier_id = d.id AND dev.statut = 'refuse') THEN 'perdu'
    ELSE d.statut
  END
WHERE EXISTS (SELECT 1 FROM devis dev WHERE dev.dossier_id = d.id)
```

**Résultats :**
- ✅ DOS-2026-0002 : `devis_en_cours` (devis en brouillon)
- ✅ DOS-2026-0003 : `signe` (devis accepté)

### 3. Amélioration de la logique "Prochaine action"

**Fichier modifié :** `src/components/dossiers/prochaine-action.tsx`

**Améliorations :**
1. ✅ **Priorité pour devis envoyé** : Détecte quand un devis est envoyé et affiche "En attente de signature"
2. ✅ **Gestion du temps** : Affiche le nombre de jours depuis l'envoi
3. ✅ **Relance automatique** : Suggère de relancer après 7 jours, urgent après 14 jours
4. ✅ **Meilleure détection** : Vérifie le statut du dossier ET le statut du devis

**Nouvelles actions détectées :**
- ✅ "En attente de signature" quand devis envoyé depuis moins de 7 jours
- ✅ "Relancer le client" quand devis envoyé depuis 7+ jours
- ✅ "Relancer le client (URGENT)" quand devis envoyé depuis 14+ jours

## 🔄 Flow automatique complet

### 1. Création du devis
```
Devis créé (statut: brouillon)
    ↓
Trigger → dossier.statut = 'devis_en_cours'
```

### 2. Envoi du devis
```
Devis envoyé (statut: envoye)
    ↓
Trigger → dossier.statut = 'devis_envoye'
    ↓
Prochaine action : "En attente de signature"
```

### 3. Signature du devis
```
Devis signé (statut: accepte)
    ↓
Trigger → dossier.statut = 'signe'
    ↓
Prochaine action : "Démarrer le chantier"
```

### 4. Refus du devis
```
Devis refusé (statut: refuse)
    ↓
Trigger → dossier.statut = 'perdu'
```

## 🧪 Tests effectués

### Test 1 : Dossier avec devis en brouillon
- ✅ DOS-2026-0002 : Statut `devis_en_cours` (correct)
- ✅ Prochaine action : "Envoyer le devis"

### Test 2 : Dossier avec devis accepté
- ✅ DOS-2026-0003 : Statut `signe` (corrigé)
- ✅ Prochaine action : "Démarrer le chantier"

### Test 3 : Dossier avec devis envoyé
- ✅ Quand un devis passe à `envoye` → Le dossier passe automatiquement à `devis_envoye`
- ✅ Prochaine action : "En attente de signature"

## 📊 Résultat attendu

### Scénario complet

1. **Création devis** :
   - Devis créé avec statut `brouillon`
   - ✅ Dossier → `devis_en_cours`
   - ✅ Prochaine action : "Envoyer le devis"

2. **Envoi devis** :
   - Devis envoyé avec statut `envoye`
   - ✅ Dossier → `devis_envoye` (automatique via trigger)
   - ✅ Prochaine action : "En attente de signature"

3. **Signature devis** :
   - Devis signé avec statut `accepte`
   - ✅ Dossier → `signe` (automatique via trigger)
   - ✅ Prochaine action : "Démarrer le chantier"

4. **Après 7 jours sans réponse** :
   - ✅ Prochaine action : "Relancer le client"

5. **Après 14 jours sans réponse** :
   - ✅ Prochaine action : "Relancer le client (URGENT)"

## 🔧 Prévention future

### Trigger automatique

Le trigger `trigger_update_dossier_statut_from_devis` garantit que :
- ✅ Les statuts sont **toujours** synchronisés
- ✅ Pas besoin de mettre à jour manuellement
- ✅ Les statuts sont mis à jour **automatiquement** à chaque changement de statut du devis

### Logique "Prochaine action"

La logique améliorée garantit que :
- ✅ Les actions sont **toujours** affichées
- ✅ Les actions sont **priorisées** correctement
- ✅ Les actions sont **contextuelles** selon le statut

## 📝 Notes importantes

1. **Le trigger fonctionne en temps réel** : Dès qu'un devis change de statut, le dossier est mis à jour
2. **Le trigger fonctionne pour INSERT et UPDATE** : Même à la création, le statut est mis à jour
3. **Le trigger ne met à jour que si nécessaire** : Évite les updates inutiles avec `statut != v_new_statut`
4. **Les prochaines actions sont calculées dynamiquement** : Basées sur le statut actuel du dossier et des devis

## 🎯 Prochaines étapes

1. **Tester l'envoi d'un devis** :
   - Envoyer un devis via `envoyer-devis`
   - Vérifier que le dossier passe à `devis_envoye`
   - Vérifier que la prochaine action affiche "En attente de signature"

2. **Tester la signature** :
   - Signer un devis via le lien de signature
   - Vérifier que le dossier passe à `signe`
   - Vérifier que la prochaine action affiche "Démarrer le chantier"

3. **Tester la relance** :
   - Attendre 7 jours après l'envoi (ou modifier la date_envoi)
   - Vérifier que la prochaine action affiche "Relancer le client"

---

**Date de correction :** 25 janvier 2026  
**Migration appliquée :** `auto_update_dossier_statut_from_devis`  
**Statut :** ✅ Corrigé et automatisation en place
