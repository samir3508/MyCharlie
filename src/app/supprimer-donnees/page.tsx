'use client'

import Link from 'next/link'
import { ArrowLeft, Mail, Trash2, Shield, AlertCircle, CheckCircle, FileText, Phone } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SupprimerDonnees() {
  const [email, setEmail] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [message, setMessage] = useState('')
  const [envoye, setEnvoye] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const sujet = 'Demande de suppression de données personnelles'
    const corps = `Bonjour,

Je souhaite demander la suppression de toutes mes données personnelles de votre plateforme.

Informations :
- Nom et prénom : ${nom}
- Email : ${email}
- Téléphone : ${telephone || 'Non renseigné'}

${message ? `Message complémentaire :\n${message}` : ''}

Je confirme que je souhaite supprimer toutes mes données personnelles conformément au RGPD.

Cordialement`

    const mailtoLink = `mailto:ddvcontact35@gmail.com?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
    window.location.href = mailtoLink
    setEnvoye(true)
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/40 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/30 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-orange-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Supprimer mes données personnelles
            </h1>
          </div>
          <p className="text-lg text-gray-300">
            Conformément au RGPD, vous avez le droit de demander la suppression de toutes vos données personnelles. 
            Cette page vous permet de faire cette demande de manière simple et sécurisée.
          </p>
        </div>

        {!envoye ? (
          <div className="space-y-8">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                Informations importantes
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Délai de traitement :</strong> Votre demande sera traitée dans un délai maximum de 30 jours à compter de sa réception.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Données concernées :</strong> Toutes vos données personnelles seront supprimées : compte utilisateur, clients, devis, factures, conversations WhatsApp, etc.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Données conservées :</strong> Certaines données peuvent être conservées plus longtemps si la loi l'exige (par exemple, factures pour obligations comptables - 10 ans).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Confidentialité :</strong> Votre demande est traitée de manière confidentielle et sécurisée.
                  </div>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-6">Formulaire de demande de suppression</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-2">
                      Nom et prénom <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Adresse email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">L'email utilisé pour votre compte MyCharlie</p>
                  </div>

                  <div>
                    <label htmlFor="telephone" className="block text-sm font-medium text-gray-300 mb-2">
                      Numéro de téléphone (optionnel)
                    </label>
                    <input
                      type="tel"
                      id="telephone"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+33 6 12 34 56 78"
                    />
                    <p className="text-xs text-gray-400 mt-1">Si vous souhaitez aussi supprimer vos données WhatsApp</p>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message complémentaire (optionnel)
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Toute information complémentaire que vous souhaitez nous communiquer..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-sm text-blue-200">
                  <strong>Note :</strong> En cliquant sur "Envoyer ma demande", votre client email s'ouvrira avec un message pré-rempli. 
                  Vous devrez confirmer l'envoi depuis votre boîte mail.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-lg"
              >
                <Mail className="w-5 h-5 mr-2" />
                Envoyer ma demande de suppression
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-green-500/10 border-2 border-green-500/40 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Demande envoyée !</h2>
            <p className="text-gray-300 mb-6">
              Votre demande de suppression de données a été préparée. Vérifiez votre client email et confirmez l'envoi.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Nous traiterons votre demande dans un délai maximum de 30 jours. Vous recevrez une confirmation par email.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Retour à l'accueil
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setEnvoye(false)
                  setEmail('')
                  setNom('')
                  setTelephone('')
                  setMessage('')
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Nouvelle demande
              </Button>
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-4">Autres moyens de contact</h3>
          <div className="space-y-3 text-gray-300">
            <p className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-400" />
              <a href="mailto:ddvcontact35@gmail.com?subject=Demande de suppression de données" className="text-orange-400 hover:text-orange-300">
                ddvcontact35@gmail.com
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-400" />
              <a href="tel:0745108883" className="text-orange-400 hover:text-orange-300">
                07 45 10 88 83
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Pour plus d'informations, consultez notre <Link href="/politique-confidentialite" className="text-orange-400 hover:text-orange-300">Politique de confidentialité</Link></p>
        </div>
      </div>
    </div>
  )
}
