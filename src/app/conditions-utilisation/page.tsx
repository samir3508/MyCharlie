import Link from 'next/link'
import { ArrowLeft, FileText, Shield, Users, AlertCircle, Mail, Phone } from 'lucide-react'

export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
          Conditions d'Utilisation
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Acceptation des conditions</h2>
            <p>
              En utilisant le service MyCharlie, vous acceptez sans réserve les présentes conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser ce service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Objet du service</h2>
            <div className="space-y-3">
              <p>MyCharlie est un service d'assistant IA destiné aux professionnels du bâtiment qui propose :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Gestion automatisée des clients et prospects</li>
                <li>Création et envoi de devis et factures</li>
                <li>Relances automatiques par email et messagerie</li>
                <li>Suivi des paiements et des chantiers</li>
                <li>Signature électronique de documents</li>
                <li>Archivage sécurisé des données professionnelles</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Conditions d'accès et d'utilisation</h2>
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <strong>Éligibilité</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Être majeur et avoir la capacité juridique de contracter</li>
                <li>Être un professionnel du secteur du bâtiment</li>
                <li>Disposer d'une activité professionnelle légale</li>
                <li>Fournir des informations exactes et complètes lors de l'inscription</li>
              </ul>
              
              <p className="flex items-center gap-2 mt-4">
                <Shield className="w-5 h-5 text-orange-400" />
                <strong>Compte utilisateur</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Un seul compte par personne physique ou morale</li>
                <li>Responsabilité de la confidentialité des identifiants</li>
                <li>Obligation de signaler toute utilisation non autorisée</li>
                <li>Maintien des informations à jour</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Obligations de l'utilisateur</h2>
            <div className="space-y-3">
              <p>En tant qu'utilisateur de MyCharlie, vous vous engagez à :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Utiliser le service conformément à sa destination professionnelle</li>
                <li>Fournir des informations exactes pour la création de documents</li>
                <li>Ne pas utiliser le service à des fins illégales ou frauduleuses</li>
                <li>Respecter la législation en vigueur (fiscale, sociale, commerciale)</li>
                <li>Ne pas tenter d'interrompre ou de dégrader le service</li>
                <li>Ne pas partager vos identifiants de connexion</li>
                <li>Respecter les droits de propriété intellectuelle de tiers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Utilisation des données et documents</h2>
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <strong>Propriété des documents</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Les documents (devis, factures, etc.) que vous créez restent votre propriété</li>
                <li>Vous conservez tous les droits sur vos documents professionnels</li>
                <li>MyCharlie n'acquiert aucun droit sur vos données professionnelles</li>
                <li>Vous pouvez exporter vos données à tout moment</li>
              </ul>
              
              <p className="flex items-center gap-2 mt-4">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <strong>Responsabilité du contenu</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Vous êtes seul responsable du contenu des documents générés</li>
                <li>MyCharlie ne garantit pas la conformité réglementaire des documents</li>
                <li>Vous devez vérifier l'exactitude des informations avant envoi</li>
                <li>MyCharlie n'est pas responsable des erreurs de saisie</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Période d'essai et tarification</h2>
            <div className="space-y-3">
              <p>
                MyCharlie est actuellement proposé en version bêta gratuite. Cette période vous permet :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>D'utiliser toutes les fonctionnalités sans limitation</li>
                <li>Sans engagement et sans carte bancaire requise</li>
                <li>Pendant une durée déterminée par MyCharlie</li>
              </ul>
              <p>
                À l'issue de la période d'essai, des formules payantes pourront être proposées. 
                Vous serez informé au moins 30 jours avant toute modification tarifaire.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Disponibilité et maintenance</h2>
            <div className="space-y-3">
              <p>
                MyCharlie s'efforce de maintenir le service accessible 24h/24 et 7j/7, 
                mais ne peut garantir une disponibilité totale. Des interruptions peuvent être nécessaires pour :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Maintenance technique planifiée</li>
                <li>Mises à jour de sécurité</li>
                <li>Amélioration des fonctionnalités</li>
                <li>Cas de force majeure</li>
              </ul>
              <p>
                MyCharlie n'est pas responsable des dommages indirects résultant de l'indisponibilité du service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Limitation de responsabilité</h2>
            <div className="space-y-3">
              <p>
                MyCharlie fournit un outil d'assistance administrative mais n'est pas responsable :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>De l'exactitude des informations que vous saisissez</li>
                <li>Des erreurs dans les documents générés</li>
                <li>De la conformité réglementaire de vos documents</li>
                <li>Des pertes de données dues à une mauvaise utilisation</li>
                <li>Des dommages indirects, perte de profit ou perte de chance</li>
                <li>Des relations avec vos clients ou prestataires</li>
              </ul>
              <p>
                La responsabilité de MyCharlie est limitée au montant des sommes éventuellement 
                versées par l'utilisateur au cours des 12 derniers mois.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Protection des données personnelles</h2>
            <p>
              Conformément au RGPD, vos données personnelles sont traitées conformément à notre 
              <Link href="/politique-confidentialite" className="text-orange-400 hover:text-orange-300 ml-1">
                Politique de confidentialité
              </Link>.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
              <li>Vos données sont hébergées en France</li>
              <li>Elles sont chiffrées et sécurisées</li>
              <li>Elles ne sont partagées avec aucun tiers sans consentement</li>
              <li>Vous disposez d'un droit d'accès, modification et suppression</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Propriété intellectuelle</h2>
            <div className="space-y-3">
              <p>
                MyCharlie et l'ensemble de ses éléments (logiciel, design, interface, algorithmes, 
                marque, etc.) sont la propriété exclusive de MyCharlie et sont protégés par le 
                droit de la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, modification, distribution ou utilisation non autorisée 
                du service ou de ses éléments est interdite et constitue une contrefaçon.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Résiliation</h2>
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <strong>Résiliation par l'utilisateur</strong>
              </p>
              <p>
                Vous pouvez résilier votre compte MyCharlie à tout moment, sans frais et sans préavis. 
                La résiliation prend effet immédiatement et entraîne la suppression de vos données.
              </p>
              
              <p className="flex items-center gap-2 mt-4">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <strong>Résiliation par MyCharlie</strong>
              </p>
              <p>
                MyCharlie peut résilier votre compte en cas de :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Non-respect des présentes conditions d'utilisation</li>
                <li>Utilisation frauduleuse ou abusive du service</li>
                <li>Violation de la législation en vigueur</li>
                <li>Non-paiement après introduction de tarification payante</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Évolution des services</h2>
            <p>
              MyCharlie se réserve le droit de faire évoluer ses services, d'ajouter ou de supprimer 
              des fonctionnalités pour améliorer l'expérience utilisateur. Les modifications majeures 
              feront l'objet d'une communication préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Litiges</h2>
            <div className="space-y-3">
              <p>
                En cas de litige relatif à l'interprétation ou l'exécution des présentes conditions, 
                les parties s'efforceront de trouver une solution amiable.
              </p>
              <p>
                À défaut d'accord amiable, le litige sera porté devant la juridiction compétente 
                du ressort du siège social de MyCharlie.
              </p>
              <p>
                Les présentes conditions d'utilisation sont soumises au droit français.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter :
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
