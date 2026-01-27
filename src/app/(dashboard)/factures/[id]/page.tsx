'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useFactureById, useUpdateFactureStatus, useDeleteFacture } from '@/lib/hooks/use-factures'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { cn, formatCurrency, formatDate, getInitials, isOverdue } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  Copy,
  FileText,
  XCircle,
  Plus,
  Bell,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function FactureDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Récupérer facture complète
  const { data: facture, isLoading } = useFactureById(id)
  const markAsPaidMutation = useUpdateFactureStatus()
  const deleteFactureMutation = useDeleteFacture()

  // Déterminer le type de facture à partir du numéro
  const getFactureType = (numero: string) => {
    if (numero.endsWith('-A')) return 'acompte'
    if (numero.endsWith('-I')) return 'intermediaire'
    if (numero.endsWith('-S')) return 'solde'
    return 'standalone'
  }

  const factureType = facture ? getFactureType(facture.numero) : 'standalone'

  // Marquer comme payée
  const handleMarkAsPaid = () => {
    markAsPaidMutation.mutate(
      { factureId: id, statut: 'payee' },
      {
        onSuccess: () => {
          toast.success('Facture marquée comme payée')
        },
        onError: () => {
          toast.error('Erreur lors de la mise à jour')
        },
      }
    )
  }

  // Supprimer facture
  const handleDelete = () => {
    deleteFactureMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Facture supprimée')
        router.push('/factures')
      },
      onError: () => {
        toast.error('Erreur lors de la suppression')
      },
    })
  }

  // Télécharger PDF
  const handleTelechargerPDF = () => {
    window.open(`/api/pdf/facture/${id}`, '_blank')
  }

  // Dupliquer facture
  const handleDupliquer = () => {
    toast.info('Fonctionnalité à venir')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-black-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!facture) {
    return (
      <div className="min-h-screen bg-gradient-black-orange flex items-center justify-center">
        <Card className="max-w-md shadow-xl border-2 border-gray-800 bg-gradient-card-dark">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Facture non trouvée</h2>
            <p className="text-gray-400 mb-6">La facture que vous recherchez n'existe pas ou a été supprimée.</p>
            <Link href="/factures">
              <Button className="bg-[#FF4D00] hover:bg-[#E64600] shadow-md hover:shadow-lg transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux factures
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculer jours de retard
  const joursRetard =
    facture.statut === 'en_retard' && facture.date_echeance
      ? differenceInDays(new Date(), new Date(facture.date_echeance))
      : 0

  // Vérifier si en retard
  const isLate = facture.statut === 'envoyee' && facture.date_echeance && isOverdue(facture.date_echeance)

  const client = facture.clients as any
  const lignes = Array.isArray(facture.lignes_factures) ? facture.lignes_factures : []

  return (
    <div className="min-h-screen bg-gradient-black-orange">
      {/* Header sticky */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm min-w-0 flex-1">
              <Link href="/dashboard" className="text-gray-400 hover:text-[#FF4D00] truncate">
                Dashboard
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
              <Link href="/factures" className="text-gray-400 hover:text-[#FF4D00] truncate">
                Factures
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
              <span className="font-semibold text-white truncate">{facture.numero}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleTelechargerPDF} className="bg-[#1A1A1A] text-white border-gray-700 hover:bg-[#262626] hover:border-gray-600 flex-1 sm:flex-initial text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Télécharger PDF</span>
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
                  <Link href={`/factures/${facture.id}/edit`}>
                    <DropdownMenuItem className="text-white hover:bg-[#262626] focus:bg-[#262626]">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier la facture
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleDupliquer} className="text-white hover:bg-[#262626] focus:bg-[#262626]">
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  {facture.statut !== 'payee' && (
                    <DropdownMenuItem onClick={handleMarkAsPaid} className="text-white hover:bg-[#262626] focus:bg-[#262626]">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer comme payée
                    </DropdownMenuItem>
                  )}
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
                    <AlertDialogContent className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Supprimer la facture ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Cette action est irréversible. La facture sera définitivement supprimée.
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Colonne gauche (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Statut & Vue d'ensemble */}
            <Card
              className={cn(
                'border-t-4 shadow-lg',
                facture.statut === 'payee' && 'border-t-green-500',
                facture.statut === 'envoyee' && 'border-t-blue-500',
                (facture.statut === 'en_retard' || isLate) && 'border-t-red-500',
                facture.statut === 'brouillon' && 'border-t-gray-500'
              )}
            >
              <CardContent className="p-3 sm:p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]">
                {/* Numéro & Statut */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 truncate">
                      Facture {facture.numero}
                    </h1>
                    <p className="text-gray-400">{facture.titre || 'Sans titre'}</p>
                    <Badge variant="outline" className="mt-2 capitalize text-xs bg-[#262626] text-gray-300 border-gray-700">
                      {factureType}
                    </Badge>
                  </div>

                  {/* Badge statut */}
                  <Badge
                    className={cn(
                      'text-sm px-4 py-2 border',
                      facture.statut === 'payee' && 'bg-green-900/30 text-green-400 border-green-800/50',
                      facture.statut === 'envoyee' && !isLate && 'bg-blue-900/30 text-blue-400 border-blue-800/50',
                      (facture.statut === 'en_retard' || isLate) && 'bg-red-900/30 text-red-400 border-red-800/50',
                      facture.statut === 'brouillon' && 'bg-gray-800 text-gray-400 border-gray-700'
                    )}
                  >
                    {(facture.statut === 'payee' || facture.statut === 'envoyee') && (
                      <CheckCircle className="h-4 w-4 mr-2 inline" />
                    )}
                    {(facture.statut === 'en_retard' || isLate) && (
                      <AlertCircle className="h-4 w-4 mr-2 inline" />
                    )}
                    {facture.statut === 'payee' && 'Payée'}
                    {facture.statut === 'envoyee' && !isLate && 'Envoyée'}
                    {(facture.statut === 'en_retard' || isLate) && 'En retard'}
                    {facture.statut === 'brouillon' && 'Brouillon'}
                  </Badge>
                </div>

                {/* Alerte retard */}
                {(facture.statut === 'en_retard' || isLate) && facture.date_echeance && (
                  <div className="bg-red-900/30 border-2 border-red-800/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-300">
                          Facture en retard de {joursRetard > 0 ? joursRetard : 1} jour
                          {joursRetard > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-red-400 mt-1">
                          Échéance dépassée depuis le{' '}
                          {format(new Date(facture.date_echeance), 'dd MMMM yyyy', {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                        <Bell className="h-4 w-4 mr-2" />
                        Relancer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Infos rapides en grille */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#262626] rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Calendar className="h-4 w-4" />
                      Émise le
                    </div>
                    <p className="font-semibold text-white">
                      {format(new Date(facture.date_emission), 'dd/MM/yyyy', {
                        locale: fr,
                      })}
                    </p>
                  </div>

                  {facture.date_echeance && (
                    <div
                      className={cn(
                        'rounded-lg p-4 border',
                        (facture.statut === 'en_retard' || isLate)
                          ? 'bg-red-900/30 border-red-800/50'
                          : 'bg-[#262626] border-gray-800'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2 text-sm mb-1',
                          (facture.statut === 'en_retard' || isLate)
                            ? 'text-red-400'
                            : 'text-gray-400'
                        )}
                      >
                        <Clock className="h-4 w-4" />
                        Échéance
                      </div>
                      <p
                        className={cn(
                          'font-semibold',
                          (facture.statut === 'en_retard' || isLate)
                            ? 'text-red-300'
                            : 'text-white'
                        )}
                      >
                        {format(new Date(facture.date_echeance), 'dd/MM/yyyy', {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  )}

                  {facture.date_paiement && (
                    <div className="bg-green-900/30 border border-green-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                        <CheckCircle className="h-4 w-4" />
                        Payée le
                      </div>
                      <p className="font-semibold text-green-300">
                        {format(new Date(facture.date_paiement), 'dd/MM/yyyy', {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  )}

                  {facture.devis_id && (
                    <div className="bg-gradient-to-r from-[#FF4D00]/20 to-[#E64600]/20 border border-[#FF4D00]/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-[#FF4D00] text-sm mb-1">
                        <FileText className="h-4 w-4" />
                        Devis lié
                      </div>
                      <Link
                        href={`/devis/${facture.devis_id}`}
                        className="font-semibold text-[#FF4D00] hover:text-[#FF6D33] hover:underline"
                      >
                        Voir le devis
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card Client */}
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
                      {client ? getInitials(client.nom_complet || '') : '??'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="font-bold text-xl text-white">
                        {client?.nom_complet || 'Client inconnu'}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      {client?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${client.email}`}
                            className="text-[#FF4D00] hover:underline"
                          >
                            {client.email}
                          </a>
                        </div>
                      )}

                      {client?.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a
                            href={`tel:${client.telephone}`}
                            className="text-[#FF4D00] hover:underline"
                          >
                            {client.telephone}
                          </a>
                        </div>
                      )}
                    </div>

                    {client?.adresse_facturation && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-gray-400">{client.adresse_facturation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Lignes de facture */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5" />
                    Détails de facturation
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                      {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]">
                {lignes.length > 0 ? (
                  <div className="divide-y divide-gray-800">
                    {lignes.map((ligne: any, index: number) => (
                      <div
                        key={ligne.id}
                        className="p-6 hover:bg-[#262626] transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Numéro */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF4D00] text-white flex items-center justify-center font-bold">
                            {ligne.ordre || index + 1}
                          </div>

                          {/* Désignation */}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-white mb-1">
                              {ligne.designation}
                            </h3>
                            {ligne.description_detaillee && (
                              <p className="text-sm text-gray-400 leading-relaxed">
                                {ligne.description_detaillee}
                              </p>
                            )}

                            {/* Détails ligne */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-[#262626] rounded-lg p-4 mt-3 border border-gray-800">
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Quantité</p>
                                <p className="font-semibold text-white">
                                  {ligne.quantite} {ligne.unite}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-400 mb-1">Prix unitaire HT</p>
                                <p className="font-semibold text-white">
                                  {formatCurrency(ligne.prix_unitaire_ht)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-400 mb-1">TVA</p>
                                <p className="font-semibold text-white">{ligne.tva_pct}%</p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-400 mb-1">Total HT</p>
                                <p className="font-semibold text-white">
                                  {formatCurrency(ligne.total_ht)}
                                </p>
                              </div>

                              <div className="bg-gradient-to-r from-[#FF4D00]/20 to-[#E64600]/20 rounded px-3 py-2 border border-[#FF4D00]/30">
                                <p className="text-xs text-[#FF4D00] mb-1">Total TTC</p>
                                <p className="font-bold text-lg text-[#FF4D00]">
                                  {formatCurrency(ligne.total_ttc)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-400">
                    <p>Aucune ligne de facturation</p>
                  </div>
                )}

                {/* Footer totaux */}
                <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 border-t border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total HT</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(facture.montant_ht)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total TVA</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(facture.montant_tva)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] rounded-lg p-4">
                      <p className="text-sm mb-1 text-white/90">Total TTC</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(facture.montant_ttc)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite (1/3) - Sidebar */}
          <div className="space-y-6">
            {/* Card Montants */}
            <Card className="sticky top-24 bg-gradient-to-br from-[#FF4D00] to-[#E64600] text-white border border-[#FF4D00]">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-white">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <div className="flex justify-between items-center">
                  <span>Total HT</span>
                  <span className="font-semibold">{formatCurrency(facture.montant_ht)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>TVA</span>
                  <span className="font-semibold">{formatCurrency(facture.montant_tva)}</span>
                </div>

                <Separator className="bg-orange-400" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total TTC</span>
                  <span className="text-2xl font-bold">{formatCurrency(facture.montant_ttc)}</span>
                </div>

                {/* Statut visuel */}
                <div className="bg-white/20 rounded-lg p-3 mt-4">
                  <p className="text-sm mb-1">Statut de paiement</p>
                  <div className="flex items-center gap-2">
                    {facture.statut === 'payee' ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Payée</span>
                      </>
                    ) : (facture.statut === 'en_retard' || isLate) ? (
                      <>
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">
                          En retard ({joursRetard > 0 ? joursRetard : 1}j)
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold">En attente</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Actions rapides */}
            <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] text-white border border-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3">
                <CardTitle className="text-white">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                {facture.statut !== 'payee' && (
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={handleMarkAsPaid}
                    disabled={markAsPaidMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme payée
                  </Button>
                )}

                {(facture.statut === 'en_retard' || isLate) && (
                  <Button className="w-full bg-red-500 hover:bg-red-600">
                    <Bell className="h-4 w-4 mr-2" />
                    Relancer le client
                  </Button>
                )}

                <Separator className="bg-gray-700" />

                <Button variant="secondary" className="w-full bg-[#262626] text-white border border-gray-700 hover:bg-[#333] hover:border-gray-600" onClick={handleTelechargerPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>

                <Button variant="secondary" className="w-full bg-[#262626] text-white border border-gray-700 hover:bg-[#333] hover:border-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  Renvoyer par email
                </Button>

                <Button variant="secondary" className="w-full bg-[#262626] text-white border border-gray-700 hover:bg-[#333] hover:border-gray-600" onClick={handleDupliquer}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </Button>

                <Separator className="bg-gray-700" />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Supprimer la facture ?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Cette action est irréversible. La facture sera définitivement supprimée.
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
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#FF4D00] to-[#E64600] text-white px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5" />
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]">
                <div className="space-y-4">
                  {/* Création */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center border border-gray-700">
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                      {facture.statut !== 'brouillon' && (
                        <div className="w-0.5 h-full bg-gradient-to-b from-gray-700 to-[#FF4D00]/30 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-semibold text-white">Facture créée</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(facture.created_at), "dd MMM yyyy 'à' HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Envoi */}
                  {facture.statut !== 'brouillon' && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF4D00]/10 to-[#E64600]/10 flex items-center justify-center border border-[#FF4D00]/30">
                          <Send className="h-4 w-4 text-[#FF4D00]" />
                        </div>
                        {facture.date_paiement && (
                          <div className="w-0.5 h-full bg-gradient-to-b from-[#FF4D00]/30 to-green-900/30 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-semibold text-[#FF4D00]">Facture envoyée</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(facture.date_emission), "dd MMM yyyy 'à' HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Paiement */}
                  {facture.date_paiement && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-900/30 to-green-800/30 flex items-center justify-center border border-green-800/50">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-semibold text-green-400">Facture payée</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(facture.date_paiement), "dd MMM yyyy 'à' HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
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