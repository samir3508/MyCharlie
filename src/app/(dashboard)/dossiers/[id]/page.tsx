'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  FolderKanban, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  FileText,
  ClipboardList,
  Euro,
  Clock,
  MessageSquare,
  ChevronRight,
  Bot,
  Edit,
  Trash2,
  Plus,
  History,
  CheckCircle2,
  AlertTriangle,
  Send,
  Receipt
} from 'lucide-react'
import { useDossier, useUpdateDossier } from '@/lib/hooks/use-dossiers'
import { STATUTS_DOSSIER, LABELS_STATUT_DOSSIER, PRIORITES, LABELS_PRIORITE } from '@/types/database'
import { ProchaineAction } from '@/components/dossiers/prochaine-action'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const statutColors: Record<string, string> = {
  contact_recu: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  qualification: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  rdv_a_planifier: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  rdv_planifie: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  rdv_confirme: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
  visite_realisee: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  devis_en_cours: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  devis_pret: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  devis_envoye: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
  en_negociation: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  signe: 'bg-green-500/10 text-green-400 border-green-500/30',
  perdu: 'bg-red-500/10 text-red-400 border-red-500/30',
  annule: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  facture_a_creer: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  facture_envoyee: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  facture_en_retard: 'bg-red-500/10 text-red-400 border-red-500/30',
  facture_payee: 'bg-green-500/10 text-green-400 border-green-500/30',
}

const prioriteColors: Record<string, string> = {
  basse: 'bg-green-500/10 text-green-400 border-green-500/30',
  normale: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  haute: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  urgente: 'bg-red-500/10 text-red-400 border-red-500/30',
}

const journalIcons: Record<string, React.ReactNode> = {
  creation: <Plus className="w-4 h-4" />,
  changement_statut: <ChevronRight className="w-4 h-4" />,
  rdv_cree: <Calendar className="w-4 h-4" />,
  visite: <ClipboardList className="w-4 h-4" />,
  devis: <FileText className="w-4 h-4" />,
  note: <MessageSquare className="w-4 h-4" />,
  relance: <Send className="w-4 h-4" />,
}

export default function DossierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dossierId = params.id as string
  
  const { data: dossier, isLoading } = useDossier(dossierId)
  const updateDossier = useUpdateDossier()

  const handleStatutChange = (newStatut: string) => {
    updateDossier.mutate({ id: dossierId, statut: newStatut as any })
  }

  const handlePrioriteChange = (newPriorite: string) => {
    updateDossier.mutate({ id: dossierId, priorite: newPriorite as any })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FolderKanban className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">Dossier non trouvé</p>
        <Button onClick={() => router.push('/dossiers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux dossiers
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dossiers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {dossier.titre}
                </h1>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                  <Bot className="w-3 h-3 mr-1" />
                  Léo
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {dossier.numero} • Créé le {formatDate(dossier.created_at)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prochaine Action - Bloc crucial */}
          <ProchaineAction dossier={dossier} />

          {/* Status & Priority Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Statut</p>
                <Select value={dossier.statut || 'contact_recu'} onValueChange={handleStatutChange}>
                  <SelectTrigger className={cn("bg-background border-0", statutColors[dossier.statut || 'contact_recu'])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS_DOSSIER.map((statut) => (
                      <SelectItem key={statut} value={statut}>
                        {LABELS_STATUT_DOSSIER[statut]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Priorité</p>
                <Select value={dossier.priorite || 'normale'} onValueChange={handlePrioriteChange}>
                  <SelectTrigger className={cn("bg-background border-0", prioriteColors[dossier.priorite || 'normale'])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITES.map((priorite) => (
                      <SelectItem key={priorite} value={priorite}>
                        {LABELS_PRIORITE[priorite]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="rdv">RDV ({(dossier.rdv as any[])?.length || 0})</TabsTrigger>
              <TabsTrigger value="fiches">Fiches ({(dossier.fiches_visite as any[])?.length || 0})</TabsTrigger>
              <TabsTrigger value="devis">Devis ({(dossier.devis as any[])?.length || 0})</TabsTrigger>
              <TabsTrigger value="factures">Factures ({(dossier.factures as any[])?.length || 0})</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Description */}
              {dossier.description && (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{dossier.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Infos */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dossier.adresse_chantier && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{dossier.adresse_chantier}</span>
                    </div>
                  )}
                  {dossier.type_travaux && (
                    <div className="flex items-center gap-2 text-sm">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      <span>{dossier.type_travaux}</span>
                    </div>
                  )}
                  {dossier.source && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{dossier.source.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {dossier.montant_estime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Euro className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-orange-400">
                        {formatMontant(dossier.montant_estime)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-4" asChild>
                  <Link href="/rdv">
                    <div className="text-center">
                      <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                      <p className="font-medium">Planifier RDV</p>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4" asChild>
                  <Link href="/fiches-visite">
                    <div className="text-center">
                      <ClipboardList className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                      <p className="font-medium">Créer fiche visite</p>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4" asChild>
                  <Link href="/devis/nouveau">
                    <div className="text-center">
                      <FileText className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                      <p className="font-medium">Créer devis</p>
                    </div>
                  </Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="rdv">
              <Card className="border-border">
                <CardContent className="p-6">
                  {(dossier.rdv as any[])?.length > 0 ? (
                    <div className="space-y-3">
                      {(dossier.rdv as any[]).map((rdv: any) => (
                        <div key={rdv.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium">{rdv.titre}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(rdv.date_heure)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{rdv.statut}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Aucun RDV</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fiches">
              <Card className="border-border">
                <CardContent className="p-6">
                  {(dossier.fiches_visite as any[])?.length > 0 ? (
                    <div className="space-y-3">
                      {(dossier.fiches_visite as any[]).map((fiche: any) => (
                        <div key={fiche.id} className="p-3 rounded-lg bg-card/50 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                              <Calendar className="w-3 h-3 mr-1" />
                              {fiche.date_visite ? new Date(fiche.date_visite).toLocaleDateString('fr-FR') : '-'}
                            </Badge>
                          </div>
                          {fiche.constat && (
                            <p className="text-sm line-clamp-2">{fiche.constat}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Aucune fiche de visite</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="devis">
              <Card className="border-border">
                <CardContent className="p-6">
                  {(dossier.devis as any[])?.length > 0 ? (
                    <div className="space-y-3">
                      {(dossier.devis as any[]).map((devis: any) => (
                        <Link key={devis.id} href={`/devis/${devis.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-orange-400" />
                              </div>
                              <div>
                                <p className="font-medium">{devis.numero}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatMontant(devis.montant_ttc || 0)}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">{devis.statut}</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground mb-4">Aucun devis</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/devis/nouveau?dossier_id=${dossier.id}`}>
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un devis
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="factures">
              <Card className="border-border">
                <CardContent className="p-6">
                  {(dossier.factures as any[])?.length > 0 ? (
                    <div className="space-y-3">
                      {(dossier.factures as any[]).map((facture: any) => {
                        const isEnRetard = facture.statut === 'en_retard' || 
                          (facture.statut === 'envoyee' && facture.date_echeance && new Date(facture.date_echeance) < new Date())
                        return (
                          <Link key={facture.id} href={`/factures/${facture.id}`}>
                            <div className={`flex items-center justify-between p-3 rounded-lg bg-card/50 border transition-colors cursor-pointer ${
                              isEnRetard ? 'border-red-500/50 bg-red-500/5' : 'border-border/50 hover:bg-card/80'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isEnRetard ? 'bg-red-500/10' : 'bg-green-500/10'
                                }`}>
                                  <Euro className={`w-5 h-5 ${isEnRetard ? 'text-red-400' : 'text-green-400'}`} />
                                </div>
                                <div>
                                  <p className="font-medium">{facture.numero}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatMontant(facture.montant_ttc || 0)}
                                    {facture.date_echeance && (
                                      <span className="ml-2">
                                        • Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isEnRetard && (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                                    En retard
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {facture.statut === 'payee' ? 'Payée' : 
                                   facture.statut === 'envoyee' ? 'Envoyée' :
                                   facture.statut === 'en_retard' ? 'En retard' : 'Brouillon'}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Euro className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground mb-4">Aucune facture</p>
                      {(dossier.devis as any[])?.length > 0 && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/factures/nouveau?dossier_id=${dossier.id}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Créer une facture
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journal">
              <Card className="border-border">
                <CardContent className="p-6">
                  {(dossier.journal_dossier as any[])?.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-6">
                        {(dossier.journal_dossier as any[])
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((entry: any, index: number) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative flex gap-4 pl-10"
                          >
                            <div className="absolute left-0 w-10 h-10 rounded-full bg-card border-2 border-orange-500/30 flex items-center justify-center text-orange-400">
                              {journalIcons[entry.type] || <History className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 pt-1">
                              <p className="font-medium">{entry.titre}</p>
                              {entry.contenu && (
                                <p className="text-sm text-muted-foreground mt-1">{entry.contenu}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDate(entry.created_at)} • {entry.auteur}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Aucune entrée dans le journal</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Client Info */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dossier.clients ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-orange-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold">
                        {getInitials(dossier.clients.nom_complet)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{dossier.clients.nom_complet}</p>
                      <p className="text-sm text-muted-foreground">Client</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {dossier.clients.telephone && (
                      <a 
                        href={`tel:${dossier.clients.telephone}`}
                        className="flex items-center gap-2 text-sm hover:text-orange-400 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {dossier.clients.telephone}
                      </a>
                    )}
                    {dossier.clients.email && (
                      <a 
                        href={`mailto:${dossier.clients.email}`}
                        className="flex items-center gap-2 text-sm hover:text-orange-400 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {dossier.clients.email}
                      </a>
                    )}
                    {dossier.clients.adresse_chantier && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span>{dossier.clients.adresse_chantier}</span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href={`/clients/${dossier.clients.id}`}>
                      Voir la fiche client
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Client non trouvé</p>
              )}
            </CardContent>
          </Card>

          {/* Résumé rapide */}
          <Card className="border-border bg-gradient-to-br from-orange-500/5 to-orange-600/10 border-orange-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">RDV</span>
                <span className="font-medium">{(dossier.rdv as any[])?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Fiches visite</span>
                <span className="font-medium">{(dossier.fiches_visite as any[])?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Devis</span>
                <span className="font-medium">{(dossier.devis as any[])?.length || 0}</span>
              </div>
              {dossier.montant_estime && (
                <>
                  <div className="border-t border-orange-500/20 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Montant estimé</span>
                      <span className="font-bold text-orange-400">{formatMontant(dossier.montant_estime)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
