'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Send, 
  Calendar,
  Euro,
  Bot
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export type ProchaineActionSummary = {
  action: string
  description: string
  urgence: 'urgente' | 'haute' | 'normale'
  dateLimite: Date | null
  icon: React.ReactNode
  couleur: string
  actionButton?: { label: string; href: string }
}

/** Logique partagée : résumé prochaine action pour liste + détail */
export function getProchaineActionSummary(dossier: any): ProchaineActionSummary | null {
  return calculerProchaineAction(dossier)
}

function calculerProchaineAction(dossier: any): ProchaineActionSummary | null {
    const statut = dossier.statut
    const rdv = (dossier.rdv as any[]) || []
    const devis = (dossier.devis as any[]) || []
    const factures = (dossier.factures as any[]) || []
    
    // Vérifier les factures en retard
    const facturesEnRetard = factures.filter((f: any) => {
      if (f.statut === 'en_retard') return true
      if (f.statut === 'envoyee' && f.date_echeance) {
        const echeance = new Date(f.date_echeance)
        return echeance < new Date() && f.statut !== 'payee'
      }
      return false
    })
    
    if (facturesEnRetard.length > 0) {
      const facture = facturesEnRetard[0]
      const echeance = facture.date_echeance ? new Date(facture.date_echeance) : null
      return {
        action: 'Relancer le paiement',
        description: `Facture ${facture.numero} en retard${echeance ? ` depuis ${formatDistanceToNow(echeance, { addSuffix: true, locale: fr })}` : ''}`,
        urgence: 'urgente' as const,
        dateLimite: echeance,
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        couleur: 'bg-red-500/10 border-red-500/30 text-red-400',
        actionButton: {
          label: 'Relancer',
          href: `/factures/${facture.id}?action=relancer`
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITÉ 0 : Gestion des phases chantier (après devis accepté)
    // ═══════════════════════════════════════════════════════════════════════
    const devisSigne = devis.find((d: any) => d.statut === 'accepte' || d.statut === 'signe')
    
    // Si devis signé et statut = signe → Démarrer le chantier
    if (devisSigne && statut === 'signe') {
      return {
        action: 'Démarrer le chantier',
        description: `Devis ${devisSigne.numero || devisSigne.id.substring(0, 8)} signé, démarrer les travaux`,
        urgence: 'haute' as const,
        dateLimite: null,
        icon: <FileText className="w-5 h-5 text-blue-400" />,
        couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        actionButton: {
          label: 'Démarrer chantier',
          href: `/dossiers/${dossier.id}?action=demarrer_chantier`
        }
      }
    }
    
    // Si chantier en cours → Terminer le chantier
    if (statut === 'chantier_en_cours') {
      return {
        action: 'Terminer le chantier',
        description: 'Travaux en cours, terminer le chantier pour créer la facture',
        urgence: 'normale' as const,
        dateLimite: null,
        icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
        couleur: 'bg-green-500/10 border-green-500/30 text-green-400',
        actionButton: {
          label: 'Terminer chantier',
          href: `/dossiers/${dossier.id}?action=terminer_chantier`
        }
      }
    }
    
    // Si chantier terminé et pas de facture → Créer la facture
    if (statut === 'chantier_termine' && factures.length === 0) {
      return {
        action: 'Créer la facture',
        description: `Chantier terminé, créer la facture${devisSigne ? ` pour le devis ${devisSigne.numero || devisSigne.id.substring(0, 8)}` : ''}`,
        urgence: 'haute' as const,
        dateLimite: null,
        icon: <Euro className="w-5 h-5 text-orange-400" />,
        couleur: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
        actionButton: {
          label: 'Créer facture',
          href: devisSigne ? `/factures/nouveau?devis_id=${devisSigne.id}` : `/factures/nouveau?dossier_id=${dossier.id}`
        }
      }
    }
    
    // Si devis signé, chantier terminé ou facture déjà créée → Vérifier factures en retard
    // (Cette logique est déjà gérée plus haut avec facturesEnRetard)
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITÉ 1 : Visite réalisée (fiche de visite existe) → Créer devis
    // ═══════════════════════════════════════════════════════════════════════
    const ficheVisite = (dossier.fiches_visite as any[]) || []
    const hasFicheVisite = ficheVisite.length > 0
    
    // Si visite réalisée (statut OU fiche existe) et pas de devis → Créer devis
    if ((statut === 'visite_realisee' || hasFicheVisite) && devis.length === 0) {
      const dateVisite = hasFicheVisite && ficheVisite[0]?.created_at 
        ? new Date(ficheVisite[0].created_at) 
        : dossier.updated_at 
          ? new Date(dossier.updated_at) 
          : new Date()
      const joursDepuisVisite = Math.floor((new Date().getTime() - dateVisite.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        action: 'Créer le devis',
        description: `Visite réalisée${joursDepuisVisite > 0 ? ` il y a ${joursDepuisVisite} jour${joursDepuisVisite > 1 ? 's' : ''}` : ' aujourd\'hui'}`,
        urgence: joursDepuisVisite > 3 ? 'haute' as const : 'normale' as const,
        dateLimite: new Date(dateVisite.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 jours après la visite
        icon: <FileText className="w-5 h-5 text-amber-400" />,
        couleur: joursDepuisVisite > 3 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        actionButton: {
          label: 'Créer devis',
          href: `/devis/nouveau?dossier_id=${dossier.id}`
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITÉ 2 : Gestion des devis (après visite réalisée)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Si devis envoyé → En attente de signature
    // Vérifier d'abord le statut du devis, pas seulement le statut du dossier
    const devisEnvoye = devis.find((d: any) => d.statut === 'envoye')
    if (devisEnvoye && (statut === 'devis_envoye' || statut === 'visite_realisee' || statut === 'devis_en_cours' || statut === 'devis_pret')) {
      const dateEnvoi = devisEnvoye.date_envoi ? new Date(devisEnvoye.date_envoi) : null
      const joursDepuisEnvoi = dateEnvoi 
        ? Math.floor((new Date().getTime() - dateEnvoi.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      
      if (joursDepuisEnvoi >= 7) {
        return {
          action: 'Relancer le client',
          description: `Devis ${devisEnvoye.numero} envoyé il y a ${joursDepuisEnvoi} jours - En attente de signature`,
          urgence: joursDepuisEnvoi >= 14 ? 'haute' as const : 'normale' as const,
          dateLimite: null,
          icon: <Send className="w-5 h-5 text-purple-400" />,
          couleur: joursDepuisEnvoi >= 14 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          actionButton: {
            label: 'Relancer',
            href: `/devis/${devisEnvoye.id}?action=relancer`
          }
        }
      } else {
        return {
          action: 'En attente de signature',
          description: `Devis ${devisEnvoye.numero} envoyé${dateEnvoi ? ` le ${dateEnvoi.toLocaleDateString('fr-FR')}` : ''} - En attente de réponse du client`,
          urgence: 'normale' as const,
          dateLimite: dateEnvoi ? new Date(dateEnvoi.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
          icon: <Clock className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Voir le devis',
            href: `/devis/${devisEnvoye.id}`
          }
        }
      }
    }
    
    // Si visite réalisée avec devis créé → Envoyer le devis (même en brouillon)
    if ((statut === 'visite_realisee' || hasFicheVisite) && devis.length > 0) {
      // Si devis en brouillon ou en préparation → Envoyer le devis
      const devisBrouillon = devis.find((d: any) => d.statut === 'brouillon' || d.statut === 'en_preparation')
      if (devisBrouillon) {
        return {
          action: 'Envoyer le devis',
          description: `Devis ${devisBrouillon.numero || 'en brouillon'} à envoyer au client`,
          urgence: 'normale' as const,
          dateLimite: null,
          icon: <Send className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Envoyer',
            href: `/devis/${devisBrouillon.id}?action=envoyer`
          }
        }
      }
      
      // Si devis prêt → Envoyer le devis
      const devisPret = devis.find((d: any) => d.statut === 'pret')
      if (devisPret) {
        return {
          action: 'Envoyer le devis',
          description: `Devis ${devisPret.numero} prêt à être envoyé`,
          urgence: 'normale' as const,
          dateLimite: null,
          icon: <Send className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Envoyer',
            href: `/devis/${devisPret.id}?action=envoyer`
          }
        }
      }
    }
    
    // Vérifier si devis prêt mais non envoyé (cas général, pas visite réalisée)
    const devisPret = devis.find((d: any) => d.statut === 'pret' || d.statut === 'en_preparation')
    if (devisPret && devisPret.statut === 'pret' && statut !== 'devis_envoye') {
      return {
        action: 'Envoyer le devis',
        description: `Devis ${devisPret.numero} prêt à être envoyé`,
        urgence: 'normale' as const,
        dateLimite: null,
        icon: <Send className="w-5 h-5 text-blue-400" />,
        couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        actionButton: {
          label: 'Envoyer',
          href: `/devis/${devisPret.id}?action=envoyer`
        }
      }
    }
    
    // Vérifier si RDV à planifier (contact_recu sans RDV)
    if ((statut === 'rdv_a_planifier' || statut === 'qualification' || statut === 'contact_recu') && rdv.length === 0) {
      return {
        action: 'Planifier un RDV',
        description: 'Prendre contact avec le client pour planifier une visite',
        urgence: 'normale' as const,
        dateLimite: null,
        icon: <Calendar className="w-5 h-5 text-purple-400" />,
        couleur: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        actionButton: {
          label: 'Planifier RDV',
          href: `/rdv/nouveau?dossier_id=${dossier.id}`
        }
      }
    }
    
    // RDV planifié(s) sans confirmation client → Créneaux envoyés, en attente confirmation
    const rdvConfirme = rdv.find((r: any) => r.statut === 'confirme')
    const rdvPlanifies = rdv.filter((r: any) => r.statut === 'planifie' || r.statut === 'confirme')
    if ((statut === 'rdv_planifie' || rdvPlanifies.length > 0) && !rdvConfirme && !hasFicheVisite) {
      const prochainRdv = rdv.find((r: any) => r.statut === 'planifie')
      return {
        action: 'En attente de confirmation client',
        description: prochainRdv
          ? `Créneaux envoyés – RDV prévu le ${new Date(prochainRdv.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. En attente du clic du client sur le lien.`
          : 'Créneaux envoyés au client. En attente de confirmation (lien dans l\'email).',
        urgence: 'normale' as const,
        dateLimite: null,
        icon: <Clock className="w-5 h-5 text-amber-400" />,
        couleur: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        actionButton: prochainRdv
          ? { label: 'Voir RDV', href: `/rdv/${prochainRdv.id}` }
          : { label: 'Agenda RDV', href: '/rdv' }
      }
    }
    
    // Vérifier si RDV confirmé (SEULEMENT si visite pas encore réalisée)
    if (rdvConfirme && !hasFicheVisite && statut !== 'visite_realisee') {
      const dateRdv = new Date(rdvConfirme.date_heure)
      const maintenant = new Date()
      
      if (dateRdv > maintenant) {
        return {
          action: 'Préparer la visite',
          description: `RDV confirmé le ${dateRdv.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
          urgence: 'normale' as const,
          dateLimite: dateRdv,
          icon: <Calendar className="w-5 h-5 text-green-400" />,
          couleur: 'bg-green-500/10 border-green-500/30 text-green-400',
          actionButton: {
            label: 'Voir RDV',
            href: `/rdv/${rdvConfirme.id}`
          }
        }
      }
    }
    
    // Pas d'action urgente
    return null
}

interface ProchaineActionProps {
  dossier: any
}

export function ProchaineAction({ dossier }: ProchaineActionProps) {
  const prochaineAction = calculerProchaineAction(dossier)
  
  if (!prochaineAction) {
    return (
      <Card className="border-border bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Prochaine action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune action urgente requise
          </p>
        </CardContent>
      </Card>
    )
  }
  
  const urgenceColors = {
    urgente: 'bg-red-500/10 border-red-500/30 text-red-400',
    haute: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    normale: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }
  
  return (
    <Card className={`border-border ${prochaineAction.couleur}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {prochaineAction.icon}
          Prochaine action
          <Badge variant="outline" className={`ml-auto ${urgenceColors[prochaineAction.urgence]}`}>
            {prochaineAction.urgence === 'urgente' ? 'Urgent' : prochaineAction.urgence === 'haute' ? 'Important' : 'Normal'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold text-sm mb-1">{prochaineAction.action}</p>
          <p className="text-xs text-muted-foreground">{prochaineAction.description}</p>
        </div>
        
        {prochaineAction.dateLimite && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3" />
            <span>
              {prochaineAction.dateLimite < new Date() 
                ? `En retard depuis ${formatDistanceToNow(prochaineAction.dateLimite, { addSuffix: true, locale: fr })}`
                : `Avant le ${prochaineAction.dateLimite.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
              }
            </span>
          </div>
        )}
        
        {prochaineAction.actionButton && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            asChild
          >
            <Link href={prochaineAction.actionButton.href}>
              {prochaineAction.actionButton.label}
            </Link>
          </Button>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Bot className="w-3 h-3" />
          <span>Suggestion automatique de Léo</span>
        </div>
      </CardContent>
    </Card>
  )
}
