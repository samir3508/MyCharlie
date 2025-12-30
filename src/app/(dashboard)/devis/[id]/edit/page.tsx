'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useClients } from '@/lib/hooks/use-clients'
import { useDevisById } from '@/lib/hooks/use-devis'
import { DevisForm } from '@/components/devis/devis-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditDevisPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { tenant } = useAuth()
  const { data: clients, isLoading: clientsLoading } = useClients(tenant?.id)
  const { data: devis, isLoading: devisLoading, error: devisError } = useDevisById(id)

  console.log('🔍 Devis chargé:', devis)
  console.log('🔍 lignes_devis:', devis?.lignes_devis)
  console.log('🔍 Nombre de lignes_devis:', devis?.lignes_devis?.length || 0)

  if (clientsLoading || devisLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (devisError || !devis) {
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
            Devis non trouvé
          </h2>
          <p className="text-muted-foreground mb-6">
            Le devis que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Link href="/devis">
            <Button>Retour aux devis</Button>
          </Link>
        </div>
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
            Vous devez créer un client avant de pouvoir modifier un devis.
          </p>
          <Link href="/clients">
            <Button>Créer un client</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Préparer les données initiales pour le formulaire
  const initialData = {
    id: devis.id,
    client_id: devis.client_id,
    titre: devis.titre || '',
    description: devis.description || '',
    adresse_chantier: devis.adresse_chantier || '',
    delai_execution: devis.delai_execution || '',
    notes: devis.notes || '',
    template_condition_paiement_id: devis.template_condition_paiement_id || undefined,
    lignes: devis.lignes_devis && devis.lignes_devis.length > 0
      ? devis.lignes_devis.map((ligne) => ({
          designation: ligne.designation || '',
          description_detaillee: ligne.description_detaillee || '',
          quantite: typeof ligne.quantite === 'number' ? ligne.quantite : parseFloat(String(ligne.quantite)) || 1,
          unite: ligne.unite || 'u',
          prix_unitaire_ht: typeof ligne.prix_unitaire_ht === 'number' ? ligne.prix_unitaire_ht : parseFloat(String(ligne.prix_unitaire_ht)) || 0,
          tva_pct: typeof ligne.tva_pct === 'number' ? ligne.tva_pct : parseFloat(String(ligne.tva_pct)) || 10,
        }))
      : [],
  }

  console.log('📄 Données initiales préparées:', initialData)
  console.log('📋 Nombre de lignes:', initialData.lignes?.length || 0)
  console.log('📋 Lignes:', JSON.stringify(initialData.lignes, null, 2))

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/devis/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Modifier le devis {devis.numero}
          </h1>
          <p className="text-muted-foreground mt-1">
            Modifiez les informations du devis
          </p>
        </div>
      </div>

      <DevisForm 
        clients={clients}
        tenantId={tenant?.id}
        initialData={initialData}
        isEditing={true}
        isLoading={false}
      />
    </div>
  )
}