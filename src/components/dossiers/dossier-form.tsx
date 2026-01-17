'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useClients } from '@/lib/hooks/use-clients'
import { useCreateDossier } from '@/lib/hooks/use-dossiers'
import { useAuth } from '@/lib/hooks/use-auth'
import { Loader2, FolderPlus, User, MapPin, Euro, MessageSquare } from 'lucide-react'
import { SOURCES_CLIENT, PRIORITES } from '@/types/database'

interface DossierFormData {
  client_id: string
  titre: string
  description?: string
  adresse_chantier?: string
  source?: string
  type_travaux?: string
  montant_estime?: number
  priorite?: string
}

interface DossierFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DossierForm({ open, onOpenChange, onSuccess }: DossierFormProps) {
  const { tenant } = useAuth()
  const { data: clients, isLoading: clientsLoading } = useClients(tenant?.id)
  const createDossier = useCreateDossier()
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<DossierFormData>({
    defaultValues: {
      priorite: 'normale',
    }
  })

  const onSubmit = async (data: DossierFormData) => {
    try {
      await createDossier.mutateAsync({
        client_id: data.client_id,
        titre: data.titre,
        description: data.description || null,
        adresse_chantier: data.adresse_chantier || null,
        source: data.source as any || null,
        type_travaux: data.type_travaux || null,
        montant_estime: data.montant_estime || null,
        priorite: data.priorite as any || 'normale',
        statut: 'contact_recu',
      })
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erreur création dossier:', error)
    }
  }

  const sourceLabels: Record<string, string> = {
    whatsapp: '💬 WhatsApp',
    instagram: '📸 Instagram',
    appel: '📞 Appel',
    email: '📧 Email',
    site_web: '🌐 Site web',
    bouche_a_oreille: '🗣️ Bouche à oreille',
    autre: '📋 Autre',
  }

  const prioriteLabels: Record<string, string> = {
    basse: '🟢 Basse',
    normale: '🔵 Normale',
    haute: '🟠 Haute',
    urgente: '🔴 Urgente',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-white" />
            </div>
            Nouveau dossier
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau dossier pour suivre un prospect de la prise de contact à la signature
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Client */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              Client *
            </Label>
            <Select onValueChange={(value) => setValue('client_id', value)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clientsLoading ? (
                  <div className="p-2 text-center text-muted-foreground">Chargement...</div>
                ) : clients?.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">Aucun client</div>
                ) : (
                  clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom_complet}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-sm text-destructive">Client requis</p>
            )}
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label>Titre du dossier *</Label>
            <Input
              {...register('titre', { required: true })}
              placeholder="Ex: Rénovation cuisine, Pose carrelage..."
              className="bg-background border-border"
            />
            {errors.titre && (
              <p className="text-sm text-destructive">Titre requis</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Description
            </Label>
            <Textarea
              {...register('description')}
              placeholder="Décrivez le projet..."
              className="bg-background border-border min-h-[80px]"
            />
          </div>

          {/* Adresse chantier */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Adresse du chantier
            </Label>
            <Input
              {...register('adresse_chantier')}
              placeholder="Adresse du chantier"
              className="bg-background border-border"
            />
          </div>

          {/* Row: Source + Priorité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select onValueChange={(value) => setValue('source', value)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="D'où vient le contact ?" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES_CLIENT.map((source) => (
                    <SelectItem key={source} value={source}>
                      {sourceLabels[source]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select defaultValue="normale" onValueChange={(value) => setValue('priorite', value)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITES.map((priorite) => (
                    <SelectItem key={priorite} value={priorite}>
                      {prioriteLabels[priorite]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Type travaux + Montant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de travaux</Label>
              <Input
                {...register('type_travaux')}
                placeholder="Ex: Peinture, Plomberie..."
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-muted-foreground" />
                Montant estimé
              </Label>
              <Input
                type="number"
                {...register('montant_estime', { valueAsNumber: true })}
                placeholder="0"
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createDossier.isPending}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {createDossier.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Créer le dossier
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
