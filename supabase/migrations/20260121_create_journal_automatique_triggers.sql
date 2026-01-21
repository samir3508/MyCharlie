-- Migration: Journal automatique pour les dossiers
-- Objectif: Créer des triggers pour enregistrer automatiquement tous les événements dans le journal

-- Fonction helper pour créer une entrée de journal
CREATE OR REPLACE FUNCTION create_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id TEXT;
  v_dossier_id TEXT;
  v_type TEXT;
  v_titre TEXT;
  v_contenu TEXT;
  v_ancien_statut TEXT;
  v_nouveau_statut TEXT;
  v_metadata JSONB;
BEGIN
  -- Déterminer le type d'événement et extraire les informations selon la table
  CASE TG_TABLE_NAME
    WHEN 'dossiers' THEN
      IF TG_OP = 'INSERT' THEN
        -- Création de dossier
        v_tenant_id := NEW.tenant_id;
        v_dossier_id := NEW.id;
        v_type := 'creation';
        v_titre := 'Dossier créé';
        v_contenu := format('Dossier "%s" créé', COALESCE(NEW.titre, NEW.numero));
        v_metadata := jsonb_build_object(
          'dossier_numero', NEW.numero,
          'dossier_titre', NEW.titre,
          'statut_initial', NEW.statut
        );
      ELSIF TG_OP = 'UPDATE' THEN
        -- Changement de statut
        IF OLD.statut IS DISTINCT FROM NEW.statut THEN
          v_tenant_id := NEW.tenant_id;
          v_dossier_id := NEW.id;
          v_type := 'changement_statut';
          v_titre := 'Statut modifié';
          v_contenu := format('Statut changé de "%s" à "%s"', OLD.statut, NEW.statut);
          v_ancien_statut := OLD.statut;
          v_nouveau_statut := NEW.statut;
          v_metadata := jsonb_build_object(
            'dossier_numero', NEW.numero,
            'ancien_statut', OLD.statut,
            'nouveau_statut', NEW.statut
          );
        ELSE
          -- Pas de changement de statut, ne pas créer d'entrée
          RETURN NEW;
        END IF;
      END IF;

    WHEN 'rdv' THEN
      IF TG_OP = 'INSERT' THEN
        -- RDV créé
        v_tenant_id := NEW.tenant_id;
        v_dossier_id := NEW.dossier_id;
        v_type := 'rdv_cree';
        v_titre := 'RDV planifié';
        v_contenu := format(
          'RDV %s prévu le %s à %s',
          COALESCE(NEW.type_rdv, 'visite'),
          to_char(NEW.date_heure, 'DD/MM/YYYY'),
          to_char(NEW.date_heure, 'HH24:MI')
        );
        v_metadata := jsonb_build_object(
          'rdv_id', NEW.id,
          'rdv_type', NEW.type_rdv,
          'rdv_date', NEW.date_heure,
          'rdv_statut', NEW.statut,
          'rdv_adresse', NEW.adresse
        );
      ELSIF TG_OP = 'UPDATE' THEN
        -- RDV modifié (notamment confirmation)
        IF OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'confirme' THEN
          v_tenant_id := NEW.tenant_id;
          v_dossier_id := NEW.dossier_id;
          v_type := 'rdv_cree';
          v_titre := 'RDV confirmé';
          v_contenu := format(
            'RDV %s confirmé pour le %s à %s',
            COALESCE(NEW.type_rdv, 'visite'),
            to_char(NEW.date_heure, 'DD/MM/YYYY'),
            to_char(NEW.date_heure, 'HH24:MI')
          );
          v_metadata := jsonb_build_object(
            'rdv_id', NEW.id,
            'rdv_type', NEW.type_rdv,
            'rdv_date', NEW.date_heure,
            'rdv_statut', NEW.statut
          );
        ELSE
          -- Autre modification de RDV
          IF OLD.date_heure IS DISTINCT FROM NEW.date_heure OR 
             OLD.adresse IS DISTINCT FROM NEW.adresse THEN
            v_tenant_id := NEW.tenant_id;
            v_dossier_id := NEW.dossier_id;
            v_type := 'rdv_modifie';
            v_titre := 'RDV modifié';
            v_contenu := format('RDV modifié - %s', COALESCE(NEW.type_rdv, 'visite'));
            v_metadata := jsonb_build_object(
              'rdv_id', NEW.id,
              'ancienne_date', OLD.date_heure,
              'nouvelle_date', NEW.date_heure
            );
          ELSE
            RETURN NEW;
          END IF;
        END IF;
      END IF;

    WHEN 'fiches_visite' THEN
      IF TG_OP = 'INSERT' THEN
        -- Visite réalisée
        v_tenant_id := NEW.tenant_id;
        v_dossier_id := NEW.dossier_id;
        v_type := 'visite';
        v_titre := 'Visite réalisée';
        v_contenu := format(
          'Fiche de visite créée%s',
          CASE WHEN NEW.date_visite IS NOT NULL 
            THEN format(' pour le %s', to_char(NEW.date_visite, 'DD/MM/YYYY'))
            ELSE ''
          END
        );
        v_metadata := jsonb_build_object(
          'fiche_id', NEW.id,
          'date_visite', NEW.date_visite,
          'a_visite', COALESCE(NEW.a_visite, false)
        );
      END IF;

    WHEN 'devis' THEN
      IF TG_OP = 'INSERT' THEN
        -- Devis créé
        v_tenant_id := NEW.tenant_id;
        v_dossier_id := NEW.dossier_id;
        v_type := 'devis';
        v_titre := 'Devis créé';
        v_contenu := format('Devis %s créé - Montant: %s €', NEW.numero, COALESCE(NEW.montant_ttc, 0));
        v_metadata := jsonb_build_object(
          'devis_id', NEW.id,
          'devis_numero', NEW.numero,
          'devis_statut', NEW.statut,
          'devis_montant_ttc', NEW.montant_ttc
        );
      ELSIF TG_OP = 'UPDATE' THEN
        -- Devis envoyé ou statut modifié
        IF OLD.statut IS DISTINCT FROM NEW.statut THEN
          v_tenant_id := NEW.tenant_id;
          v_dossier_id := NEW.dossier_id;
          v_type := 'devis';
          
          IF NEW.statut = 'envoye' THEN
            v_titre := 'Devis envoyé';
            v_contenu := format('Devis %s envoyé au client', NEW.numero);
          ELSIF NEW.statut = 'signe' OR NEW.statut = 'accepte' THEN
            v_titre := 'Devis signé';
            v_contenu := format('Devis %s signé par le client', NEW.numero);
          ELSE
            v_titre := 'Statut devis modifié';
            v_contenu := format('Devis %s - Statut: %s', NEW.numero, NEW.statut);
          END IF;
          
          v_metadata := jsonb_build_object(
            'devis_id', NEW.id,
            'devis_numero', NEW.numero,
            'ancien_statut', OLD.statut,
            'nouveau_statut', NEW.statut
          );
        ELSE
          RETURN NEW;
        END IF;
      END IF;

    WHEN 'factures' THEN
      IF TG_OP = 'INSERT' THEN
        -- Facture créée
        v_tenant_id := NEW.tenant_id;
        v_dossier_id := NEW.dossier_id;
        v_type := 'facture';
        v_titre := 'Facture créée';
        v_contenu := format('Facture %s créée - Montant: %s €', NEW.numero, COALESCE(NEW.montant_ttc, 0));
        v_metadata := jsonb_build_object(
          'facture_id', NEW.id,
          'facture_numero', NEW.numero,
          'facture_statut', NEW.statut,
          'facture_montant_ttc', NEW.montant_ttc,
          'facture_date_echeance', NEW.date_echeance
        );
      ELSIF TG_OP = 'UPDATE' THEN
        -- Facture envoyée ou payée
        IF OLD.statut IS DISTINCT FROM NEW.statut THEN
          v_tenant_id := NEW.tenant_id;
          v_dossier_id := NEW.dossier_id;
          
          IF NEW.statut = 'envoyee' THEN
            v_type := 'facture';
            v_titre := 'Facture envoyée';
            v_contenu := format('Facture %s envoyée au client', NEW.numero);
            v_metadata := jsonb_build_object(
              'facture_id', NEW.id,
              'facture_numero', NEW.numero,
              'facture_statut', NEW.statut
            );
          ELSIF NEW.statut = 'payee' THEN
            v_type := 'paiement';
            v_titre := 'Paiement reçu';
            v_contenu := format('Facture %s payée - Montant: %s €', NEW.numero, COALESCE(NEW.montant_ttc, 0));
            v_metadata := jsonb_build_object(
              'facture_id', NEW.id,
              'facture_numero', NEW.numero,
              'facture_montant_ttc', NEW.montant_ttc,
              'date_paiement', NEW.date_paiement
            );
          ELSE
            v_type := 'facture';
            v_titre := 'Statut facture modifié';
            v_contenu := format('Facture %s - Statut: %s', NEW.numero, NEW.statut);
            v_metadata := jsonb_build_object(
              'facture_id', NEW.id,
              'facture_numero', NEW.numero,
              'ancien_statut', OLD.statut,
              'nouveau_statut', NEW.statut
            );
          END IF;
        ELSE
          RETURN NEW;
        END IF;
      END IF;

    WHEN 'relances' THEN
      IF TG_OP = 'INSERT' THEN
        -- Relance envoyée
        v_tenant_id := NEW.tenant_id;
        v_dossier_id := NEW.dossier_id;
        v_type := 'autre';
        v_titre := 'Relance envoyée';
        v_contenu := format(
          'Relance %s envoyée%s',
          NEW.type_relance,
          CASE WHEN NEW.cible = 'devis' AND NEW.devis_id IS NOT NULL
            THEN format(' pour le devis %s', (SELECT numero FROM devis WHERE id = NEW.devis_id))
            WHEN NEW.cible = 'facture' AND NEW.facture_id IS NOT NULL
            THEN format(' pour la facture %s', (SELECT numero FROM factures WHERE id = NEW.facture_id))
            ELSE ''
          END
        );
        v_metadata := jsonb_build_object(
          'relance_id', NEW.id,
          'relance_type', NEW.type_relance,
          'relance_cible', NEW.cible,
          'relance_date', NEW.date_envoi
        );
      END IF;

    ELSE
      -- Table non gérée
      RETURN NEW;
  END CASE;

  -- Insérer l'entrée dans le journal seulement si on a un dossier_id
  IF v_dossier_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    INSERT INTO journal_dossier (
      tenant_id,
      dossier_id,
      type,
      titre,
      contenu,
      ancien_statut,
      nouveau_statut,
      metadata,
      auteur
    ) VALUES (
      v_tenant_id,
      v_dossier_id,
      v_type,
      v_titre,
      v_contenu,
      v_ancien_statut,
      v_nouveau_statut,
      v_metadata,
      'systeme'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_journal_dossiers ON dossiers;
DROP TRIGGER IF EXISTS trigger_journal_rdv ON rdv;
DROP TRIGGER IF EXISTS trigger_journal_fiches_visite ON fiches_visite;
DROP TRIGGER IF EXISTS trigger_journal_devis ON devis;
DROP TRIGGER IF EXISTS trigger_journal_factures ON factures;
DROP TRIGGER IF EXISTS trigger_journal_relances ON relances;

-- Créer les triggers
CREATE TRIGGER trigger_journal_dossiers
  AFTER INSERT OR UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_entry();

CREATE TRIGGER trigger_journal_rdv
  AFTER INSERT OR UPDATE ON rdv
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_entry();

CREATE TRIGGER trigger_journal_fiches_visite
  AFTER INSERT ON fiches_visite
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_entry();

CREATE TRIGGER trigger_journal_devis
  AFTER INSERT OR UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_entry();

CREATE TRIGGER trigger_journal_factures
  AFTER INSERT OR UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_entry();

CREATE TRIGGER trigger_journal_relances
  AFTER INSERT ON relances
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_entry();

-- Commentaires pour documentation
COMMENT ON FUNCTION create_journal_entry() IS 'Fonction trigger pour créer automatiquement des entrées dans journal_dossier lors des événements importants';
COMMENT ON TRIGGER trigger_journal_dossiers ON dossiers IS 'Crée automatiquement une entrée de journal lors de la création ou du changement de statut d''un dossier';
COMMENT ON TRIGGER trigger_journal_rdv ON rdv IS 'Crée automatiquement une entrée de journal lors de la création, modification ou confirmation d''un RDV';
COMMENT ON TRIGGER trigger_journal_fiches_visite ON fiches_visite IS 'Crée automatiquement une entrée de journal lors de la création d''une fiche de visite';
COMMENT ON TRIGGER trigger_journal_devis ON devis IS 'Crée automatiquement une entrée de journal lors de la création ou de l''envoi d''un devis';
COMMENT ON TRIGGER trigger_journal_factures ON factures IS 'Crée automatiquement une entrée de journal lors de la création, l''envoi ou le paiement d''une facture';
COMMENT ON TRIGGER trigger_journal_relances ON relances IS 'Crée automatiquement une entrée de journal lors de l''envoi d''une relance';
