-- Migration: Add columns for interactive relances in notifications_matin
-- Date: 2026-01-28
-- Description: Adds columns to store pending relances and track confirmation status

-- Add new columns to notifications_matin for interactive relance system
ALTER TABLE notifications_matin
ADD COLUMN IF NOT EXISTS relances_en_attente JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS confirmation_attendue BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS relances_executees BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS relances_annulees BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS relances_resultat JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS traite_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS message TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS envoyee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canal VARCHAR(50) DEFAULT 'whatsapp';

-- Create index for faster queries on pending confirmations
CREATE INDEX IF NOT EXISTS idx_notifications_matin_confirmation_attendue 
ON notifications_matin(tenant_id, confirmation_attendue) 
WHERE confirmation_attendue = TRUE;

-- Create index for recent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_matin_created_at 
ON notifications_matin(tenant_id, created_at DESC);

-- Add comment explaining the new columns
COMMENT ON COLUMN notifications_matin.relances_en_attente IS 'JSON containing pending relances: {factures_en_retard: [], factures_echeance: [], devis_a_relancer: []}';
COMMENT ON COLUMN notifications_matin.confirmation_attendue IS 'True if waiting for artisan response (oui/non) to send relances';
COMMENT ON COLUMN notifications_matin.relances_executees IS 'True if relances were sent after artisan confirmed';
COMMENT ON COLUMN notifications_matin.relances_annulees IS 'True if artisan declined to send relances';
COMMENT ON COLUMN notifications_matin.relances_resultat IS 'JSON containing results of sent relances';
COMMENT ON COLUMN notifications_matin.traite_at IS 'Timestamp when the notification was processed (confirmed or declined)';
