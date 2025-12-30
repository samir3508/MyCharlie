'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Receipt, 
  CheckCircle2, 
  AlertCircle,
  Star,
  Settings
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Client } from '@/types/database'
import Link from 'next/link'

interface Template {
  id: string
  nom: string
  description: string | null
  montant_min: number
  montant_max: number | null
  pourcentage_acompte: number
  pourcentage_intermediaire: number | null
  pourcentage_solde: number | null
  delai_acompte: number
  delai_intermediaire: number | null
  delai_solde: number
  is_default: boolean
}

const ligneSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description_detaillee: z.string().optional(),
  quantite: z.number().min(0, 'La quantité doit être positive'),
  unite: z.string().min(1, 'L\'unité est requise'),
  prix_unitaire_ht: z.number().min(0, 'Le prix doit être positif'),
  tva_pct: z.number().min(0).max(100),
})

const factureSchema = z.object({
  client_id: z.string().min(1, 'Le client est requis'),
  titre: z.string().optional(),
  description: z.string().optional(),
  adresse_chantier: z.string().optional(),
  notes: z.string().optional(),
  template_condition_paiement_id: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne est requise'),
})

type FactureFormData = z.infer<typeof factureSchema>

interface FactureFormProps {
  clients: Client[]
  onSubmit: (data: FactureFormData) => Promise<void>
  isLoading?: boolean
  submitButtonText?: string
  defaultValues?: Partial<FactureFormData>
}

export function FactureForm({ 
  clients, 
  onSubmit, 
  isLoading = false, 
  submitButtonText = 'Créer la facture',
  defaultValues
}: FactureFormProps) {
  const form = useForm<FactureFormData>({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      client_id: defaultValues?.client_id || '',
      titre: defaultValues?.titre || '',
      description: defaultValues?.description || '',
      notes: defaultValues?.notes || '',
      lignes: defaultValues?.lignes?.length ? defaultValues.lignes : [
        {
          designation: '',
          description_detaillee: '',
          quantite: 1,
          unite: 'unité',
          prix_unitaire_ht: 0,
          tva_pct: 20,
        }
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lignes',
  })

  const selectedClient = form.watch('client_id')
  const lignes = form.watch('lignes')

  // Récupérer les templates de conditions de paiement
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates-conditions-paiement'],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('templates_conditions_paiement')
        .select('*')
        .order('is_default', { ascending: false })

      if (error) throw error
      return data as Template[]
    },
  })

  // Calculer les totaux
  const totaux = useMemo(() => {
    return lignes.reduce(
      (acc, ligne) => {
        const totalHT = ligne.quantite * ligne.prix_unitaire_ht
        const totalTVA = totalHT * (ligne.tva_pct / 100)
        return {
          ht: acc.ht + totalHT,
          tva: acc.tva + totalTVA,
          ttc: acc.ttc + totalHT + totalTVA,
        }
      },
      { ht: 0, tva: 0, ttc: 0 }
    )
  }, [lignes])

  // Ajouter une ligne
  const ajouterLigne = () => {
    append({
      designation: '',
      description_detaillee: '',
      quantite: 1,
      unite: 'unité',
      prix_unitaire_ht: 0,
      tva_pct: 20,
    })
  }

  // Soumettre le formulaire
  const handleSubmit = async (data: FactureFormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Remplissez les informations de base de votre facture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informations client sélectionné */}
            {selectedClient && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium mb-2">Informations client</div>
                {(() => {
                  const client = clients.find(c => c.id === selectedClient)
                  if (!client) return null
                  return (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>{client.email}</div>
                      <div>{client.telephone}</div>
                      <div>{client.adresse_facturation}</div>
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Titre */}
              <FormField
                control={form.control}
                name="titre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de la facture</FormLabel>
                    <FormControl>
                      <Input placeholder="Facture pour prestations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adresse du chantier */}
              <FormField
                control={form.control}
                name="adresse_chantier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse du chantier</FormLabel>
                    <FormControl>
                      <Input placeholder="123 rue de la Paix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description des prestations</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description détaillée des prestations facturées..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template de conditions de paiement */}
            <FormField
              control={form.control}
              name="template_condition_paiement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions de paiement</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez des conditions de paiement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.nom}</span>
                            {template.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Défaut
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notes supplémentaires..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Lignes de facturation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Lignes de facturation
                </CardTitle>
                <CardDescription>
                  Ajoutez les différentes prestations à facturer
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={ajouterLigne}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Ligne {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Désignation */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.designation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Désignation *</FormLabel>
                        <FormControl>
                          <Input placeholder="Prestation de service" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantité */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.quantite`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Unité */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.unite`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité *</FormLabel>
                        <FormControl>
                          <Input placeholder="unité" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Prix unitaire HT */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.prix_unitaire_ht`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix unitaire HT (€) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* TVA */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.tva_pct`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TVA (%)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseFloat(value))} defaultValue={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Taux de TVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5.5">5,5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description détaillée */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.description_detaillee`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description détaillée</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description optionnelle de la prestation..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Total de la ligne */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-end text-sm">
                    <span className="text-muted-foreground">
                      Total HT : {formatCurrency(lignes[index]?.quantite * lignes[index]?.prix_unitaire_ht || 0)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Récapitulatif */}
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total HT :</span>
                <span>{formatCurrency(totaux.ht)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA :</span>
                <span>{formatCurrency(totaux.tva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total TTC :</span>
                <span>{formatCurrency(totaux.ttc)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/factures">
            <Button variant="outline" disabled={isLoading}>
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}
