-- Migration: Corriger la policy notifications trop permissive
-- Objectif: Remplacer WITH CHECK (true) par une vérification tenant_id correcte
-- Date: 2026-01-23
-- Identifié par: Supabase Security Advisors

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Créer une nouvelle policy sécurisée
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

-- Commentaire
COMMENT ON POLICY "Service role can insert notifications" ON public.notifications IS 'Policy corrigée - Vérifie que tenant_id appartient à l''utilisateur authentifié';

-- Vérifier que toutes les policies notifications sont correctes
-- Liste des policies actuelles :
-- 1. "Service role can insert notifications" (corrigée ci-dessus)
-- 2. "Users can view their tenant notifications" (à vérifier)
-- 3. "Users can update their tenant notifications" (à vérifier)

-- Note: Les autres policies semblent correctes d'après l'audit MCP
-- Si d'autres policies sont trop permissives, les corriger ici
