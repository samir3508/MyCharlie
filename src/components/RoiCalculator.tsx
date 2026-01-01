'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, Clock, Euro, TrendingUp, Users, FileText, Send, ArrowRight } from 'lucide-react'

const SliderInput = ({ label, value, onChange, min, max, step, unit, suffix }: { 
  label: string; 
  value: number; 
  onChange: (value: number) => void; 
  min: number; 
  max: number; 
  step: number; 
  unit?: string; 
  suffix?: string; 
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-gray-300 text-sm">{label}</label>
      <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent font-bold">{value}{unit || ''} {suffix || ''}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))} 
      className="w-full h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" 
    />
  </div>
)

export default function RoiCalculator() {
  const [tauxHoraire, setTauxHoraire] = useState(50)
  const [devisParSemaine, setDevisParSemaine] = useState(30)
  const [tempsParDevis, setTempsParDevis] = useState(30)
  const [facturesParSemaine, setFacturesParSemaine] = useState(30)
  const [tempsParFacture, setTempsParFacture] = useState(15)
  const [relancesParSemaine, setRelancesParSemaine] = useState(30)
  const [tempsParRelance, setTempsParRelance] = useState(5)

  // Calculs
  const tempsDevisHebdo = (devisParSemaine * tempsParDevis) / 60
  const tempsFacturesHebdo = (facturesParSemaine * tempsParFacture) / 60
  const tempsRelancesHebdo = (relancesParSemaine * tempsParRelance) / 60
  const tempsTotalHebdo = tempsDevisHebdo + tempsFacturesHebdo + tempsRelancesHebdo
  
  const coutHebdo = Math.round(tempsTotalHebdo * tauxHoraire)
  const coutMensuel = coutHebdo * 4
  const coutAnnuel = coutMensuel * 12
  
  // Avec Charly (2 minutes par tâche)
  const tempsCharlyParTache = 2 / 60 // 2 minutes en heures
  const totalTachesParSemaine = devisParSemaine + facturesParSemaine + relancesParSemaine
  const tempsCharlyHebdo = totalTachesParSemaine * tempsCharlyParTache
  
  const tempsEconomiseHebdo = tempsTotalHebdo - tempsCharlyHebdo
  const tempsEconomiseAnnuel = tempsEconomiseHebdo * 52
  
  const coutCharlyHebdo = Math.round(tempsCharlyHebdo * tauxHoraire)
  const coutCharlyMensuel = coutCharlyHebdo * 4
  
  // Calcul mathématiquement correct de l'argent économisé
  const argentEconomiseHebdo = coutHebdo - coutCharlyHebdo
  const argentEconomiseMensuel = argentEconomiseHebdo * 4
  const argentEconomiseAnnuel = argentEconomiseMensuel * 12

  const pourcentageEconomie = Math.round((tempsEconomiseHebdo / tempsTotalHebdo) * 100)

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black via-gray-900/50 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/5"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6 border border-orange-500/30">
            <Users className="w-5 h-5" />
            <span className="font-semibold">Pour les entreprises du bâtiment</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Calculateur de ROI
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Découvrez combien de temps et d'argent vous perdez chaque semaine sur vos tâches administratives
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Colonne gauche - Formulaire */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                    <Euro className="w-6 h-6 text-orange-500" />
                    Taux horaire
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">Votre taux horaire moyen</p>
                  <SliderInput 
                    label="" 
                    value={tauxHoraire} 
                    onChange={setTauxHoraire} 
                    min={20} 
                    max={150} 
                    step={5} 
                    unit="€" 
                    suffix="/h" 
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-orange-500" />
                    Création de devis
                  </h3>
                  <div className="space-y-4">
                    <SliderInput 
                      label="Devis par semaine" 
                      value={devisParSemaine} 
                      onChange={setDevisParSemaine} 
                      min={1} 
                      max={100} 
                      step={1} 
                      suffix="devis" 
                    />
                    <SliderInput 
                      label="Temps par devis" 
                      value={tempsParDevis} 
                      onChange={setTempsParDevis} 
                      min={5} 
                      max={120} 
                      step={5} 
                      suffix="min" 
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-orange-500" />
                    Création de factures
                  </h3>
                  <div className="space-y-4">
                    <SliderInput 
                      label="Factures par semaine" 
                      value={facturesParSemaine} 
                      onChange={setFacturesParSemaine} 
                      min={1} 
                      max={100} 
                      step={1} 
                      suffix="factures" 
                    />
                    <SliderInput 
                      label="Temps par facture" 
                      value={tempsParFacture} 
                      onChange={setTempsParFacture} 
                      min={5} 
                      max={60} 
                      step={5} 
                      suffix="min" 
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                    <Send className="w-6 h-6 text-orange-500" />
                    Relances clients
                  </h3>
                  <div className="space-y-4">
                    <SliderInput 
                      label="Relances par semaine" 
                      value={relancesParSemaine} 
                      onChange={setRelancesParSemaine} 
                      min={1} 
                      max={100} 
                      step={1} 
                      suffix="relances" 
                    />
                    <SliderInput 
                      label="Temps par relance" 
                      value={tempsParRelance} 
                      onChange={setTempsParRelance} 
                      min={1} 
                      max={30} 
                      step={1} 
                      suffix="min" 
                    />
                  </div>
                </div>
              </div>

              {/* Colonne droite - Résultats */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-6">Vos KPIs actuels</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">Par semaine</p>
                      <p className="text-3xl font-bold text-white">{tempsTotalHebdo.toFixed(1)}h</p>
                      <p className="text-xl text-orange-400">{coutHebdo.toLocaleString()} €</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">Par mois</p>
                      <p className="text-3xl font-bold text-white">{(tempsTotalHebdo * 4).toFixed(1)}h</p>
                      <p className="text-xl text-orange-400">{coutMensuel.toLocaleString()} €</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">Par an</p>
                      <p className="text-3xl font-bold text-white">{(tempsTotalHebdo * 52).toFixed(0)}h</p>
                      <p className="text-xl text-orange-400">{coutAnnuel.toLocaleString()} €</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-2xl p-6">
                  <h3 className="text-2xl font-semibold text-white mb-4">Avec Charly IA</h3>
                  <p className="text-gray-300 mb-6">N'importe quelle tâche en moins de 2 minutes</p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">Temps économisé / an</p>
                      <p className="text-3xl font-bold text-orange-400">{tempsEconomiseAnnuel.toFixed(0)}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">Argent économisé / an</p>
                      <p className="text-3xl font-bold text-orange-400">{argentEconomiseAnnuel.toLocaleString()} €</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-2xl p-4">
                    <h4 className="text-white font-semibold mb-3">Temps hebdomadaire</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Avant</p>
                        <p className="text-xl font-bold text-white">{tempsTotalHebdo.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Avec Charly</p>
                        <p className="text-xl font-bold text-orange-400">{tempsCharlyHebdo.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Économie</p>
                        <p className="text-xl font-bold text-green-400">{tempsEconomiseHebdo.toFixed(1)}h</p>
                        <p className="text-xs text-green-400">-{pourcentageEconomie}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-2xl p-4">
                    <h4 className="text-white font-semibold mb-3">Coût mensuel</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Avant</p>
                        <p className="text-xl font-bold text-white">{coutMensuel.toLocaleString()} €</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Avec Charly</p>
                        <p className="text-xl font-bold text-orange-400">{coutCharlyMensuel.toLocaleString()} €</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Économie</p>
                        <p className="text-xl font-bold text-green-400">{(coutMensuel - coutCharlyMensuel).toLocaleString()} €</p>
                        <p className="text-xs text-green-400">-{pourcentageEconomie}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section CTA */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Le vrai coût, ce n'est pas Charlie.
                </h3>
                <p className="text-xl text-gray-300 mb-4">
                  C'est de continuer comme avant.
                </p>
                <p className="text-lg text-gray-400 mb-8">
                  Prêt à gagner {tempsEconomiseAnnuel.toFixed(0)}h par an ?<br />
                  Charly automatise vos devis, factures et relances en moins de 2 minutes chacun.<br />
                  C'est {argentEconomiseAnnuel.toLocaleString()} € d'économies annuelles.
                </p>
                
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-4 px-8 text-lg">
                  Découvrir Charly
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
