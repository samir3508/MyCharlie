-- Migration pour créer la table oauth_connections
-- Cette table stocke les connexions OAuth (Gmail, etc.) pour chaque tenant

CREATE TABLE IF NOT EXISTS public.oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'microsoft', etc.
  service TEXT NOT NULL, -- 'gmail', 'outlook', etc.
  email TEXT NOT NULL, -- Email du compte connecté
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un seul compte actif par provider/service/tenant
  CONSTRAINT oauth_connections_unique_active 
    UNIQUE (tenant_id, provider, service, is_active) 
    WHERE is_active = true
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_oauth_connections_tenant_provider_service 
  ON public.oauth_connections(tenant_id, provider, service, is_active);

-- Index pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_oauth_connections_email 
  ON public.oauth_connections(email);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_oauth_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_oauth_connections_updated_at
  BEFORE UPDATE ON public.oauth_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_connections_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres connexions OAuth
CREATE POLICY oauth_connections_tenant_isolation ON public.oauth_connections
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE public.oauth_connections IS 'Stocke les connexions OAuth (Gmail, etc.) pour chaque tenant';
COMMENT ON COLUMN public.oauth_connections.provider IS 'Fournisseur OAuth (google, microsoft, etc.)';
COMMENT ON COLUMN public.oauth_connections.service IS 'Service spécifique (gmail, outlook, etc.)';
COMMENT ON COLUMN public.oauth_connections.access_token IS 'Token d''accès OAuth (chiffré en production)';
COMMENT ON COLUMN public.oauth_connections.refresh_token IS 'Token de rafraîchissement OAuth (chiffré en production)';
COMMENT ON COLUMN public.oauth_connections.expires_at IS 'Date d''expiration du token d''accès';
COMMENT ON COLUMN public.oauth_connections.is_active IS 'Indique si la connexion est active et peut être utilisée';
