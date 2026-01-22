'use client'

import { useParams, useRouter } from 'next/navigation'
import { use } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft,
  ClipboardList, 
  Calendar,
  MapPin,
  User,
  FileText,
  Ruler,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Euro,
  Edit,
  Trash2,
  Link as LinkIcon
} from 'lucide-react'
import { useFicheVisite, useDeleteFicheVisite } from '@/lib/hooks/use-fiches-visite'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type PageProps = {
  params: Promise<{ id: string }>
}

export default function FicheVisiteDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // #region agent log
  if (typeof window !== 'undefined') {
    console.log('[FICHE-VISITE-PAGE] Component mounted on client', { id, timestamp: Date.now() })
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fiches-visite/[id]/page.tsx:37',message:'PAGE COMPONENT CALLED - CLIENT',data:{id,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C,D'})}).catch(()=>{});
  } else {
    console.log('[FICHE-VISITE-PAGE] Component rendered on server', { id, timestamp: Date.now() })
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fiches-visite/[id]/page.tsx:47',message:'PAGE COMPONENT CALLED - SERVER',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C,D'})}).catch(()=>{});
  }
  // #endregion
  
  const { data: fiche, isLoading, error } = useFicheVisite(id)
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fiches-visite/[id]/page.tsx:43',message:'Hook result',data:{id,isLoading,hasFiche:!!fiche,hasError:!!error,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }
  // #endregion
  const deleteFiche = useDeleteFicheVisite()

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fiche de visite ?')) {
      return
    }

    try {
      await deleteFiche.mutateAsync(id)
      toast.success('Fiche de visite supprimée')
      router.push('/fiches-visite')
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la suppression')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !fiche) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {error ? 'Erreur lors du chargement de la fiche de visite' : 'Fiche de visite introuvable'}
            </p>
            <Button variant="outline" onClick={() => router.push('/fiches-visite')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux fiches
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dossier = fiche.dossiers as any
  const client = dossier?.clients as any
  const rdv = fiche.rdv as any

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/fiches-visite')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Fiche de visite
              </h1>
              <p className="text-sm text-muted-foreground">
                {dossier?.numero} - {dossier?.titre}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDelete}
            disabled={deleteFiche.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations principales */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Informations de la visite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date de visite</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{formatDate(fiche.date_visite)}</p>
                  </div>
                </div>
                {fiche.duree_visite_minutes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Durée</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{fiche.duree_visite_minutes} minutes</p>
                    </div>
                  </div>
                )}
              </div>

              {fiche.surface_m2 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Surface</p>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{fiche.surface_m2} m²</p>
                  </div>
                </div>
              )}

              {fiche.nombre_pieces && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombre de pièces</p>
                  <p className="font-medium">{fiche.nombre_pieces}</p>
                </div>
              )}

              {fiche.etage && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Étage</p>
                  <p className="font-medium">{fiche.etage}</p>
                </div>
              )}

              {fiche.accessibilite && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Accessibilité</p>
                  <p className="font-medium">{fiche.accessibilite}</p>
                </div>
              )}

              {fiche.etat_general && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">État général</p>
                  <Badge variant="outline" className="capitalize">
                    {fiche.etat_general.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Constat */}
          {fiche.constat && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Constat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{fiche.constat}</p>
              </CardContent>
            </Card>
          )}

          {/* Difficultés */}
          {fiche.difficultes && (
            <Card className="border-border border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Difficultés détectées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{fiche.difficultes}</p>
              </CardContent>
            </Card>
          )}

          {/* Matériaux nécessaires */}
          {fiche.materiaux_necessaires && fiche.materiaux_necessaires.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-green-500" />
                  Matériaux nécessaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {fiche.materiaux_necessaires.map((materiau: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-green-500/10 text-green-400 border-0">
                      {materiau}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Travaux identifiés */}
          {fiche.travaux_identifies && fiche.travaux_identifies.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-500" />
                  Travaux identifiés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {fiche.travaux_identifies.map((travail: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="text-sm">{travail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Estimation */}
          {(fiche.estimation_heures || fiche.estimation_cout) && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5 text-purple-500" />
                  Estimation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fiche.estimation_heures && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Durée estimée</p>
                    <p className="font-medium">{fiche.estimation_heures} heures</p>
                  </div>
                )}
                {fiche.estimation_cout && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Coût estimé</p>
                    <p className="font-medium text-lg">{fiche.estimation_cout.toLocaleString('fr-FR')} €</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {fiche.notes && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{fiche.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {fiche.photos_urls && fiche.photos_urls.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Photos ({fiche.photos_urls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fiche.photos_urls.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      <img 
                        src={url} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Dossier lié */}
          {dossier && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm">Dossier lié</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Numéro</p>
                  <Link href={`/dossiers/${dossier.id}`}>
                    <p className="font-medium text-sm hover:text-amber-400 transition-colors flex items-center gap-1">
                      {dossier.numero}
                      <LinkIcon className="w-3 h-3" />
                    </p>
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Titre</p>
                  <p className="font-medium text-sm">{dossier.titre}</p>
                </div>
                {dossier.adresse_chantier && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Adresse chantier</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                      <span>{dossier.adresse_chantier}</span>
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dossiers/${dossier.id}`}>
                    Voir le dossier
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Client */}
          {client && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nom</p>
                  <Link href={`/clients/${client.id}`}>
                    <p className="font-medium text-sm hover:text-amber-400 transition-colors flex items-center gap-1">
                      {client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim()}
                      <LinkIcon className="w-3 h-3" />
                    </p>
                  </Link>
                </div>
                {client.telephone && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
                    <p className="text-sm">{client.telephone}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm">{client.email}</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/clients/${client.id}`}>
                    Voir le client
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* RDV lié */}
          {rdv && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  RDV lié
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date et heure</p>
                  <p className="text-sm font-medium">{formatDateTime(rdv.date_heure)}</p>
                </div>
                {rdv.adresse && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Adresse</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                      <span>{rdv.adresse}</span>
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/rdv/${rdv.id}`}>
                    Voir le RDV
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Métadonnées */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {fiche.valide_par_artisan && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>Validée par l'artisan</span>
                </div>
              )}
              {fiche.date_validation && (
                <div>
                  <p>Date de validation : {formatDate(fiche.date_validation)}</p>
                </div>
              )}
              {fiche.created_at && (
                <div>
                  <p>Créée le : {formatDateTime(fiche.created_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
