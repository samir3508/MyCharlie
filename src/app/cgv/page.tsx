import Link from 'next/link'
import { ArrowLeft, FileText, Clock, Shield, CreditCard, Users, AlertCircle, Mail, Phone } from 'lucide-react'

export default function CGV() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
          Conditions Générales de Vente
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent l'utilisation du service MyCharlie, 
              assistant IA spécialisé pour les professionnels du bâtiment. En utilisant notre service, 
              vous acceptez sans réserve ces CGV.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Description du service</h2>
            <div className="space-y-3">
              <p>MyCharlie est un service d'assistant IA qui propose :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Gestion des clients et prospects</li>
                <li>Création automatique de devis et factures</li>
                <li>Relances automatiques par email et WhatsApp</li>
                <li>Suivi des paiements</li>
                <li>Signature électronique des documents</li>
                <li>Archivage sécurisé des documents</li>
              </ul>
              <p className="flex items-center gap-2 text-orange-400">
                <AlertCircle className="w-4 h-4" />
                Le service est actuellement en version bêta gratuite.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Inscription et compte utilisateur</h2>
            <div className="space-y-3">
              <p>
                L'accès à MyCharlie est soumis à la création d'un compte utilisateur. 
                Vous vous engagez à fournir des informations exactes et à les maintenir à jour.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Vous devez être majeur et avoir la capacité juridique de contracter</li>
                <li>Un seul compte par personne physique ou morale est autorisé</li>
                <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
                <li>Toute utilisation non autorisée de votre compte doit être signalée immédiatement</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Période d'essai et tarification</h2>
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <strong>Période d'essai gratuite</strong>
              </p>
              <p>
                MyCharlie est actuellement proposé en version bêta gratuite, sans engagement et sans 
                carte bancaire requise. Cette période d'essai vous permet d'utiliser toutes les fonctionnalités 
                du service sans limitation.
              </p>
              <p className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-400" />
                <strong>Future tarification</strong>
              </p>
              <p>
                À l'issue de la période bêta, des formules payantes pourront être proposées. 
                Vous serez informé au moins 30 jours avant toute introduction de tarification. 
                Vous aurez alors la possibilité de souscrire à une formule payante ou de résilier 
                votre compte sans frais.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Obligations de l'utilisateur</h2>
            <div className="space-y-3">
              <p>En tant qu'utilisateur de MyCharlie, vous vous engagez à :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Utiliser le service conformément à sa destination et à la législation en vigueur</li>
                <li>Fournir des informations exactes pour la création de documents</li>
                <li>Ne pas utiliser le service pour des activités illégales ou frauduleuses</li>
                <li>Respecter les droits de propriété intellectuelle de tiers</li>
                <li>Ne pas tenter d'interrompre ou de dégrader le service</li>
                <li>Ne pas partager vos identifiants de connexion</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Propriété intellectuelle</h2>
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <strong>Documents créés</strong>
              </p>
              <p>
                Les documents (devis, factures, etc.) que vous créez via MyCharlie restent votre propriété. 
                Vous conservez tous les droits sur ces documents.
              </p>
              <p className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <strong>Plateforme MyCharlie</strong>
              </p>
              <p>
                MyCharlie et l'ensemble de ses éléments (logiciel, design, interface, etc.) sont la propriété 
                exclusive de MyCharlie et sont protégés par le droit de la propriété intellectuelle. 
                Toute reproduction ou utilisation non autorisée est interdite.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Données personnelles et confidentialité</h2>
            <div className="space-y-3">
              <p>
                MyCharlie s'engage à protéger vos données personnelles conformément à notre 
                <Link href="/politique-confidentialite" className="text-orange-400 hover:text-orange-300 ml-1">
                  Politique de confidentialité
                </Link>.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Vos données sont hébergées en France</li>
                <li>Elles sont chiffrées et sécurisées</li>
                <li>Elles ne sont jamais partagées avec des tiers sans votre consentement</li>
                <li>Vous disposez d'un droit d'accès, de modification et de suppression</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Disponibilité du service</h2>
            <div className="space-y-3">
              <p>
                MyCharlie s'efforce de maintenir le service accessible 24h/24 et 7j/7, 
                mais ne peut garantir une disponibilité totale. Des interruptions temporaires 
                peuvent être nécessaires pour la maintenance, les mises à jour ou en cas de 
                force majeure.
              </p>
              <p>
                MyCharlie n'est pas responsable des dommages indirects résultant de 
                l'indisponibilité du service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Responsabilité</h2>
            <div className="space-y-3">
              <p>
                MyCharlie fournit un outil d'assistance mais n'est pas responsable :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>De l'exactitude des informations que vous saisissez</li>
                <li>Des erreurs dans les documents générés si les données d'entrée sont incorrectes</li>
                <li>De la conformité réglementaire de vos documents (vous restez responsable)</li>
                <li>Des pertes de données dues à une mauvaise utilisation du service</li>
                <li>Des dommages indirects, perte de profit ou perte de chance</li>
              </ul>
              <p>
                La responsabilité de MyCharlie est limitée au montant des sommes versées 
                par l'utilisateur au cours des 12 derniers mois.
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
                Vous pouvez résilier votre compte MyCharlie à tout moment, sans frais et sans préavis, 
                depuis votre espace utilisateur ou en nous contactant. 
                La résiliation prend effet immédiatement.
              </p>
              <p className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <strong>Résiliation par MyCharlie</strong>
              </p>
              <p>
                MyCharlie peut résilier votre compte en cas de :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Non-respect des présentes CGV</li>
                <li>Utilisation frauduleuse ou abusive du service</li>
                <li>Non-paiement après introduction de tarification payante</li>
                <li>Violation de la législation en vigueur</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Évolution des services</h2>
            <p>
              MyCharlie se réserve le droit de faire évoluer ses services, d'ajouter ou de supprimer 
              des fonctionnalités pour améliorer l'expérience utilisateur. 
              Les modifications majeures feront l'objet d'une communication préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Litiges</h2>
            <div className="space-y-3">
              <p>
                En cas de litige relatif à l'interprétation ou l'exécution des présentes CGV, 
                les parties s'efforceront de trouver une solution amiable.
              </p>
              <p>
                À défaut d'accord amiable, le litige sera porté devant la juridiction compétente 
                du ressort du siège social de MyCharlie.
              </p>
              <p>
                Les présentes CGV sont soumises au droit français.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              Pour toute question concernant ces CGV, vous pouvez nous contacter :
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
