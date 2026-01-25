-- Migration: Ajouter des index sur les foreign keys manquantes
-- Objectif: Améliorer les performances des JOINs et contraintes FK
-- Date: 2026-01-23
-- Identifié par: Supabase Performance Advisors

-- 1. conversation_state.tenant_id
CREATE INDEX IF NOT EXISTS idx_conversation_state_tenant_id 
  ON public.conversation_state(tenant_id);

-- 2. devis.template_condition_paiement_id
CREATE INDEX IF NOT EXISTS idx_devis_template_condition_paiement_id 
  ON public.devis(template_condition_paiement_id);

-- 3. factures.devis_id
CREATE INDEX IF NOT EXISTS idx_factures_devis_id 
  ON public.factures(devis_id);

-- 4. factures.dossier_id
CREATE INDEX IF NOT EXISTS idx_factures_dossier_id 
  ON public.factures(dossier_id);

-- 5. fiches_visite.rdv_id
CREATE INDEX IF NOT EXISTS idx_fiches_visite_rdv_id 
  ON public.fiches_visite(rdv_id);

-- 6. fiches_visite.tenant_id
CREATE INDEX IF NOT EXISTS idx_fiches_visite_tenant_id 
  ON public.fiches_visite(tenant_id);

-- 7. journal_dossier.tenant_id
CREATE INDEX IF NOT EXISTS idx_journal_dossier_tenant_id 
  ON public.journal_dossier(tenant_id);

-- 8. rdv.client_id
CREATE INDEX IF NOT EXISTS idx_rdv_client_id 
  ON public.rdv(client_id);

-- 9. relances.tenant_id
CREATE INDEX IF NOT EXISTS idx_relances_tenant_id 
  ON public.relances(tenant_id);

-- 10. templates_conditions_paiement.tenant_id
CREATE INDEX IF NOT EXISTS idx_templates_conditions_paiement_tenant_id 
  ON public.templates_conditions_paiement(tenant_id);

-- Index supplémentaires pour les colonnes de dates (pour relances)
CREATE INDEX IF NOT EXISTS idx_devis_date_envoi 
  ON public.devis(date_envoi) WHERE date_envoi IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_factures_date_echeance 
  ON public.factures(date_echeance) WHERE date_echeance IS NOT NULL;

-- Commentaires
COMMENT ON INDEX idx_conversation_state_tenant_id IS 'Index FK pour améliorer les JOINs sur tenant_id';
COMMENT ON INDEX idx_devis_template_condition_paiement_id IS 'Index FK pour améliorer les JOINs sur template_condition_paiement_id';
COMMENT ON INDEX idx_factures_devis_id IS 'Index FK pour améliorer les JOINs sur devis_id';
COMMENT ON INDEX idx_factures_dossier_id IS 'Index FK pour améliorer les JOINs sur dossier_id';
COMMENT ON INDEX idx_fiches_visite_rdv_id IS 'Index FK pour améliorer les JOINs sur rdv_id';
COMMENT ON INDEX idx_fiches_visite_tenant_id IS 'Index FK pour améliorer les JOINs sur tenant_id';
COMMENT ON INDEX idx_journal_dossier_tenant_id IS 'Index FK pour améliorer les JOINs sur tenant_id';
COMMENT ON INDEX idx_rdv_client_id IS 'Index FK pour améliorer les JOINs sur client_id';
COMMENT ON INDEX idx_relances_tenant_id IS 'Index FK pour améliorer les JOINs sur tenant_id';
COMMENT ON INDEX idx_templates_conditions_paiement_tenant_id IS 'Index FK pour améliorer les JOINs sur tenant_id';
COMMENT ON INDEX idx_devis_date_envoi IS 'Index pour recherches rapides sur date_envoi (relances)';
COMMENT ON INDEX idx_factures_date_echeance IS 'Index pour recherches rapides sur date_echeance (relances)';
