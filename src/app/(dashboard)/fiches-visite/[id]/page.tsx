'use client'

import { useParams, useRouter } from 'next/navigation'
import { use, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  ArrowLeft,
  ClipboardList, 
  Calendar,
  MapPin,
  User,
  FileText,
  Ruler,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Euro,
  Trash2,
  Save,
  Phone,
  ChevronDown,
  Lightbulb,
  Building,
  Shield,
  Target,
  Link as LinkIcon,
  FilePlus
} from 'lucide-react'
import { useFicheVisite, useUpdateFicheVisite, useDeleteFicheVisite } from '@/lib/hooks/use-fiches-visite'
import { NoteVocale } from '@/components/fiches-visite/note-vocale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type PageProps = {
  params: Promise<{ id: string }>
}

const URGENCE_CONFIG = {
  basse: { label: 'Basse', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  normale: { label: 'Normale', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  haute: { label: 'Haute', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  critique: { label: 'Critique', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

const TYPE_VISITE_CONFIG = {
  premiere_visite: { label: 'Première visite', icon: '🏠' },
  contre_visite: { label: 'Contre-visite', icon: '🔄' },
  reception: { label: 'Réception chantier', icon: '✅' },
}

const ACCESSIBILITE_CONFIG = {
  facile: { label: 'Facile', color: 'text-green-400' },
  moyen: { label: 'Moyen', color: 'text-yellow-400' },
  difficile: { label: 'Difficile', color: 'text-red-400' },
}

export default function FicheVisiteDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  
  const { data: fiche, isLoading, error } = useFicheVisite(id)
  const updateFiche = useUpdateFicheVisite()
  const deleteFiche = useDeleteFicheVisite()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [openSections, setOpenSections] = useState({
    mesures: true,
    contraintes: true,
    preconisations: true,
    materiaux: true,
  })

  useEffect(() => {
    if (fiche) {
      setFormData({
        type_visite: fiche.type_visite || 'premiere_visite',
        urgence: fiche.urgence || 'normale',
        presence_client: fiche.presence_client ?? true,
        accessibilite: fiche.accessibilite || 'facile',
        constat: fiche.constat || '',
        constat_vocal_url: fiche.constat_vocal_url || null,
        surface_m2: fiche.surface_m2 || '',
        hauteur_plafond: fiche.hauteur_plafond || '',
        longueur: fiche.longueur || '',
        largeur: fiche.largeur || '',
        autres_mesures: fiche.autres_mesures || '',
        contraintes_techniques: fiche.contraintes_techniques || '',
        contraintes_client: fiche.contraintes_client || '',
        preconisations: fiche.preconisations || '',
        complexite: fiche.complexite || 'moyenne',
        budget_estime: fiche.budget_estime || '',
        delai_souhaite: fiche.delai_souhaite || '',
        materiaux_necessaires: fiche.materiaux_necessaires?.join(', ') || '',
        sous_traitance_requise: fiche.sous_traitance_requise || false,
        evacuation_dechets: fiche.evacuation_dechets || '',
        devis_a_faire_avant: fiche.devis_a_faire_avant || '',
        priorite: fiche.priorite || 'normale',
        notes: fiche.notes || '',
      })
    }
  }, [fiche])

  const handleSave = async () => {
    try {
      const materiauxArray = formData.materiaux_necessaires
        ? formData.materiaux_necessaires.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0)
        : null

      await updateFiche.mutateAsync({
        id,
        type_visite: formData.type_visite,
        urgence: formData.urgence,
        presence_client: formData.presence_client,
        accessibilite: formData.accessibilite,
        constat: formData.constat || null,
        constat_vocal_url: formData.constat_vocal_url || null,
        surface_m2: formData.surface_m2 ? parseFloat(formData.surface_m2) : null,
        hauteur_plafond: formData.hauteur_plafond ? parseFloat(formData.hauteur_plafond) : null,
        longueur: formData.longueur ? parseFloat(formData.longueur) : null,
        largeur: formData.largeur ? parseFloat(formData.largeur) : null,
        autres_mesures: formData.autres_mesures || null,
        contraintes_techniques: formData.contraintes_techniques || null,
        contraintes_client: formData.contraintes_client || null,
        preconisations: formData.preconisations || null,
        complexite: formData.complexite,
        budget_estime: formData.budget_estime || null,
        delai_souhaite: formData.delai_souhaite || null,
        materiaux_necessaires: materiauxArray,
        sous_traitance_requise: formData.sous_traitance_requise,
        evacuation_dechets: formData.evacuation_dechets || null,
        devis_a_faire_avant: formData.devis_a_faire_avant || null,
        priorite: formData.priorite,
        notes: formData.notes || null,
      })
      
      toast.success('Fiche de visite enregistrée')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fiche de visite ?')) {
      return
    }

    try {
      await deleteFiche.mutateAsync(id)
      toast.success('Fiche de visite supprimée')
      router.push('/fiches-visite')
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la suppression')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !fiche) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {error ? 'Erreur lors du chargement' : 'Fiche de visite introuvable'}
            </p>
            <Button variant="outline" onClick={() => router.push('/fiches-visite')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux fiches
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dossier = fiche.dossiers as any
  const client = dossier?.clients as any
  const urgenceConfig = URGENCE_CONFIG[formData.urgence as keyof typeof URGENCE_CONFIG] || URGENCE_CONFIG.normale

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-6">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 🔝 HEADER FIXE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => dossier ? router.push(`/dossiers/${dossier.id}`) : router.push('/fiches-visite')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Fiche de visite – {dossier?.numero}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(fiche.date_visite)}
                <span className="mx-1">•</span>
                <User className="w-3 h-3" />
                {client?.nom_complet || 'Client inconnu'}
                {client?.telephone && (
                  <a href={`tel:${client.telephone}`} className="text-amber-400 hover:underline ml-1">
                    <Phone className="w-3 h-3 inline" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDelete}
              disabled={deleteFiche.isPending}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={updateFiche.isPending}
              className="bg-gradient-to-r from-amber-500 to-amber-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 🧾 SECTION 1 – IDENTITÉ DE LA VISITE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Dossier */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">📁 Dossier</p>
              <Link href={`/dossiers/${dossier?.id}`} className="text-sm font-medium hover:text-amber-400 flex items-center gap-1">
                {dossier?.numero}
                <LinkIcon className="w-3 h-3" />
              </Link>
            </div>
            {/* Client */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">👤 Client</p>
              <p className="text-sm font-medium">{client?.nom_complet || '-'}</p>
            </div>
            {/* Adresse */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-muted-foreground mb-1">📍 Adresse</p>
              <p className="text-sm font-medium line-clamp-1">{dossier?.adresse_chantier || '-'}</p>
            </div>
            {/* Type de visite */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">🛠️ Type</p>
              <Select
                value={formData.type_visite}
                onValueChange={(value) => setFormData({ ...formData, type_visite: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_VISITE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Urgence */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">🚨 Urgence</p>
              <Select
                value={formData.urgence}
                onValueChange={(value) => setFormData({ ...formData, urgence: value })}
              >
                <SelectTrigger className={cn("h-8 text-sm", urgenceConfig.color)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(URGENCE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* COLONNE PRINCIPALE */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 📝 SECTION 2 – DESCRIPTION GLOBALE */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-amber-500" />
                Description du besoin
                <Badge variant="outline" className="ml-2 text-xs">Obligatoire</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.constat}
                onChange={(e) => setFormData({ ...formData, constat: e.target.value })}
                placeholder="Explique brièvement ce que le client veut faire... Ex: Rénovation complète salle de bain, remplacement douche, carrelage mural..."
                className="min-h-[120px] bg-background border-border"
              />
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 🎙️ SECTION 3 – NOTE VOCALE */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <NoteVocale
            audioUrl={formData.constat_vocal_url}
            onAudioChange={(url) => setFormData({ ...formData, constat_vocal_url: url })}
            maxDurationSeconds={180}
          />

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 📐 SECTION 4 – MESURES & DIMENSIONS */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <Collapsible open={openSections.mesures} onOpenChange={(open) => setOpenSections({ ...openSections, mesures: open })}>
            <Card className="border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-blue-500" />
                      Mesures & Dimensions
                    </span>
                    <ChevronDown className={cn("w-5 h-5 transition-transform", openSections.mesures && "rotate-180")} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Surface (m²)</Label>
                      <Input
                        type="number"
                        value={formData.surface_m2}
                        onChange={(e) => setFormData({ ...formData, surface_m2: e.target.value })}
                        placeholder="Ex: 25"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Hauteur plafond (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.hauteur_plafond}
                        onChange={(e) => setFormData({ ...formData, hauteur_plafond: e.target.value })}
                        placeholder="Ex: 2.5"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Longueur (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.longueur}
                        onChange={(e) => setFormData({ ...formData, longueur: e.target.value })}
                        placeholder="Ex: 5"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Largeur (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.largeur}
                        onChange={(e) => setFormData({ ...formData, largeur: e.target.value })}
                        placeholder="Ex: 4"
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label className="text-xs">Autres mesures importantes</Label>
                    <Textarea
                      value={formData.autres_mesures}
                      onChange={(e) => setFormData({ ...formData, autres_mesures: e.target.value })}
                      placeholder="Autres dimensions, angles, etc."
                      className="bg-background min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* ⚠️ SECTION 5 – CONTRAINTES & TECHNIQUES */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <Collapsible open={openSections.contraintes} onOpenChange={(open) => setOpenSections({ ...openSections, contraintes: open })}>
            <Card className="border-border border-orange-500/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Contraintes & Techniques
                      <Badge variant="outline" className="ml-2 text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">Important</Badge>
                    </span>
                    <ChevronDown className={cn("w-5 h-5 transition-transform", openSections.contraintes && "rotate-180")} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      <Building className="w-3 h-3" />
                      Contraintes techniques
                    </Label>
                    <Textarea
                      value={formData.contraintes_techniques}
                      onChange={(e) => setFormData({ ...formData, contraintes_techniques: e.target.value })}
                      placeholder="Ex: Mur porteur, accès difficile, normes spécifiques, réseaux existants..."
                      className="bg-background min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      <User className="w-3 h-3" />
                      Contraintes client
                    </Label>
                    <Textarea
                      value={formData.contraintes_client}
                      onChange={(e) => setFormData({ ...formData, contraintes_client: e.target.value })}
                      placeholder="Ex: Budget estimé, délais souhaités, impératifs personnels..."
                      className="bg-background min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Accessibilité chantier</Label>
                      <Select
                        value={formData.accessibilite}
                        onValueChange={(value) => setFormData({ ...formData, accessibilite: value })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACCESSIBILITE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <span className={config.color}>{config.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Client présent ?</Label>
                      <Select
                        value={formData.presence_client ? 'oui' : 'non'}
                        onValueChange={(value) => setFormData({ ...formData, presence_client: value === 'oui' })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oui">✅ Oui</SelectItem>
                          <SelectItem value="non">❌ Non</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 💡 SECTION 6 – PRÉCONISATIONS ARTISAN */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <Collapsible open={openSections.preconisations} onOpenChange={(open) => setOpenSections({ ...openSections, preconisations: open })}>
            <Card className="border-border border-green-500/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-green-500" />
                      Préconisations artisan
                      <Badge variant="outline" className="ml-2 text-xs bg-green-500/10 text-green-400 border-green-500/30">Valeur pro</Badge>
                    </span>
                    <ChevronDown className={cn("w-5 h-5 transition-transform", openSections.preconisations && "rotate-180")} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <Textarea
                    value={formData.preconisations}
                    onChange={(e) => setFormData({ ...formData, preconisations: e.target.value })}
                    placeholder="Ex: Solution recommandée, variante possible, risques à anticiper, suggestions d'amélioration..."
                    className="bg-background min-h-[120px]"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Complexité</Label>
                      <Select
                        value={formData.complexite}
                        onValueChange={(value) => setFormData({ ...formData, complexite: value })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="moyenne">Moyenne</SelectItem>
                          <SelectItem value="complexe">Complexe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Budget estimé</Label>
                      <Input
                        value={formData.budget_estime}
                        onChange={(e) => setFormData({ ...formData, budget_estime: e.target.value })}
                        placeholder="Ex: 5000-8000€"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Délai souhaité</Label>
                      <Input
                        value={formData.delai_souhaite}
                        onChange={(e) => setFormData({ ...formData, delai_souhaite: e.target.value })}
                        placeholder="Ex: 2 semaines"
                        className="bg-background"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 📦 SECTION 7 – MATÉRIAUX & BESOINS */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <Collapsible open={openSections.materiaux} onOpenChange={(open) => setOpenSections({ ...openSections, materiaux: open })}>
            <Card className="border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-purple-500" />
                      Matériaux & Besoins
                    </span>
                    <ChevronDown className={cn("w-5 h-5 transition-transform", openSections.materiaux && "rotate-180")} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Matériaux nécessaires (séparés par des virgules)</Label>
                    <Textarea
                      value={formData.materiaux_necessaires}
                      onChange={(e) => setFormData({ ...formData, materiaux_necessaires: e.target.value })}
                      placeholder="Ex: Carrelage 60x60, colle, joints, placo BA13..."
                      className="bg-background min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Sous-traitance requise ?</Label>
                      <Select
                        value={formData.sous_traitance_requise ? 'oui' : 'non'}
                        onValueChange={(value) => setFormData({ ...formData, sous_traitance_requise: value === 'oui' })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non">Non</SelectItem>
                          <SelectItem value="oui">Oui</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Évacuation déchets</Label>
                      <Input
                        value={formData.evacuation_dechets}
                        onChange={(e) => setFormData({ ...formData, evacuation_dechets: e.target.value })}
                        placeholder="Ex: Benne à prévoir"
                        className="bg-background"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Notes libres */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-gray-500" />
                Notes complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Autres remarques..."
                className="bg-background min-h-[80px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* COLONNE DROITE */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 📅 SUIVI POST-VISITE */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <Card className="border-border border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-5 h-5 text-amber-500" />
                Suivi post-visite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Devis à faire avant le</Label>
                <Input
                  type="date"
                  value={formData.devis_a_faire_avant}
                  onChange={(e) => setFormData({ ...formData, devis_a_faire_avant: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Priorité</Label>
                <Select
                  value={formData.priorite}
                  onValueChange={(value) => setFormData({ ...formData, priorite: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">🟢 Basse</SelectItem>
                    <SelectItem value="normale">🟡 Normale</SelectItem>
                    <SelectItem value="haute">🔴 Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 🔄 IMPACT AUTOMATIQUE */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <Card className="border-border bg-green-500/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                Impact automatique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Dossier marqué "Visite réalisée"
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Suivi devis déclenché
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Visible dans le dossier
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Liens rapides */}
          {dossier && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Liens rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/dossiers/${dossier.id}`}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Voir le dossier
                  </Link>
                </Button>
                {client && (
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/clients/${client.id}`}>
                      <User className="w-4 h-4 mr-2" />
                      Voir le client
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Métadonnées */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {fiche.created_at && (
                <p>Créée le : {formatDate(fiche.created_at)}</p>
              )}
              {fiche.updated_at && (
                <p>Modifiée le : {formatDate(fiche.updated_at)}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 🔽 FOOTER MOBILE – ACTIONS PRINCIPALES */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background/95 backdrop-blur-sm border-t border-border p-4 space-y-2">
        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            disabled={updateFiche.isPending}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link href={`/devis/new?dossier_id=${dossier?.id}&fiche_id=${id}`}>
              <FilePlus className="w-4 h-4 mr-2" />
              Créer devis
            </Link>
          </Button>
        </div>
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => router.push(`/dossiers/${dossier?.id}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au dossier
        </Button>
      </div>
    </div>
  )
}
