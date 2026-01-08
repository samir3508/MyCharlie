import Link from 'next/link'
import { ArrowLeft, Mail, Shield, Database, Eye, Trash2, Phone } from 'lucide-react'

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
          Politique de confidentialité
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
            <p>
              MyCharlie s'engage à protéger la vie privée de ses utilisateurs et à respecter la réglementation 
              relative à la protection des données personnelles, notamment le RGPD. Cette politique décrit 
              comment nous collectons, utilisons et protégeons vos données personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Données collectées</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-400" />
                  Données du formulaire de contact
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-6">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone</li>
                  <li>Nom de l'entreprise (optionnel)</li>
                  <li>Message (optionnel)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-400" />
                  Données techniques
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-6">
                  <li>Adresse IP</li>
                  <li>Type de navigateur et système d'exploitation</li>
                  <li>Pages visitées et durée de consultation</li>
                  <li>Cookies techniques nécessaires au fonctionnement</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Finalités du traitement</h2>
            <div className="space-y-3">
              <p>Vos données sont collectées pour les finalités suivantes :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Répondre à vos demandes de démonstration ou d'information</li>
                <li>Vous contacter pour organiser une démonstration de MyCharlie</li>
                <li>Améliorer nos services et l'expérience utilisateur</li>
                <li>Assurer la sécurité et la maintenance technique du site</li>
                <li>Respecter nos obligations légales et réglementaires</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Base légale</h2>
            <p>
              Le traitement de vos données est fondé sur :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
              <li><strong>Votre consentement</strong> pour les données du formulaire de contact</li>
              <li><strong>Notre intérêt légitime</strong> pour les données techniques et l'amélioration du service</li>
              <li><strong>Obligations légales</strong> pour la conservation de certaines données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Durée de conservation</h2>
            <div className="space-y-3">
              <p>Vos données sont conservées pendant une durée n'excédant pas nécessairement au regard des finalités pour lesquelles elles sont traitées :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li><strong>Données de contact</strong> : 3 ans après votre dernière demande</li>
                <li><strong>Données techniques</strong> : 13 mois maximum</li>
                <li><strong>Cookies</strong> : durée de session ou 13 mois maximum</li>
              </ul>
              <p>À l'issue de ces durées, vos données sont supprimées ou anonymisées.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Destinataires des données</h2>
            <p>
              Vos données sont accessibles uniquement aux personnes habilitées de MyCharlie et à nos sous-traitants 
              strictement nécessaires à la fourniture du service :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
              <li>Prestataire d'hébergement (Render) - serveurs situés en France</li>
              <li>Prestataire d'envoi d'emails (Resend) - serveurs situés en Europe</li>
            </ul>
            <p className="mt-2">
              Nous nous assurons que nos sous-traitants respectent un niveau de sécurité équivalent à celui de MyCharlie 
              et sont conformes au RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Sécurité des données</h2>
            <p className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              MyCharlie met en œuvre des mesures techniques et organisationnelles appropriées pour protéger 
              vos données contre la perte, l'accès non autorisé, la modification ou la divulgation.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
              <li>Chiffrement des données (HTTPS/TLS)</li>
              <li>Contrôle d'accès strict aux données</li>
              <li>Sauvegardes régulières et sécurisées</li>
              <li>Formation du personnel à la protection des données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Vos droits RGPD</h2>
            <div className="space-y-4">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Droit d'accès</strong> : savoir si nous traitons vos données et, le cas échéant, 
                    en obtenir une copie.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <strong>Droit de rectification</strong> : demander la correction de données inexactes.
                </li>
                <li className="flex items-start gap-2">
                  <Trash2 className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Droit à l'effacement</strong> : demander la suppression de vos données 
                    lorsque la conservation n'est plus nécessaire.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <strong>Droit à la limitation du traitement</strong> : limiter l'utilisation de vos données.
                </li>
                <li className="flex items-start gap-2">
                  <strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré.
                </li>
                <li className="flex items-start gap-2">
                  <strong>Droit d'opposition</strong> : vous opposer au traitement de vos données.
                </li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : 
                <a href="mailto:ddvcontact35@gmail.com" className="text-orange-400 hover:text-orange-300 ml-1">ddvcontact35@gmail.com</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
            <p>
              Ce site utilise uniquement des cookies techniques nécessaires à son bon fonctionnement. 
              Aucun cookie de tracking ou de publicité n'est utilisé sans votre consentement explicite.
            </p>
            <p className="mt-2">
              Vous pouvez désactiver les cookies dans les paramètres de votre navigateur. 
              Cela peut affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Modifications de la politique</h2>
            <p>
              MyCharlie se réserve le droit de modifier cette politique de confidentialité à tout moment. 
              Les modifications entreront en vigueur dès leur publication sur ce site. 
              Nous vous invitons à consulter régulièrement cette page pour prendre connaissance des éventuelles mises à jour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou l'exercice de vos droits, 
              vous pouvez nous contacter :
            </p>
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> 
                <a href="mailto:ddvcontact35@gmail.com" className="text-orange-400 hover:text-orange-300">ddvcontact35@gmail.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> 
                07 45 10 88 83
              </p>
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
