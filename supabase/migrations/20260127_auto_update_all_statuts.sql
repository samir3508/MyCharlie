-- Migration: Mise à jour automatique de TOUS les statuts selon les actions
-- Objectif: Automatiser complètement les statuts de dossiers, devis, factures selon les actions
-- Date: 2026-01-27
-- Appliquée via MCP Supabase (apply_migration) → version 20260127002931

-- ════════════════════════════════════════════════════════════════════════════
-- 1. MISE À JOUR STATUT DOSSIER SELON DEVIS (amélioration)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_dossier_statut_from_devis()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_statut TEXT;
  v_current_statut TEXT;
BEGIN
  -- Ne mettre à jour que si le devis est lié à un dossier
  IF NEW.dossier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer le statut actuel du dossier
  SELECT statut INTO v_current_statut
  FROM dossiers
  WHERE id = NEW.dossier_id;

  -- Déterminer le nouveau statut selon le statut du devis
  CASE NEW.statut
    WHEN 'brouillon', 'en_preparation' THEN
      v_new_statut := 'devis_en_cours';
    WHEN 'pret' THEN
      v_new_statut := 'devis_pret';
    WHEN 'envoye' THEN
      v_new_statut := 'devis_envoye';
    WHEN 'accepte' THEN
      v_new_statut := 'signe';
    WHEN 'refuse', 'expire' THEN
      v_new_statut := 'perdu';
    ELSE
      -- Ne pas changer le statut si le statut du devis n'est pas reconnu
      RETURN NEW;
  END CASE;

  -- Ne mettre à jour que si le statut change et qu'on n'est pas déjà dans un statut "supérieur"
  -- (ex: ne pas revenir de 'signe' à 'devis_envoye' si un autre devis est accepté)
  IF v_current_statut IS DISTINCT FROM v_new_statut THEN
    -- Vérifier si on ne revient pas en arrière depuis un statut "supérieur"
    -- Ordre de progression: contact_recu → qualification → rdv_* → devis_* → signe → chantier_* → facture_*
    IF v_current_statut IN ('signe', 'chantier_en_cours', 'chantier_termine', 'facture_payee') 
       AND v_new_statut IN ('devis_en_cours', 'devis_pret', 'devis_envoye') THEN
      -- Ne pas revenir en arrière si le dossier est déjà signé ou en chantier
      RETURN NEW;
    END IF;

    -- Mettre à jour le statut du dossier
    UPDATE dossiers
    SET 
      statut = v_new_statut,
      updated_at = NOW()
    WHERE id = NEW.dossier_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_update_dossier_statut_from_devis ON devis;
CREATE TRIGGER trigger_update_dossier_statut_from_devis
  AFTER INSERT OR UPDATE OF statut ON devis
  FOR EACH ROW
  WHEN (NEW.dossier_id IS NOT NULL)
  EXECUTE FUNCTION update_dossier_statut_from_devis();

-- ════════════════════════════════════════════════════════════════════════════
-- 2. MISE À JOUR STATUT DOSSIER SELON FACTURE
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_dossier_statut_from_facture()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_statut TEXT;
  v_current_statut TEXT;
  v_all_paid BOOLEAN;
BEGIN
  -- Ne mettre à jour que si la facture est liée à un dossier
  IF NEW.dossier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer le statut actuel du dossier
  SELECT statut INTO v_current_statut
  FROM dossiers
  WHERE id = NEW.dossier_id;

  -- Déterminer le nouveau statut selon le statut de la facture
  CASE NEW.statut
    WHEN 'brouillon' THEN
      -- Ne pas changer si brouillon
      RETURN NEW;
    WHEN 'envoyee' THEN
      v_new_statut := 'facture_envoyee';
    WHEN 'en_retard' THEN
      v_new_statut := 'facture_en_retard';
    WHEN 'payee' THEN
      -- Au moins une facture ET toutes payées → dossier facture_payee
      SELECT (COUNT(*) > 0) AND (COUNT(*) FILTER (WHERE statut != 'payee') = 0)
      INTO v_all_paid
      FROM factures
      WHERE dossier_id = NEW.dossier_id;

      IF v_all_paid THEN
        v_new_statut := 'facture_payee';
      ELSE
        RETURN NEW;
      END IF;
    ELSE
      RETURN NEW;
  END CASE;

  -- Ne mettre à jour que si le statut change
  IF v_current_statut IS DISTINCT FROM v_new_statut THEN
    UPDATE dossiers
    SET 
      statut = v_new_statut,
      updated_at = NOW()
    WHERE id = NEW.dossier_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_dossier_statut_from_facture ON factures;
CREATE TRIGGER trigger_update_dossier_statut_from_facture
  AFTER INSERT OR UPDATE OF statut ON factures
  FOR EACH ROW
  WHEN (NEW.dossier_id IS NOT NULL)
  EXECUTE FUNCTION update_dossier_statut_from_facture();

-- ════════════════════════════════════════════════════════════════════════════
-- 3. MISE À JOUR STATUT DOSSIER SELON RDV
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_dossier_statut_from_rdv()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_statut TEXT;
  v_current_statut TEXT;
BEGIN
  -- Ne mettre à jour que si le RDV est lié à un dossier
  IF NEW.dossier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer le statut actuel du dossier
  SELECT statut INTO v_current_statut
  FROM dossiers
  WHERE id = NEW.dossier_id;

  -- Déterminer le nouveau statut selon le statut du RDV
  CASE NEW.statut
    WHEN 'planifie' THEN
      -- Si le dossier est encore en contact_recu ou qualification, passer à rdv_planifie
      IF v_current_statut IN ('contact_recu', 'qualification', 'rdv_a_planifier') THEN
        v_new_statut := 'rdv_planifie';
      ELSE
        -- Ne pas changer si déjà dans un statut supérieur
        RETURN NEW;
      END IF;
    WHEN 'confirme' THEN
      v_new_statut := 'rdv_confirme';
    WHEN 'realise' THEN
      -- Après réalisation, passer à visite_realisee
      v_new_statut := 'visite_realisee';
    WHEN 'annule', 'reporte' THEN
      -- Si annulé, revenir à rdv_a_planifier
      IF v_current_statut IN ('rdv_planifie', 'rdv_confirme') THEN
        v_new_statut := 'rdv_a_planifier';
      ELSE
        RETURN NEW;
      END IF;
    ELSE
      RETURN NEW;
  END CASE;

  -- Ne mettre à jour que si le statut change
  IF v_current_statut IS DISTINCT FROM v_new_statut THEN
    UPDATE dossiers
    SET 
      statut = v_new_statut,
      updated_at = NOW()
    WHERE id = NEW.dossier_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_dossier_statut_from_rdv ON rdv;
CREATE TRIGGER trigger_update_dossier_statut_from_rdv
  AFTER INSERT OR UPDATE OF statut ON rdv
  FOR EACH ROW
  WHEN (NEW.dossier_id IS NOT NULL)
  EXECUTE FUNCTION update_dossier_statut_from_rdv();

-- ════════════════════════════════════════════════════════════════════════════
-- 4. MISE À JOUR STATUT DOSSIER SELON FICHE VISITE
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_dossier_statut_from_fiche_visite()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_statut TEXT;
BEGIN
  -- Ne mettre à jour que si la fiche est liée à un dossier
  IF NEW.dossier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer le statut actuel du dossier
  SELECT statut INTO v_current_statut
  FROM dossiers
  WHERE id = NEW.dossier_id;

  -- Quand une fiche de visite est créée, passer à visite_realisee
  IF TG_OP = 'INSERT' THEN
    IF v_current_statut IN ('rdv_confirme', 'rdv_planifie') THEN
      UPDATE dossiers
      SET 
        statut = 'visite_realisee',
        updated_at = NOW()
      WHERE id = NEW.dossier_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_dossier_statut_from_fiche_visite ON fiches_visite;
CREATE TRIGGER trigger_update_dossier_statut_from_fiche_visite
  AFTER INSERT ON fiches_visite
  FOR EACH ROW
  WHEN (NEW.dossier_id IS NOT NULL)
  EXECUTE FUNCTION update_dossier_statut_from_fiche_visite();

-- ════════════════════════════════════════════════════════════════════════════
-- 5. MISE À JOUR STATUT DOSSIER LORS DE LA CRÉATION (selon contexte)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.auto_set_dossier_statut_on_create()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Si le statut n'est pas fourni ou est 'contact_recu', le laisser tel quel
  -- Sinon, utiliser le statut fourni
  IF NEW.statut IS NULL THEN
    NEW.statut := 'contact_recu';
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger BEFORE INSERT pour définir le statut par défaut
DROP TRIGGER IF EXISTS trigger_auto_set_dossier_statut_on_create ON dossiers;
CREATE TRIGGER trigger_auto_set_dossier_statut_on_create
  BEFORE INSERT ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_dossier_statut_on_create();

-- ════════════════════════════════════════════════════════════════════════════
-- 6. MISE À JOUR STATUT DOSSIER QUAND UN DEVIS EST CRÉÉ (même sans statut explicite)
-- ════════════════════════════════════════════════════════════════════════════

-- Cette fonction est déjà gérée par update_dossier_statut_from_devis
-- Mais on s'assure qu'elle fonctionne aussi à l'INSERT
-- (déjà fait dans le trigger ci-dessus)

-- ════════════════════════════════════════════════════════════════════════════
-- COMMENTAIRES
-- ════════════════════════════════════════════════════════════════════════════

COMMENT ON FUNCTION update_dossier_statut_from_devis() IS 
'Met à jour automatiquement le statut du dossier selon le statut du devis. Ne revient pas en arrière depuis signe/chantier.';

COMMENT ON FUNCTION update_dossier_statut_from_facture() IS 
'Met à jour automatiquement le statut du dossier selon le statut de la facture. Passe à facture_payee seulement si toutes les factures sont payées.';

COMMENT ON FUNCTION update_dossier_statut_from_rdv() IS 
'Met à jour automatiquement le statut du dossier selon le statut du RDV. Gère planifie → confirme → realise.';

COMMENT ON FUNCTION update_dossier_statut_from_fiche_visite() IS 
'Met à jour automatiquement le statut du dossier à visite_realisee quand une fiche de visite est créée.';

COMMENT ON FUNCTION auto_set_dossier_statut_on_create() IS 
'Définit automatiquement le statut contact_recu si aucun statut n''est fourni à la création d''un dossier.';
