# Prochaines actions : facture / acompte avant chantier

## Objectif

Ne plus proposer **« Lancer le chantier »** juste après la signature du devis.  
Respecter les **templates de conditions de paiement** de chaque artisan (comptant, acompte, solde, etc.) et ne proposer **« Lancer le chantier »** qu’une fois la facture ou la facture d’acompte **payée**.

## Règles mises en place

### 1. Devis signé, aucune facture

- **Template avec acompte** (ex. 30 %, 33 %, 100 % comptant) :
  - **« Créer la facture d’acompte »** (ou **« Créer la facture »** si comptant 100 %)  
  - Lien → page du devis (`/devis/{id}`) pour créer l’acompte / la facture selon le template.
- **Template sans acompte** (100 % solde en fin de chantier) :
  - **« Lancer le chantier »** directement.
- **Template inconnu** (ex. liste / kanban sans template) :
  - **« Créer la facture »** + lien vers le devis (prudence).

### 2. Facture d’acompte créée, non payée

- **« En attente du paiement de l’acompte »**  
- Lien → fiche de la facture.  
- **« Lancer le chantier »** n’est pas proposé.

### 3. Acompte payé (ou comptant payé)

- **« Lancer le chantier »**  
- Bouton **« Démarrer chantier »** affiché dans les actions rapides.

### 4. Chantier en cours

- **« Terminer le chantier »**  
- Si le template prévoit un solde : mention **« puis créer la facture de solde »**.

### 5. Chantier terminé

- **Template avec solde** et pas encore de facture de solde → **« Créer la facture de solde »** + lien vers le devis.
- Sinon (0 facture, pas de solde) → **« Créer la facture »** + lien devis ou `/factures/nouveau`.

## Fichiers modifiés

| Fichier | Modification |
|--------|---------------|
| `src/lib/hooks/use-dossiers.ts` | `useDossiers` et `useDossier` : chargement de `template_condition_paiement` et `devis_id` sur les factures pour liste, détail et kanban. |
| `src/components/dossiers/prochaine-action.tsx` | Nouvelle logique « facture / acompte avant chantier » : créer facture ou acompte, attente paiement, puis « Lancer le chantier ». Gestion template nul (liste). |
| `src/app/(dashboard)/dossiers/[id]/page.tsx` | **Actions rapides** : « Démarrer chantier » uniquement si acompte payé ou pas d’acompte ; « Créer facture d’acompte » / « Créer facture de solde » avec liens vers le devis. |
| `src/components/dossiers/relances-alertes.tsx` | Alerte « Facture à créer » : « Facture d’acompte à créer » si template avec acompte, lien vers `/devis/{id}`. |

## Templates de conditions de paiement

Chaque artisan configure ses templates (Paramètres → Templates) :

- **Paiement comptant** : 100 % à la signature → une seule facture, puis chantier quand elle est payée.
- **30/70**, **3×33 %**, etc. : acompte (et éventuellement intermédiaire), puis solde.  
  On crée d’abord la facture d’acompte, on propose **« Lancer le chantier »** seulement une fois l’acompte **payé**, puis en fin de chantier **« Créer la facture de solde »**.

## Résumé

- **Avant** : devis signé → « Lancer le chantier » tout de suite.  
- **Après** : devis signé → « Créer la facture » / « Créer la facture d’acompte » selon le template → « En attente du paiement de l’acompte » → une fois payé → « Lancer le chantier ».  
Les prochaines actions et les boutons du dossier reflètent ce flux.
