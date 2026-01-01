'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { X, Mail, Phone, Building2, User, MessageSquare, Send } from 'lucide-react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
  source: 'demo' | 'signup'
}

export default function DemoModal({ isOpen, onClose, source }: DemoModalProps) {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nom || !formData.email || !formData.telephone) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source })
      })
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setFormData({ nom: '', email: '', telephone: '', entreprise: '', message: '' })
          onClose()
        }, 3000)
      } else {
        alert('Erreur lors de l\'envoi. Réessayez.')
      }
    } catch (err) {
      alert('Erreur réseau. Réessayez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nom" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4" /> Nom complet
                </Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@exemple.com"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="telephone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4" /> Téléphone
                </Label>
                <Input
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="06 12 34 56 78"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="entreprise" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4" /> Entreprise (optionnel)
                </Label>
                <Input
                  id="entreprise"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleChange}
                  placeholder="BTP SARL"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MessageSquare className="w-4 h-4" /> Message (optionnel)
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Dites-nous en plus sur votre besoin..."
                  rows={3}
                  className="w-full"
                />
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
