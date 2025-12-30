'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useClient, useUpdateClient } from '@/lib/hooks/use-clients'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ClientEditPage({ params }: PageProps) {
  const router = useRouter()
  const { tenant } = useAuth()
  const updateClient = useUpdateClient()
  const [id, setId] = useState<string>('')
  const { data: client, isLoading } = useClient(id)

  useEffect(() => {
    const getId = async () => {
      const { id: clientId } = await params
      setId(clientId)
    }
    getId()
  }, [params])

  const handleSubmit = async (data: {
    nom: string
    prenom: string
    email?: string
    telephone?: string
    adresse_facturation?: string
    adresse_chantier?: string
    type: 'particulier' | 'professionnel'
    notes?: string
  }) => {
    if (!tenant?.id || !id) return

    console.log('Tentative de modification client:', { clientId: id, data, tenantId: tenant.id })

    try {
      const result = await updateClient.mutateAsync({
        clientId: id,
        updates: data,
      })

      console.log('Client modifié avec succès:', result)
      toast.success('Client modifié avec succès')
      router.push(`/clients/${id}`)
    } catch (error: any) {
      console.error('Erreur modification client:', error)
      toast.error(`Erreur: ${error?.message || 'Erreur inconnue'}`)
    }
  }

  if (isLoading || !id) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Button>
        </Link>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Client non trouvé
          </h2>
          <p className="text-muted-foreground mb-6">
            Le client que vous essayez de modifier n'existe pas.
          </p>
          <Link href="/clients">
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
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux clients
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>
            Modifier le client
          </h1>
          <p className="text-muted-foreground mt-1">
            Modifiez les informations de {client.nom_complet}
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={(e) => {
          e.preventDefault()
          // Pour l'instant, afficher les données du client
          console.log('Client à modifier:', client)
          toast.info('Formulaire de modification en cours de développement')
        }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prénom</label>
              <input
                type="text"
                defaultValue={client.prenom}
                className="w-full p-2 border rounded"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nom</label>
              <input
                type="text"
                defaultValue={client.nom}
                className="w-full p-2 border rounded"
                placeholder="Nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              defaultValue={client.email || ''}
              className="w-full p-2 border rounded"
              placeholder="Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Téléphone</label>
            <input
              type="tel"
              defaultValue={client.telephone || ''}
              className="w-full p-2 border rounded"
              placeholder="Téléphone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Adresse de facturation</label>
            <textarea
              defaultValue={client.adresse_facturation || ''}
              className="w-full p-2 border rounded"
              placeholder="Adresse de facturation"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Adresse du chantier</label>
            <textarea
              defaultValue={client.adresse_chantier || ''}
              className="w-full p-2 border rounded"
              placeholder="Adresse du chantier"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              defaultValue={client.type}
              className="w-full p-2 border rounded"
            >
              <option value="particulier">Particulier</option>
              <option value="professionnel">Professionnel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              defaultValue={client.notes || ''}
              className="w-full p-2 border rounded"
              placeholder="Notes"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/clients">
              <Button variant="outline" disabled={updateClient.isPending}>
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={updateClient.isPending}>
              {updateClient.isPending && 'Chargement...'}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
