-- Migration: Corriger le problème de sécurité function_search_path_mutable
-- Objectif: Ajouter SET search_path = public, pg_temp à toutes les fonctions pour éviter les injections SQL
-- Date: 2026-01-23
-- Identifié par: Supabase Security Advisors

-- 1. Fonction create_journal_entry (CRITIQUE - utilisée par tous les triggers)
CREATE OR REPLACE FUNCTION public.create_journal_entry()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
DECLARE
  v_tenant_id UUID;
  v_dossier_id UUID;
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
          RETURN NEW;
        END IF;
      END IF;

    WHEN 'rdv' THEN
      IF TG_OP = 'INSERT' THEN
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
          'valide_par_artisan', COALESCE(NEW.valide_par_artisan, false)
        );
      END IF;

    WHEN 'devis' THEN
      IF TG_OP = 'INSERT' THEN
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
      IF TG_OP = 'INSERT' AND NEW.statut = 'envoye' THEN
        IF NEW.facture_id IS NOT NULL THEN
          SELECT dossier_id INTO v_dossier_id FROM factures WHERE id = NEW.facture_id;
        ELSIF NEW.devis_id IS NOT NULL THEN
          SELECT dossier_id INTO v_dossier_id FROM devis WHERE id = NEW.devis_id;
        END IF;
        
        IF v_dossier_id IS NOT NULL THEN
          v_tenant_id := NEW.tenant_id;
          v_type := 'autre';
          v_titre := 'Relance envoyée';
          
          IF NEW.facture_id IS NOT NULL THEN
            v_contenu := format(
              'Relance %s envoyée pour la facture %s',
              NEW.type,
              (SELECT numero FROM factures WHERE id = NEW.facture_id)
            );
          ELSIF NEW.devis_id IS NOT NULL THEN
            v_contenu := format(
              'Relance %s envoyée pour le devis %s',
              NEW.type,
              (SELECT numero FROM devis WHERE id = NEW.devis_id)
            );
          ELSE
            v_contenu := format('Relance %s envoyée', NEW.type);
          END IF;
          
          v_metadata := jsonb_build_object(
            'relance_id', NEW.id,
            'relance_type', NEW.type,
            'relance_niveau', NEW.niveau,
            'relance_date_envoi', NEW.date_envoi,
            'facture_id', NEW.facture_id,
            'devis_id', NEW.devis_id
          );
        ELSE
          RETURN NEW;
        END IF;
      END IF;

    ELSE
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
$$;

-- 2. Fonction handle_new_user (CRITIQUE - création tenant)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
DECLARE
  new_tenant_id uuid;
  company_name_text text;
  phone_text text;
BEGIN
  -- Récupérer les métadonnées de l'utilisateur
  company_name_text := COALESCE(
    (NEW.raw_user_meta_data->>'company_name')::text,
    split_part(NEW.email, '@', 1),
    'Mon entreprise'
  );
  phone_text := COALESCE(
    (NEW.raw_user_meta_data->>'phone')::text,
    ''
  );

  -- Vérifier si le tenant n'existe pas déjà
  SELECT id INTO new_tenant_id
  FROM public.tenants
  WHERE user_id = NEW.id;

  -- Créer le tenant seulement s'il n'existe pas
  IF new_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      user_id,
      company_name,
      email,
      phone,
      subscription_status,
      subscription_plan,
      trial_ends_at
    ) VALUES (
      NEW.id,
      company_name_text,
      NEW.email,
      phone_text,
      'trial',
      'starter',
      (NOW() + INTERVAL '14 days')::timestamp
    ) RETURNING id INTO new_tenant_id;

    -- Créer les templates de conditions de paiement par défaut
    IF new_tenant_id IS NOT NULL THEN
      INSERT INTO public.templates_conditions_paiement (
        tenant_id,
        nom,
        description,
        montant_min,
        montant_max,
        pourcentage_acompte,
        delai_acompte,
        is_default
      ) VALUES
        (
          new_tenant_id,
          'Paiement comptant',
          '100% à la signature',
          0,
          1000,
          100,
          0,
          true
        ),
        (
          new_tenant_id,
          '30/70',
          '30% acompte, 70% livraison',
          1000,
          5000,
          30,
          0,
          false
        ),
        (
          new_tenant_id,
          '3 x 33%',
          '33% acompte, 33% mi-parcours, 34% livraison',
          5000,
          NULL,
          33,
          0,
          false
        )
      ON CONFLICT DO NOTHING;

      -- Créer la config LÉO par défaut
      INSERT INTO public.leo_config (
        tenant_id,
        nom,
        ton,
        horaire_debut,
        horaire_fin,
        jours_travail,
        reponse_auto_hors_horaires,
        message_hors_horaires
      ) VALUES (
        new_tenant_id,
        'LÉO',
        'informel',
        '08:00',
        '18:00',
        ARRAY['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']::text[],
        true,
        'Bonjour ! Je suis LÉO, l''assistant de ' || company_name_text || '. Nous sommes actuellement en dehors de nos horaires de travail. Je vous répondrai dès que possible !'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Fonction update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Fonction set_devis_pdf_url
CREATE OR REPLACE FUNCTION public.set_devis_pdf_url()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  -- Si le devis a un ID et pas encore de pdf_url, générer l'URL
  IF NEW.pdf_url IS NULL OR NEW.pdf_url = '' THEN
    NEW.pdf_url := 'https://mycharlie.fr/api/pdf/devis/' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Fonction set_facture_pdf_url
CREATE OR REPLACE FUNCTION public.set_facture_pdf_url()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  -- Si la facture a un ID et pas encore de pdf_url, générer l'URL
  IF NEW.pdf_url IS NULL OR NEW.pdf_url = '' THEN
    NEW.pdf_url := 'https://mycharlie.fr/api/pdf/facture/' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Fonction generate_devis_signature_token
CREATE OR REPLACE FUNCTION public.generate_devis_signature_token()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  -- Générer un token unique pour la signature si pas déjà présent
  IF NEW.signature_token IS NULL THEN
    NEW.signature_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Fonction update_oauth_connections_updated_at
CREATE OR REPLACE FUNCTION public.update_oauth_connections_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 8. Fonction update_notifications_updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 9. Fonction set_n8n_chat_tenant_id (si elle existe)
CREATE OR REPLACE FUNCTION public.set_n8n_chat_tenant_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
DECLARE
  extracted_tenant_id UUID;
BEGIN
  -- Extraire tenant_id du message JSON
  IF NEW.message IS NOT NULL THEN
    BEGIN
      extracted_tenant_id := (NEW.message->'context'->>'tenant_id')::UUID;
      IF extracted_tenant_id IS NOT NULL THEN
        NEW.tenant_id := extracted_tenant_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignorer les erreurs de parsing
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- 10. Fonction set_n8n_chat_histories_tenant_id (si elle existe)
CREATE OR REPLACE FUNCTION public.set_n8n_chat_histories_tenant_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
DECLARE
  extracted_tenant_id UUID;
BEGIN
  -- Extraire tenant_id du message JSON
  IF NEW.message IS NOT NULL THEN
    BEGIN
      extracted_tenant_id := (NEW.message->'context'->>'tenant_id')::UUID;
      IF extracted_tenant_id IS NOT NULL THEN
        NEW.tenant_id := extracted_tenant_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignorer les erreurs de parsing
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- 11. Fonction generate_session_id_from_context (si elle existe)
CREATE OR REPLACE FUNCTION public.generate_session_id_from_context()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  -- Générer session_id depuis context si pas présent
  IF NEW.session_id IS NULL AND NEW.message IS NOT NULL THEN
    BEGIN
      NEW.session_id := COALESCE(
        NEW.message->>'session_id',
        (NEW.message->'context'->>'whatsapp_phone'),
        gen_random_uuid()::text
      );
    EXCEPTION WHEN OTHERS THEN
      NEW.session_id := gen_random_uuid()::text;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- 12. Fonction init_templates_relances (si elle existe)
CREATE OR REPLACE FUNCTION public.init_templates_relances()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ✅ Fix sécurité
AS $$
BEGIN
  -- Créer templates relances par défaut pour nouveau tenant
  INSERT INTO public.templates_relances (
    tenant_id,
    type,
    r1_jours,
    r2_jours,
    r3_jours,
    active
  ) VALUES
    (NEW.id, 'devis_non_repondu', 7, 14, 30, true),
    (NEW.id, 'facture_avant_echeance', 3, 7, NULL, true),
    (NEW.id, 'facture_en_retard', 1, 7, 14, true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Commentaires
COMMENT ON FUNCTION public.create_journal_entry() IS 'Fonction trigger sécurisée pour créer automatiquement des entrées dans journal_dossier - Avec SET search_path';
COMMENT ON FUNCTION public.handle_new_user() IS 'Fonction trigger sécurisée pour créer tenant et données par défaut - Avec SET search_path';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Fonction trigger sécurisée pour mettre à jour updated_at - Avec SET search_path';
COMMENT ON FUNCTION public.set_devis_pdf_url() IS 'Fonction trigger sécurisée pour générer URL PDF devis - Avec SET search_path';
COMMENT ON FUNCTION public.set_facture_pdf_url() IS 'Fonction trigger sécurisée pour générer URL PDF facture - Avec SET search_path';
COMMENT ON FUNCTION public.generate_devis_signature_token() IS 'Fonction trigger sécurisée pour générer token signature - Avec SET search_path';
