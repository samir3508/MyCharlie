-- Migration: Optimiser les policies RLS pour éviter la réévaluation de auth.uid() à chaque ligne
-- Objectif: Remplacer auth.uid() par (SELECT auth.uid()) pour améliorer les performances
-- Date: 2026-01-23
-- Identifié par: Supabase Performance Advisors

-- 1. Table tenants - Policy "Users can view own tenant"
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));  -- ✅ Optimisé

-- 2. Table tenants - Policy "Users can update own tenant"
DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;
CREATE POLICY "Users can update own tenant" ON public.tenants
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()));  -- ✅ Optimisé

-- 3. Table tenants - Policy "Users can insert own tenant"
DROP POLICY IF EXISTS "Users can insert own tenant" ON public.tenants;
CREATE POLICY "Users can insert own tenant" ON public.tenants
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));  -- ✅ Optimisé

-- 4. Table oauth_connections - Policy "oauth_connections_tenant_isolation"
DROP POLICY IF EXISTS "oauth_connections_tenant_isolation" ON public.oauth_connections;
CREATE POLICY "oauth_connections_tenant_isolation" ON public.oauth_connections
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = (SELECT auth.uid())  -- ✅ Optimisé
    )
  );

-- 5. Table templates_relances - Policy "Users can manage their own templates_relances"
DROP POLICY IF EXISTS "Users can manage their own templates_relances" ON public.templates_relances;
CREATE POLICY "Users can manage their own templates_relances" ON public.templates_relances
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = (SELECT auth.uid())  -- ✅ Optimisé
    )
  );

-- 6. Table notifications - Policy "Users can view their tenant notifications"
DROP POLICY IF EXISTS "Users can view their tenant notifications" ON public.notifications;
CREATE POLICY "Users can view their tenant notifications" ON public.notifications
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = (SELECT auth.uid())  -- ✅ Optimisé
    )
  );

-- 7. Table notifications - Policy "Users can update their tenant notifications"
DROP POLICY IF EXISTS "Users can update their tenant notifications" ON public.notifications;
CREATE POLICY "Users can update their tenant notifications" ON public.notifications
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = (SELECT auth.uid())  -- ✅ Optimisé
    )
  );

-- Commentaires
COMMENT ON POLICY "Users can view own tenant" ON public.tenants IS 'Policy optimisée - auth.uid() évalué une seule fois par requête';
COMMENT ON POLICY "Users can update own tenant" ON public.tenants IS 'Policy optimisée - auth.uid() évalué une seule fois par requête';
COMMENT ON POLICY "Users can insert own tenant" ON public.tenants IS 'Policy optimisée - auth.uid() évalué une seule fois par requête';
COMMENT ON POLICY "oauth_connections_tenant_isolation" ON public.oauth_connections IS 'Policy optimisée - auth.uid() évalué une seule fois par requête';
COMMENT ON POLICY "Users can manage their own templates_relances" ON public.templates_relances IS 'Policy optimisée - auth.uid() évalué une seule fois par requête';
COMMENT ON POLICY "Users can view their tenant notifications" ON public.notifications IS 'Policy optimisée - auth.uid() évalué une seule fois par requête';
COMMENT ON POLICY "Users can update their tenant notifications" ON public.notifications IS 'Policy optimisée - auth.uid() évalué une seule fois par requête';
