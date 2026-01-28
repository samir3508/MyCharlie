'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useClients } from '@/lib/hooks/use-clients'
import { useDevis } from '@/lib/hooks/use-devis'
import { useCreateFacture } from '@/lib/hooks/use-factures'
import { FactureForm } from '@/components/factures/facture-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Search } from 'lucide-react'

function NewFactureForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tenant } = useAuth()
  const { data: clients, isLoading: clientsLoading } = useClients(tenant?.id)
  const { data: devis, isLoading: devisLoading } = useDevis(tenant?.id)
  const createFacture = useCreateFacture()
  const devisIdFromUrl = searchParams.get('devis_id')
  const [selectedDevis, setSelectedDevis] = useState<string>(devisIdFromUrl || '')
  const [devisSearch, setDevisSearch] = useState('')
  
  // Filtrer les devis par numéro ou nom client (toujours inclure le devis sélectionné)
  const filteredDevis = devis
    ? devis.filter((d) => {
        const q = devisSearch.trim().toLowerCase()
        if (!q) return true
        if (selectedDevis && selectedDevis !== 'empty' && d.id === selectedDevis) return true
        const num = (d.numero ?? '').toLowerCase()
        const tit = (d.titre ?? '').toLowerCase()
        const clientName = (d as { client_name?: string }).client_name ?? ''
        const clientNom = clients?.find((c) => c.id === d.client_id)?.nom ?? ''
        return num.includes(q) || tit.includes(q) || clientName.toLowerCase().includes(q) || clientNom.toLowerCase().includes(q)
      })
    : []
  
  // Pré-sélectionner le devis depuis l'URL
  useEffect(() => {
    if (devisIdFromUrl && devis && devis.length > 0) {
      const devisExists = devis.find(d => d.id === devisIdFromUrl)
      if (devisExists) {
        setSelectedDevis(devisIdFromUrl)
      }
    }
  }, [devisIdFromUrl, devis])

  const handleSubmit = async (data: {
    client_id: string
    titre?: string
    description?: string
    notes?: string
    lignes: {
      designation: string
      description_detaillee?: string
      quantite: number
      unite: string
      prix_unitaire_ht: number
      tva_pct: number
    }[]
  }) => {
    if (!tenant?.id) return

    try {
      const result = await createFacture.mutateAsync({
        facture: {
          tenant_id: tenant.id,
          client_id: data.client_id,
          numero: '', // Will be generated
          titre: data.titre,
          description: data.description,
          notes: data.notes,
          statut: 'brouillon',
          date_emission: new Date().toISOString().split('T')[0],
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        lignes: data.lignes.map((ligne, index) => ({
          ordre: index + 1,
          designation: ligne.designation,
          description_detaillee: ligne.description_detaillee,
          quantite: ligne.quantite,
          unite: ligne.unite,
          prix_unitaire_ht: ligne.prix_unitaire_ht,
          tva_pct: ligne.tva_pct,
        })),
      })

      toast.success('Facture créée avec succès')
      router.push(`/factures/${result.id}`)
    } catch {
      toast.error('Erreur lors de la création de la facture')
    }
  }

  // Get default values from selected devis
  const getDefaultValues = () => {
    if (!selectedDevis || selectedDevis === 'empty' || !devis) return undefined
    
    const selectedDevisData = devis.find(d => d.id === selectedDevis)
    if (!selectedDevisData) return undefined

    return {
      client_id: selectedDevisData.client_id,
      titre: selectedDevisData.titre ? `Facture - ${selectedDevisData.titre}` : undefined,
      description: selectedDevisData.description || undefined,
      notes: selectedDevisData.notes || undefined,
      lignes: (selectedDevisData as any).lignes_devis?.map((ligne: any) => ({
        designation: ligne.designation,
        description_detaillee: ligne.description_detaillee || undefined,
        quantite: ligne.quantite,
        unite: ligne.unite,
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        tva_pct: ligne.tva_pct,
      })) || []
    }
  }

  if (clientsLoading || devisLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Link href="/factures">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux factures
          </Button>
        </Link>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Aucun client
          </h2>
          <p className="text-muted-foreground mb-6">
            Vous devez créer un client avant de pouvoir créer une facture.
          </p>
          <Link href="/clients">
            <Button>Créer un client</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/factures">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux factures
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>
            Nouvelle facture
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez une nouvelle facture pour votre client
          </p>
        </div>
      </div>

      {/* Option to create from devis */}
      {devis && devis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Créer depuis un devis
            </CardTitle>
            <CardDescription>
              Sélectionnez un devis pour pré-remplir la facture. Recherche par numéro ou nom du client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou nom client…"
                value={devisSearch}
                onChange={(e) => setDevisSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedDevis} onValueChange={setSelectedDevis}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un devis (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Créer une facture vierge</SelectItem>
                {filteredDevis.map((dev) => {
                  const client = clients?.find(c => c.id === dev.client_id)
                  return (
                    <SelectItem key={dev.id} value={dev.id}>
                      <div className="flex flex-col">
                        <span>{dev.numero} - {dev.titre || 'Sans titre'}</span>
                        <span className="text-sm text-muted-foreground">
                          {client?.nom ?? (dev as { client_name?: string }).client_name ?? 'Client inconnu'} - {dev.created_at ? new Date(dev.created_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <FactureForm
        clients={clients}
        onSubmit={handleSubmit}
        isLoading={createFacture.isPending}
        submitButtonText="Créer la facture"
        defaultValues={getDefaultValues()}
      />
    </div>
  )
}

export default function NewFacturePage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    }>
      <NewFactureForm />
    </Suspense>
  )
}
