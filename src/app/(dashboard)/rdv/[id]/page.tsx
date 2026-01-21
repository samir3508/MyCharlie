'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  FolderKanban,
  Edit,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export default function RdvDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rdvId = params.id as string
  const { tenant } = useAuth()

  const { data: rdv, isLoading } = useQuery({
    queryKey: ['rdv', rdvId],
    queryFn: async () => {
      if (!tenant?.id || !rdvId) return null

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('rdv')
        .select(`
          *,
          clients (id, nom, prenom, nom_complet, email, telephone, adresse_chantier, adresse_facturation),
          dossiers (id, numero, titre, statut)
        `)
        .eq('id', rdvId)
        .eq('tenant_id', tenant.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id && !!rdvId,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!rdv) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Calendar className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">RDV non trouvé</p>
        <Button onClick={() => router.push('/rdv')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux RDV
        </Button>
      </div>
    )
  }

  const rdvDate = rdv.date_heure ? new Date(rdv.date_heure) : null
  const client = (rdv.clients as any) || null
  const dossier = (rdv.dossiers as any) || null

  const statutColors: Record<string, string> = {
    planifie: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    confirme: 'bg-green-500/10 text-green-400 border-green-500/30',
    en_cours: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    realise: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    annule: 'bg-red-500/10 text-red-400 border-red-500/30',
    reporte: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/rdv')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {rdv.titre || 'Rendez-vous'}
                </h1>
                <Badge variant="outline" className={statutColors[rdv.statut || 'planifie']}>
                  {rdv.statut || 'planifié'}
                </Badge>
              </div>
              {rdvDate && (
                <p className="text-muted-foreground text-sm">
                  {format(rdvDate, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
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
          {/* Date et heure */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Date et heure
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rdvDate ? (
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {format(rdvDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-muted-foreground">
                    {format(rdvDate, "HH:mm", { locale: fr })} heures
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Date non définie</p>
              )}
            </CardContent>
          </Card>

          {/* Adresse */}
          {rdv.adresse && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{rdv.adresse}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {rdv.notes && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rdv.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Dossier lié */}
          {dossier && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-orange-500" />
                  Dossier lié
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dossiers/${dossier.id}`}>
                  <div className="p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors cursor-pointer">
                    <p className="font-medium">{dossier.titre}</p>
                    <p className="text-sm text-muted-foreground">{dossier.numero}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Client Info */}
        {client && (
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim()}</p>
                  <p className="text-sm text-muted-foreground">Client</p>
                </div>
                
                <div className="space-y-3">
                  {client.telephone && (
                    <a 
                      href={`tel:${client.telephone}`}
                      className="flex items-center gap-2 text-sm hover:text-purple-400 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {client.telephone}
                    </a>
                  )}
                  {client.email && (
                    <a 
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-2 text-sm hover:text-purple-400 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {client.email}
                    </a>
                  )}
                  {(client.adresse_chantier || client.adresse_facturation) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>{client.adresse_chantier || client.adresse_facturation}</span>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/clients/${client.id}`}>
                    Voir la fiche client
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
