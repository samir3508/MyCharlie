export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          user_id: string
          company_name: string
          siret: string | null
          address: string | null
          phone: string | null
          whatsapp_phone: string | null
          email: string | null
          logo_url: string | null
          tva_intra: string | null
          iban: string | null
          bic: string | null
          legal_mentions: string | null
          subscription_status: 'trial' | 'active' | 'cancelled'
          subscription_plan: 'starter' | 'pro' | 'enterprise'
          trial_ends_at: string | null
          n8n_workflow_id: string | null
          n8n_webhook_url: string | null
          whatsapp_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          siret?: string | null
          address?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          logo_url?: string | null
          tva_intra?: string | null
          iban?: string | null
          bic?: string | null
          legal_mentions?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled'
          subscription_plan?: 'starter' | 'pro' | 'enterprise'
          trial_ends_at?: string | null
          n8n_workflow_id?: string | null
          n8n_webhook_url?: string | null
          whatsapp_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          siret?: string | null
          address?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          logo_url?: string | null
          tva_intra?: string | null
          iban?: string | null
          bic?: string | null
          legal_mentions?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled'
          subscription_plan?: 'starter' | 'pro' | 'enterprise'
          trial_ends_at?: string | null
          n8n_workflow_id?: string | null
          n8n_webhook_url?: string | null
          whatsapp_connected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          prenom: string
          nom_complet: string
          email: string | null
          telephone: string | null
          adresse_facturation: string | null
          adresse_chantier: string | null
          type: 'particulier' | 'professionnel'
          nb_devis: number
          nb_factures: number
          ca_total: number
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom: string
          prenom: string
          email?: string | null
          telephone?: string | null
          adresse_facturation?: string | null
          adresse_chantier?: string | null
          type?: 'particulier' | 'professionnel'
          nb_devis?: number
          nb_factures?: number
          ca_total?: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          prenom?: string
          email?: string | null
          telephone?: string | null
          adresse_facturation?: string | null
          adresse_chantier?: string | null
          type?: 'particulier' | 'professionnel'
          nb_devis?: number
          nb_factures?: number
          ca_total?: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      devis: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          numero: string
          titre: string | null
          description: string | null
          adresse_chantier: string | null
          delai_execution: string | null
          montant_ht: number
          montant_tva: number
          montant_ttc: number
          statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
          template_condition_paiement_id: string | null
          date_creation: string
          date_envoi: string | null
          date_acceptation: string | null
          date_expiration: string | null
          pdf_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          numero: string
          titre?: string | null
          description?: string | null
          adresse_chantier?: string | null
          delai_execution?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
          template_condition_paiement_id?: string | null
          date_creation?: string
          date_envoi?: string | null
          date_acceptation?: string | null
          date_expiration?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          numero?: string
          titre?: string | null
          description?: string | null
          adresse_chantier?: string | null
          delai_execution?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
          template_condition_paiement_id?: string | null
          date_creation?: string
          date_envoi?: string | null
          date_acceptation?: string | null
          date_expiration?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lignes_devis: {
        Row: {
          id: string
          devis_id: string
          ordre: number
          designation: string
          description_detaillee: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct: number
          total_ht: number
          total_tva: number
          total_ttc: number
          created_at: string
        }
        Insert: {
          id?: string
          devis_id: string
          ordre: number
          designation: string
          description_detaillee?: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct?: number
          created_at?: string
        }
        Update: {
          id?: string
          devis_id?: string
          ordre?: number
          designation?: string
          description_detaillee?: string | null
          quantite?: number
          unite?: string
          prix_unitaire_ht?: number
          tva_pct?: number
          created_at?: string
        }
      }
      factures: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          devis_id: string | null
          numero: string
          titre: string | null
          description: string | null
          montant_ht: number
          montant_tva: number
          montant_ttc: number
          statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
          date_emission: string
          date_echeance: string | null
          date_paiement: string | null
          pdf_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          devis_id?: string | null
          numero: string
          titre?: string | null
          description?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
          date_emission?: string
          date_echeance?: string | null
          date_paiement?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          devis_id?: string | null
          numero?: string
          titre?: string | null
          description?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
          date_emission?: string
          date_echeance?: string | null
          date_paiement?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lignes_factures: {
        Row: {
          id: string
          facture_id: string
          ordre: number
          designation: string
          description_detaillee: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct: number
          total_ht: number
          total_tva: number
          total_ttc: number
          created_at: string
        }
        Insert: {
          id?: string
          facture_id: string
          ordre: number
          designation: string
          description_detaillee?: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct?: number
          created_at?: string
        }
        Update: {
          id?: string
          facture_id?: string
          ordre?: number
          designation?: string
          description_detaillee?: string | null
          quantite?: number
          unite?: string
          prix_unitaire_ht?: number
          tva_pct?: number
          created_at?: string
        }
      }
      relances: {
        Row: {
          id: string
          tenant_id: string
          facture_id: string
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau: number
          statut: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue: string
          date_envoi: string | null
          objet: string | null
          message: string | null
          erreur: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          facture_id: string
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau: number
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue: string
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          facture_id?: string
          type?: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau?: number
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue?: string
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string
        }
      }
      leo_config: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          ton: 'formel' | 'informel' | 'amical'
          instructions_specifiques: string | null
          horaire_debut: string
          horaire_fin: string
          jours_travail: string[]
          reponse_auto_hors_horaires: boolean
          message_hors_horaires: string | null
          template_devis_cree: string | null
          template_facture_envoyee: string | null
          template_relance_paiement: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom?: string
          ton?: 'formel' | 'informel' | 'amical'
          instructions_specifiques?: string | null
          horaire_debut?: string
          horaire_fin?: string
          jours_travail?: string[]
          reponse_auto_hors_horaires?: boolean
          message_hors_horaires?: string | null
          template_devis_cree?: string | null
          template_facture_envoyee?: string | null
          template_relance_paiement?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          ton?: 'formel' | 'informel' | 'amical'
          instructions_specifiques?: string | null
          horaire_debut?: string
          horaire_fin?: string
          jours_travail?: string[]
          reponse_auto_hors_horaires?: boolean
          message_hors_horaires?: string | null
          template_devis_cree?: string | null
          template_facture_envoyee?: string | null
          template_relance_paiement?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          tenant_id: string
          client_id: string | null
          whatsapp_phone: string | null
          last_message: string | null
          last_message_at: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id?: string | null
          whatsapp_phone?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string | null
          whatsapp_phone?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversation_state: {
        Row: {
          id: string
          conversation_id: string
          tenant_id: string
          current_step: 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | null
          action_type: 'create_devis' | 'create_facture' | 'search_client' | null
          collected_data: Json
          missing_fields: string[]
          last_user_message: string | null
          last_leo_response: string | null
          pending_confirmation: boolean
          confirmation_type: 'create_devis' | 'create_facture' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          tenant_id: string
          current_step?: 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | null
          action_type?: 'create_devis' | 'create_facture' | 'search_client' | null
          collected_data?: Json
          missing_fields?: string[]
          last_user_message?: string | null
          last_leo_response?: string | null
          pending_confirmation?: boolean
          confirmation_type?: 'create_devis' | 'create_facture' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          tenant_id?: string
          current_step?: 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | null
          action_type?: 'create_devis' | 'create_facture' | 'search_client' | null
          collected_data?: Json
          missing_fields?: string[]
          last_user_message?: string | null
          last_leo_response?: string | null
          pending_confirmation?: boolean
          confirmation_type?: 'create_devis' | 'create_facture' | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url: string | null
          media_type: string | null
          statut: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url?: string | null
          media_type?: string | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          direction?: 'inbound' | 'outbound'
          message?: string
          media_url?: string | null
          media_type?: string | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string
        }
      }
      templates_conditions_paiement: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          description: string | null
          montant_min: number
          montant_max: number | null
          pourcentage_acompte: number | null
          pourcentage_intermediaire: number | null
          pourcentage_solde: number | null
          delai_acompte: number
          delai_intermediaire: number | null
          delai_solde: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom: string
          description?: string | null
          montant_min?: number
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number
          delai_intermediaire?: number | null
          delai_solde?: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          description?: string | null
          montant_min?: number
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number
          delai_intermediaire?: number | null
          delai_solde?: number
          is_default?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_devis_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_facture_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient aliases
export type Tenant = Tables<'tenants'>
export type Client = Tables<'clients'>
export type Devis = Tables<'devis'>
export type LigneDevis = Tables<'lignes_devis'>
export type Facture = Tables<'factures'>
export type LigneFacture = Tables<'lignes_factures'>
export type Relance = Tables<'relances'>
export type LeoConfig = Tables<'leo_config'>
export type Conversation = Tables<'conversations'>
export type ConversationState = Tables<'conversation_state'>
export type Message = Tables<'messages'>
export type TemplateConditionPaiement = Tables<'templates_conditions_paiement'>
export const __DATABASE_TS_JUNK__ = `
          description_detaillee: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct: number
          total_ht: number
          total_tva: number
          total_ttc: number
          created_at: string
        }
        Insert: {
          id?: string
          facture_id: string
          ordre: number
          designation: string
          description_detaillee?: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct?: number
          created_at?: string
        }
        Update: {
          id?: string
          facture_id?: string
          ordre?: number
          designation?: string
          description_detaillee?: string | null
          quantite?: number
          unite?: string
          prix_unitaire_ht?: number
          tva_pct?: number
          created_at?: string
        }
      }
      relances: {
        Row: {
          id: string
          tenant_id: string
          facture_id: string
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau: number
          statut: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue: string
          date_envoi: string | null
          objet: string | null
          message: string | null
          erreur: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          facture_id: string
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau: number
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue: string
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          facture_id?: string
          type?: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau?: number
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue?: string
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string
        }
      }
      leo_config: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          ton: 'formel' | 'informel' | 'amical'
          instructions_specifiques: string | null
          horaire_debut: string
          horaire_fin: string
          jours_travail: string[]
          reponse_auto_hors_horaires: boolean
          message_hors_horaires: string | null
          template_devis_cree: string | null
          template_facture_envoyee: string | null
          template_relance_paiement: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom?: string
          ton?: 'formel' | 'informel' | 'amical'
          instructions_specifiques?: string | null
          horaire_debut?: string
          horaire_fin?: string
          jours_travail?: string[]
          reponse_auto_hors_horaires?: boolean
          message_hors_horaires?: string | null
          template_devis_cree?: string | null
          template_facture_envoyee?: string | null
          template_relance_paiement?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          ton?: 'formel' | 'informel' | 'amical'
          instructions_specifiques?: string | null
          horaire_debut?: string
          horaire_fin?: string
          jours_travail?: string[]
          reponse_auto_hors_horaires?: boolean
          message_hors_horaires?: string | null
          template_devis_cree?: string | null
          template_facture_envoyee?: string | null
          template_relance_paiement?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          tenant_id: string
          client_id: string | null
          whatsapp_phone: string | null
          last_message: string | null
          last_message_at: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id?: string | null
          whatsapp_phone?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string | null
          whatsapp_phone?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversation_state: {
        Row: {
          id: string
          conversation_id: string
          tenant_id: string
          current_step: 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | null
          action_type: 'create_devis' | 'create_facture' | 'search_client' | null
          collected_data: Json
          missing_fields: string[]
          last_user_message: string | null
          last_leo_response: string | null
          pending_confirmation: boolean
          confirmation_type: 'create_devis' | 'create_facture' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          tenant_id: string
          current_step?: 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | null
          action_type?: 'create_devis' | 'create_facture' | 'search_client' | null
          collected_data?: Json
          missing_fields?: string[]
          last_user_message?: string | null
          last_leo_response?: string | null
          pending_confirmation?: boolean
          confirmation_type?: 'create_devis' | 'create_facture' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          tenant_id?: string
          current_step?: 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | null
          action_type?: 'create_devis' | 'create_facture' | 'search_client' | null
          collected_data?: Json
          missing_fields?: string[]
          last_user_message?: string | null
          last_leo_response?: string | null
          pending_confirmation?: boolean
          confirmation_type?: 'create_devis' | 'create_facture' | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url: string | null
          media_type: string | null
          statut: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url?: string | null
          media_type?: string | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          direction?: 'inbound' | 'outbound'
          message?: string
          media_url?: string | null
          media_type?: string | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string
        }
      }
      templates_conditions_paiement: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          description: string | null
          montant_min: number
          montant_max: number | null
          pourcentage_acompte: number | null
          pourcentage_intermediaire: number | null
          pourcentage_solde: number | null
          delai_acompte: number
          delai_intermediaire: number | null
          delai_solde: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom: string
          description?: string | null
          montant_min?: number
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number
          delai_intermediaire?: number | null
          delai_solde?: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          description?: string | null
          montant_min?: number
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number
          delai_intermediaire?: number | null
          delai_solde?: number
          is_default?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_devis_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_facture_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient aliases
export type Tenant = Tables<'tenants'>
export type Client = Tables<'clients'>
export type Devis = Tables<'devis'>
export type LigneDevis = Tables<'lignes_devis'>
export type Facture = Tables<'factures'>
export type LigneFacture = Tables<'lignes_factures'>
export type Relance = Tables<'relances'>
export type LeoConfig = Tables<'leo_config'>
export type Conversation = Tables<'conversations'>
export type ConversationState = Tables<'conversation_state'>
export type Message = Tables<'messages'>
export type TemplateConditionPaiement = Tables<'templates_conditions_paiement'>



  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          user_id: string
          company_name: string
          siret: string | null
          address: string | null
          phone: string | null
          whatsapp_phone: string | null
          email: string | null
          logo_url: string | null
          tva_intra: string | null
          iban: string | null
          bic: string | null
          legal_mentions: string | null
          subscription_status: 'trial' | 'active' | 'cancelled'
          subscription_plan: 'starter' | 'pro' | 'enterprise'
          trial_ends_at: string | null
          n8n_workflow_id: string | null
          n8n_webhook_url: string | null
          whatsapp_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          siret?: string | null
          address?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          logo_url?: string | null
          tva_intra?: string | null
          iban?: string | null
          bic?: string | null
          legal_mentions?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled'
          subscription_plan?: 'starter' | 'pro' | 'enterprise'
          trial_ends_at?: string | null
          n8n_workflow_id?: string | null
          n8n_webhook_url?: string | null
          whatsapp_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          siret?: string | null
          address?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          logo_url?: string | null
          tva_intra?: string | null
          iban?: string | null
          bic?: string | null
          legal_mentions?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled'
          subscription_plan?: 'starter' | 'pro' | 'enterprise'
          trial_ends_at?: string | null
          n8n_workflow_id?: string | null
          n8n_webhook_url?: string | null
          whatsapp_connected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          prenom: string
          nom_complet: string
          email: string | null
          telephone: string | null
          adresse_facturation: string | null
          adresse_chantier: string | null
          type: 'particulier' | 'professionnel'
          nb_devis: number
          nb_factures: number
          ca_total: number
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom: string
          prenom: string
          email?: string | null
          telephone?: string | null
          adresse_facturation?: string | null
          adresse_chantier?: string | null
          type?: 'particulier' | 'professionnel'
          nb_devis?: number
          nb_factures?: number
          ca_total?: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          prenom?: string
          email?: string | null
          telephone?: string | null
          adresse_facturation?: string | null
          adresse_chantier?: string | null
          type?: 'particulier' | 'professionnel'
          nb_devis?: number
          nb_factures?: number
          ca_total?: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      devis: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          numero: string
          titre: string | null
          description: string | null
          adresse_chantier: string | null
          delai_execution: string | null
          montant_ht: number
          montant_tva: number
          montant_ttc: number
          statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
          template_condition_paiement_id: string | null
          date_creation: string
          date_envoi: string | null
          date_acceptation: string | null
          date_expiration: string | null
          pdf_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          numero: string
          titre?: string | null
          description?: string | null
          adresse_chantier?: string | null
          delai_execution?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
          template_condition_paiement_id?: string | null
          date_creation?: string
          date_envoi?: string | null
          date_acceptation?: string | null
          date_expiration?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          numero?: string
          titre?: string | null
          description?: string | null
          adresse_chantier?: string | null
          delai_execution?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
          template_condition_paiement_id?: string | null
          date_creation?: string
          date_envoi?: string | null
          date_acceptation?: string | null
          date_expiration?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lignes_devis: {
        Row: {
          id: string
          devis_id: string
          ordre: number
          designation: string
          description_detaillee: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct: number
          total_ht: number
          total_tva: number
          total_ttc: number
          created_at: string
        }
        Insert: {
          id?: string
          devis_id: string
          ordre: number
          designation: string
          description_detaillee?: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct?: number
          created_at?: string
        }
        Update: {
          id?: string
          devis_id?: string
          ordre?: number
          designation?: string
          description_detaillee?: string | null
          quantite?: number
          unite?: string
          prix_unitaire_ht?: number
          tva_pct?: number
          created_at?: string
        }
      }
      factures: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          devis_id: string | null
          numero: string
          titre: string | null
          description: string | null
          montant_ht: number
          montant_tva: number
          montant_ttc: number
          statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
          date_emission: string
          date_echeance: string | null
          date_paiement: string | null
          pdf_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          devis_id?: string | null
          numero: string
          titre?: string | null
          description?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
          date_emission?: string
          date_echeance?: string | null
          date_paiement?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          devis_id?: string | null
          numero?: string
          titre?: string | null
          description?: string | null
          montant_ht?: number
          montant_tva?: number
          montant_ttc?: number
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
          date_emission?: string
          date_echeance?: string | null
          date_paiement?: string | null
          pdf_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lignes_factures: {
        Row: {
          id: string
          facture_id: string
          ordre: number
          designation: string
          description_detaillee: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct: number
          total_ht: number
          total_tva: number
          total_ttc: number
          created_at: string
        }
        Insert: {
          id?: string
          facture_id: string
          ordre: number
          designation: string
          description_detaillee?: string | null
          quantite: number
          unite: string
          prix_unitaire_ht: number
          tva_pct?: number
          created_at?: string
        }
        Update: {
          id?: string
          facture_id?: string
          ordre?: number
          designation?: string
          description_detaillee?: string | null
          quantite?: number
          unite?: string
          prix_unitaire_ht?: number
          tva_pct?: number
          created_at?: string
        }
      }
      relances: {
        Row: {
          id: string
          tenant_id: string
          facture_id: string
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau: number
          statut: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue: string
          date_envoi: string | null
          objet: string | null
          message: string | null
          erreur: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          facture_id: string
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau: number
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue: string
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          facture_id?: string
          type?: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau?: number
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue'
          date_prevue?: string
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string
        }
      }
      leo_config: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          ton: 'formel' | 'informel' | 'amical'
          instructions_specifiques: string | null
          horaire_debut: string
          horaire_fin: string
          jours_travail: string[]
          reponse_auto_hors_horaires: boolean
          message_hors_horaires: string | null
          template_devis_cree: string | null
          template_facture_envoyee: string | null
          template_relance_paiement: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom?: string
          ton?: 'formel' | 'informel' | 'amical'
          instructions_specifiques?: string | null
          horaire_debut?: string
          horaire_fin?: string
          jours_travail?: string[]
          reponse_auto_hors_horaires?: boolean
          message_hors_horaires?: string | null
          template_devis_cree?: string | null
          template_facture_envoyee?: string | null
          template_relance_paiement?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          ton?: 'formel' | 'informel' | 'amical'
          instructions_specifiques?: string | null
          horaire_debut?: string
          horaire_fin?: string
          jours_travail?: string[]
          reponse_auto_hors_horaires?: boolean
          message_hors_horaires?: string | null
          template_devis_cree?: string | null
          template_facture_envoyee?: string | null
          template_relance_paiement?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          tenant_id: string
          client_id: string | null
          whatsapp_phone: string | null
          last_message: string | null
          last_message_at: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id?: string | null
          whatsapp_phone?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string | null
          whatsapp_phone?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url: string | null
          media_type: string | null
          statut: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url?: string | null
          media_type?: string | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          direction?: 'inbound' | 'outbound'
          message?: string
          media_url?: string | null
          media_type?: string | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string
        }
      }
      templates_conditions_paiement: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          description: string | null
          montant_min: number
          montant_max: number | null
          pourcentage_acompte: number | null
          pourcentage_intermediaire: number | null
          pourcentage_solde: number | null
          delai_acompte: number
          delai_intermediaire: number | null
          delai_solde: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nom: string
          description?: string | null
          montant_min?: number
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number
          delai_intermediaire?: number | null
          delai_solde?: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          description?: string | null
          montant_min?: number
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number
          delai_intermediaire?: number | null
          delai_solde?: number
          is_default?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_devis_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_facture_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient aliases
export type Tenant = Tables<'tenants'>
export type Client = Tables<'clients'>
export type Devis = Tables<'devis'>
export type LigneDevis = Tables<'lignes_devis'>
export type Facture = Tables<'factures'>
export type LigneFacture = Tables<'lignes_factures'>
export type Relance = Tables<'relances'>
export type LeoConfig = Tables<'leo_config'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type TemplateConditionPaiement = Tables<'templates_conditions_paiement'>

`;
