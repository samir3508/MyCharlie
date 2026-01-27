'use client'

import { use, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useDevisById, useUpdateDevisStatus, useDeleteDevis } from '@/lib/hooks/use-devis'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
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
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Eye, 
  Pencil, 
  Download, 
  Send,
  Check,
  X,
  XCircle,
  MoreVertical,
  CreditCard,
  FileText,
  Receipt,
  Loader2,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Copy,
  Plus,
  Bell,
  ExternalLink,
  Lock as LockIcon,
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getInitials, cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createFactureAcompte, createFactureIntermediaire, createFactureSolde, getDevisFacturesSummary } from '@/lib/utils/factures'

interface PageProps {
  params: Promise<{ id: string }>
}

// Hook pour récupérer les factures d'un devis
function useDevisFactures(devisId: string | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['devis-factures', devisId],
    queryFn: async () => {
      if (!devisId) return null
      return await getDevisFacturesSummary(devisId)
    },
    enabled: !!devisId,
  })
}

// Hook pour récupérer le template de conditions de paiement
function useTemplateConditionPaiement(templateId: string | null | undefined) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['template-condition-paiement', templateId],
    queryFn: async () => {
      if (!templateId) return null

      const { data, error } = await supabase
        .from('templates_conditions_paiement')
        .select('*')
        .eq('id', templateId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!templateId,
  })
}

export default function DevisDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const { data: devis, isLoading: devisLoading, error: devisError } = useDevisById(id, tenant?.id)
  const { data: facturesSummary } = useDevisFactures(id)
  const { data: template } = useTemplateConditionPaiement(devis?.template_condition_paiement_id || undefined)

  const updateStatusMutation = useUpdateDevisStatus()
  const deleteDevisMutation = useDeleteDevis()

  // Factures
  const factureAcompte = facturesSummary?.acompte
  const factureIntermediaire = facturesSummary?.intermediaire
  const factureSolde = facturesSummary?.solde
  const allFactures = facturesSummary?.factures || []

  // Créer l'historique complet
  const historyEvents = useMemo(() => {
    const events: Array<{
      type: 'creation' | 'modification' | 'envoi' | 'acceptation' | 'refus' | 'facture' | 'paye'
      label: string
      date: Date
      factureType?: 'acompte' | 'intermediaire' | 'solde'
      factureNumero?: string
    }> = []

    // 1. Création du devis
    if (devis?.created_at) {
      events.push({
        type: 'creation',
        label: 'Devis créé',
        date: new Date(devis.created_at),
      })
    }

    // 2. Modifications (si updated_at est différent de created_at)
    if (devis?.updated_at && devis?.created_at) {
      const createdDate = new Date(devis.created_at).getTime()
      const updatedDate = new Date(devis.updated_at).getTime()
      if (updatedDate > createdDate + 1000) { // Au moins 1 seconde de différence
        events.push({
          type: 'modification',
          label: 'Devis modifié',
          date: new Date(devis.updated_at),
        })
      }
    }

    // 3. Envoi
    if (devis?.date_envoi) {
      events.push({
        type: 'envoi',
        label: 'Devis envoyé',
        date: new Date(devis.date_envoi),
      })
    }

    // 4. Acceptation
    if (devis?.date_acceptation) {
      events.push({
        type: 'acceptation',
        label: 'Devis accepté',
        date: new Date(devis.date_acceptation),
      })
    }

    // 5. Refus (si statut = 'refuse', utiliser updated_at si disponible, sinon date_envoi)
    if (devis?.statut === 'refuse') {
      const refusDate = devis.updated_at 
        ? new Date(devis.updated_at)
        : devis.date_envoi 
          ? new Date(devis.date_envoi)
          : null
      if (refusDate) {
        events.push({
          type: 'refus',
          label: 'Devis refusé',
          date: refusDate,
        })
      }
    }

    // 6. Paiement (si statut = 'paye', utiliser updated_at)
    if ((devis as any)?.statut === 'paye' && devis?.updated_at) {
      events.push({
        type: 'paye',
        label: 'Devis payé',
        date: new Date(devis.updated_at),
      })
    }

    // 7. Création des factures
    allFactures.forEach((facture: any) => {
      let factureType: 'acompte' | 'intermediaire' | 'solde' | undefined
      let factureLabel = 'Facture créée'
      
      if (facture.numero.endsWith('-A')) {
        factureType = 'acompte'
        factureLabel = 'Facture d\'acompte créée'
      } else if (facture.numero.endsWith('-I')) {
        factureType = 'intermediaire'
        factureLabel = 'Facture intermédiaire créée'
      } else if (facture.numero.endsWith('-S')) {
        factureType = 'solde'
        factureLabel = 'Facture de solde créée'
      }

      if (facture.created_at) {
        events.push({
          type: 'facture',
          label: factureLabel,
          date: new Date(facture.created_at),
          factureType,
          factureNumero: facture.numero,
        })
      }
    })

    // Trier par date (du plus récent au plus ancien, puis inverser pour afficher du plus ancien au plus récent)
    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [devis, allFactures])

  // Vérifier et mettre à jour le statut du devis si toutes les factures sont payées
  useEffect(() => {
    if (!devis || !facturesSummary || (devis as any).statut === 'paye') return

    const allFactures = facturesSummary.factures || []
    if (allFactures.length === 0) return

    // Vérifier si toutes les factures sont payées
    const allPaid = allFactures.every((f: any) => f.statut === 'payee')
    
    // Si toutes les factures sont payées, mettre à jour le statut du devis
    if (allPaid) {
      const supabase = getSupabaseClient()
      supabase
        .from('devis')
        .update({
          statut: 'paye' as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .then((res: any) => {
          const { error } = res || {}
          if (error) {
            console.error('Error updating devis status:', error)
          } else {
            // Invalider les queries pour rafraîchir les données
            queryClient.invalidateQueries({ queryKey: ['devis', id] })
            queryClient.invalidateQueries({ queryKey: ['devis-factures', id] })
          }
        })
    }
  }, [devis, facturesSummary, id, queryClient])

  // Conditions pour créer les factures
  const canCreateAcompte = template && template.pourcentage_acompte > 0 && !factureAcompte && devis?.statut === 'accepte'
  const canCreateIntermediaire = template && template.pourcentage_intermediaire && template.pourcentage_intermediaire > 0 && !factureIntermediaire && factureAcompte
  const canCreateSolde = template && template.pourcentage_solde && template.pourcentage_solde > 0 && !factureSolde && (factureIntermediaire || (template.pourcentage_intermediaire === 0 && factureAcompte))

  // Mutations pour créer les factures
  const createAcompteMutation = useMutation({
    mutationFn: () => createFactureAcompte(id),
    onSuccess: (facture) => {
      toast.success(`Facture d'acompte ${facture.numero} créée !`)
      queryClient.invalidateQueries({ queryKey: ['devis', id] })
      queryClient.invalidateQueries({ queryKey: ['devis-factures', id] })
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Erreur inconnue'
      toast.error(`Erreur lors de la création de la facture d'acompte: ${errorMessage}`)
    },
  })

  const createIntermediaireMutation = useMutation({
    mutationFn: () => createFactureIntermediaire(id),
    onSuccess: (facture) => {
      toast.success(`Facture intermédiaire ${facture.numero} créée !`)
      queryClient.invalidateQueries({ queryKey: ['devis', id] })
      queryClient.invalidateQueries({ queryKey: ['devis-factures', id] })
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Erreur inconnue'
      toast.error(`Erreur lors de la création de la facture intermédiaire: ${errorMessage}`)
    },
  })

  const createSoldeMutation = useMutation({
    mutationFn: () => createFactureSolde(id),
    onSuccess: (facture) => {
      toast.success(`Facture de solde ${facture.numero} créée !`)
      queryClient.invalidateQueries({ queryKey: ['devis', id] })
      queryClient.invalidateQueries({ queryKey: ['devis-factures', id] })
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Erreur inconnue'
      toast.error(`Erreur lors de la création de la facture de solde: ${errorMessage}`)
    },
  })

  const handleCreateAcompte = () => {
    createAcompteMutation.mutate()
  }

  const handleCreateIntermediaire = () => {
    createIntermediaireMutation.mutate()
  }

  const handleCreateSolde = () => {
    createSoldeMutation.mutate()
  }

  const handleCreateFactures = () => {
    if (canCreateAcompte) {
      handleCreateAcompte()
    }
  }

  const handleDelete = () => {
    deleteDevisMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Devis supprimé')
        router.push('/devis')
      },
      onError: () => {
        toast.error('Erreur lors de la suppression')
      },
    })
  }

  const handleDupliquer = () => {
    toast.info('Fonctionnalité à venir')
  }

  const handleUpdateStatus = async (newStatus: 'brouillon' | 'envoye' | 'accepte' | 'refuse') => {
    // Bloquer la modification du statut si le devis est déjà accepté
    if (devis?.statut === 'accepte') {
      toast.error('Impossible de modifier le statut d\'un devis accepté')
      return
    }
    
    try {
      await updateStatusMutation.mutateAsync({ devisId: id, statut: newStatus })
      toast.success(`Statut du devis mis à jour`)
    } catch (error: any) {
      toast.error(`Erreur: ${error?.message || 'Erreur inconnue'}`)
    }
  }

  // Vérifier si le devis est expiré (plus de 30 jours sans réponse)
  const isDevisExpired = () => {
    if (!devis || devis.statut === 'accepte' || devis.statut === 'refuse') return false
    
    const createdDate = new Date(devis.created_at || Date.now())
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysDiff > 30
  }

  // Obtenir le statut affiché (avec expiration)
  const getDisplayedStatus = () => {
    if (!devis) return 'brouillon'
    if (devis.statut === 'accepte' || devis.statut === 'refuse') return devis.statut
    if (isDevisExpired()) return 'expire'
    return devis.statut
  }

  const handleDownloadPDF = async () => {
    if (!id) {
      toast.error('ID du devis non disponible')
      return
    }
    
    try {
      console.log('Downloading PDF for devis:', id)
      const response = await fetch(`/api/pdf/devis/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('PDF download error:', errorData)
        toast.error(`Erreur: ${errorData.error || 'Erreur lors du téléchargement'}`)
        return
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${devis?.numero || 'devis'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  const handleVoirPDF = () => {
    if (!id) {
      toast.error('ID du devis non disponible')
      return
    }
    
    const pdfUrl = `/api/pdf/devis/${id}`
    console.log('Opening PDF:', pdfUrl)
    
    // Essayer d'ouvrir dans un nouvel onglet
    const newWindow = window.open(pdfUrl, '_blank')
    
    // Si le popup est bloqué, ouvrir dans le même onglet
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log('Popup blocked, opening in same tab')
      window.location.href = pdfUrl
    }
  }

  if (devisLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (devisError) {
    console.error('Devis error:', devisError)
    console.error('Tenant ID:', tenant?.id)
    console.error('Devis ID recherché:', id)
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Erreur lors du chargement du devis</p>
            <p className="text-sm text-muted-foreground mt-2">
              {devisError instanceof Error ? devisError.message : 'Erreur inconnue'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ID recherché: {id} | Tenant: {tenant?.id || 'Non défini'}
            </p>
            <Button asChild className="mt-4">
              <Link href="/devis">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!devis) {
    console.warn('Devis non trouvé - ID:', id, 'Tenant:', tenant?.id)
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Devis non trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Le devis avec l'ID "{id}" n'existe pas ou n'est plus disponible.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Vérifiez que le devis appartient au tenant: {tenant?.id || 'Non défini'}
            </p>
            <Button asChild className="mt-4">
              <Link href="/devis">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lignes = devis.lignes_devis || []
  const client = devis.clients as any

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0A0A0A] to-[#1A0A00]">
      {/* Header sticky */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm min-w-0 flex-1">
              <Link href="/dashboard" className="text-gray-400 hover:text-[#FF4D00] truncate">
                Dashboard
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
              <Link href="/devis" className="text-gray-400 hover:text-[#FF4D00] truncate">
                Devis
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
              <span className="font-semibold text-white truncate">{devis?.numero || ''}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleVoirPDF} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Voir le PDF</span>
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Télécharger</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="bg-[#FF4D00] hover:bg-[#E64600] text-xs sm:text-sm">
                    <span className="hidden sm:inline">Actions</span>
                    <span className="sm:hidden">...</span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1A] text-white border border-gray-800">
                  <DropdownMenuItem asChild>
                    <Link href={`/devis/${id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier le devis
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDupliquer}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuLabel className="text-gray-400">
                    {devis?.statut === 'accepte' ? 'Statut verrouillé' : 'Changer le statut'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  
                  {devis?.statut === 'accepte' ? (
                    <DropdownMenuItem disabled className="text-gray-500 cursor-not-allowed">
                      <LockIcon className="h-4 w-4 mr-2" />
                      Devis accepté - Statut bloqué
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {devis?.statut !== 'brouillon' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus('brouillon')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Marquer comme brouillon
                        </DropdownMenuItem>
                      )}
                      {devis?.statut !== 'envoye' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus('envoye')}>
                          <Send className="h-4 w-4 mr-2" />
                          Marquer comme envoyé
                        </DropdownMenuItem>
                      )}
                      {!devis?.statut || devis.statut === 'brouillon' || devis.statut === 'envoye' ? (
                        <DropdownMenuItem onClick={() => handleUpdateStatus('accepte')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marquer comme accepté
                        </DropdownMenuItem>
                      ) : null}
                      {devis?.statut !== 'refuse' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus('refuse')}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Marquer comme refusé
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={handleVoirPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Voir le PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-red-600"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le devis ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le devis sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Colonne gauche (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Statut & Vue d'ensemble */}
            <Card
              className={cn(
                'border-t-4 shadow-xl transition-all duration-200 hover:shadow-2xl overflow-hidden !py-0',
                (devis as any).statut === 'paye' && 'border-t-emerald-500 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]',
                devis.statut === 'accepte' && 'border-t-green-500 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]',
                devis.statut === 'envoye' && 'border-t-blue-500 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]',
                devis.statut === 'refuse' && 'border-t-red-500 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]',
                devis.statut === 'brouillon' && 'border-t-gray-500 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]'
              )}
            >
              <CardContent className="p-4 !px-4">
                {/* Numéro & Statut */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                      Devis {devis.numero}
                    </h1>
                    <p className="text-base text-gray-300 mb-1">{devis.titre || 'Sans titre'}</p>
                    {client && (
                      <p className="text-sm text-gray-400">
                        Client: <span className="font-medium text-gray-200">{client.nom_complet}</span>
                      </p>
                    )}
                  </div>

                  {/* Badge statut amélioré */}
                  <Badge
                    className={cn(
                      'text-xs px-3 py-1.5 font-semibold shadow-md',
                      (devis as any).statut === 'paye' && 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0',
                      devis.statut === 'accepte' && 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0',
                      devis.statut === 'envoye' && 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0',
                      devis.statut === 'refuse' && 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0',
                      devis.statut === 'brouillon' && 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0'
                    )}
                  >
                    {(devis as any).statut === 'paye' && <CheckCircle className="h-3 w-3 mr-1 inline" />}
                    {devis.statut === 'accepte' && <CheckCircle className="h-3 w-3 mr-1 inline" />}
                    {devis.statut === 'envoye' && <Send className="h-3 w-3 mr-1 inline" />}
                    {devis.statut === 'refuse' && <XCircle className="h-3 w-3 mr-1 inline" />}
                    {getStatusLabel(devis.statut || 'brouillon')}
                  </Badge>
                </div>

                {/* Infos rapides en grille améliorées */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-gradient-to-br from-[#262626] to-[#1A1A1A] rounded-lg p-3 border border-gray-700 shadow-sm hover:shadow-md hover:border-gray-600 transition-all">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">Créé le</span>
                    </div>
                    <p className="font-bold text-sm text-white">
                      {devis.created_at ? format(new Date(devis.created_at), 'dd/MM/yyyy', { locale: fr }) : '-'}
                    </p>
                  </div>

                  {devis.date_envoi && (
                    <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-lg p-3 border border-blue-700/50 shadow-sm hover:shadow-md hover:border-blue-600 transition-all">
                      <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                        <Send className="h-3 w-3" />
                        <span className="font-medium">Envoyé le</span>
                      </div>
                      <p className="font-bold text-sm text-blue-300">
                        {format(new Date(devis.date_envoi), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}

                  {devis.date_acceptation && (
                    <div className="bg-gradient-to-br from-[#1A2E1A] to-[#162E16] rounded-lg p-3 border border-green-700/50 shadow-sm hover:shadow-md hover:border-green-600 transition-all">
                      <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                        <CheckCircle className="h-3 w-3" />
                        <span className="font-medium">Accepté le</span>
                      </div>
                      <p className="font-bold text-sm text-green-300">
                        {format(new Date(devis.date_acceptation), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-[#FF4D00]/20 to-[#E64600]/10 rounded-lg p-3 border border-[#FF4D00]/50 shadow-sm hover:shadow-md hover:border-[#FF4D00] transition-all">
                    <div className="flex items-center gap-2 text-[#FF4D00] text-xs mb-1">
                      <FileText className="h-3 w-3" />
                      <span className="font-medium">Montant TTC</span>
                    </div>
                    <p className="font-bold text-base text-[#FF4D00]">{formatCurrency(devis.montant_ttc || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Client */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden !py-0">
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white px-4 py-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-semibold">Informations client</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-gray-700 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white text-lg font-bold">
                      {client ? getInitials(client.nom_complet || '') : '??'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="font-bold text-xl text-white mb-1">
                        {client?.nom_complet || 'Client inconnu'}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      {client?.email && (
                        <div className="flex items-center gap-2 p-2 bg-[#262626] rounded-lg hover:bg-[#2A2A2A] border border-gray-700 transition-colors">
                          <div className="p-1.5 bg-blue-900/30 rounded-lg border border-blue-700/50">
                            <Mail className="h-3 w-3 text-blue-400" />
                          </div>
                          <a
                            href={`mailto:${client.email}`}
                            className="text-[#FF4D00] hover:text-[#FF6D33] hover:underline font-medium text-sm"
                          >
                            {client.email}
                          </a>
                        </div>
                      )}

                      {client?.telephone && (
                        <div className="flex items-center gap-2 p-2 bg-[#262626] rounded-lg hover:bg-[#2A2A2A] border border-gray-700 transition-colors">
                          <div className="p-1.5 bg-green-900/30 rounded-lg border border-green-700/50">
                            <Phone className="h-3 w-3 text-green-400" />
                          </div>
                          <a
                            href={`tel:${client.telephone}`}
                            className="text-[#FF4D00] hover:text-[#FF6D33] hover:underline font-medium text-sm"
                          >
                            {client.telephone}
                          </a>
                        </div>
                      )}
                    </div>

                    {client?.adresse_facturation && (
                      <div className="flex items-start gap-2 p-2 bg-[#262626] rounded-lg border border-gray-700">
                        <div className="p-1.5 bg-purple-900/30 rounded-lg border border-purple-700/50 mt-0.5">
                          <MapPin className="h-3 w-3 text-purple-400" />
                        </div>
                        <p className="text-gray-300 font-medium text-sm">{client.adresse_facturation}</p>
                      </div>
                    )}

                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Détails du devis */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden !py-0">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-semibold">Détails du devis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[#1A1A1A]/50">
                <div className="space-y-3">
                  {devis.description && (
                    <div className="bg-[#262626] rounded-lg p-3 border border-gray-700 shadow-sm">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Description
                      </p>
                      <p className="text-sm text-gray-200 leading-relaxed">{devis.description}</p>
                    </div>
                  )}
                  {devis.delai_execution && (
                    <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-lg p-3 border border-blue-700/50 shadow-sm">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Délai d'exécution
                      </p>
                      <p className="text-sm font-semibold text-blue-300">{devis.delai_execution}</p>
                    </div>
                  )}
                  {devis.notes && (
                    <div className="bg-[#262626] rounded-lg p-3 border border-gray-700 shadow-sm">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Notes
                      </p>
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{devis.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card Lignes de devis */}
            <Card className="overflow-hidden !py-0">
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] via-[#FF5D1A] to-[#E64600] text-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Lignes de devis</span>
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30 flex-shrink-0">
                      {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-gradient-card-dark">
                {lignes.length > 0 ? (
                  <div className="divide-y divide-gray-800/50">
                    {lignes.map((ligne: any, index: number) => (
                      <div
                        key={ligne.id || index}
                        className="p-4 hover:bg-[#1A1A1A]/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Numéro */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white flex items-center justify-center font-bold">
                            {ligne.ordre || index + 1}
                          </div>

                          {/* Désignation */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-white mb-1 break-words">
                              {ligne.designation}
                            </h3>
                            {ligne.description_detaillee && (
                              <p className="text-sm text-gray-400 leading-relaxed mb-2 break-words">
                                {ligne.description_detaillee}
                              </p>
                            )}

                            {/* Détails ligne */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#1A1A1A] rounded-lg p-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Quantité</p>
                                <p className="font-semibold text-white text-sm">
                                  {ligne.quantite} {ligne.unite || 'u'}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Prix unitaire HT</p>
                                <p className="font-semibold text-white text-sm">
                                  {formatCurrency(ligne.prix_unitaire_ht)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">TVA</p>
                                <p className="font-semibold text-white text-sm">{ligne.tva_pct || 0}%</p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Total HT</p>
                                <p className="font-semibold text-white text-sm">
                                  {formatCurrency(ligne.quantite * ligne.prix_unitaire_ht)}
                                </p>
                              </div>

                              <div className="bg-gradient-to-br from-[#FF4D00]/20 to-[#E64600]/10 rounded-lg px-3 py-2 border border-[#FF4D00]/40">
                                <p className="text-xs text-[#FF4D00] mb-1">Total TTC</p>
                                <p className="font-bold text-[#FF4D00] text-base">
                                  {formatCurrency(ligne.quantite * ligne.prix_unitaire_ht * (1 + (ligne.tva_pct || 0) / 100))}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>Aucune ligne de travaux</p>
                  </div>
                )}

                {/* Footer totaux */}
                <div className="bg-black text-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Total HT</p>
                      <p className="text-xl font-bold">{formatCurrency(devis.montant_ht || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Total TVA</p>
                      <p className="text-xl font-bold">{formatCurrency(devis.montant_tva || 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#FF4D00] to-[#E64600] rounded-lg p-3">
                      <p className="text-xs mb-1">Total TTC</p>
                      <p className="text-2xl font-bold">{formatCurrency(devis.montant_ttc || 0)}</p>
                    </div>
                  </div>
                </div>
        </CardContent>
      </Card>

            {/* Conditions de paiement */}
            {template && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carte Conditions de paiement - Design Premium */}
          <Card className="overflow-hidden border border-gray-800/50 shadow-2xl !py-0">
            <CardHeader className="bg-gradient-to-r from-[#1A0A00] via-[#2A0A00] to-[#1A0A00] border-b border-[#FF4D00]/20 relative overflow-hidden px-4 py-3">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D00]/5 to-transparent"></div>
              <CardTitle className="flex items-center gap-3 text-white relative z-10 min-w-0">
                <div className="p-2 bg-gradient-to-br from-[#FF4D00] to-[#E64600] rounded-lg shadow-xl shadow-[#FF4D00]/30 flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold tracking-tight truncate">Conditions de paiement</h3>
                  <p className="text-xs text-gray-400 font-normal mt-0.5 truncate">Répartition des échéances</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-[#0F0F0F]">
              <div className="space-y-4">
                {/* Template Info Premium */}
                <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-gray-800">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-white mb-2 tracking-tight break-words">{template.nom}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-400 leading-relaxed break-words">{template.description}</p>
                    )}
                  </div>
                  {template.montant_min && (
                    <Badge className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white border-0 font-bold px-3 py-1.5 text-xs shadow-xl shadow-[#FF4D00]/30 flex-shrink-0">
                      {template.montant_min}€ - {template.montant_max ? `${template.montant_max}€` : '∞'}
                    </Badge>
                  )}
                </div>

                {/* Répartition Premium */}
                <div className="space-y-3">
                  {template.pourcentage_acompte > 0 && (
                    <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-[#FF4D00]/10 via-[#FF4D00]/5 to-transparent rounded-lg border border-[#FF4D00]/30 hover:border-[#FF4D00]/50 hover:bg-gradient-to-r hover:from-[#FF4D00]/15 hover:via-[#FF4D00]/10 hover:to-transparent transition-all duration-300 shadow-lg shadow-[#FF4D00]/5 flex-wrap group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white flex items-center justify-center font-bold text-base shadow-xl shadow-[#FF4D00]/30 flex-shrink-0 group-hover:shadow-[#FF4D00]/50 transition-shadow">
                          1
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base text-white mb-1">Acompte</p>
                          <p className="text-xs text-gray-400">
                            {template.delai_acompte === 0 ? 'Signature • Immédiat' : `${template.delai_acompte}j après signature`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-0">
                        <p className="text-xl font-bold text-[#FF4D00] mb-1 break-words">
                          {formatCurrency(((devis.montant_ttc || 0) * (template.pourcentage_acompte || 0)) / 100)}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{template.pourcentage_acompte}%</p>
                      </div>
                    </div>
                  )}

                  {template.pourcentage_intermediaire && template.pourcentage_intermediaire > 0 && (
                    <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-purple-900/20 via-purple-800/10 to-transparent rounded-lg border border-purple-700/30 hover:border-purple-600/50 hover:bg-gradient-to-r hover:from-purple-900/30 hover:via-purple-800/20 hover:to-transparent transition-all duration-300 shadow-lg shadow-purple-900/5 flex-wrap group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center font-bold text-base shadow-xl shadow-purple-600/30 flex-shrink-0 group-hover:shadow-purple-600/50 transition-shadow">
                          2
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base text-white mb-1">Intermédiaire</p>
                          <p className="text-xs text-gray-400">
                            Mi-parcours ({template.delai_intermediaire || 0}j)
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-0">
                        <p className="text-xl font-bold text-purple-400 mb-1 break-words">
                          {formatCurrency(((devis.montant_ttc || 0) * (template.pourcentage_intermediaire || 0)) / 100)}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{template.pourcentage_intermediaire}%</p>
                      </div>
                    </div>
                  )}

                  {template.pourcentage_solde && template.pourcentage_solde > 0 && (
                    <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-900/20 via-emerald-800/10 to-transparent rounded-lg border border-emerald-700/30 hover:border-emerald-600/50 hover:bg-gradient-to-r hover:from-emerald-900/30 hover:via-emerald-800/20 hover:to-transparent transition-all duration-300 shadow-lg shadow-emerald-900/5 flex-wrap group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xl shadow-emerald-600/30 flex-shrink-0 group-hover:shadow-emerald-600/50 transition-shadow">
                          {template.pourcentage_intermediaire ? '3' : '2'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base text-white mb-1">Solde</p>
                          <p className="text-xs text-gray-400">
                            {template.delai_solde || 0}j après livraison
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-0">
                        <p className="text-xl font-bold text-emerald-400 mb-1 break-words">
                          {formatCurrency(((devis.montant_ttc || 0) * (template.pourcentage_solde || 0)) / 100)}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{template.pourcentage_solde}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carte Décomposition des factures - Design Premium */}
          {template && (
          <Card className="overflow-hidden border border-gray-800/50 shadow-2xl !py-0">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 border-b border-blue-700/20 relative overflow-hidden px-4 py-3">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5"></div>
              <CardTitle className="flex items-center justify-between gap-3 relative z-10 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-xl shadow-blue-600/30 flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold tracking-tight text-white truncate">Décomposition des factures</h3>
                    <p className="text-xs text-gray-400 font-normal mt-0.5 truncate">Planification des échéances</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 font-bold px-3 py-1.5 text-xs shadow-xl shadow-blue-600/30 flex-shrink-0">
                  {template.nom}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-[#0F0F0F]">
              <div className="space-y-4">
                {/* Intro Premium */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent rounded-lg p-4 border border-blue-800/30">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-full blur-3xl"></div>
                  <div className="relative flex items-start justify-between gap-4 flex-wrap">
                    <p className="text-sm text-gray-300 flex-1 leading-relaxed min-w-0">
                      Selon les conditions de paiement <strong className="text-white font-semibold">{template.nom}</strong>, ce devis de{' '}
                      <strong className="text-[#FF4D00] font-bold text-base">{formatCurrency(devis.montant_ttc || 0)} TTC</strong>{' '}
                      sera facturé en{' '}
                      <strong className="text-white font-semibold">
                        {template.pourcentage_intermediaire && template.pourcentage_intermediaire > 0 ? '3' : '2'} fois
                      </strong>
                      :
                    </p>
                    {!factureAcompte && !factureIntermediaire && !factureSolde && canCreateAcompte && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="bg-[#FF4D00] hover:bg-[#E64600] text-white flex-shrink-0">
                            <Receipt className="h-4 w-4 mr-2" />
                            Générer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Générer toutes les factures</AlertDialogTitle>
                            <AlertDialogDescription>
                              Les factures seront créées selon les conditions de paiement définies :
                            </AlertDialogDescription>
                            <div className="mt-3 space-y-1">
                              {template.pourcentage_acompte > 0 && (
                                <p className="text-sm text-muted-foreground">- Facture d'acompte ({template.pourcentage_acompte}%)</p>
                              )}
                              {template.pourcentage_intermediaire && template.pourcentage_intermediaire > 0 && (
                                <p className="text-sm text-muted-foreground">- Facture intermédiaire ({template.pourcentage_intermediaire}%)</p>
                              )}
                              {template.pourcentage_solde && template.pourcentage_solde > 0 && (
                                <p className="text-sm text-muted-foreground">- Facture de solde ({template.pourcentage_solde}%)</p>
                              )}
                            </div>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCreateFactures}
                              className="bg-[#FF4D00] hover:bg-[#E64600]"
                            >
                              Générer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Facture Acompte */}
                {template.pourcentage_acompte > 0 && (
                  <div className="relative">
                    {factureAcompte && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Créée
                        </Badge>
                      </div>
                    )}

                    <div
                      className={cn(
                        'border-2 rounded-lg p-4 transition-all shadow-lg',
                        factureAcompte
                          ? 'border-green-600/50 bg-gradient-to-r from-green-900/30 via-green-800/20 to-transparent'
                          : 'border-gray-800/50 bg-gradient-to-r from-[#FF4D00]/10 via-[#FF4D00]/5 to-transparent'
                      )}
                    >
                      {/* Header avec montant inline */}
                      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white flex items-center justify-center font-bold text-base shadow-xl shadow-[#FF4D00]/30 flex-shrink-0">
                            1
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-base text-white">
                                Facture d'acompte
                              </h3>
                              <span className="text-xs font-bold text-gray-300 bg-gray-800/50 px-2 py-0.5 rounded-full whitespace-nowrap border border-gray-700">
                                {template.pourcentage_acompte}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                              <span className="whitespace-nowrap">
                                {template.delai_acompte === 0
                                  ? 'Signature'
                                  : `${template.delai_acompte}j après signature`}
                              </span>
                              <span>•</span>
                              <span className="whitespace-nowrap">{template.delai_acompte === 0 ? 'Immédiat' : 'À réception'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 min-w-0">
                          <p className="text-xl font-bold text-[#FF4D00] mb-1 break-words">
                            {formatCurrency(((devis.montant_ttc || 0) * (template.pourcentage_acompte || 0)) / 100)}
                          </p>
                          {factureAcompte && (
                            <Link
                              href={`/factures/${factureAcompte.id}`}
                              className="text-sm text-[#FF4D00] hover:text-[#FF6D33] hover:underline font-medium break-words"
                            >
                              {factureAcompte.numero} →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Statut facture si créée ou bouton pour créer */}
                      {factureAcompte ? (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={cn(
                                  factureAcompte.statut === 'payee' && 'bg-green-600/20 text-green-400 border-green-600/50',
                                  factureAcompte.statut === 'envoyee' && 'bg-blue-600/20 text-blue-400 border-blue-600/50',
                                  factureAcompte.statut === 'en_retard' && 'bg-red-600/20 text-red-400 border-red-600/50',
                                  'text-xs whitespace-nowrap border font-semibold'
                                )}
                              >
                                {factureAcompte.statut === 'payee' && 'Payée'}
                                {factureAcompte.statut === 'envoyee' && 'Envoyée'}
                                {factureAcompte.statut === 'en_retard' && 'En retard'}
                              </Badge>
                              {factureAcompte.date_paiement && (
                                <span className="text-xs text-green-400 whitespace-nowrap">
                                  le {formatDate(factureAcompte.date_paiement)}
                                </span>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs flex-shrink-0 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-700">
                              <Link href={`/factures/${factureAcompte.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : canCreateAcompte ? (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <Button 
                            onClick={handleCreateAcompte}
                            disabled={createAcompteMutation.isPending}
                            size="sm"
                            className="w-full bg-gradient-to-r from-[#FF4D00] to-[#E64600] hover:from-[#FF5D1A] hover:to-[#FF4D00] text-white h-8 text-xs font-semibold shadow-lg shadow-[#FF4D00]/30"
                          >
                            {createAcompteMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                Création...
                              </>
                            ) : (
                              <>
                                <Receipt className="h-3 w-3 mr-1.5" />
                                Créer la facture d'acompte
                              </>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Facture Intermédiaire (si existe) */}
                {template.pourcentage_intermediaire && template.pourcentage_intermediaire > 0 && (
                  <div className="relative">
                    {factureIntermediaire && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Créée
                        </Badge>
                      </div>
                    )}

                    <div
                      className={cn(
                        'border-2 rounded-lg p-4 transition-all shadow-lg',
                        factureIntermediaire
                          ? 'border-green-600/50 bg-gradient-to-r from-green-900/30 via-green-800/20 to-transparent'
                          : 'border-gray-800/50 bg-gradient-to-r from-purple-900/20 via-purple-800/10 to-transparent'
                      )}
                    >
                      {/* Header avec montant inline */}
                      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center font-bold text-base shadow-xl shadow-purple-600/30 flex-shrink-0">
                            2
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-base text-white">
                                Facture intermédiaire
                              </h3>
                              <span className="text-xs font-bold text-gray-300 bg-gray-800/50 text-purple-300 px-2 py-0.5 rounded-full whitespace-nowrap border border-purple-700/50">
                                {template.pourcentage_intermediaire}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                              <span className="whitespace-nowrap">Mi-parcours ({template.delai_intermediaire || 0}j)</span>
                              <span>•</span>
                              <span className="whitespace-nowrap">À réception</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 min-w-0">
                          <p className="text-xl font-bold text-purple-400 mb-1 break-words">
                            {formatCurrency(((devis.montant_ttc || 0) * (template.pourcentage_intermediaire || 0)) / 100)}
                          </p>
                          {factureIntermediaire && (
                            <Link
                              href={`/factures/${factureIntermediaire.id}`}
                              className="text-sm text-[#FF4D00] hover:text-[#FF6D33] hover:underline font-medium break-words"
                            >
                              {factureIntermediaire.numero} →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Statut ou bouton */}
                      {factureIntermediaire ? (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <Badge
                              className={cn(
                                factureIntermediaire.statut === 'payee' && 'bg-green-600/20 text-green-400 border-green-600/50',
                                factureIntermediaire.statut === 'envoyee' && 'bg-blue-600/20 text-blue-400 border-blue-600/50',
                                factureIntermediaire.statut === 'en_retard' && 'bg-red-600/20 text-red-400 border-red-600/50',
                                'text-xs whitespace-nowrap border font-semibold'
                              )}
                            >
                              {factureIntermediaire.statut === 'payee' && 'Payée'}
                              {factureIntermediaire.statut === 'envoyee' && 'Envoyée'}
                              {factureIntermediaire.statut === 'en_retard' && 'En retard'}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs flex-shrink-0 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-700">
                              <Link href={`/factures/${factureIntermediaire.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : canCreateIntermediaire ? (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <Button 
                            onClick={handleCreateIntermediaire}
                            disabled={createIntermediaireMutation.isPending}
                            size="sm"
                            className="w-full bg-gradient-to-r from-[#FF4D00] to-[#E64600] hover:from-[#FF5D1A] hover:to-[#FF4D00] text-white h-8 text-xs font-semibold shadow-lg shadow-[#FF4D00]/30"
                          >
                            {createIntermediaireMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                Création...
                              </>
                            ) : (
                              <>
                                <Receipt className="h-3 w-3 mr-1.5" />
                                Créer la facture intermédiaire
                              </>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Facture Solde */}
                {template.pourcentage_solde && template.pourcentage_solde > 0 && (
                  <div className="relative">
                    {factureSolde && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Créée
                        </Badge>
                      </div>
                    )}

                    <div
                      className={cn(
                        'border-2 rounded-lg p-4 transition-all shadow-lg',
                        factureSolde
                          ? 'border-green-600/50 bg-gradient-to-r from-green-900/30 via-green-800/20 to-transparent'
                          : 'border-gray-800/50 bg-gradient-to-r from-emerald-900/20 via-emerald-800/10 to-transparent'
                      )}
                    >
                      {/* Header avec montant inline */}
                      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xl shadow-emerald-600/30 flex-shrink-0">
                            {template.pourcentage_intermediaire ? '3' : '2'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-base text-white">
                                Facture de solde
                              </h3>
                              <span className="text-xs font-bold text-gray-300 bg-gray-800/50 text-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap border border-emerald-700/50">
                                {template.pourcentage_solde}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                              <span className="whitespace-nowrap">Fin des travaux</span>
                              <span>•</span>
                              <span className="whitespace-nowrap">{template.delai_solde || 0}j après livraison</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 min-w-0">
                          <p className="text-xl font-bold text-emerald-400 mb-1 break-words">
                            {formatCurrency(((devis.montant_ttc || 0) * (template.pourcentage_solde || 0)) / 100)}
                          </p>
                          {factureSolde && (
                            <Link
                              href={`/factures/${factureSolde.id}`}
                              className="text-sm text-[#FF4D00] hover:text-[#FF6D33] hover:underline font-medium break-words"
                            >
                              {factureSolde.numero} →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Statut ou bouton */}
                      {factureSolde ? (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <Badge
                              className={cn(
                                factureSolde.statut === 'payee' && 'bg-green-600/20 text-green-400 border-green-600/50',
                                factureSolde.statut === 'envoyee' && 'bg-blue-600/20 text-blue-400 border-blue-600/50',
                                factureSolde.statut === 'en_retard' && 'bg-red-600/20 text-red-400 border-red-600/50',
                                factureSolde.statut === 'brouillon' && 'bg-gray-600/20 text-gray-400 border-gray-600/50',
                                'text-xs whitespace-nowrap border font-semibold'
                              )}
                            >
                              {factureSolde.statut === 'brouillon' && 'En attente'}
                              {factureSolde.statut === 'envoyee' && 'Envoyée'}
                              {factureSolde.statut === 'payee' && 'Payée'}
                              {factureSolde.statut === 'en_retard' && 'En retard'}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs flex-shrink-0 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-700">
                              <Link href={`/factures/${factureSolde.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : canCreateSolde ? (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <Button 
                            onClick={handleCreateSolde}
                            disabled={createSoldeMutation.isPending}
                            size="sm"
                            className="w-full bg-gradient-to-r from-[#FF4D00] to-[#E64600] hover:from-[#FF5D1A] hover:to-[#FF4D00] text-white h-8 text-xs font-semibold shadow-lg shadow-[#FF4D00]/30"
                          >
                            {createSoldeMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                Création...
                              </>
                            ) : (
                              <>
                                <Receipt className="h-3 w-3 mr-1.5" />
                                Créer la facture de solde
                              </>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}
              </div>
            )}

          </div>

          {/* Colonne droite (1/3) - Sidebar */}
          <div className="space-y-6">
            {/* Card Récapitulatif */}
            <Card className="bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white shadow-2xl border border-orange-600/30 overflow-hidden">
              <CardHeader className="px-4 py-3 bg-black/20 border-b border-white/10">
                <CardTitle className="text-lg font-bold">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/90 font-medium">Total HT</span>
                    <span className="font-bold text-lg">{formatCurrency(devis.montant_ht || 0)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/90 font-medium">TVA</span>
                    <span className="font-bold text-lg">{formatCurrency(devis.montant_tva || 0)}</span>
                  </div>
                </div>

                <Separator className="bg-white/30" />

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total TTC</span>
                    <span className="text-2xl font-bold">{formatCurrency(devis.montant_ttc || 0)}</span>
                  </div>
                </div>

                {/* Statut visuel amélioré */}
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-xs text-white/80 mb-3 font-medium uppercase tracking-wide">Statut</p>
                  <div className="flex items-center gap-3">
                    {getDisplayedStatus() === 'expire' ? (
                      <>
                        <div className="p-2 bg-orange-500/30 rounded-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Expiré</span>
                      </>
                    ) : getDisplayedStatus() === 'accepte' ? (
                      <>
                        <div className="p-2 bg-green-500/30 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Accepté</span>
                      </>
                    ) : getDisplayedStatus() === 'envoye' ? (
                      <>
                        <div className="p-2 bg-blue-500/30 rounded-lg">
                          <Send className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Envoyé</span>
                      </>
                    ) : getDisplayedStatus() === 'refuse' ? (
                      <>
                        <div className="p-2 bg-red-500/30 rounded-lg">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Refusé</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-gray-500/30 rounded-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Brouillon</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Actions rapides */}
            <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white shadow-2xl border-0 !py-0">
              <CardHeader className="px-4 py-3 pb-3">
                <CardTitle className="text-lg font-bold">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="secondary" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-200 font-medium" 
                  asChild
                >
                  <Link href={`/devis/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier le devis
                  </Link>
                </Button>

                <Separator className="bg-gray-700/50" />

                <Button 
                  variant="secondary" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-200 font-medium" 
                  onClick={handleVoirPDF}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Voir le PDF
                </Button>

                <Button 
                  variant="secondary" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-200 font-medium" 
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>

                <Button 
                  variant="secondary" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-200 font-medium" 
                  onClick={handleDupliquer}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </Button>

                <Separator className="bg-gray-700/50" />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le devis ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le devis sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Factures liées - Sidebar */}
            {facturesSummary && (factureAcompte || factureIntermediaire || factureSolde) && (
              <Card className="!py-0">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Factures liées
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {factureAcompte && (
                      <Link
                        href={`/factures/${factureAcompte.id}`}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-black">{factureAcompte.numero}</p>
                          <p className="text-xs text-orange-700 mt-1">Acompte</p>
                        </div>
                        <Eye className="h-4 w-4 text-[#FF4D00]" />
                      </Link>
                    )}
                    {factureIntermediaire && (
                      <Link
                        href={`/factures/${factureIntermediaire.id}`}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-black">{factureIntermediaire.numero}</p>
                          <p className="text-xs text-purple-700 mt-1">Intermédiaire</p>
                        </div>
                        <Eye className="h-4 w-4 text-[#FF4D00]" />
                      </Link>
                    )}
                    {factureSolde && (
                      <Link
                        href={`/factures/${factureSolde.id}`}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-black">{factureSolde.numero}</p>
                          <p className="text-xs text-green-700 mt-1">Solde</p>
                        </div>
                        <Eye className="h-4 w-4 text-[#FF4D00]" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card Adresse du chantier - Sidebar */}
            {devis.adresse_chantier && (
              <Card className="!py-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Adresse du chantier
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-black break-words">{devis.adresse_chantier}</p>
                    </div>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
                      size="sm"
                      onClick={() => {
                        const encodedAddress = encodeURIComponent(devis.adresse_chantier || '')
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline/Historique */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 !py-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white px-4 py-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-semibold">Historique</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]">
                <div className="space-y-2">
                  {historyEvents.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Aucun événement</p>
                  ) : (
                    historyEvents.map((event, index) => {
                      const isLast = index === historyEvents.length - 1
                      const getIcon = () => {
                        switch (event.type) {
                          case 'creation':
                            return <Plus className="h-4 w-4 text-white" />
                          case 'modification':
                            return <Edit className="h-4 w-4 text-white" />
                          case 'envoi':
                            return <Send className="h-4 w-4 text-white" />
                          case 'acceptation':
                            return <CheckCircle className="h-4 w-4 text-white" />
                          case 'refus':
                            return <XCircle className="h-4 w-4 text-white" />
                          case 'paye':
                            return <CheckCircle className="h-4 w-4 text-white" />
                          case 'facture':
                            return <Receipt className="h-4 w-4 text-white" />
                          default:
                            return <Clock className="h-4 w-4 text-white" />
                        }
                      }

                      const getBgColor = () => {
                        switch (event.type) {
                          case 'creation':
                            return 'from-gray-600 to-gray-700'
                          case 'modification':
                            return 'from-blue-600 to-blue-700'
                          case 'envoi':
                            return 'from-[#FF4D00] to-[#E64600]'
                          case 'acceptation':
                            return 'from-green-600 to-green-700'
                          case 'refus':
                            return 'from-red-600 to-red-700'
                          case 'paye':
                            return 'from-emerald-600 to-emerald-700'
                          case 'facture':
                            return 'from-purple-600 to-purple-700'
                          default:
                            return 'from-gray-600 to-gray-700'
                        }
                      }

                      const getCardBg = () => {
                        switch (event.type) {
                          case 'creation':
                            return 'bg-[#262626] border-gray-700'
                          case 'modification':
                            return 'bg-gradient-to-r from-blue-900/20 to-blue-900/10 border-blue-700/30'
                          case 'envoi':
                            return 'bg-gradient-to-r from-[#FF4D00]/10 to-[#FF4D00]/5 border-[#FF4D00]/30'
                          case 'acceptation':
                            return 'bg-gradient-to-r from-green-900/20 to-green-900/10 border-green-700/30'
                          case 'refus':
                            return 'bg-gradient-to-r from-red-900/20 to-red-900/10 border-red-700/30'
                          case 'paye':
                            return 'bg-gradient-to-r from-emerald-900/20 to-emerald-900/10 border-emerald-700/30'
                          case 'facture':
                            return 'bg-gradient-to-r from-purple-900/20 to-purple-900/10 border-purple-700/30'
                          default:
                            return 'bg-[#262626] border-gray-700'
                        }
                      }

                      const getTextColor = () => {
                        switch (event.type) {
                          case 'creation':
                            return 'text-white'
                          case 'modification':
                            return 'text-blue-300'
                          case 'envoi':
                            return 'text-[#FF4D00]'
                          case 'acceptation':
                            return 'text-green-300'
                          case 'refus':
                            return 'text-red-300'
                          case 'paye':
                            return 'text-emerald-300'
                          case 'facture':
                            return 'text-purple-300'
                          default:
                            return 'text-white'
                        }
                      }

                      return (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getBgColor()} flex items-center justify-center shadow-md`}>
                              {getIcon()}
                            </div>
                            {!isLast && (
                              <div className={`w-1 h-full bg-gradient-to-b ${getBgColor()}/50 my-1 rounded-full`} />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className={`rounded-lg p-2.5 border shadow-sm ${getCardBg()}`}>
                              <p className={`text-sm font-bold mb-0.5 ${getTextColor()}`}>
                                {event.label}
                                {event.factureNumero && (
                                  <span className="ml-2 text-xs text-gray-400">({event.factureNumero})</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">
                                {format(event.date, "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}