'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/use-auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  Receipt,
  Percent,
  Calendar,
  Star,
  Loader2,
  Minus
} from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  tenant_id: string
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
  created_at: string
}

interface TemplateFormData {
  nom: string
  description: string
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

// Structure pour les paiements dynamiques
interface Paiement {
  id: string
  nom: string
  pourcentage: number
  delai: number
  color: string
}

const PAYMENT_COLORS = [
  { bg: 'bg-[#FF4D00]', border: 'border-[#FF4D00]', text: 'text-[#FF4D00]' },
  { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500' },
  { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500' },
  { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
  { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
]

const PAYMENT_NAMES = ['Acompte', 'Solde', 'Paiement 3', 'Paiement 4', 'Paiement 5']

const defaultFormData: TemplateFormData = {
  nom: '',
  description: '',
  montant_min: 0,
  montant_max: null,
  pourcentage_acompte: 30,
  pourcentage_intermediaire: null,
  pourcentage_solde: 70,
  delai_acompte: 0,
  delai_intermediaire: null,
  delai_solde: 30,
  is_default: false,
}

export default function TemplatesPage() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData)
  const [hasIntermediate, setHasIntermediate] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [nombrePaiements, setNombrePaiements] = useState(2)
  const [paiements, setPaiements] = useState<Paiement[]>([
    { id: '1', nom: 'Acompte', pourcentage: 30, delai: 0, color: PAYMENT_COLORS[0].border },
    { id: '2', nom: 'Solde', pourcentage: 70, delai: 30, color: PAYMENT_COLORS[1].border },
  ])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mettre à jour les paiements quand le nombre change
  const handleNombrePaiementsChange = (value: string) => {
    const newCount = parseInt(value)
    setNombrePaiements(newCount)
    
    const currentPaiements = [...paiements]
    
    if (newCount > currentPaiements.length) {
      // Ajouter des paiements
      const totalActuel = currentPaiements.reduce((sum, p) => sum + p.pourcentage, 0)
      const restant = 100 - totalActuel
      const pourcentageParNouveau = Math.floor(restant / (newCount - currentPaiements.length))
      
      for (let i = currentPaiements.length; i < newCount; i++) {
        currentPaiements.push({
          id: String(i + 1),
          nom: PAYMENT_NAMES[i] || `Paiement ${i + 1}`,
          pourcentage: pourcentageParNouveau,
          delai: 15 * i,
          color: PAYMENT_COLORS[i % PAYMENT_COLORS.length].border,
        })
      }
      
      // Ajuster le dernier paiement pour arriver à 100%
      const total = currentPaiements.reduce((sum, p) => sum + p.pourcentage, 0)
      if (total !== 100 && currentPaiements.length > 0) {
        currentPaiements[currentPaiements.length - 1].pourcentage += (100 - total)
      }
    } else if (newCount < currentPaiements.length) {
      // Retirer des paiements
      const removed = currentPaiements.splice(newCount)
      const removedTotal = removed.reduce((sum, p) => sum + p.pourcentage, 0)
      // Ajouter le pourcentage retiré au dernier paiement restant
      if (currentPaiements.length > 0) {
        currentPaiements[currentPaiements.length - 1].pourcentage += removedTotal
      }
    }
    
    setPaiements(currentPaiements)
  }

  // Mettre à jour le pourcentage d'un paiement
  const updatePaiementPourcentage = (id: string, value: number) => {
    const newPaiements = paiements.map(p => 
      p.id === id ? { ...p, pourcentage: value } : p
    )
    setPaiements(newPaiements)
  }

  // Mettre à jour le délai d'un paiement
  const updatePaiementDelai = (id: string, value: number) => {
    const newPaiements = paiements.map(p => 
      p.id === id ? { ...p, delai: value } : p
    )
    setPaiements(newPaiements)
  }

  // Mettre à jour le nom d'un paiement
  const updatePaiementNom = (id: string, value: string) => {
    const newPaiements = paiements.map(p => 
      p.id === id ? { ...p, nom: value } : p
    )
    setPaiements(newPaiements)
  }

  // Convertir paiements vers formData pour sauvegarde
  const paiementsToFormData = (): Partial<TemplateFormData> => {
    if (paiements.length >= 1) {
      const result: Partial<TemplateFormData> = {
        pourcentage_acompte: paiements[0].pourcentage,
        delai_acompte: paiements[0].delai,
      }
      
      if (paiements.length === 2) {
        result.pourcentage_intermediaire = null
        result.delai_intermediaire = null
        result.pourcentage_solde = paiements[1].pourcentage
        result.delai_solde = paiements[1].delai
      } else if (paiements.length >= 3) {
        result.pourcentage_intermediaire = paiements[1].pourcentage
        result.delai_intermediaire = paiements[1].delai
        result.pourcentage_solde = paiements.slice(2).reduce((sum, p) => sum + p.pourcentage, 0)
        result.delai_solde = paiements[paiements.length - 1].delai
      }
      
      return result
    }
    return {}
  }

  // Charger paiements depuis un template
  const loadPaiementsFromTemplate = (template: Template) => {
    const newPaiements: Paiement[] = [
      { id: '1', nom: 'Acompte', pourcentage: template.pourcentage_acompte, delai: template.delai_acompte, color: PAYMENT_COLORS[0].border },
    ]
    
    if (template.pourcentage_intermediaire) {
      newPaiements.push({
        id: '2',
        nom: 'Intermédiaire',
        pourcentage: template.pourcentage_intermediaire,
        delai: template.delai_intermediaire || 15,
        color: PAYMENT_COLORS[2].border,
      })
      if (template.pourcentage_solde) {
        newPaiements.push({
          id: '3',
          nom: 'Solde',
          pourcentage: template.pourcentage_solde,
          delai: template.delai_solde,
          color: PAYMENT_COLORS[1].border,
        })
      }
    } else if (template.pourcentage_solde) {
      newPaiements.push({
        id: '2',
        nom: 'Solde',
        pourcentage: template.pourcentage_solde,
        delai: template.delai_solde,
        color: PAYMENT_COLORS[1].border,
      })
    }
    
    setPaiements(newPaiements)
    setNombrePaiements(newPaiements.length)
  }

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('templates_conditions_paiement')
        .select('*')
        .eq('tenant_id', tenant.id)
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
    enabled: !!tenant?.id,
  })

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!tenant?.id) throw new Error('No tenant')
      const supabase = getSupabaseClient()
      
      const { error } = await supabase
        .from('templates_conditions_paiement')
        .insert({
          tenant_id: tenant.id,
          ...data,
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template créé avec succès')
      setIsDialogOpen(false)
      resetForm()
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('templates_conditions_paiement')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template mis à jour')
      setIsDialogOpen(false)
      resetForm()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('templates_conditions_paiement')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template supprimé')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingTemplate(null)
    setHasIntermediate(false)
    setNombrePaiements(2)
    setPaiements([
      { id: '1', nom: 'Acompte', pourcentage: 30, delai: 0, color: PAYMENT_COLORS[0].border },
      { id: '2', nom: 'Solde', pourcentage: 70, delai: 30, color: PAYMENT_COLORS[1].border },
    ])
  }

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      nom: template.nom,
      description: template.description || '',
      montant_min: template.montant_min,
      montant_max: template.montant_max,
      pourcentage_acompte: template.pourcentage_acompte,
      pourcentage_intermediaire: template.pourcentage_intermediaire,
      pourcentage_solde: template.pourcentage_solde,
      delai_acompte: template.delai_acompte,
      delai_intermediaire: template.delai_intermediaire,
      delai_solde: template.delai_solde,
      is_default: template.is_default,
    })
    setHasIntermediate(!!template.pourcentage_intermediaire)
    loadPaiementsFromTemplate(template)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    // Validate percentages from paiements
    const total = paiements.reduce((sum, p) => sum + p.pourcentage, 0)
    
    if (Math.abs(total - 100) > 0.01) {
      toast.error('Les pourcentages doivent totaliser 100%')
      return
    }

    // Fusionner les données de paiements dans formData
    const finalData = {
      ...formData,
      ...paiementsToFormData(),
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: finalData })
    } else {
      createMutation.mutate(finalData)
    }
  }

  // Équilibrer automatiquement les pourcentages
  const equilibrerPourcentages = () => {
    const pourcentageParPaiement = Math.floor(100 / paiements.length)
    const reste = 100 - (pourcentageParPaiement * paiements.length)
    
    const newPaiements = paiements.map((p, index) => ({
      ...p,
      pourcentage: pourcentageParPaiement + (index === paiements.length - 1 ? reste : 0)
    }))
    
    setPaiements(newPaiements)
  }

  const formatMontant = (montant: number | null) => {
    if (montant === null) return '∞'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Conditions de paiement
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos templates de conditions de paiement pour les devis
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-[#FF4D00] hover:bg-[#E64600]">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau template
            </Button>
          </DialogTrigger>
          {mounted && (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
              </DialogTitle>
              <DialogDescription>
                Définissez les conditions de paiement qui seront appliquées aux devis
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Nom et description */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom du template *</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: 30/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: 30% acompte, 70% livraison"
                  />
                </div>
              </div>

              {/* Plage de montants */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Plage de montants (TTC)
                </Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Montant minimum</Label>
                    <Input
                      type="number"
                      value={formData.montant_min}
                      onChange={(e) => setFormData({ ...formData, montant_min: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Montant maximum (vide = illimité)</Label>
                    <Input
                      type="number"
                      value={formData.montant_max || ''}
                      onChange={(e) => setFormData({ ...formData, montant_max: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Illimité"
                    />
                  </div>
                </div>
              </div>

              {/* Nombre de paiements */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Nombre d'échéances de paiement
                </Label>
                <div className="flex items-center gap-4">
                  <Select 
                    value={String(nombrePaiements)} 
                    onValueChange={handleNombrePaiementsChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Nombre de paiements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 paiement (100%)</SelectItem>
                      <SelectItem value="2">2 paiements</SelectItem>
                      <SelectItem value="3">3 paiements</SelectItem>
                      <SelectItem value="4">4 paiements</SelectItem>
                      <SelectItem value="5">5 paiements</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={equilibrerPourcentages}
                  >
                    Équilibrer les %
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choisissez le nombre d'échéances de paiement pour ce template
                </p>
              </div>

              {/* Répartition dynamique des paiements */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Répartition des paiements
                </Label>
                
                <div className={`grid gap-4 ${
                  paiements.length === 1 ? 'grid-cols-1' :
                  paiements.length === 2 ? 'md:grid-cols-2' :
                  paiements.length === 3 ? 'md:grid-cols-3' :
                  paiements.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
                  'md:grid-cols-2 lg:grid-cols-5'
                }`}>
                  {paiements.map((paiement, index) => (
                    <Card 
                      key={paiement.id} 
                      className={`${PAYMENT_COLORS[index % PAYMENT_COLORS.length].border} border-opacity-50`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <Input
                            value={paiement.nom}
                            onChange={(e) => updatePaiementNom(paiement.id, e.target.value)}
                            className="h-7 text-sm font-medium border-0 p-0 focus-visible:ring-0 bg-transparent"
                            placeholder={`Paiement ${index + 1}`}
                          />
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${PAYMENT_COLORS[index % PAYMENT_COLORS.length].text}`}
                          >
                            #{index + 1}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Pourcentage</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={paiement.pourcentage}
                              onChange={(e) => updatePaiementPourcentage(paiement.id, parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">
                            {index === 0 ? 'Délai (jours)' : 'Délai après précédent (jours)'}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={paiement.delai}
                            onChange={(e) => updatePaiementDelai(paiement.id, parseInt(e.target.value) || 0)}
                            placeholder={index === 0 ? "0 = immédiat" : "Jours après le précédent"}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Total indicator */}
                {(() => {
                  const total = paiements.reduce((sum, p) => sum + p.pourcentage, 0)
                  const isValid = Math.abs(total - 100) < 0.01
                  return (
                    <div className={`p-3 rounded-lg text-center ${
                      isValid 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/30' 
                        : 'bg-red-500/10 text-red-600 border border-red-500/30'
                    }`}>
                      <span className="font-semibold">Total: {total}%</span>
                      {!isValid && (
                        <span className="ml-2 text-sm">(doit être exactement 100%)</span>
                      )}
                      {isValid && (
                        <span className="ml-2 text-sm">✓ Répartition valide</span>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Default */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Template par défaut
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ce template sera sélectionné automatiquement pour les nouveaux devis
                  </p>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.nom}
                className="bg-[#FF4D00] hover:bg-[#E64600]"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingTemplate ? 'Mettre à jour' : 'Créer'}
              </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>

      {/* Templates list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun template</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier template de conditions de paiement
            </p>
            <Button onClick={openCreateDialog} className="bg-[#FF4D00] hover:bg-[#E64600]">
              <Plus className="w-4 h-4 mr-2" />
              Créer un template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className={template.is_default ? 'relative border-[#FF4D00] border-2' : 'relative'}>
              {template.is_default && (
                <Badge className="absolute -top-2 right-4 bg-[#FF4D00]">
                  <Star className="w-3 h-3 mr-1" />
                  Par défaut
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{template.nom}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Les devis existants utilisant ce template ne seront pas affectés.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(template.id)}
                            className="bg-destructive hover:bg-destructive hover:opacity-90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plage de montants */}
                <div className="flex items-center gap-2 text-sm">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Montant:</span>
                  <span className="font-medium">
                    {formatMontant(template.montant_min)} - {formatMontant(template.montant_max)}
                  </span>
                </div>

                {/* Répartition */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-[#FF4D00] bg-opacity-10 rounded">
                    <span className="text-sm">Acompte</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.pourcentage_acompte}%</Badge>
                      <span className="text-xs text-muted-foreground">
                        {template.delai_acompte === 0 ? 'Immédiat' : template.delai_acompte + 'j'}
                      </span>
                    </div>
                  </div>
                  
                  {template.pourcentage_intermediaire && (
                    <div className="flex justify-between items-center p-2 bg-yellow-500 bg-opacity-10 rounded">
                      <span className="text-sm">Intermédiaire</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.pourcentage_intermediaire}%</Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.delai_intermediaire + 'j'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {template.pourcentage_solde && template.pourcentage_solde > 0 && (
                    <div className="flex justify-between items-center p-2 bg-green-500 bg-opacity-10 rounded">
                      <span className="text-sm">Solde</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.pourcentage_solde}%</Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.delai_solde + 'j'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
