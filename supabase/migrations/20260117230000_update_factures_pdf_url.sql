-- Migration pour mettre à jour les pdf_url manquants dans la table factures
-- Le pdf_url sera généré automatiquement à partir de l'ID de la facture

-- Fonction pour générer l'URL du PDF
-- Note: L'URL de base doit être configurée selon l'environnement
-- En production: https://mycharlie.fr
-- En local: http://localhost:3000

UPDATE factures
SET pdf_url = CONCAT(
  CASE 
    WHEN current_setting('app.url', true) != '' 
    THEN current_setting('app.url', true)
    ELSE 'https://mycharlie.fr'  -- URL par défaut en production
  END,
  '/api/pdf/facture/',
  id::text
)
WHERE (pdf_url IS NULL OR pdf_url = '')
  AND id IS NOT NULL;

-- Créer un trigger pour mettre à jour automatiquement le pdf_url lors de la création d'une nouvelle facture
CREATE OR REPLACE FUNCTION set_facture_pdf_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Si pdf_url n'est pas défini, le générer automatiquement
  IF NEW.pdf_url IS NULL OR NEW.pdf_url = '' THEN
    NEW.pdf_url := CONCAT(
      COALESCE(
        current_setting('app.url', true),
        'https://mycharlie.fr'  -- URL par défaut en production
      ),
      '/api/pdf/facture/',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_set_facture_pdf_url ON factures;

-- Créer le trigger
CREATE TRIGGER trigger_set_facture_pdf_url
  BEFORE INSERT OR UPDATE ON factures
  FOR EACH ROW
  WHEN (NEW.pdf_url IS NULL OR NEW.pdf_url = '')
  EXECUTE FUNCTION set_facture_pdf_url();

-- Commentaire
COMMENT ON FUNCTION set_facture_pdf_url() IS 'Génère automatiquement le pdf_url pour une facture si non défini';
COMMENT ON TRIGGER trigger_set_facture_pdf_url ON factures IS 'Met à jour automatiquement le pdf_url lors de la création ou mise à jour d''une facture';
