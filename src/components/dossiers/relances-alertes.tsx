'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Clock, 
  Send, 
  FileText, 
  Euro,
  Calendar,
  Bot,
  CheckCircle2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { format } from 'date-fns'

interface RelancesAlertesProps {
  dossier: any
  devis?: any[]
  factures?: any[]
  rdv?: any[]
}

export function RelancesAlertes({ dossier, devis: devisProp, factures: facturesProp, rdv: rdvProp }: RelancesAlertesProps) {
  const devis = devisProp || (dossier.devis as any[]) || []
  const factures = facturesProp || (dossier.factures as any[]) || []
  const rdv = rdvProp || (dossier.rdv as any[]) || []
  
  const maintenant = new Date()
  
  // Détecter les alertes
  const detecterAlertes = () => {
    const alertes = []
    
    // 1. Visite réalisée sans devis (3+ jours)
    if (dossier.statut === 'visite_realisee' && devis.length === 0) {
      const dateVisite = dossier.updated_at ? new Date(dossier.updated_at) : new Date()
      const joursDepuisVisite = Math.floor((maintenant.getTime() - dateVisite.getTime()) / (1000 * 60 * 60 * 24))
      
      if (joursDepuisVisite >= 3) {
        alertes.push({
          type: 'devis_manquant',
          urgence: joursDepuisVisite >= 7 ? 'urgente' : 'haute',
          titre: 'Devis non créé',
          message: `Visite réalisée il y a ${joursDepuisVisite} jour${joursDepuisVisite > 1 ? 's' : ''}. Le devis doit être créé rapidement.`,
          action: {
            label: 'Créer le devis',
            href: `/devis/nouveau?dossier_id=${dossier.id}`
          },
          icon: <FileText className="w-4 h-4" />
        })
      }
    }
    
    // 2. Devis envoyé sans réponse (7+ jours)
    const devisEnvoye = devis.find((d: any) => d.statut === 'envoye')
    if (devisEnvoye && devisEnvoye.date_envoi) {
      const dateEnvoi = new Date(devisEnvoye.date_envoi)
      const joursDepuisEnvoi = Math.floor((maintenant.getTime() - dateEnvoi.getTime()) / (1000 * 60 * 60 * 24))
      
      if (joursDepuisEnvoi >= 7) {
        alertes.push({
          type: 'devis_sans_reponse',
          urgence: joursDepuisEnvoi >= 14 ? 'urgente' : 'normale',
          titre: 'Devis sans réponse',
          message: `Devis ${devisEnvoye.numero} envoyé il y a ${joursDepuisEnvoi} jour${joursDepuisEnvoi > 1 ? 's' : ''}. Relance recommandée.`,
          action: {
            label: 'Relancer',
            href: `/devis/${devisEnvoye.id}?action=relancer`
          },
          icon: <Send className="w-4 h-4" />
        })
      }
    }
    
    // 3. Factures en retard
    const facturesEnRetard = factures.filter((f: any) => {
      if (f.statut === 'en_retard') return true
      if (f.statut === 'envoyee' && f.date_echeance) {
        const echeance = new Date(f.date_echeance)
        return echeance < maintenant && f.statut !== 'payee'
      }
      return false
    })
    
    facturesEnRetard.forEach((facture: any) => {
      const echeance = facture.date_echeance ? new Date(facture.date_echeance) : null
      const joursRetard = echeance ? Math.floor((maintenant.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24)) : 0
      
      alertes.push({
        type: 'facture_retard',
        urgence: joursRetard >= 30 ? 'urgente' : joursRetard >= 15 ? 'haute' : 'normale',
        titre: 'Facture en retard',
        message: `Facture ${facture.numero} en retard${joursRetard > 0 ? ` depuis ${joursRetard} jour${joursRetard > 1 ? 's' : ''}` : ''}. Relance immédiate recommandée.`,
        action: {
          label: 'Relancer',
          href: `/factures/${facture.id}?action=relancer`
        },
        icon: <Euro className="w-4 h-4" />
      })
    })
    
    // 4. Devis signé sans facture (acompte ou comptant selon template)
    const devisSigne = devis.find((d: any) => d.statut === 'accepte' || d.statut === 'signe')
    if (devisSigne && factures.length === 0) {
      const tpl = (devisSigne as any).template_condition_paiement as { pourcentage_acompte?: number } | null
      const hasAcompte = (tpl?.pourcentage_acompte ?? 0) > 0
      alertes.push({
        type: 'facture_manquante',
        urgence: 'haute',
        titre: hasAcompte ? 'Facture d\'acompte à créer' : 'Facture à créer',
        message: hasAcompte
          ? `Devis ${devisSigne.numero} signé. Créer la facture d'acompte selon les conditions de paiement, puis lancer le chantier une fois l'acompte payé.`
          : `Devis ${devisSigne.numero} signé. Créer la facture selon les conditions de paiement.`,
        action: {
          label: hasAcompte ? 'Créer facture d\'acompte' : 'Créer facture',
          href: `/devis/${devisSigne.id}`
        },
        icon: <Euro className="w-4 h-4" />
      })
    }
    
    // 5. RDV confirmé à venir (rappel)
    const rdvConfirme = rdv.find((r: any) => r.statut === 'confirme')
    if (rdvConfirme) {
      const dateRdv = new Date(rdvConfirme.date_heure)
      const heuresAvantRdv = (dateRdv.getTime() - maintenant.getTime()) / (1000 * 60 * 60)
      
      if (heuresAvantRdv > 0 && heuresAvantRdv <= 24) {
        alertes.push({
          type: 'rdv_proche',
          urgence: heuresAvantRdv <= 2 ? 'urgente' : 'normale',
          titre: 'RDV à venir',
          message: `RDV confirmé ${format(dateRdv, "le d MMMM à HH:mm", { locale: fr })} (${formatDistanceToNow(dateRdv, { addSuffix: true, locale: fr })}).`,
          action: {
            label: 'Voir RDV',
            href: `/rdv/${rdvConfirme.id}`
          },
          icon: <Calendar className="w-4 h-4" />
        })
      }
    }
    
    return alertes
  }
  
  const alertes = detecterAlertes()
  
  // Calculer les relances prévues
  const relancesPrevues = () => {
    const relances = []
    
    // Relances devis (si devis envoyé depuis 7+ jours)
    const devisEnvoye = devis.find((d: any) => d.statut === 'envoye')
    if (devisEnvoye && devisEnvoye.date_envoi) {
      const dateEnvoi = new Date(devisEnvoye.date_envoi)
      const joursDepuisEnvoi = Math.floor((maintenant.getTime() - dateEnvoi.getTime()) / (1000 * 60 * 60 * 24))
      
      if (joursDepuisEnvoi >= 7 && joursDepuisEnvoi < 14) {
        relances.push({
          type: 'relance_devis',
          date: new Date(dateEnvoi.getTime() + 7 * 24 * 60 * 60 * 1000),
          titre: 'Relance devis',
          message: `Relancer le client pour le devis ${devisEnvoye.numero}`,
          action: {
            label: 'Relancer',
            href: `/devis/${devisEnvoye.id}?action=relancer`
          }
        })
      }
    }
    
    // Relances factures (si facture envoyée et échéance dans 3 jours)
    factures.forEach((facture: any) => {
      if (facture.statut === 'envoyee' && facture.date_echeance) {
        const echeance = new Date(facture.date_echeance)
        const joursAvantEcheance = Math.floor((echeance.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24))
        
        if (joursAvantEcheance >= 0 && joursAvantEcheance <= 3) {
          relances.push({
            type: 'relance_facture',
            date: echeance,
            titre: 'Relance facture',
            message: `Relancer le client pour la facture ${facture.numero} (échéance ${format(echeance, 'dd/MM/yyyy', { locale: fr })})`,
            action: {
              label: 'Relancer',
              href: `/factures/${facture.id}?action=relancer`
            }
          })
        }
      }
    })
    
    return relances
  }
  
  const relances = relancesPrevues()
  
  const urgenceColors: Record<string, string> = {
    urgente: 'bg-red-500/10 border-red-500/30 text-red-400',
    haute: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    normale: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }
  
  return (
    <div className="space-y-6">
      {/* Alertes */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Alertes ({alertes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertes.length > 0 ? (
            alertes.map((alerte, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${urgenceColors[alerte.urgence]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    {alerte.icon}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alerte.titre}</p>
                      <p className="text-xs mt-1 opacity-90">{alerte.message}</p>
                    </div>
                  </div>
                  {alerte.action && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={alerte.action.href}>
                        {alerte.action.label}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
              <p className="text-sm">Aucune alerte</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Relances prévues */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Relances prévues ({relances.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {relances.length > 0 ? (
            relances.map((relance, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-border/50 bg-card/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{relance.titre}</p>
                    <p className="text-xs text-muted-foreground mt-1">{relance.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(relance.date, "Prévu le d MMMM à HH:mm", { locale: fr })}
                    </p>
                  </div>
                  {relance.action && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={relance.action.href}>
                        {relance.action.label}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune relance prévue</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Suggestions LEO */}
      <Card className="border-border bg-gradient-to-br from-purple-500/5 to-purple-600/10 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-500" />
            Suggestions de Léo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {alertes.length > 0 
              ? `Léo recommande de traiter ${alertes.length} alerte${alertes.length > 1 ? 's' : ''} en priorité.`
              : 'Aucune action urgente. Le dossier est à jour.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
