/**
 * Schémas Zod partagés pour validation des entrées des Edge Functions
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>

 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>



 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

/**
 * Schéma de base pour tenant_id (obligatoire partout)
 */
export const TenantIdSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
})

/**
 * Schéma pour recherche client
 */
export const SearchClientRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
})

/**
 * Schéma pour récupérer un client par ID
 */
export const GetClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les clients
 */
export const ListClientsRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
})

/**
 * Schéma pour modifier un client
 */
export const UpdateClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un client
 */
export const DeleteClientRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
})

/**
 * Schéma pour création client
 */
export const CreateClientRequestSchema = TenantIdSchema.extend({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse_facturation: z.string().min(1, "L'adresse de facturation est requise"),
  adresse_chantier: z.string().nullable().optional(),
  type: z.enum(['particulier', 'professionnel']).default('particulier'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour création devis
 */
export const CreateDevisRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().min(1, "L'adresse de chantier est requise"),
  delai_execution: z.string().min(1, 'Le délai d\'exécution est requis'),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de devis
 */
export const LigneDevisSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de devis
 */
export const AddLigneDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  lignes: z.array(LigneDevisSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation devis
 */
export const FinalizeDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi devis
 */
export const SendDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer un devis par ID
 */
export const GetDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les devis
 */
export const ListDevisRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'expire']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier un devis
 */
export const UpdateDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adresse_chantier: z.string().nullable().optional(),
  delai_execution: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer un devis
 */
export const DeleteDevisRequestSchema = TenantIdSchema.extend({
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de devis
 */
export const UpdateLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de devis
 */
export const DeleteLigneDevisRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour création facture
 */
export const CreateFactureRequestSchema = TenantIdSchema.extend({
  client_id: z.string().uuid('Le client_id doit être un UUID valide'),
  devis_id: z.string().uuid('Le devis_id doit être un UUID valide').nullable().optional(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_emission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour une ligne de facture (identique aux lignes de devis)
 */
export const LigneFactureSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive'),
  unite: z.string().min(1, "L'unité est requise"),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul'),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
})

/**
 * Schéma pour ajout de lignes de facture
 */
export const AddLigneFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  lignes: z.array(LigneFactureSchema).min(1, 'Au moins une ligne est requise'),
})

/**
 * Schéma pour finalisation facture
 */
export const FinalizeFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour envoi facture
 */
export const SendFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour marquer facture comme payée
 */
export const MarkFacturePaidRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  date_paiement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour envoi relance
 */
export const SendRelanceRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  method: z.enum(['email', 'whatsapp']),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
})

/**
 * Schéma pour récupérer une facture par ID
 */
export const GetFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour lister les factures
 */
export const ListFacturesRequestSchema = TenantIdSchema.extend({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard']).optional(),
  client_id: z.string().uuid('Le client_id doit être un UUID valide').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
})

/**
 * Schéma pour modifier une facture
 */
export const UpdateFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date_echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schéma pour supprimer une facture
 */
export const DeleteFactureRequestSchema = TenantIdSchema.extend({
  facture_id: z.string().uuid('Le facture_id doit être un UUID valide'),
})

/**
 * Schéma pour modifier une ligne de facture
 */
export const UpdateLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
  designation: z.string().min(1, 'La désignation est requise').optional(),
  description_detaillee: z.string().nullable().optional(),
  quantite: z.number().positive('La quantité doit être positive').optional(),
  unite: z.string().min(1, "L'unité est requise").optional(),
  prix_unitaire_ht: z.number().nonnegative('Le prix unitaire HT doit être positif ou nul').optional(),
  tva_pct: z.number().int().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').optional(),
})

/**
 * Schéma pour supprimer une ligne de facture
 */
export const DeleteLigneFactureRequestSchema = TenantIdSchema.extend({
  ligne_id: z.string().uuid('Le ligne_id doit être un UUID valide'),
})

/**
 * Schéma pour statistiques dashboard
 */
export const StatsDashboardRequestSchema = TenantIdSchema.extend({
  period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('all'),
  include_advanced: z.boolean().optional().default(false),
})

/**
 * Schéma pour recherche globale
 */
export const SearchGlobalRequestSchema = TenantIdSchema.extend({
  query: z.string().min(1, 'La requête de recherche est requise'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

// Types TypeScript dérivés
export type SearchClientRequest = z.infer<typeof SearchClientRequestSchema>
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>
export type GetClientRequest = z.infer<typeof GetClientRequestSchema>
export type ListClientsRequest = z.infer<typeof ListClientsRequestSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>
export type DeleteClientRequest = z.infer<typeof DeleteClientRequestSchema>

export type CreateDevisRequest = z.infer<typeof CreateDevisRequestSchema>
export type GetDevisRequest = z.infer<typeof GetDevisRequestSchema>
export type ListDevisRequest = z.infer<typeof ListDevisRequestSchema>
export type UpdateDevisRequest = z.infer<typeof UpdateDevisRequestSchema>
export type DeleteDevisRequest = z.infer<typeof DeleteDevisRequestSchema>
export type AddLigneDevisRequest = z.infer<typeof AddLigneDevisRequestSchema>
export type UpdateLigneDevisRequest = z.infer<typeof UpdateLigneDevisRequestSchema>
export type DeleteLigneDevisRequest = z.infer<typeof DeleteLigneDevisRequestSchema>
export type FinalizeDevisRequest = z.infer<typeof FinalizeDevisRequestSchema>
export type SendDevisRequest = z.infer<typeof SendDevisRequestSchema>
export type LigneDevis = z.infer<typeof LigneDevisSchema>

export type CreateFactureRequest = z.infer<typeof CreateFactureRequestSchema>
export type GetFactureRequest = z.infer<typeof GetFactureRequestSchema>
export type ListFacturesRequest = z.infer<typeof ListFacturesRequestSchema>
export type UpdateFactureRequest = z.infer<typeof UpdateFactureRequestSchema>
export type DeleteFactureRequest = z.infer<typeof DeleteFactureRequestSchema>
export type AddLigneFactureRequest = z.infer<typeof AddLigneFactureRequestSchema>
export type UpdateLigneFactureRequest = z.infer<typeof UpdateLigneFactureRequestSchema>
export type DeleteLigneFactureRequest = z.infer<typeof DeleteLigneFactureRequestSchema>
export type FinalizeFactureRequest = z.infer<typeof FinalizeFactureRequestSchema>
export type SendFactureRequest = z.infer<typeof SendFactureRequestSchema>
export type MarkFacturePaidRequest = z.infer<typeof MarkFacturePaidRequestSchema>
export type SendRelanceRequest = z.infer<typeof SendRelanceRequestSchema>
export type LigneFacture = z.infer<typeof LigneFactureSchema>

export type StatsDashboardRequest = z.infer<typeof StatsDashboardRequestSchema>
export type SearchGlobalRequest = z.infer<typeof SearchGlobalRequestSchema>