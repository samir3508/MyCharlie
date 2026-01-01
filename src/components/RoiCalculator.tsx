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
  const [nombreEmployes, setNombreEmployes] = useState(5)
  const [salaireMoyen, setSalaireMoyen] = useState(3500)
  const [heuresAdminParSemaine, setHeuresAdminParSemaine] = useState(10)
  const [tempsFacturable, setTempsFacturable] = useState(60)
  const [results, setResults] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateROI = () => {
    setIsCalculating(true)
    
    setTimeout(() => {
      const employes = nombreEmployes
      const salaire = salaireMoyen
      const heuresAdmin = heuresAdminParSemaine
      const tempsFact = tempsFacturable

      // Calculs
      const coutAdminMensuel = (employes * salaire * heuresAdmin / 35) * 4.33
      const tempsGagne = heuresAdmin * 0.7 // 70% de temps gagné
      const nouveauTempsFacturable = tempsFact + (tempsGagne / 35 * 100)
      const gainMensuel = (employes * salaire * tempsGagne / 35) * 4.33
      const gainAnnuel = gainMensuel * 12

      setResults({
        coutAdminMensuel: coutAdminMensuel.toFixed(0),
        tempsGagne: tempsGagne.toFixed(1),
        nouveauTempsFacturable: nouveauTempsFacturable.toFixed(1),
        gainMensuel: gainMensuel.toFixed(0),
        gainAnnuel: gainAnnuel.toFixed(0)
      })
      setIsCalculating(false)
    }, 1000)
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black via-gray-900/50 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/5"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Calculateur de ROI
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Découvrez combien de temps et d'argent vous pouvez économiser avec Charlie
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Colonne gauche - Formulaire avec sliders */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-white mb-6">
                  Vos données actuelles
                </h3>
                
                <div className="space-y-6">
                  <SliderInput 
                    label="Nombre d'employés" 
                    value={nombreEmployes} 
                    onChange={setNombreEmployes} 
                    min={1} 
                    max={50} 
                    step={1} 
                    suffix="employés" 
                  />

                  <SliderInput 
                    label="Salaire moyen mensuel" 
                    value={salaireMoyen} 
                    onChange={setSalaireMoyen} 
                    min={1500} 
                    max={8000} 
                    step={100} 
                    unit="€" 
                  />

                  <SliderInput 
                    label="Heures admin par semaine" 
                    value={heuresAdminParSemaine} 
                    onChange={setHeuresAdminParSemaine} 
                    min={1} 
                    max={40} 
                    step={1} 
                    suffix="h" 
                  />

                  <SliderInput 
                    label="Temps facturable actuel" 
                    value={tempsFacturable} 
                    onChange={setTempsFacturable} 
                    min={20} 
                    max={90} 
                    step={5} 
                    unit="%" 
                  />
                </div>

                <Button 
                  onClick={calculateROI}
                  disabled={isCalculating}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-4 text-lg"
                >
                  {isCalculating ? (
                    <span className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 animate-spin" />
                      Calcul en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Calculer mon ROI
                    </span>
                  )}
                </Button>
              </div>

              {/* Colonne droite - Résultats */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-white mb-6">
                  Vos gains avec Charlie
                </h3>

                {results ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Euro className="w-8 h-8 text-orange-500" />
                        <h4 className="text-xl font-semibold text-white">Économies mensuelles</h4>
                      </div>
                      <p className="text-3xl font-bold text-orange-400">
                        {results.gainMensuel} €
                      </p>
                      <p className="text-gray-400 mt-2">
                        Soit {results.gainAnnuel} € par an
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-8 h-8 text-blue-500" />
                        <h4 className="text-xl font-semibold text-white">Temps gagné</h4>
                      </div>
                      <p className="text-3xl font-bold text-blue-400">
                        {results.tempsGagne}h
                      </p>
                      <p className="text-gray-400 mt-2">
                        Par semaine et par employé
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-8 h-8 text-green-500" />
                        <h4 className="text-xl font-semibold text-white">Nouveau temps facturable</h4>
                      </div>
                      <p className="text-3xl font-bold text-green-400">
                        {results.nouveauTempsFacturable}%
                      </p>
                      <p className="text-gray-400 mt-2">
                        Au lieu de {tempsFacturable}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      Remplissez vos données pour voir vos économies potentielles
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Section CTA */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Le vrai coût, c'est de continuer comme avant.
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  Avec Charlie, tu récupères du temps ET de l'argent.
                </p>
                
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-4 px-8 text-lg">
                  <Send className="w-5 h-5 mr-2" />
                  Recevoir mon calcul personnalisé
                </Button>
                
                <p className="text-gray-400 mt-4 text-sm">
                  Démo gratuite • Sans engagement • Réponse en 24h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
