-- Créer automatiquement un tenant et les données associées quand un utilisateur est créé dans auth.users

-- Fonction pour créer le tenant et les données par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur auth.users
-- Note: Le trigger doit être créé dans le schéma auth
-- Si vous ne pouvez pas créer le trigger directement sur auth.users,
-- utilisez une webhook Supabase ou créez le trigger via l'API

-- Alternative: Créer une fonction qui sera appelée par une webhook
-- Cette fonction peut être appelée depuis l'application ou une webhook Supabase

-- Pour créer le trigger, vous devez avoir les permissions nécessaires
-- sur le schéma auth. Si vous n'avez pas ces permissions, utilisez
-- une webhook Supabase configurée dans le dashboard Supabase.

-- Option 1: Trigger direct (nécessite des permissions élevées)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Option 2: Utiliser une webhook Supabase (recommandé)
-- Configurez une webhook dans le dashboard Supabase qui appelle cette fonction
-- Webhook URL: https://[votre-projet].supabase.co/functions/v1/handle-new-user
-- Event: auth.users INSERT

COMMENT ON FUNCTION public.handle_new_user() IS 'Crée automatiquement un tenant et les données par défaut lors de la création d''un utilisateur dans auth.users';
