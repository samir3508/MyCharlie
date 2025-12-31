'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/use-auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Loader2
} from 'lucide-react'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'

type RelanceType = 'devis_non_repondu' | 'facture_avant_echeance' | 'facture_en_retard'

type TemplateRelance = {
  id: string
  tenant_id: string
  type: RelanceType
  active: boolean
  r1_jours: number
  r2_jours: number
  r3_jours: number
}

type TemplateRelanceState = {
  id: string
  type: RelanceType
  active: boolean
  r1_jours: string
  r2_jours: string
  r3_jours: string
}

export default function RelancesPage() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [templatesState, setTemplatesState] = useState<TemplateRelanceState[]>([])
  const [savingType, setSavingType] = useState<RelanceType | null>(null)

  const handleToggleActive = (type: RelanceType) => {
    const tpl = templatesState.find((t) => t.type === type)
    updateTemplateField(type, 'active', !(tpl?.active ?? false))
  }

  const handleDaysChange = (
    type: RelanceType,
    field: 'r1_jours' | 'r2_jours' | 'r3_jours',
    value: string
  ) => {
    updateTemplateField(type, field, value)
  }

  const { data: relances, isLoading } = useQuery({
    queryKey: ['relances', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []

      const { data, error } = await supabase
        .from('relances')
        .select(`
          *,
          factures (
            numero,
            montant_ttc,
            clients (nom_complet)
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('date_prevue', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id,
  })

  const { data: templatesRelances } = useQuery({
    queryKey: ['templates-relances', tenant?.id],
    queryFn: async (): Promise<TemplateRelance[]> => {
      if (!tenant?.id) return []

      const { data, error } = await supabase
        .from('templates_relances')
        .select('*')
        .eq('tenant_id', tenant.id)

      if (error) throw error
      return data as TemplateRelance[]
    },
    enabled: !!tenant?.id,
  })

  // Synchronise l'état local avec les données Supabase
  useEffect(() => {
    if (!templatesRelances) return

    const nextState: TemplateRelanceState[] = templatesRelances.map((t: TemplateRelance) => ({
      id: t.id,
      type: t.type,
      active: t.active,
      r1_jours: t.r1_jours.toString(),
      r2_jours: t.r2_jours.toString(),
      r3_jours: t.r3_jours.toString(),
    }))
    setTemplatesState(nextState)
  }, [templatesRelances])

  const updateTemplateField = (
    type: RelanceType,
    field: keyof Omit<TemplateRelanceState, 'id' | 'type'>,
    value: string | boolean
  ) => {
    setTemplatesState((prev) =>
      prev.map((t: TemplateRelanceState) =>
        t.type === type
          ? {
              ...t,
              [field]: value,
            }
          : t
      )
    )
  }

  const handleSaveTemplate = async (type: RelanceType) => {
    const tpl = templatesState.find((t) => t.type === type)
    if (!tpl) return

    setSavingType(type)
    try {
      await supabase
        .from('templates_relances')
        .update({
          active: tpl.active,
          r1_jours: Number(tpl.r1_jours || 0),
          r2_jours: Number(tpl.r2_jours || 0),
          r3_jours: Number(tpl.r3_jours || 0),
        })
        .eq('id', tpl.id)
    } finally {
      setSavingType(null)
    }
  }

  const { data: facturesEnRetard } = useQuery({
    queryKey: ['factures-en-retard', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []

      const { data, error } = await supabase
        .from('factures')
        .select(`
          *,
          clients (nom_complet, telephone, email)
        `)
        .eq('tenant_id', tenant.id)
        .in('statut', ['envoyee', 'en_retard'])
        .lt('date_echeance', new Date().toISOString().split('T')[0])
        .order('date_echeance', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id,
  })

  const { data: facturesAvantEcheance } = useQuery({
    queryKey: ['factures-avant-echeance', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []

      const { data, error } = await supabase
        .from('factures')
        .select(`
          *,
          clients (nom_complet, telephone, email)
        `)
        .eq('tenant_id', tenant.id)
        .eq('statut', 'envoyee')
        .gte('date_echeance', new Date().toISOString().split('T')[0])
        .order('date_echeance', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id,
  })

  const { data: devisNonRepondu } = useQuery({
    queryKey: ['devis-non-repondu', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []

      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          client:clients (nom_complet, telephone, email)
        `)
        .eq('tenant_id', tenant.id)
        .eq('statut', 'envoye')
        .is('date_acceptation', null)
        .not('date_envoi', 'is', null)
        .order('date_envoi', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id,
  })

  const filteredRelances = relances?.filter((r: any) => {
    const matchesSearch = 
      r.factures?.numero?.toLowerCase().includes(search.toLowerCase()) ||
      r.factures?.clients?.nom_complet?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || r.statut === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  const stats = {
    planifiees: relances?.filter((r: any) => r.statut === 'planifie').length || 0,
    envoyees: relances?.filter((r: any) => r.statut === 'envoye').length || 0,
    reussies: relances?.filter((r: any) => r.statut === 'reussi').length || 0,
    echouees: relances?.filter((r: any) => r.statut === 'echoue').length || 0,
    facturesEnRetard: facturesEnRetard?.length || 0,
    facturesAvantEcheance: facturesAvantEcheance?.length || 0,
    montantEnRetard:
      facturesEnRetard?.reduce((sum: number, f: any) => sum + Number(f.montant_ttc || 0), 0) || 0,
    devisNonRepondu: devisNonRepondu?.length || 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Relances
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les relances automatiques de vos factures impayées
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 !py-2">
            <CardTitle className="text-sm font-medium !mb-0">
              Factures en retard
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facturesEnRetard}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(stats.montantEnRetard)} en attente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 !py-2">
            <CardTitle className="text-sm font-medium !mb-0">
              Relances planifiées
            </CardTitle>
            <Clock className="w-4 h-4 text-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planifiees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 !py-2">
            <CardTitle className="text-sm font-medium !mb-0">
              Relances échouées
            </CardTitle>
            <XCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.echouees}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devis" className="space-y-4" key="relances-tabs-fixed">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="devis" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Devis sans réponse
            {stats.devisNonRepondu > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.devisNonRepondu}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="factures-avant" className="gap-2">
            <Clock className="w-4 h-4" />
            À relancer
            {stats.facturesAvantEcheance > 0 && (
              <Badge variant="outline" className="ml-1">
                {stats.facturesAvantEcheance}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="factures" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            En retard
            {stats.facturesEnRetard > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.facturesEnRetard}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="parametres" className="gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devis" className="space-y-4" key="devis-tab-fixed">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Devis envoyés sans réponse</CardTitle>
              <CardDescription>
                Ces devis ont été envoyés au client mais n'ont pas encore été acceptés ou signés
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-gradient-card-dark">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Devis</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Date d'envoi</TableHead>
                    <TableHead>Jours sans réponse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!devisNonRepondu || devisNonRepondu.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p>Aucun devis en attente de réponse 🎉</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    devisNonRepondu.map((d: any) => {
                      const daysSinceSent = d.date_envoi 
                        ? Math.ceil((Date.now() - new Date(d.date_envoi).getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium font-mono">{d.numero}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{d.client?.nom_complet}</p>
                              <p className="text-sm text-muted-foreground">{d.client?.telephone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-right">
                            {formatCurrency(d.montant_ttc)}
                          </TableCell>
                          <TableCell>
                            {d.date_envoi ? formatDate(d.date_envoi) : 'Non envoyé'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={daysSinceSent > 14 ? 'destructive' : daysSinceSent > 7 ? 'default' : 'secondary'}>
                              {daysSinceSent} jours
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factures-avant" className="space-y-4" key="factures-avant-tab-fixed">
          <Card className="overflow-hidden bg-gradient-card-dark border-gray-800">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900">
              <CardTitle className="text-white">Factures envoyées (avant échéance)</CardTitle>
              <CardDescription className="text-gray-400">
                Ces factures ont été envoyées au client, ne sont pas encore arrivées à échéance et ne sont pas encore payées.
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-gradient-card-dark">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-800">
                    <TableHead className="text-gray-300 font-semibold">Facture</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Client</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Montant</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Échéance</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Temps restant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!facturesAvantEcheance || facturesAvantEcheance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p>Aucune facture à relancer avant échéance 🎉</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturesAvantEcheance.map((f: any) => {
                      const daysLeft = f.date_echeance
                        ? Math.ceil(
                            (new Date(f.date_echeance).getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0

                      let badgeVariant: 'default' | 'secondary' | 'destructive' = 'secondary'
                      if (daysLeft <= 1) badgeVariant = 'destructive'
                      else if (daysLeft <= 5) badgeVariant = 'default'

                      return (
                        <TableRow key={f.id} className="border-b border-gray-800/50 hover:bg-[#1A1A1A]/50">
                          <TableCell className="font-medium font-mono text-white">{f.numero}</TableCell>
                          <TableCell className="text-white">
                            <div>
                              <p className="font-medium">{f.clients?.nom_complet}</p>
                              <p className="text-xs text-gray-400">
                                {f.clients?.telephone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            {formatCurrency(f.montant_ttc)}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {f.date_echeance ? formatDate(f.date_echeance) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={badgeVariant}>
                              {daysLeft > 0 ? `${daysLeft} jours` : 'Aujourd\'hui'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factures" className="space-y-4" key="factures-tab-fixed">
          <Card className="overflow-hidden bg-gradient-card-dark border-gray-800">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900">
              <CardTitle className="text-white">Factures nécessitant une relance</CardTitle>
              <CardDescription className="text-gray-400">
                Ces factures ont dépassé leur date d'échéance et n'ont pas encore été payées
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-gradient-card-dark">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-800">
                    <TableHead className="text-gray-300 font-semibold">Facture</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Client</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Montant</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Échéance</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Retard</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!facturesEnRetard || facturesEnRetard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p>Aucune facture en retard 🎉</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturesEnRetard.map((f: any) => {
                      const daysLate = Math.ceil((Date.now() - new Date(f.date_echeance).getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <TableRow key={f.id} className="border-b border-gray-800/50 hover:bg-[#1A1A1A]/50">
                          <TableCell className="font-medium font-mono text-white">{f.numero}</TableCell>
                          <TableCell className="text-white">
                            <div>
                              <p className="font-medium">{f.clients?.nom_complet}</p>
                              <p className="text-xs text-gray-400">{f.clients?.telephone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            {formatCurrency(f.montant_ttc)}
                          </TableCell>
                          <TableCell className="text-red-400">
                            {formatDate(f.date_echeance)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {daysLate} jours
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametres" className="space-y-4" key="parametres-tab-fixed">
          <Card className="overflow-hidden bg-gradient-card-dark border-gray-800">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900">
              <CardTitle className="text-white">Paramètres de relance</CardTitle>
              <CardDescription className="text-gray-400">
                Configurez le nombre de jours avant chaque relance pour les devis et les factures. 3 relances
                maximum par système.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 bg-gradient-card-dark">
              {!templatesRelances ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : templatesRelances.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Aucun template de relance trouvé pour ce compte. Les valeurs par défaut seront utilisées.
                </p>
              ) : (
                (['devis_non_repondu', 'facture_avant_echeance', 'facture_en_retard'] as RelanceType[]).map(
                  (type) => {
                    const tpl = templatesState.find((t) => t.type === type)
                    const titleMap: Record<RelanceType, string> = {
                      devis_non_repondu: 'Devis envoyés sans réponse',
                      facture_avant_echeance: 'Factures envoyées (avant échéance)',
                      facture_en_retard: 'Factures en retard (après échéance)',
                    }
                    const descriptionMap: Record<RelanceType, string> = {
                      devis_non_repondu:
                        'Relances pour les devis envoyés au client mais sans réponse. Délais en jours APRÈS la date d\'envoi du devis.',
                      facture_avant_echeance:
                        'Relances pour les factures envoyées mais non payées, avant la date d\'échéance. Délais en jours AVANT la date d\'échéance.',
                      facture_en_retard:
                        'Relances pour les factures dont la date d\'échéance est dépassée. Délais en jours APRÈS la date d\'échéance.',
                    }

                    if (!tpl) {
                      return (
                        <div key={type} className="rounded-lg border border-gray-800 p-4 bg-[#1A1A1A]">
                          <p className="text-sm text-gray-400">
                            Chargement du template {titleMap[type]}...
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={type}
                        className="rounded-lg border border-gray-800 p-4 flex flex-col gap-3 bg-[#1A1A1A]"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{titleMap[type]}</p>
                            <p className="text-xs text-gray-400">{descriptionMap[type]}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Activer</span>
                            <input
                              type="checkbox"
                              checked={tpl.active}
                              onChange={(e) =>
                                updateTemplateField(type, 'active', e.target.checked)
                              }
                              className="w-4 h-4"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-gray-400">Relance 1 (jours)</label>
                            <Input
                              type="number"
                              value={tpl.r1_jours}
                              onChange={(e) => handleDaysChange(type, 'r1_jours', e.target.value)}
                              className="mt-1 bg-[#262626] border-gray-700 text-white"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Relance 2 (jours)</label>
                            <Input
                              type="number"
                              value={tpl.r2_jours}
                              onChange={(e) => handleDaysChange(type, 'r2_jours', e.target.value)}
                              className="mt-1 bg-[#262626] border-gray-700 text-white"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Relance 3 (jours)</label>
                            <Input
                              type="number"
                              value={tpl.r3_jours}
                              onChange={(e) => handleDaysChange(type, 'r3_jours', e.target.value)}
                              className="mt-1 bg-[#262626] border-gray-700 text-white"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSaveTemplate(type)}
                            disabled={savingType === type}
                            className="bg-[#FF4D00] hover:bg-[#FF4D00]/90"
                          >
                            {savingType === type ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    )
                  }
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
