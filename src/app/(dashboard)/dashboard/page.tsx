'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  FileText,
  Receipt,
  Euro,
  TrendingUp,
  TrendingDown,
  Calendar,
  FolderKanban,
  ClipboardList,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bot,
  Trophy,
  Send,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { useDossiersStats } from '@/lib/hooks/use-dossiers'
import { useRdvToday, useRdvUpcoming } from '@/lib/hooks/use-rdv'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()

  // Stats Charlie (Devis & Factures)
  const { data: charlieStats, isLoading: charlieLoading } = useQuery({
    queryKey: ['charlie-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Devis stats
      const { count: devisEnCours } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('statut', ['brouillon', 'en_preparation', 'pret', 'envoye'])

      const { count: devisAcceptes } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('statut', 'accepte')

      const { count: devisMois } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('date_creation', startOfMonth.toISOString())

      // Factures stats
      const { data: facturesPaid } = await supabase
        .from('factures')
        .select('montant_ttc')
        .eq('tenant_id', tenant.id)
        .eq('statut', 'payee')

      const { count: facturesImpayees } = await supabase
        .from('factures')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('statut', ['envoyee', 'en_retard'])

      const caTotal = facturesPaid?.reduce((sum: number, f: { montant_ttc: number | null }) => sum + (f.montant_ttc || 0), 0) || 0

      // Taux conversion
      const { count: totalDevisEnvoyes } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('statut', ['envoye', 'accepte', 'refuse'])

      const tauxConversion = totalDevisEnvoyes && totalDevisEnvoyes > 0
        ? Math.round(((devisAcceptes || 0) / totalDevisEnvoyes) * 100)
        : 0

      // Relances à faire
      const { count: relancesAFaire } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('statut', 'envoye')
        .lt('date_envoi', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())

      return {
        devisEnCours: devisEnCours || 0,
        devisAcceptes: devisAcceptes || 0,
        devisMois: devisMois || 0,
        facturesImpayees: facturesImpayees || 0,
        caTotal,
        tauxConversion,
        relancesAFaire: relancesAFaire || 0,
      }
    },
    enabled: !!tenant?.id,
  })

  // Stats Léo
  const { data: leoStats } = useDossiersStats()
  const { data: rdvToday } = useRdvToday()
  const { data: rdvUpcoming } = useRdvUpcoming(7)

  // Clients
  const { data: clientsCount } = useQuery({
    queryKey: ['clients-count', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return 0
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
      return count || 0
    },
    enabled: !!tenant?.id,
  })

  // Recent devis
  const { data: recentDevis } = useQuery({
    queryKey: ['recent-devis', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      const { data } = await supabase
        .from('devis')
        .select('id, numero, montant_ttc, statut, clients (nom_complet)')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(montant)
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-500/10 text-gray-400',
      en_preparation: 'bg-blue-500/10 text-blue-400',
      pret: 'bg-amber-500/10 text-amber-400',
      envoye: 'bg-purple-500/10 text-purple-400',
      accepte: 'bg-green-500/10 text-green-400',
      refuse: 'bg-red-500/10 text-red-400',
    }
    return colors[statut] || 'bg-gray-500/10 text-gray-400'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Bonjour{tenant?.company_name ? `, ${tenant.company_name}` : ''} 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              Voici le récapitulatif de votre activité
            </p>
          </div>
        </div>
        {/* Boutons toujours sous le titre */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto justify-center" asChild>
            <Link href="/devis/nouveau">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau devis
            </Link>
          </Button>
          <Button className="w-full sm:w-auto justify-center bg-gradient-to-r from-orange-500 to-orange-600" asChild>
            <Link href="/dossiers">
              <FolderKanban className="w-4 h-4 mr-2" />
              Voir les dossiers
            </Link>
          </Button>
        </div>
      </div>

      {/* Agents Sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* CHARLIE Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-blue-400">Charlie</span>
                  <span className="text-muted-foreground text-sm font-normal">— Devis & Factures</span>
                </CardTitle>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {charlieLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-muted-foreground">Devis en cours</span>
                      </div>
                      <p className="text-2xl font-bold">{charlieStats?.devisEnCours}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-muted-foreground">Taux conversion</span>
                      </div>
                      <p className="text-2xl font-bold">{charlieStats?.tauxConversion}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Euro className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-muted-foreground">CA total</span>
                      </div>
                      <p className="text-2xl font-bold">{formatMontant(charlieStats?.caTotal || 0)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-muted-foreground">Impayées</span>
                      </div>
                      <p className="text-2xl font-bold">{charlieStats?.facturesImpayees}</p>
                    </div>
                  </div>

                  {(charlieStats?.relancesAFaire || 0) > 0 && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-400">
                          {charlieStats?.relancesAFaire} devis à relancer
                        </span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                        <Link href="/relances">
                          Voir <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300" asChild>
                      <Link href="/devis">
                        Gérer les devis <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* LÉO Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-orange-500/20 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-orange-400">Léo</span>
                  <span className="text-muted-foreground text-sm font-normal">— Suivi Commercial</span>
                </CardTitle>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                  Nouveau
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderKanban className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-muted-foreground">Dossiers actifs</span>
                  </div>
                  <p className="text-2xl font-bold">{leoStats?.enCours || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-muted-foreground">RDV aujourd'hui</span>
                  </div>
                  <p className="text-2xl font-bold">{rdvToday?.length || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-muted-foreground">Dossiers signés</span>
                  </div>
                  <p className="text-2xl font-bold">{leoStats?.signes || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Euro className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-muted-foreground">CA potentiel</span>
                  </div>
                  <p className="text-2xl font-bold">{formatMontant(leoStats?.montantTotal || 0)}</p>
                </div>
              </div>

              {(rdvUpcoming?.length || 0) > 0 && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-400">
                      {rdvUpcoming?.length} RDV cette semaine
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-purple-400 hover:bg-purple-500/10" asChild>
                    <Link href="/rdv">
                      Voir <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300" asChild>
                  <Link href="/dossiers">
                    Gérer les dossiers <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Devis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Derniers devis
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/devis">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentDevis && recentDevis.length > 0 ? (
                <div className="space-y-2">
                  {recentDevis.map((devis: any, index: number) => (
                    <motion.div
                      key={devis.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-blue-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-blue-500/10 text-blue-400 text-xs">
                            {devis.clients?.nom_complet?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{devis.clients?.nom_complet || 'Client inconnu'}</p>
                          <p className="text-xs text-muted-foreground">{devis.numero}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">{formatMontant(devis.montant_ttc || 0)}</span>
                        <Badge variant="outline" className={cn("text-xs", getStatutColor(devis.statut))}>
                          {devis.statut?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun devis récent</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                Aperçu rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Clients</span>
                  </div>
                  <span className="font-bold">{clientsCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Dossiers total</span>
                  </div>
                  <span className="font-bold">{leoStats?.total || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Devis ce mois</span>
                  </div>
                  <span className="font-bold">{charlieStats?.devisMois || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Devis acceptés</span>
                  </div>
                  <span className="font-bold text-green-400">{charlieStats?.devisAcceptes || 0}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-border space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Actions rapides</p>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/clients">
                    <Users className="w-4 h-4 mr-2" />
                    Nouveau client
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/dossiers">
                    <FolderKanban className="w-4 h-4 mr-2" />
                    Nouveau dossier
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* RDV du jour */}
      {rdvToday && rdvToday.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border bg-gradient-to-r from-purple-500/5 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                RDV aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rdvToday.map((rdv: any, index: number) => (
                  <motion.div
                    key={rdv.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="p-3 rounded-lg bg-card border border-purple-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-purple-400">
                        {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                        {rdv.type_rdv}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{rdv.titre || rdv.dossiers?.titre}</p>
                    {rdv.clients && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {rdv.clients.nom_complet}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
