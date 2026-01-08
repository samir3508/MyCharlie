import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
          Mentions légales
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Éditeur du site</h2>
            <div className="space-y-2">
              <p><strong>MyCharlie</strong></p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> ddvcontact35@gmail.com</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> 07 45 10 88 83</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> France</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Hébergement</h2>
            <div className="space-y-2">
              <p><strong>Render</strong></p>
              <p>Services d'hébergement cloud</p>
              <p>Serveurs situés en France (Union Européenne)</p>
              <p><a href="https://render.com" className="text-orange-400 hover:text-orange-300" target="_blank" rel="noopener noreferrer">https://render.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Propriété intellectuelle</h2>
            <p>
              L'ensemble de ce site, y compris son design, ses textes, ses graphismes, son logo et ses logiciels, 
              est la propriété exclusive de MyCharlie et est protégé par les lois françaises et internationales 
              relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou distribution 
              partielle ou intégrale du site, par quelque procédé que ce soit, sans l'autorisation expresse de MyCharlie 
              est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code 
              de la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Données personnelles</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de modification, de rectification et de suppression 
              de vos données personnelles. Vous pouvez exercer ce droit en nous contactant à l'adresse : 
              <a href="mailto:ddvcontact35@gmail.com" className="text-orange-400 hover:text-orange-300 ml-1">ddvcontact35@gmail.com</a>.
            </p>
            <p className="mt-2">
              Pour plus d'informations, consultez notre <Link href="/politique-confidentialite" className="text-orange-400 hover:text-orange-300">Politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
            <p>
              Ce site utilise des cookies techniques nécessaires à son bon fonctionnement. Aucun cookie de tracking 
              tiers n'est utilisé sans votre consentement préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Limitation de responsabilité</h2>
            <p>
              MyCharlie s'efforce de fournir des informations précises et à jour sur ce site, mais ne peut garantir 
              l'exactitude, la complétude ou l'actualité des informations. MyCharlie décline toute responsabilité 
              pour les dommages directs ou indirects résultant de l'utilisation de ce site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Loi applicable</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. Tout litige relatif à l'interprétation 
              ou à l'exécution des présentes sera de la compétence exclusive des tribunaux français.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              Pour toute question concernant ces mentions légales, vous pouvez nous contacter :
            </p>
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> <a href="mailto:ddvcontact35@gmail.com" className="text-orange-400 hover:text-orange-300">ddvcontact35@gmail.com</a></p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> 07 45 10 88 83</p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  )
}
