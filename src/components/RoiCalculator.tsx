'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator, Clock, Euro, TrendingUp, Users, FileText, Send, ArrowRight } from 'lucide-react'

export default function RoiCalculator() {
  const [formData, setFormData] = useState({
    nombreEmployes: '',
    salaireMoyen: '',
    heuresAdminParSemaine: '',
    tempsFacturable: ''
  })
  const [results, setResults] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const calculateROI = () => {
    setIsCalculating(true)
    
    setTimeout(() => {
      const employes = Number(formData.nombreEmployes) || 1
      const salaire = Number(formData.salaireMoyen) || 3500
      const heuresAdmin = Number(formData.heuresAdminParSemaine) || 10
      const tempsFacturable = Number(formData.tempsFacturable) || 60

      // Calculs
      const coutAdminMensuel = (employes * salaire * heuresAdmin / 35) * 4.33
      const tempsGagne = heuresAdmin * 0.7 // 70% de temps gagné
      const nouveauTempsFacturable = tempsFacturable + (tempsGagne / 35 * 100)
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
              {/* Colonne gauche - Formulaire */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-white mb-6">
                  Vos données actuelles
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombreEmployes" className="text-gray-300 mb-2 block">
                      Nombre d'employés
                    </Label>
                    <Input
                      id="nombreEmployes"
                      name="nombreEmployes"
                      type="number"
                      value={formData.nombreEmployes}
                      onChange={handleChange}
                      placeholder="5"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salaireMoyen" className="text-gray-300 mb-2 block">
                      Salaire moyen mensuel (€)
                    </Label>
                    <Input
                      id="salaireMoyen"
                      name="salaireMoyen"
                      type="number"
                      value={formData.salaireMoyen}
                      onChange={handleChange}
                      placeholder="3500"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="heuresAdminParSemaine" className="text-gray-300 mb-2 block">
                      Heures admin par semaine par employé
                    </Label>
                    <Input
                      id="heuresAdminParSemaine"
                      name="heuresAdminParSemaine"
                      type="number"
                      value={formData.heuresAdminParSemaine}
                      onChange={handleChange}
                      placeholder="10"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tempsFacturable" className="text-gray-300 mb-2 block">
                      Temps facturable actuel (%)
                    </Label>
                    <Input
                      id="tempsFacturable"
                      name="tempsFacturable"
                      type="number"
                      value={formData.tempsFacturable}
                      onChange={handleChange}
                      placeholder="60"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <Button 
                  onClick={calculateROI}
                  disabled={isCalculating || !formData.nombreEmployes || !formData.salaireMoyen}
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
                        Au lieu de {formData.tempsFacturable}%
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
