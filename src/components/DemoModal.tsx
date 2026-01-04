'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Mail, Phone, Building2, User, Send, Check } from 'lucide-react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
  source: 'demo' | 'signup'
}

export default function DemoModal({ isOpen, onClose, source }: DemoModalProps) {
  const [formData, setFormData] = useState({
    nom: '',
    entreprise: '',
    telephone: '',
    email: '',
    metier: '',
    autreMetier: '',
    situation: '',
    automatiser: '',
    rappel: '',
    consentement: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nom || !formData.email || !formData.telephone || !formData.consentement) {
      alert('Veuillez remplir les champs obligatoires et accepter le consentement.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setFormData({ 
            nom: '', 
            entreprise: '', 
            telephone: '', 
            email: '', 
            metier: '', 
            autreMetier: '', 
            situation: '', 
            automatiser: '', 
            rappel: '', 
            consentement: false 
          })
          onClose()
        }, 3000)
      } else {
        console.error('Submit error:', data)
        alert(`Erreur lors de l'envoi : ${data.error || 'Réessayez.'}`)
      }
    } catch (err) {
      console.error('Network error:', err)
      alert('Erreur réseau. Réessayez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {source === 'demo' ? 'Demander une démo' : 'Essayer gratuitement'}
              </h2>
              <p className="text-sm text-gray-600">
                {source === 'demo' ? 'On vous contacte sous 24h' : 'Commencez sans engagement'}
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Demande envoyée !</p>
              <p className="text-gray-600">Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1️⃣ Informations essentielles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-orange-500">1️⃣</span> Informations essentielles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4" /> Nom et prénom
                    </Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      required
                      className="w-full text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="entreprise" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Building2 className="w-4 h-4" /> Nom de l'entreprise
                    </Label>
                    <Input
                      id="entreprise"
                      name="entreprise"
                      value={formData.entreprise}
                      onChange={handleChange}
                      placeholder="BTP SARL"
                      className="w-full text-gray-900 border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telephone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4" /> Téléphone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      required
                      className="w-full text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4" /> Adresse e-mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jean@exemple.com"
                      required
                      className="w-full text-gray-900 border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* 2️⃣ Qualification rapide */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-orange-500">2️⃣</span> Qualification rapide
                </h3>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Votre métier</Label>
                  <div className="space-y-2">
                    {['Plombier', 'Électricien', 'Menuisier', 'Paysagiste'].map((metier) => (
                      <label key={metier} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="metier"
                          value={metier}
                          checked={formData.metier === metier}
                          onChange={handleChange}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{metier}</span>
                      </label>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="metier"
                        value="autre"
                        checked={formData.metier === 'autre'}
                        onChange={handleChange}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Autre :</span>
                      <Input
                        name="autreMetier"
                        value={formData.autreMetier}
                        onChange={handleChange}
                        placeholder="Précisez votre métier"
                        className="w-full text-gray-900 border-gray-300"
                        disabled={formData.metier !== 'autre'}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Votre situation actuelle</Label>
                  <div className="space-y-2">
                    {[
                      'Je fais mes devis / factures moi-même',
                      'Quelqu\'un s\'en occupe',
                      'Je perds du temps sur l\'administratif'
                    ].map((situation) => (
                      <label key={situation} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="situation"
                          value={situation}
                          checked={formData.situation === situation}
                          onChange={handleChange}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{situation}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Ce que vous aimeriez automatiser en priorité</Label>
                  <div className="space-y-2">
                    {['Devis', 'Factures', 'Relances clients', 'Tout'].map((auto) => (
                      <label key={auto} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="automatiser"
                          value={auto}
                          checked={formData.automatiser === auto}
                          onChange={handleChange}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{auto}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3️⃣ Prise de contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-orange-500">3️⃣</span> Prise de contact
                </h3>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Quand préférez-vous être rappelé ?</Label>
                  <div className="space-y-2">
                    {['Matin', 'Midi', 'Après-midi', 'Peu importe'].map((periode) => (
                      <label key={periode} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="rappel"
                          value={periode}
                          checked={formData.rappel === periode}
                          onChange={handleChange}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{periode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4️⃣ Consentement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-orange-500">4️⃣</span> Consentement
                </h3>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consentement"
                    checked={formData.consentement}
                    onChange={handleChange}
                    required
                    className="text-orange-500 focus:ring-orange-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    J'accepte d'être contacté par MyCharlie pour organiser une démonstration. <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3"
              >
                {isSubmitting ? 'Envoi en cours...' : source === 'demo' ? 'Demander une démo' : 'Essayer gratuitement'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
