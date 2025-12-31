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
  designation: z.string().min(1, 'Désignation requise'),
  description_detaillee: z.string().optional(),
  quantite: z.number().min(0.01, 'Quantité invalide'),
  unite: z.string().min(1, 'Unité requise'),
  prix_unitaire_ht: z.number().min(0, 'Prix invalide'),
  tva_pct: z.number().min(0).max(100),
})

const devisSchema = z.object({
  client_id: z.string().min(1, 'Client requis'),
  titre: z.string().optional(),
  description: z.string().optional(),
  adresse_chantier: z.string().optional(),
  delai_execution: z.string().optional(),
  notes: z.string().optional(),
  template_condition_paiement_id: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne requise'),
})

type DevisFormValues = z.infer<typeof devisSchema>

interface DevisFormProps {
  clients?: Client[]
  tenantId?: string
  onSubmit?: (data: DevisFormValues) => void
  isLoading?: boolean
  defaultValues?: Partial<DevisFormValues>
  initialData?: any
  isEditing?: boolean
}

const UNITES = [
  { value: 'u', label: 'Unité (u)' },
  { value: 'm²', label: 'Mètre carré (m²)' },
  { value: 'ml', label: 'Mètre linéaire (ml)' },
  { value: 'm³', label: 'Mètre cube (m³)' },
  { value: 'h', label: 'Heure (h)' },
  { value: 'jour', label: 'Jour' },
  { value: 'forfait', label: 'Forfait' },
  { value: 'kg', label: 'Kilogramme (kg)' },
]

const TVA_RATES = [
  { value: 20, label: '20%' },
  { value: 10, label: '10% (travaux)' },
  { value: 5.5, label: '5,5% (rénovation énergétique)' },
  { value: 0, label: '0% (exonéré)' },
]

export function DevisForm({ clients: propClients, tenantId, onSubmit, isLoading, defaultValues, initialData, isEditing = false }: DevisFormProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialData?.template_condition_paiement_id || null)

  // Fetch clients if not provided
  const { data: fetchedClients = [] } = useQuery({
    queryKey: ['clients', tenantId],
    queryFn: async () => {
      if (!tenantId) return []
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nom_complet')
      
      if (error) throw error
      return data || []
    },
    enabled: !!tenantId && !propClients,
  })

  const clients = propClients || fetchedClients

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['templates', tenantId],
    queryFn: async () => {
      if (!tenantId) return []
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('templates_conditions_paiement')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('montant_min')
      
      if (error) throw error
      
      // Convert string values to numbers (Supabase returns decimals as strings)
      return (data || []).map((t: any) => ({
        ...t,
        montant_min: parseFloat(t.montant_min) || 0,
        montant_max: t.montant_max ? parseFloat(t.montant_max) : null,
        pourcentage_acompte: parseFloat(t.pourcentage_acompte) || 0,
        pourcentage_intermediaire: t.pourcentage_intermediaire ? parseFloat(t.pourcentage_intermediaire) : null,
        pourcentage_solde: t.pourcentage_solde ? parseFloat(t.pourcentage_solde) : null,
        delai_acompte: parseInt(t.delai_acompte) || 0,
        delai_intermediaire: t.delai_intermediaire ? parseInt(t.delai_intermediaire) : null,
        delai_solde: parseInt(t.delai_solde) || 30,
      })) as Template[]
    },
    enabled: !!tenantId,
  })

  const formDefaults = initialData || defaultValues || {}
  
  const form = useForm<DevisFormValues>({
    resolver: zodResolver(devisSchema),
    defaultValues: {
      client_id: formDefaults.client_id || '',
      titre: formDefaults.titre || '',
      description: formDefaults.description || '',
      adresse_chantier: formDefaults.adresse_chantier || '',
      delai_execution: formDefaults.delai_execution || '',
      notes: formDefaults.notes || '',
      template_condition_paiement_id: formDefaults.template_condition_paiement_id || '',
      lignes: formDefaults.lignes || [
        { designation: '', quantite: 1, unite: 'u', prix_unitaire_ht: 0, tva_pct: 10 }
      ],
    },
  })

  // Réinitialiser le formulaire quand initialData change (important pour l'édition)
  useEffect(() => {
    if (initialData && isEditing && initialData.id && initialData.lignes) {
      const resetData = {
        client_id: initialData.client_id || '',
        titre: initialData.titre || '',
        description: initialData.description || '',
        adresse_chantier: initialData.adresse_chantier || '',
        delai_execution: initialData.delai_execution || '',
        notes: initialData.notes || '',
        template_condition_paiement_id: initialData.template_condition_paiement_id || '',
        lignes: initialData.lignes.length > 0 
          ? initialData.lignes.map((l: any) => ({
              designation: l.designation || '',
              description_detaillee: l.description_detaillee || '',
              quantite: typeof l.quantite === 'number' ? l.quantite : parseFloat(String(l.quantite)) || 1,
              unite: l.unite || 'u',
              prix_unitaire_ht: typeof l.prix_unitaire_ht === 'number' ? l.prix_unitaire_ht : parseFloat(String(l.prix_unitaire_ht)) || 0,
              tva_pct: typeof l.tva_pct === 'number' ? l.tva_pct : parseFloat(String(l.tva_pct)) || 10,
            }))
          : [{ designation: '', quantite: 1, unite: 'u', prix_unitaire_ht: 0, tva_pct: 10 }],
      }
      console.log('🔄 Réinitialisation du formulaire avec:', resetData)
      console.log('📋 Nombre de lignes dans resetData:', resetData.lignes?.length || 0)
      console.log('📋 Lignes détaillées:', JSON.stringify(resetData.lignes, null, 2))
      form.reset(resetData)
      if (initialData.template_condition_paiement_id) {
        setSelectedTemplateId(initialData.template_condition_paiement_id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id, initialData?.lignes?.length, isEditing]) // Réinitialiser quand l'ID ou le nombre de lignes change

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lignes',
  })

  // Calculate totals
  const lignes = form.watch('lignes')
  const totals = useMemo(() => {
    return lignes.reduce(
      (acc, ligne) => {
        const ht = (ligne.quantite || 0) * (ligne.prix_unitaire_ht || 0)
        const tva = ht * ((ligne.tva_pct || 0) / 100)
        return {
          ht: acc.ht + ht,
          tva: acc.tva + tva,
          ttc: acc.ttc + ht + tva,
        }
      },
      { ht: 0, tva: 0, ttc: 0 }
    )
  }, [lignes])

  // Find recommended template based on amount
  const recommendedTemplate = useMemo(() => {
    return templates.find(
      (t) =>
        totals.ttc >= t.montant_min &&
        (t.montant_max === null || totals.ttc <= t.montant_max)
    )
  }, [templates, totals.ttc])

  // Auto-select recommended template when totals change
  useEffect(() => {
    if (recommendedTemplate && !selectedTemplateId) {
      setSelectedTemplateId(recommendedTemplate.id)
      form.setValue('template_condition_paiement_id', recommendedTemplate.id)
    }
  }, [recommendedTemplate, selectedTemplateId, form])

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    form.setValue('template_condition_paiement_id', templateId)
  }

  const handleSubmit = async (data: DevisFormValues) => {
    if (onSubmit) {
      onSubmit({
        ...data,
        template_condition_paiement_id: selectedTemplateId || undefined,
      })
    } else if (isEditing && initialData?.id) {
      // Handle update directly
      try {
        const supabase = getSupabaseClient()
        
        // Update devis
        const { error: devisError } = await supabase
          .from('devis')
          .update({
            client_id: data.client_id,
            titre: data.titre || null,
            adresse_chantier: data.adresse_chantier || null,
            delai_execution: data.delai_execution || null,
            notes: data.notes || null,
            template_condition_paiement_id: selectedTemplateId || null,
            montant_ht: totals.ht,
            montant_tva: totals.tva,
            montant_ttc: totals.ttc,
          })
          .eq('id', initialData.id)

        if (devisError) throw devisError

        // Delete old lines and insert new ones
        await supabase
          .from('lignes_devis')
          .delete()
          .eq('devis_id', initialData.id)

        const lignesData = data.lignes.map((ligne, index) => ({
          devis_id: initialData.id,
          ordre: index + 1,
          designation: ligne.designation,
          description_detaillee: ligne.description_detaillee || null,
          quantite: ligne.quantite,
          unite: ligne.unite,
          prix_unitaire_ht: ligne.prix_unitaire_ht,
          tva_pct: ligne.tva_pct
        }))

        const { error: lignesError } = await supabase
          .from('lignes_devis')
          .insert(lignesData)

        if (lignesError) throw lignesError

        // Redirect to devis page
        window.location.href = `/devis/${initialData.id}`
      } catch (error) {
        console.error('Error updating devis:', error)
        alert('Erreur lors de la modification du devis')
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Client & Info */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-display)' }}>
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nom_complet}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre du devis</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Rénovation cuisine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description générale des travaux..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adresse_chantier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse du chantier</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adresse où se déroulent les travaux"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delai_execution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Délai d'exécution</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2 semaines" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lignes de devis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle style={{ fontFamily: 'var(--font-display)' }}>
              Lignes du devis
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ 
                designation: '', 
                quantite: 1, 
                unite: 'u', 
                prix_unitaire_ht: 0, 
                tva_pct: 10 
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ligne
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-muted-foreground">
                    Ligne {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`lignes.${index}.designation`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Désignation *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Carrelage mural" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`lignes.${index}.description_detaillee`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description détaillée</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Détails supplémentaires..."
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-4 gap-4">
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
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lignes.${index}.unite`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITES.map((u) => (
                              <SelectItem key={u.value} value={u.value}>
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lignes.${index}.prix_unitaire_ht`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix unitaire HT *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lignes.${index}.tva_pct`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TVA *</FormLabel>
                        <Select 
                          onValueChange={(v) => field.onChange(parseFloat(v))} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TVA_RATES.map((rate) => (
                              <SelectItem key={rate.value} value={rate.value.toString()}>
                                {rate.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-right text-sm">
                  <span className="text-muted-foreground">Total ligne: </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      (lignes[index]?.quantite || 0) * 
                      (lignes[index]?.prix_unitaire_ht || 0) * 
                      (1 + (lignes[index]?.tva_pct || 0) / 100)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-right">
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">Total HT:</span>
                <span className="font-semibold w-32">{formatCurrency(totals.ht)}</span>
              </div>
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">Total TVA:</span>
                <span className="font-semibold w-32">{formatCurrency(totals.tva)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-end gap-8 text-lg">
                <span className="font-semibold">Total TTC:</span>
                <span className="font-bold w-32 text-[#FF4D00]">{formatCurrency(totals.ttc)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions de paiement */}
        <Card className="border-[#FF4D00]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                  <Receipt className="w-5 h-5 text-[#FF4D00]" />
                  Conditions de paiement
                </CardTitle>
                <CardDescription>
                  Sélectionnez comment le client paiera ce devis
                </CardDescription>
              </div>
              <Link href="/settings/templates">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Gérer les templates
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aucun template de conditions de paiement configuré
                </p>
                <Link href="/settings/templates">
                  <Button variant="outline">
                    Configurer les templates
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Recommended badge */}
                {recommendedTemplate && (
                  <div className="flex items-center gap-2 p-3 bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-[#FF4D00]" />
                    <span className="text-sm">
                      Template recommandé pour {formatCurrency(totals.ttc)} : 
                      <strong className="ml-1">{recommendedTemplate.nom}</strong>
                    </span>
                  </div>
                )}

                {/* Templates list */}
                <div className="space-y-3">
                  {templates.map((template) => {
                    const isRecommended = template.id === recommendedTemplate?.id
                    const isSelected = template.id === selectedTemplateId
                    const isInRange = totals.ttc >= template.montant_min && 
                      (template.montant_max === null || totals.ttc <= template.montant_max)
                    
                    return (
                      <div
                        key={template.id}
                        className={`relative flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                          isSelected 
                            ? 'border-[#FF4D00] bg-[#FF4D00]/5 shadow-md' 
                            : 'border-gray-200 hover:border-[#FF4D00]/50'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isSelected ? 'border-[#FF4D00] bg-[#FF4D00]' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold">
                              {template.nom}
                            </span>
                            {template.is_default && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Par défaut
                              </Badge>
                            )}
                            {isRecommended && (
                              <Badge className="bg-[#FF4D00] text-xs">
                                Recommandé
                              </Badge>
                            )}
                            {!isInRange && (
                              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
                                Hors plage
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Plage : {formatCurrency(template.montant_min)} - {template.montant_max ? formatCurrency(template.montant_max) : '∞'}
                          </div>
                          
                          {/* Payment breakdown */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              <p className="text-sm font-medium">Échéancier prévu :</p>
                              <div className="grid gap-2 text-sm">
                                {template.pourcentage_acompte > 0 && (
                                  <div className="flex justify-between p-2 bg-[#FF4D00]/10 rounded">
                                    <span>Acompte ({template.pourcentage_acompte}%)</span>
                                    <span className="font-semibold">
                                      {formatCurrency(totals.ttc * template.pourcentage_acompte / 100)}
                                    </span>
                                  </div>
                                )}
                                {template.pourcentage_intermediaire && (
                                  <div className="flex justify-between p-2 bg-yellow-500/10 rounded">
                                    <span>Intermédiaire ({template.pourcentage_intermediaire}%)</span>
                                    <span className="font-semibold">
                                      {formatCurrency(totals.ttc * template.pourcentage_intermediaire / 100)}
                                    </span>
                                  </div>
                                )}
                                {template.pourcentage_solde && template.pourcentage_solde > 0 && (
                                  <div className="flex justify-between p-2 bg-green-500/10 rounded">
                                    <span>Solde ({template.pourcentage_solde}%) - {template.delai_solde}j</span>
                                    <span className="font-semibold">
                                      {formatCurrency(totals.ttc * template.pourcentage_solde / 100)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-display)' }}>
              Notes internes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Notes internes (non visibles sur le devis)..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-[#FF4D00] hover:bg-[#E64600]">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Enregistrer les modifications' : 'Créer le devis'}
          </Button>
        </div>
      </form>
    </Form>
  )
}