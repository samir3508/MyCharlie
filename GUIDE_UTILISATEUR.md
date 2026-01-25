# 📖 GUIDE UTILISATEUR - MyCharlie

Bienvenue sur MyCharlie, votre assistant de gestion BTP intelligent !

---

## 🎯 Vue d'ensemble

MyCharlie est une application qui vous aide à gérer votre activité BTP de A à Z :
- Gestion des clients et dossiers
- Création de devis et factures
- Planning et rendez-vous
- Relances automatiques
- Agents IA pour vous assister

---

## 🚪 Premiers pas

### 1. Créer un compte

1. Allez sur https://mycharlie.fr
2. Cliquez sur **`S'inscrire`**
3. Remplissez le formulaire :
   - Nom de votre entreprise
   - Email professionnel
   - Mot de passe sécurisé (min. 8 caractères)
   - Numéro de téléphone
4. Cliquez sur **`Créer mon compte`**
5. Vérifiez votre email et cliquez sur le lien de confirmation

### 2. Configurer votre profil

Après la première connexion :
1. Allez dans **`Paramètres`** (icône engrenage)
2. Complétez les informations de votre entreprise :
   - SIRET
   - Adresse
   - TVA intracommunautaire
   - IBAN/BIC
   - Logo (pour vos devis/factures)

---

## 👤 Gestion des clients

### Créer un nouveau client

**Méthode 1 : Via l'interface**
1. Allez dans **`Clients`** dans le menu
2. Cliquez sur **`+ Nouveau client`**
3. Remplissez les informations :
   - Nom et prénom (ou nom entreprise)
   - Email
   - Téléphone
   - Adresse de facturation
   - Type (Particulier / Professionnel)
4. Cliquez sur **`Créer`**

**Méthode 2 : Via Charlie (IA)**
Parlez simplement à Charlie :
> "Crée un client Jean Dupont, email jean@example.com, tel 0612345678"

Charlie créera automatiquement le client ET un dossier associé !

### Modifier un client

1. Dans la liste des clients, cliquez sur le client
2. Cliquez sur **`Modifier`**
3. Modifiez les informations
4. Cliquez sur **`Enregistrer`**

### Voir les statistiques d'un client

Sur la fiche client, vous verrez :
- 💰 Chiffre d'affaires total
- 📄 Nombre de devis créés
- 💳 Nombre de factures émises
- 📊 Graphique d'évolution du CA

---

## 📁 Gestion des dossiers

Un **dossier** suit un prospect/client de la prise de contact à la signature et au paiement.

### Les 13 statuts d'un dossier

1. **Contact reçu** : Premier contact avec le client
2. **Qualification** : Vérification des besoins
3. **RDV à planifier** : Besoin d'organiser une visite
4. **RDV planifié** : Visite programmée
5. **RDV confirmé** : Visite confirmée par le client
6. **Visite réalisée** : Visite effectuée, fiche créée
7. **Devis en cours** : Devis en préparation
8. **Devis prêt** : Devis finalisé, prêt à être envoyé
9. **Devis envoyé** : Devis envoyé au client
10. **En négociation** : Échanges avec le client
11. **Signé** : Devis accepté par le client
12. **Perdu** : Dossier perdu (concurrent, budget, etc.)
13. **Annulé** : Dossier annulé par le client

### Vue Kanban

La vue Kanban organise vos dossiers en 6 colonnes :
- **Nouveaux** : Contact reçu, qualification
- **RDV** : RDV à planifier, planifié, confirmé
- **Visite faite** : Visite réalisée
- **Devis** : Devis en cours, prêt, envoyé, négociation
- **Gagnés** : Devis signés
- **Perdus** : Dossiers perdus ou annulés

**Déplacer un dossier :**
- Glissez-déposez le dossier dans une autre colonne
- Le statut sera mis à jour automatiquement

### Fiche détaillée d'un dossier

Cliquez sur un dossier pour voir sa fiche complète avec **6 onglets** :

#### 1. Rendez-vous
- Liste des RDV programmés
- Date, heure, type, statut
- Créer un nouveau RDV

#### 2. Fiches de visite
- Constats techniques
- Photos du chantier
- Estimations heures/coût
- Matériaux nécessaires

#### 3. Devis
- Liste des devis du dossier
- Statut, date création, montant
- Actions : Générer PDF, Envoyer, Signer

#### 4. Factures
- Liste des factures du dossier
- Factures en retard en rouge
- Actions : Envoyer, Relancer, Marquer payée

#### 5. Relances & Alertes IA
- Relances programmées
- Alertes IA (actions oubliées, devis non créés, etc.)
- Suggestions contextuelles de LÉO

#### 6. Journal (Timeline)
- Historique complet du dossier
- Tous les événements automatiquement enregistrés :
  - Création dossier
  - RDV planifié/confirmé
  - Visite réalisée
  - Devis créé/envoyé/signé
  - Facture créée/envoyée/payée
  - Relances envoyées
  - Changements de statut

### Prochaine Action (Suggestion IA)

En haut de chaque fiche dossier, un encadré **"Prochaine Action"** vous indique :
- 🔴 **URGENT** : Facture en retard → Relancer immédiatement
- 🟠 **IMPORTANT** : Devis signé → Créer facture
- 🟡 **NORMAL** : Visite faite → Créer devis

Cliquez sur le bouton d'action pour être redirigé directement vers la bonne page !

---

## 📄 Créer un devis

### Méthode 1 : Via l'interface

1. Allez dans **`Devis`** → **`+ Nouveau devis`**
2. **Étape 1 : Client**
   - Sélectionnez le client
   - Renseignez le titre du devis
   - Adresse du chantier
   - Délai d'exécution
3. **Étape 2 : Lignes**
   - Ajoutez les prestations une par une
   - Pour chaque ligne :
     - Désignation (ex: "Rénovation salle de bain")
     - Description détaillée
     - Quantité et unité (m², h, u, etc.)
     - Prix unitaire HT
     - TVA (défaut 20%)
   - Les totaux sont calculés automatiquement
4. **Étape 3 : Conditions**
   - Sélectionnez un template de paiement
   - Ajoutez des notes si nécessaire
5. Cliquez sur **`Finaliser`**
   - Le PDF est généré automatiquement
   - Le statut passe à "Prêt"

### Méthode 2 : Via Charlie (IA)

Parlez à Charlie :
> "Fais un devis pour Jean Martin avec :"
> "- Rénovation cuisine : 5000€ HT"
> "- Pose carrelage 20m² : 800€ HT"
> "Délai 3 semaines"

Charlie va :
1. Chercher le client (ou le créer si absent)
2. Créer le dossier (si absent)
3. Créer le devis avec les lignes
4. Calculer automatiquement les totaux
5. Générer le PDF

### Envoyer un devis

**Via l'interface :**
1. Ouvrez le devis
2. Cliquez sur **`Envoyer par email`**
3. Vérifiez l'email du client
4. Personnalisez le message (optionnel)
5. Cliquez sur **`Envoyer`**

**Via Charlie :**
> "Envoie le devis DV-2026-0001"

Charlie va :
1. Récupérer le devis
2. Composer un email professionnel
3. Vous montrer un aperçu
4. Vous demander confirmation
5. Envoyer via Gmail avec le PDF en pièce jointe

### Signature électronique

Quand vous envoyez un devis, un **lien de signature** est inclus dans l'email.

Le client peut :
1. Cliquer sur le lien
2. Consulter le devis
3. Signer électroniquement (avec souris ou doigt)
4. Valider

Vous recevez une notification instantanée quand le devis est signé !

---

## 💳 Créer une facture

### Depuis un devis signé

**Via l'interface :**
1. Ouvrez le dossier
2. Dans l'onglet **`Factures`**, cliquez sur **`Créer depuis devis`**
3. Sélectionnez le type :
   - **Acompte** (30%, 40%, 50%)
   - **Intermédiaire** (si plusieurs étapes)
   - **Solde** (montant restant)
4. Les lignes du devis sont copiées automatiquement
5. Ajustez les montants si nécessaire
6. Cliquez sur **`Finaliser`**

**Via Charlie :**
> "Crée une facture d'acompte de 30% pour le devis DV-2026-0001"

Charlie va :
1. Récupérer le devis
2. Créer la facture avec 30% du montant
3. Générer le PDF
4. Vous proposer de l'envoyer

### Envoyer une facture

Même processus que pour les devis :
- Bouton **`Envoyer par email`** dans l'interface
- Ou demander à Charlie : "Envoie la facture FA-2026-0001"

### Marquer une facture comme payée

**Via l'interface :**
1. Ouvrez la facture
2. Cliquez sur **`Marquer comme payée`**
3. Renseignez la date de paiement
4. Validez

**Via Charlie :**
> "La facture FA-2026-0001 a été payée aujourd'hui"

Le journal du dossier enregistrera automatiquement le paiement !

---

## 📅 Gérer les rendez-vous

### Créer un RDV

**Via l'interface :**
1. Allez dans **`Agenda`**
2. Cliquez sur **`+ Nouveau RDV`**
3. Remplissez :
   - Client / Dossier
   - Date et heure
   - Type (Visite, Appel, Chantier, etc.)
   - Adresse (pour visite)
   - Durée
   - Notes d'accès
4. Cliquez sur **`Créer`**

Le RDV est automatiquement créé dans votre **Google Calendar** !

**Via LÉO (IA) :**
> "Organise une visite avec M. Dupont demain à 14h"

LÉO va :
1. Vérifier votre planning dans Google Calendar
2. Détecter les conflits
3. Créer le RDV dans l'app
4. Créer l'événement dans Google Calendar
5. Envoyer un email de confirmation au client

### Voir votre planning

**Vue Jour :**
- Vos RDV du jour
- Heure par heure

**Vue Semaine :**
- Planning de la semaine
- Vue d'ensemble

**Vue Mois :**
- Calendrier mensuel
- Tous vos RDV

### Synchronisation Google Calendar

MyCharlie se synchronise automatiquement avec votre Google Calendar :
- ✅ RDV créés dans l'app → Apparaissent dans Calendar
- ✅ RDV créés dans Calendar → Apparaissent dans l'app
- ✅ Modifications synchronisées en temps réel

---

## 🤖 Utiliser les agents IA

### Charlie - Agent Commercial

**Quand l'utiliser :**
- Créer/modifier clients
- Créer/envoyer devis
- Créer/envoyer factures
- Relancer clients
- Questions commerciales

**Exemples de commandes :**
```
"Crée un client Martin Jean, email jean@test.com"
→ Client + dossier créés automatiquement

"Fais un devis pour Martin avec cuisine 5000€ HT"
→ Devis créé avec calculs automatiques

"Envoie le devis DV-2026-0001"
→ Email envoyé avec PDF

"Crée une facture d'acompte de 30% pour le devis DV-2026-0001"
→ Facture créée automatiquement

"La facture FA-2026-0001 a été payée"
→ Facture marquée payée, journal mis à jour
```

### LÉO - Agent Terrain

**Quand l'utiliser :**
- Consulter votre planning
- Créer des RDV
- Gérer les dossiers
- Voir les stats
- Questions opérationnelles

**Exemples de commandes :**
```
"J'ai quoi demain ?"
→ LÉO consulte votre Google Calendar

"Organise une visite avec Dupont mardi 14h"
→ RDV créé dans app + Google Calendar

"Combien j'ai de dossiers actifs ?"
→ Stats en temps réel

"Quelles sont mes factures en retard ?"
→ Liste des factures échues

"Quel est mon CA du mois ?"
→ Chiffre d'affaires calculé
```

### Manager - Router Intelligent

Le Manager analyse automatiquement vos messages et vous redirige vers le bon agent :
- Messages commerciaux → Charlie
- Messages terrain → LÉO

Vous n'avez pas besoin de choisir, le Manager le fait pour vous !

---

## 📊 Dashboard

Votre tableau de bord affiche :

### KPIs principaux
- 📁 Nombre de dossiers actifs
- 💰 CA du mois / trimestre / année
- 📈 Taux de conversion devis → facture
- 🔴 Montant des factures en retard
- 📅 RDV des prochaines 48h

### Graphiques
- Évolution du CA (par mois)
- Répartition des statuts dossiers
- Statuts des devis (brouillon, envoyé, signé)

---

## 🔔 Notifications

### Notifications automatiques

Vous recevez des notifications pour :
- 📄 Devis signé par un client
- 💳 Facture payée
- ⏰ RDV dans 24h
- ⚠️ Facture en retard
- 🔔 Action oubliée (devis non créé après visite)

### Notification du matin

Chaque matin à 7h30, LÉO vous envoie un résumé :
- 📅 Vos RDV du jour
- 📄 Devis à envoyer
- 💳 Factures à suivre
- ⚠️ Relances à faire

---

## 🔁 Relances automatiques

### Configuration des relances

1. Allez dans **`Paramètres`** → **`Relances`**
2. Configurez les délais pour chaque type :

**Devis non répondu :**
- R1 : après 7 jours
- R2 : après 14 jours
- R3 : après 30 jours

**Facture avant échéance :**
- R1 : 3 jours avant
- R2 : 7 jours avant

**Facture en retard :**
- R1 : 1 jour après échéance
- R2 : 7 jours après
- R3 : 14 jours après

### Envoi des relances

**Automatique :**
- LÉO vous suggère les relances à faire
- Vous validez d'un clic
- L'email est envoyé automatiquement

**Manuel :**
- Ouvrez le devis ou la facture
- Cliquez sur **`Relancer`**
- Personnalisez le message
- Envoyez

---

## 🔍 Recherche

### Recherche globale

Cliquez sur la barre de recherche (ou `Ctrl+K`) :
- Cherchez par nom de client
- Cherchez par numéro (DOS-YYYY-XXXX, DV-YYYY-XXXX, FA-YYYY-XXXX)
- Cherchez par téléphone ou email

### Filtres avancés

Dans chaque module (Clients, Devis, Factures) :
- Filtrez par statut
- Filtrez par date
- Triez par montant, date, nom

---

## 📤 Import/Export

### Exporter vos données

1. Allez dans le module (Clients, Devis, Factures, etc.)
2. Cliquez sur **`Exporter`**
3. Choisissez le format :
   - **CSV** : Pour Excel/Google Sheets
   - **Excel** : Avec formatage
   - **PDF** : Pour impression
4. Le fichier est téléchargé automatiquement

### Importer des clients

1. Allez dans **`Clients`** → **`Importer`**
2. Téléchargez le modèle CSV
3. Remplissez vos données
4. Glissez-déposez le fichier
5. Mappez les colonnes
6. Cliquez sur **`Importer`**

---

## ⚙️ Paramètres

### Profil entreprise
- Nom, SIRET, adresse
- Logo (pour devis/factures)
- Coordonnées bancaires (IBAN/BIC)

### Agents IA
- Activer/désactiver Charlie et LÉO
- Personnaliser le ton (Formel, Informel, Amical)
- Horaires de disponibilité
- Message hors horaires

### Templates
- Templates de devis (conditions de paiement)
- Templates de relances
- Templates d'emails

### Intégrations
- Connecter Gmail
- Connecter Google Calendar
- Connecter WhatsApp (via Twilio)

---

## 💡 Astuces & Bonnes pratiques

### Workflow recommandé

1. **Contact reçu** → Créer client + dossier
2. **Qualification** → Échanger avec le client, noter les besoins
3. **Planifier RDV** → Via LÉO ou l'interface
4. **Réaliser visite** → Créer fiche de visite avec photos
5. **Créer devis** → Via Charlie ou l'interface
6. **Envoyer devis** → Email automatique avec PDF
7. **Suivre** → Relances automatiques si pas de réponse
8. **Devis signé** → Créer facture d'acompte
9. **Suivre paiements** → Relances si retard
10. **Clôturer** → Marquer facture payée

### Raccourcis clavier

- `Ctrl+K` : Recherche globale
- `Ctrl+N` : Nouveau client
- `Ctrl+D` : Nouveau devis
- `Ctrl+F` : Nouvelle facture

### Utiliser les tags

Ajoutez des tags à vos clients/dossiers pour mieux organiser :
- `VIP` : Clients importants
- `Urgent` : Dossiers prioritaires
- `Été 2026` : Chantiers d'été
- `Rénovation` : Type de travaux

---

## 🆘 Besoin d'aide ?

### Support technique
- Email : support@mycharlie.fr
- Chat : Cliquez sur l'icône 💬 en bas à droite
- Documentation : https://docs.mycharlie.fr

### Questions fréquentes

**Q : Puis-je modifier un devis déjà envoyé ?**  
R : Oui, mais créez un nouvel envoi. L'historique des versions est conservé dans le journal.

**Q : Comment annuler une facture ?**  
R : Marquez-la comme "annulée" et créez une facture d'avoir si nécessaire.

**Q : Puis-je avoir plusieurs utilisateurs ?**  
R : Oui, avec le plan Pro ou Enterprise. Contactez-nous.

**Q : Mes données sont-elles sécurisées ?**  
R : Oui, isolation stricte entre tenants, chiffrement, backups quotidiens.

---

**Version :** 0.1.0  
**Dernière mise à jour :** 23 janvier 2026
