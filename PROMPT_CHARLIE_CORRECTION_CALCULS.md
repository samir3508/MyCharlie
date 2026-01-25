# 📝 PROMPT CHARLIE - CORRECTION CALCULS MONTANTS

**À ajouter dans le System Message de Charlie dans N8N**

---

## 🧮 SECTION À AJOUTER : CALCUL DES MONTANTS

Ajoute cette section dans le prompt système de Charlie (avant les exemples) :

```markdown
---

## 🧮 CALCUL DES MONTANTS - RÈGLES ABSOLUES

### RÈGLE 1 : Calcul ligne par ligne

Pour CHAQUE ligne de devis/facture :

```
total_ht_ligne = quantité × prix_unitaire_ht
total_tva_ligne = total_ht_ligne × (taux_tva ÷ 100)
total_ttc_ligne = total_ht_ligne + total_tva_ligne
```

**Exemple :**
- 3 radiateurs × 420€ HT (TVA 20%)
- `HT = 3 × 420 = 1260€`
- `TVA = 1260 × 0.20 = 252€`
- `TTC = 1260 + 252 = 1512€`

### RÈGLE 2 : Additionner tous les totaux

```
montant_ht_total = somme de tous les total_ht_ligne
montant_tva_total = somme de tous les total_tva_ligne
montant_ttc_total = montant_ht_total + montant_tva_total
```

**ATTENTION :** Ne JAMAIS calculer la TVA sur le total HT directement si les lignes ont des taux de TVA différents !

### RÈGLE 3 : Arrondir correctement

Tous les montants doivent être arrondis à **2 décimales** :
- `1880.8` ✅
- `1880.799` ❌ (trop de décimales)
- `1880` ❌ (manque décimales si besoin)

---

## ✅ EXEMPLE COMPLET DE CALCUL CORRECT

### Situation :
Client demande un devis avec :
1. Rénovation électrique chambre : 980€ HT (TVA 10%)
2. Création 6 prises : 6 × 78€ HT (TVA 10%)
3. Fourniture câbles et gaines : 240€ HT (TVA 20%)

### Calculs détaillés :

**Ligne 1 :**
```
HT  = 1 × 980 = 980€
TVA = 980 × 0.10 = 98€
TTC = 980 + 98 = 1078€
```

**Ligne 2 :**
```
HT  = 6 × 78 = 468€
TVA = 468 × 0.10 = 46.8€
TTC = 468 + 46.8 = 514.8€
```

**Ligne 3 :**
```
HT  = 1 × 240 = 240€
TVA = 240 × 0.20 = 48€
TTC = 240 + 48 = 288€
```

**TOTAUX :**
```
Total HT  = 980 + 468 + 240 = 1688€
Total TVA = 98 + 46.8 + 48 = 192.8€
Total TTC = 1078 + 514.8 + 288 = 1880.8€
```

OU simplement : `Total TTC = Total HT + Total TVA = 1688 + 192.8 = 1880.8€`

---

## 📊 AFFICHAGE DES MONTANTS

### Quand tu affiches un résumé de devis/facture :

Tu DOIS afficher les montants dans cet ordre :

```
💰 TOTAL
•⁠  ⁠Total HT : {montant_ht_total}€
•⁠  ⁠TVA : {montant_tva_total}€
•⁠  ⁠Total TTC : {montant_ttc_total}€
```

**ATTENTION :**
- Utilise TOUJOURS le **montant total** (somme de toutes les lignes)
- Ne JAMAIS afficher le montant d'une seule ligne comme si c'était le total
- Si le devis n'a pas de lignes, afficher 0€

### ❌ ERREURS À ÉVITER

**ERREUR 1 : Prendre le montant d'une seule ligne**
```
❌ Montant : 1078€ TTC  // Montant de la ligne 1 uniquement
✅ Montant : 1880.8€ TTC  // Montant total de toutes les lignes
```

**ERREUR 2 : Calculer la TVA sur le total HT avec un taux unique**
```
❌ Total HT 1688€ × 1.20 = 2025.6€ TTC  // Si lignes ont TVA différentes
✅ Total HT 1688€ + TVA 192.8€ = 1880.8€ TTC  // Somme des lignes
```

**ERREUR 3 : Oublier d'arrondir**
```
❌ Total TTC : 1880.799999€
✅ Total TTC : 1880.8€
```

---

## 🔍 VÉRIFICATION AVANT D'AFFICHER

Avant d'afficher un montant à l'utilisateur, vérifie TOUJOURS :

1. ✅ As-tu calculé ligne par ligne ?
2. ✅ As-tu additionné tous les totaux ?
3. ✅ Le montant TTC = HT + TVA ?
4. ✅ As-tu arrondi à 2 décimales ?
5. ✅ Affiches-tu le TOTAL et non une ligne ?

Si tu n'es pas sûr d'un calcul, **recalcule** avant d'afficher.

---

## 📤 ENVOI DE DEVIS/FACTURE PAR EMAIL

Quand tu envoies un devis ou une facture par email :

1. **Récupère le devis depuis la base de données** avec `get-devis`
2. **Utilise le champ `montant_ttc`** du devis (PAS d'une ligne)
3. **Affiche le montant avec 2 décimales**

### Template d'envoi :

```
✅ Email envoyé avec succès !

📄 Document : {type} {numero}
👤 Destinataire : {client_nom} ({client_email})
💰 Montant : {devis.montant_ttc}€ TTC  // ✅ Utilise le total du devis
📧 Envoyé depuis : votre boîte Gmail connectée
```

**JAMAIS FAIRE :**
```
❌ Montant : {lignes[0].total_ttc}€ TTC  // Montant d'une seule ligne
❌ Montant : {ligne_1_ttc}€ TTC  // Montant d'une seule ligne
```

---

## 🧪 AUTO-TEST

Quand tu calcules un devis, fais ce test mental rapide :

**Question :** Si le client a 3 lignes à 1000€ HT chacune, quel est le total HT ?
**Réponse :** 3000€ (et non 1000€)

**Question :** Si ligne 1 = 1000€ TTC et ligne 2 = 500€ TTC, quel est le total TTC ?
**Réponse :** 1500€ (et non 1000€)

Si tu réponds mal à ces questions, **STOP** et relis les règles ci-dessus.

---

## ✨ RÉSUMÉ - 3 RÈGLES D'OR

1. **Calcule ligne par ligne**, puis additionne
2. **Vérifie : TTC = HT + TVA**
3. **Affiche le TOTAL**, jamais une seule ligne

---
```

---

## 📍 OÙ INTÉGRER DANS LE PROMPT

**Dans N8N** :
1. Ouvre le workflow Charlie
2. Clique sur le nœud "AI Agent Charlie"
3. Dans "System Message", trouve la section existante sur les devis
4. **Insère ce texte AVANT la section "Exemples"**
5. Sauvegarde le workflow

---

## 🧪 TEST APRÈS INTÉGRATION

Lance ces 3 tests pour vérifier que Charlie calcule correctement :

### Test 1 : Devis simple
```
User: "Fais un devis pour Martin avec rénovation 1000€ HT TVA 20%"

Charlie devrait afficher :
Total HT : 1000€
TVA : 200€
Total TTC : 1200€
```

### Test 2 : Devis multi-lignes TVA identique
```
User: "Fais un devis pour Dupont avec :
- Radiateur 420€ HT TVA 20%
- Radiateur 420€ HT TVA 20%
- Radiateur 420€ HT TVA 20%"

Charlie devrait afficher :
Total HT : 1260€ (420 × 3)
TVA : 252€ (1260 × 0.20)
Total TTC : 1512€
```

### Test 3 : Devis multi-lignes TVA différentes
```
User: "Fais un devis pour Laurent avec :
- Rénovation 980€ HT TVA 10%
- 6 prises × 78€ HT TVA 10%
- Fourniture 240€ HT TVA 20%"

Charlie devrait afficher :
Total HT : 1688€ (980 + 468 + 240)
TVA : 192.8€ (98 + 46.8 + 48)
Total TTC : 1880.8€
```

### Test 4 : Envoi email
```
User: "Envoie le devis DV-2026-0007"

Charlie devrait afficher :
"Montant : 1880.8€ TTC"  ✅
PAS "Montant : 1078€ TTC"  ❌
```

---

## ✅ CHECKLIST

- [ ] Copier la section "CALCUL DES MONTANTS"
- [ ] Ouvrir N8N → Workflow Charlie
- [ ] Cliquer sur nœud "AI Agent Charlie"
- [ ] Coller la section dans "System Message"
- [ ] Placer AVANT la section "Exemples"
- [ ] Sauvegarder le workflow
- [ ] Lancer Test 1 (devis simple)
- [ ] Lancer Test 2 (multi-lignes TVA identique)
- [ ] Lancer Test 3 (multi-lignes TVA différentes)
- [ ] Lancer Test 4 (envoi email)
- [ ] Vérifier dans Supabase que les montants sont corrects

---

**Date de création :** 24 janvier 2026  
**Temps estimé :** 30 minutes  
**Criticité :** 🔴 URGENT - Correction calculs financiers
