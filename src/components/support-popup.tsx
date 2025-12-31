'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  HelpCircle,
  Zap,
  Star,
  MessageSquare,
  Smartphone
} from 'lucide-react'

export function SupportPopup() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [sending, setSending] = useState(false)
  const [step, setStep] = useState<'form' | 'success' | 'error'>('form')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium')
  const [showQuickActions, setShowQuickActions] = useState(false)

  const quickMessages = [
    { text: "Je n'arrive pas à créer un devis", category: 'technique' },
    { text: "Problème de connexion à mon compte", category: 'compte' },
    { text: "Question sur la facturation", category: 'facturation' },
    { text: "Besoin d'aide pour utiliser LÉO", category: 'general' }
  ]

  const urgencyColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      // Envoi vers ton API ou service de support
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom,
          email,
          telephone,
          message,
          urgency,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })

      if (response.ok) {
        setStep('success')
        setTimeout(() => {
          setMessage('')
          setEmail('')
          setNom('')
          setTelephone('')
          setUrgency('medium')
          setStep('form')
          setOpen(false)
        }, 3000)
      } else {
        throw new Error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      setStep('error')
      setTimeout(() => setStep('form'), 3000)
      console.error('Erreur support:', error)
    } finally {
      setSending(false)
    }
  }

  const handleQuickMessage = (quickMsg: typeof quickMessages[0]) => {
    setMessage(quickMsg.text)
    setShowQuickActions(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:scale-105 transition-all duration-300"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Support
          <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
            24/7
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Support Client
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Une question ? Un problème ? Notre équipe est là pour vous aider !'}
            {step === 'success' && '✅ Message envoyé avec succès !'}
            {step === 'error' && '❌ Erreur lors de l\'envoi. Veuillez réessayer.'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Messages rapides */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="w-full justify-start"
              >
                <Zap className="w-4 h-4 mr-2" />
                Messages rapides
              </Button>
              
              {showQuickActions && (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                  {quickMessages.map((quickMsg, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickMessage(quickMsg)}
                      className="text-xs h-auto p-2 whitespace-normal"
                    >
                      {quickMsg.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="text-sm font-medium">
                  Nom complet *
                </label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom et prénom"
                  required
                />
              </div>
              <div>
                <label htmlFor="telephone" className="text-sm font-medium">
                  Téléphone *
                </label>
                <Input
                  id="telephone"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Votre numéro de téléphone"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Niveau d'urgence */}
            <div>
              <label htmlFor="urgency" className="text-sm font-medium">
                Niveau d'urgence
              </label>
              <div className="flex gap-1 mt-1">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={urgency === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUrgency(level)}
                    className={`flex-1 ${urgency === level ? urgencyColors[level] : ''}`}
                  >
                    {level === 'low' && '🟢 Faible'}
                    {level === 'medium' && '🟡 Moyenne'}
                    {level === 'high' && '🔴 Urgente'}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="message" className="text-sm font-medium">
                Message *
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre question ou votre problème..."
                rows={4}
                required
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {message.length}/500 caractères
                </span>
                <Badge variant={urgency === 'high' ? 'destructive' : 'secondary'}>
                  {urgency === 'low' && 'Faible'}
                  {urgency === 'medium' && 'Moyenne'}
                  {urgency === 'high' && 'Urgente'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <a href="mailto:support@monentreprise.com" className="flex items-center gap-1 hover:text-blue-600">
                    <Mail className="w-4 h-4" />
                    support@monentreprise.com
                  </a>
                  <a 
                    href="https://wa.me/33745108883?text=Bonjour%20!%20J'ai%20besoin%20d'aide%20pour%20l'application%20LÉO%20BTP" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>WhatsApp</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={sending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button type="submit" disabled={sending}>
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Message envoyé !</h3>
            <p className="text-gray-600 mb-4">
              Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
            </p>
            <div className="text-sm text-gray-500">
              <Clock className="w-4 h-4 inline mr-1" />
              Temps de réponse habituel : moins de 2h
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur d'envoi</h3>
            <p className="text-gray-600 mb-4">
              Une erreur est survenue. Veuillez réessayer ou nous contacter directement.
            </p>
            <Button onClick={() => setStep('form')}>
              Réessayer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
