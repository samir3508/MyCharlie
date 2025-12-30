'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useClient, useDeleteClient } from '@/lib/hooks/use-clients'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  FileText,
  Receipt,
  Calendar,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

// Hook pour récupérer les devis d'un client
function useClientDevis(clientId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['client-devis', clientId],
    queryFn: async () => {
      if (!clientId) return { devis: [], count: 0 }

      // Récupérer le total
      const { count, error: countError } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)

      if (countError) throw countError

      // Récupérer les 10 derniers pour l'affichage
      const { data, error } = await supabase
        .from('devis')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return { devis: data || [], count: count || 0 }
    },
    enabled: !!clientId,
  })
}

// Hook pour récupérer les factures d'un client
function useClientFactures(clientId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['client-factures', clientId],
    queryFn: async () => {
      if (!clientId) return { factures: [], count: 0, caTotal: 0 }

      // Récupérer toutes les factures pour calculer le CA total
      const { data: allFactures, error: allError } = await supabase
        .from('factures')
        .select('*')
        .eq('client_id', clientId)

      if (allError) throw allError

      // Calculer le CA total depuis seulement les factures payées
      const caTotal = allFactures
        ?.filter((f: any) => f.statut === 'payee')
        .reduce((sum: number, f: any) => sum + (f.montant_ttc || 0), 0) || 0

      // Trier et prendre les 10 dernières pour l'affichage
      const facturesSorted = (allFactures || []).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const facturesDisplay = facturesSorted.slice(0, 10)

      return { 
        factures: facturesDisplay,
        count: allFactures?.length || 0,
        caTotal 
      }
    },
    enabled: !!clientId,
  })
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: client, isLoading: clientLoading, error: clientError } = useClient(id)
  const { data: devisData } = useClientDevis(id)
  const { data: facturesData } = useClientFactures(id)
  const deleteClient = useDeleteClient()

  const devis = devisData?.devis || []
  const factures = facturesData?.factures || []
  const nbDevis = devisData?.count || 0
  const nbFactures = facturesData?.count || 0
  const caTotal = facturesData?.caTotal || 0

  const handleDelete = () => {
    deleteClient.mutate(id, {
      onSuccess: () => {
        toast.success('Client supprimé')
        router.push('/clients')
      },
      onError: () => {
        toast.error('Erreur lors de la suppression')
      },
    })
  }

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-black-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-gradient-black-orange flex items-center justify-center">
        <Card className="max-w-md shadow-xl border-2 border-gray-800 bg-gradient-card-dark">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-white">Client non trouvé</h2>
            <p className="text-gray-400 mb-6">Le client que vous recherchez n'existe pas ou a été supprimé.</p>
            <Link href="/clients">
              <Button className="bg-[#FF4D00] hover:bg-[#E64600] text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux clients
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-black-orange">
      {/* Header sticky */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/dashboard" className="text-gray-400 hover:text-[#FF4D00]">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-600" />
              <Link href="/clients" className="text-gray-400 hover:text-[#FF4D00]">
                Clients
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-white">{client.nom_complet}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href={`/clients/${id}/edit`}>
                <Button variant="outline" size="sm" className="bg-[#1A1A1A] text-white border-gray-700 hover:bg-[#262626] hover:border-gray-600">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="bg-[#FF4D00] hover:bg-[#E64600] text-white">
                    Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1A] text-white border border-gray-800">
                  <DropdownMenuItem asChild className="text-white hover:bg-[#262626] focus:bg-[#262626]">
                    <Link href={`/clients/${id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier le client
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-red-400 hover:bg-[#262626] focus:bg-[#262626]"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Supprimer le client ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Cette action est irréversible. Le client sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#262626] text-white border-gray-700 hover:bg-[#333]">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Container principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Informations client */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-[#FF4D00] text-white text-xl">
                      {getInitials(client.nom_complet)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">
                        {client.nom_complet}
                      </h1>
                      <Badge variant="outline" className="bg-[#262626] text-gray-300 border-gray-700">
                        {client.type}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${client.email}`}
                            className="text-[#FF4D00] hover:text-[#FF6D33] hover:underline"
                          >
                            {client.email}
                          </a>
                        </div>
                      )}

                      {client.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a
                            href={`tel:${client.telephone}`}
                            className="text-[#FF4D00] hover:text-[#FF6D33] hover:underline"
                          >
                            {client.telephone}
                          </a>
                        </div>
                      )}
                    </div>

                    {client.adresse_facturation && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-400 mb-1">Adresse de facturation</p>
                          <p className="text-white">{client.adresse_facturation}</p>
                        </div>
                      </div>
                    )}

                    {client.adresse_chantier && client.adresse_chantier !== client.adresse_facturation && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-400 mb-1">Adresse du chantier</p>
                          <p className="text-white">{client.adresse_chantier}</p>
                        </div>
                      </div>
                    )}

                    {client.notes && (
                      <div className="mt-4 p-4 bg-[#262626] rounded-lg border border-gray-800">
                        <p className="text-sm text-gray-400 mb-2">Notes</p>
                        <p className="text-white text-sm whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-4 pt-4 border-t border-gray-800">
                      <Calendar className="h-4 w-4" />
                      <span>Client depuis le {format(new Date(client.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Devis */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5" />
                    Devis
                    {nbDevis > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                        {nbDevis}
                      </Badge>
                    )}
                  </CardTitle>
                  <Link href="/devis/new">
                    <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau devis
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]">
                {devis.length > 0 ? (
                  <div className="space-y-3">
                    {devis.map((devi: any) => (
                      <Link
                        key={devi.id}
                        href={`/devis/${devi.id}`}
                        className="block p-4 bg-[#262626] rounded-lg border border-gray-800 hover:border-[#FF4D00]/50 hover:bg-[#2A2A2A] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white">{devi.numero}</p>
                              <Badge
                                variant="outline"
                                className={`
                                  text-xs border
                                  ${devi.statut === 'accepte' ? 'bg-green-900/30 text-green-400 border-green-800/50' : ''}
                                  ${devi.statut === 'envoye' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : ''}
                                  ${devi.statut === 'refuse' ? 'bg-red-900/30 text-red-400 border-red-800/50' : ''}
                                  ${devi.statut === 'brouillon' ? 'bg-gray-800 text-gray-400 border-gray-700' : ''}
                                `}
                              >
                                {devi.statut}
                              </Badge>
                            </div>
                            {devi.titre && <p className="text-sm text-gray-400 mb-2">{devi.titre}</p>}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{format(new Date(devi.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                              <span>{formatCurrency(devi.montant_ttc)} TTC</span>
                            </div>
                          </div>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun devis pour ce client</p>
                    <Link href="/devis/new" className="mt-4 inline-block">
                      <Button size="sm" className="bg-[#FF4D00] hover:bg-[#E64600] text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un devis
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card Factures */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Receipt className="h-5 w-5" />
                    Factures
                    {nbFactures > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                        {nbFactures}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]">
                {factures.length > 0 ? (
                  <div className="space-y-3">
                    {factures.map((facture: any) => (
                      <Link
                        key={facture.id}
                        href={`/factures/${facture.id}`}
                        className="block p-4 bg-[#262626] rounded-lg border border-gray-800 hover:border-[#FF4D00]/50 hover:bg-[#2A2A2A] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white">{facture.numero}</p>
                              <Badge
                                variant="outline"
                                className={`
                                  text-xs border
                                  ${facture.statut === 'payee' ? 'bg-green-900/30 text-green-400 border-green-800/50' : ''}
                                  ${facture.statut === 'envoyee' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : ''}
                                  ${facture.statut === 'en_retard' ? 'bg-red-900/30 text-red-400 border-red-800/50' : ''}
                                  ${facture.statut === 'brouillon' ? 'bg-gray-800 text-gray-400 border-gray-700' : ''}
                                `}
                              >
                                {facture.statut}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{format(new Date(facture.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                              <span>{formatCurrency(facture.montant_ttc)} TTC</span>
                            </div>
                          </div>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune facture pour ce client</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite (1/3) - Sidebar */}
          <div className="space-y-6">
            {/* Card Statistiques */}
            <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3">
                <CardTitle className="text-white">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Nombre de devis</p>
                  <p className="text-2xl font-bold text-white">{nbDevis}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Nombre de factures</p>
                  <p className="text-2xl font-bold text-white">{nbFactures}</p>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-1">CA Total</p>
                  <p className="text-2xl font-bold text-[#FF4D00]">
                    {formatCurrency(caTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
