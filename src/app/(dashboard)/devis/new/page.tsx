'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useClients } from '@/lib/hooks/use-clients'
import { useCreateDevis } from '@/lib/hooks/use-devis'
import { DevisForm } from '@/components/devis/devis-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

export default function NewDevisPage() {
  const router = useRouter()
  const { tenant } = useAuth()
  const { data: clients, isLoading: clientsLoading } = useClients(tenant?.id)
  const createDevis = useCreateDevis()

  const handleSubmit = async (data: {
    client_id: string
    titre?: string
    description?: string
    adresse_chantier?: string
    delai_execution?: string
    notes?: string
    template_condition_paiement_id?: string
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
      console.log('🚀 Création du devis avec données:', { tenant_id: tenant.id, client_id: data.client_id, lignes_count: data.lignes.length })
      
      const result = await createDevis.mutateAsync({
        devis: {
          tenant_id: tenant.id,
          client_id: data.client_id,
          numero: '', // Will be generated
          titre: data.titre,
          description: data.description,
          adresse_chantier: data.adresse_chantier,
          delai_execution: data.delai_execution,
          notes: data.notes,
          template_condition_paiement_id: data.template_condition_paiement_id,
          statut: 'brouillon',
          date_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

      console.log('✅ Devis créé avec succès:', result)
      
      if (!result || !result.id) {
        console.error('❌ Le devis créé n\'a pas d\'ID:', result)
        toast.error('Erreur: Le devis a été créé mais l\'ID est manquant')
        return
      }

      toast.success('Devis créé avec succès')
      console.log('🔗 Redirection vers:', `/devis/${result.id}`)
      
      // Attendre un peu pour que la base de données finalise la création
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push(`/devis/${result.id}`)
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du devis:', error)
      const errorMessage = error?.message || 'Erreur inconnue lors de la création du devis'
      toast.error(`Erreur: ${errorMessage}`)
    }
  }

  if (clientsLoading) {
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
        <Link href="/devis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux devis
          </Button>
        </Link>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Aucun client
          </h2>
          <p className="text-muted-foreground mb-6">
            Vous devez créer un client avant de pouvoir créer un devis.
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
      <div className="flex items-center gap-4">
        <Link href="/devis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Nouveau devis
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez un nouveau devis pour votre client
          </p>
        </div>
      </div>

      <DevisForm 
        clients={clients}
        tenantId={tenant?.id}
        onSubmit={handleSubmit}
        isLoading={createDevis.isPending}
      />
    </div>
  )
}
