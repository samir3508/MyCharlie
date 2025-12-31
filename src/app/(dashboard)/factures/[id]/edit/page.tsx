'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useClients } from '@/lib/hooks/use-clients'
import { useFactureById } from '@/lib/hooks/use-factures'
import { FactureForm } from '@/components/factures/facture-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getFactureUrl } from '@/lib/utils/urls'

export default function FactureEditPage() {
  const params = useParams()
  const [id, setId] = useState<string>('')
  const { tenant } = useAuth()
  const { data: clients, isLoading: clientsLoading } = useClients(tenant?.id)
  const { data: facture, isLoading: factureLoading, error: factureError } = useFactureById(id)

  useEffect(() => {
    const getId = async () => {
      const { id: factureId } = await params
      if (factureId) setId(factureId as string)
    }
    getId()
  }, [params])

  console.log('🔍 Facture à modifier:', facture)
  console.log('🔍 lignes_factures:', facture?.lignes_factures)
  console.log('🔍 Nombre de lignes_factures:', facture?.lignes_factures?.length || 0)

  const handleSubmit = async (data: any) => {
    if (!tenant?.id || !id) return

    console.log('Tentative de modification facture:', { factureId: id, data, tenantId: tenant.id })

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Calculer les totaux
      const totals = data.lignes.reduce(
        (acc: any, ligne: any) => ({
          montant_ht: acc.montant_ht + (ligne.quantite * ligne.prix_unitaire_ht),
          montant_tva: acc.montant_tva + (ligne.quantite * ligne.prix_unitaire_ht * (ligne.tva_pct || 10) / 100),
        }),
        { montant_ht: 0, montant_tva: 0 }
      )

      // Update facture
      const { error: factureError } = await supabase
        .from('factures')
        .update({
          client_id: data.client_id,
          titre: data.titre || null,
          adresse_chantier: data.adresse_chantier || null,
          delai_execution: data.delai_execution || null,
          notes: data.notes || null,
          date_echeance: data.date_echeance || null,
          montant_ht: totals.montant_ht,
          montant_tva: totals.montant_tva,
          montant_ttc: totals.montant_ht + totals.montant_tva,
        })
        .eq('id', id)

      if (factureError) throw factureError

      // Delete old lines and insert new ones
      await supabase
        .from('lignes_factures')
        .delete()
        .eq('facture_id', id)

      if (data.lignes.length > 0) {
        const lignesData = data.lignes.map((ligne: any, index: number) => ({
          facture_id: id,
          ordre: index + 1,
          designation: ligne.designation,
          description_detaillee: ligne.description_detaillee || null,
          quantite: ligne.quantite,
          unite: ligne.unite,
          prix_unitaire_ht: ligne.prix_unitaire_ht,
          tva_pct: ligne.tva_pct
        }))

        const { error: lignesError } = await supabase
          .from('lignes_factures')
          .insert(lignesData)

        if (lignesError) throw lignesError
      }

      console.log('Facture modifiée avec succès')
      toast.success('Facture modifiée avec succès')
      
      // Redirect to facture page
      window.location.href = getFactureUrl(id)
    } catch (error: any) {
      console.error('Erreur modification facture:', error)
      toast.error(`Erreur: ${error?.message || 'Erreur inconnue'}`)
    }
  }

  // Préparer les données initiales pour le formulaire
  const initialData = facture ? {
    client_id: facture.client_id,
    titre: facture.titre || '',
    adresse_chantier: facture.adresse_chantier || '',
    delai_execution: facture.delai_execution || '',
    notes: facture.notes || '',
    date_echeance: facture.date_echeance || '',
    lignes: facture.lignes_factures?.map((ligne: any) => ({
      designation: ligne.designation,
      description_detaillee: ligne.description_detaillee || '',
      quantite: ligne.quantite,
      unite: ligne.unite || 'u',
      prix_unitaire_ht: ligne.prix_unitaire_ht,
      tva_pct: ligne.tva_pct || 10,
    })) || []
  } : null

  if (factureLoading || clientsLoading || !id) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!facture) {
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
            Facture non trouvée
          </h2>
          <p className="text-muted-foreground mb-6">
            La facture que vous essayez de modifier n'existe pas.
          </p>
          <Link href="/factures">
            <Button>Retour à la liste</Button>
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
            Modifier la facture
          </h1>
          <p className="text-muted-foreground mt-1">
            Modifiez les informations de {facture.titre || `Facture ${facture.numero}`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {clients && initialData && (
          <FactureForm 
            clients={clients}
            onSubmit={handleSubmit}
            defaultValues={initialData}
            submitButtonText="Enregistrer les modifications"
          />
        )}
      </div>
    </div>
  )
}
