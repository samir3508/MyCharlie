'use client'

import { use, useState, useEffect } from 'react'
import { SignaturePad, type SignatureData } from '@/components/signature/signature-pad'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

interface DevisData {
  id: string
  numero: string
  date_creation: string
  date_expiration: string
  montant_ht: number
  montant_ttc: number
  statut: string
  titre?: string
  signature_client?: string
  signature_nom?: string
  signature_email?: string
  signature_date?: string
  client: {
    nom_complet: string
    email: string
  }
  tenant: {
    company_name: string
  }
  lignes: Array<{
    id: string
    designation: string
    description_detaillee?: string
    quantite: number
    unite: string
    prix_unitaire_ht: number
    tva_pct: number
    total_ht: number
    total_ttc: number
  }>
}

export default function SignaturePage({ params }: PageProps) {
  const { token } = use(params)
  const [devis, setDevis] = useState<DevisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signatureData, setSignatureData] = useState<{ dataUrl: string; isEmpty: boolean } | null>(null)
  const [signatureType, setSignatureType] = useState<'draw' | 'text'>('draw')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    signer_email: ''
  })

  // Charger les données du devis
  useEffect(() => {
    const fetchDevis = async () => {
      try {
        console.log('Fetching devis for token:', token)
        const response = await fetch(`/api/sign/${token}`)
        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.log('Error response:', errorData)
          setError(errorData.error || 'Devis non trouvé')
          return
        }
        
        const data = await response.json()
        console.log('Devis data received:', data)
        
        setDevis(data)
        // Pré-remplir l'email du client
        setFormData(prev => ({
          ...prev,
          signer_email: data.client.email || ''
        }))
        console.log('Devis loaded:', data)
        console.log('Lignes:', data.lignes)
        console.log('Lignes count:', data.lignes?.length)
        console.log('Devis montant_ht:', data.montant_ht)
        console.log('Devis montant_ttc:', data.montant_ttc)
        console.log('Client:', data.client)
        console.log('Full devis object keys:', Object.keys(data))
      } catch (err) {
        console.error('Fetch error:', err)
        console.error('Error details:', err instanceof Error ? err.message : 'Unknown error')
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    fetchDevis()
  }, [token])

  // Soumettre la signature
  const handleSignatureSubmit = async () => {
    // Validation du formulaire
    if (!formData.first_name || !formData.last_name || !formData.signer_email) {
      alert('Veuillez remplir votre prénom, nom et email')
      return
    }
    
    // Validation de la signature selon le type
    if (signatureType === 'draw') {
      if (!signatureData || signatureData.isEmpty) {
        alert('Veuillez signer le document')
        return
      }
    }
    // Pour signature textuelle, pas besoin de validation supplémentaire

    setSigning(true)
    try {
      console.log('Submitting signature with data:', {
        signatureType,
        hasSignatureData: !!signatureData,
        isEmpty: signatureData?.isEmpty,
        formData
      })
      
      let signatureImage = ''
      
      if (signatureType === 'draw') {
        signatureImage = signatureData!.dataUrl
      } else {
        // Créer une signature textuelle
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = 300
        canvas.height = 100
        
        // Fond blanc
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Texte de la signature
        ctx.fillStyle = 'black'
        ctx.font = 'italic 24px cursive'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${formData.first_name} ${formData.last_name}`, canvas.width / 2, canvas.height / 2)
        
        signatureImage = canvas.toDataURL()
      }
      
      const payload = {
        signature_image: signatureImage,
        signer_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        signer_email: formData.signer_email,
        signed_at: new Date().toISOString()
      }
      
      console.log('Sending payload:', {
        ...payload,
        signature_image: payload.signature_image.substring(0, 50) + '...'
      })
      
      const response = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      console.log('POST response status:', response.status)
      console.log('POST response ok:', response.ok)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la signature')
      }

      setSigned(true)
    } catch (err) {
      console.error('Sign error:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la signature')
    } finally {
      setSigning(false)
    }
  }

  // Gérer le changement de signature
  const handleSignatureChange = (data: { dataUrl: string; isEmpty: boolean }) => {
    setSignatureData(data)
  }

  // Formatage
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // États d'affichage
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF4D00] mx-auto mb-4" />
          <p className="text-gray-600">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Lien invalide</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Document signé !</h2>
            <p className="text-gray-600 mb-4">
              Votre signature a été enregistrée avec succès.
            </p>
            <p className="text-sm text-gray-500">
              Un email de confirmation vous sera envoyé.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!devis) return null

  // Debug: Test simple render
  console.log('About to render devis:', devis.numero)
  console.log('Will render lignes:', devis.lignes?.length || 0)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Signature électronique
          </h1>
          <p className="text-gray-600">
            {devis.tenant.company_name}
          </p>
        </div>

        {/* Récapitulatif du devis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF4D00] rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Devis {devis.numero}</CardTitle>
                  <CardDescription>
                    Créé le {formatDate(devis.date_creation)}
                  </CardDescription>
                </div>
              </div>
              {devis.signature_client ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  ✓ Signé
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[#FF4D00] border-[#FF4D00]">
                  En attente de signature
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {devis.titre && (
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Objet</h4>
                <p className="font-medium">{devis.titre}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Client</h4>
                <p className="font-medium">{devis.client.nom_complet}</p>
                <p className="text-sm text-gray-600">{devis.client.email}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Validité</h4>
                <p className="font-medium">
                  {devis.date_expiration ? `Jusqu'au ${formatDate(devis.date_expiration)}` : 'Non spécifiée'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Lignes du devis */}
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">Détail des prestations</h4>
              {devis.lignes && devis.lignes.length > 0 ? (
                <div className="space-y-2">
                  {devis.lignes.map((ligne, index) => (
                    <div key={ligne.id || index} className="flex justify-between text-sm bg-gray-800 text-white p-3 rounded border border-gray-600">
                      <div className="flex-1">
                        <div className="font-medium text-white">{ligne.designation || 'Sans designation'}</div>
                        {ligne.description_detaillee && (
                          <div className="text-xs text-gray-300 mt-1">{ligne.description_detaillee}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {ligne.quantite} {ligne.unite} × {formatCurrency(ligne.prix_unitaire_ht)}
                        </div>
                      </div>
                      <span className="font-medium text-[#FF4D00]">{formatCurrency(ligne.total_ht)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-300 bg-gray-800 p-4 rounded text-center border border-gray-600">
                  Aucune ligne de prestation trouvée
                </div>
              )}
            </div>

            <Separator />

            {/* Totaux */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT</span>
                <span>{formatCurrency(devis.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA (20%)</span>
                <span>{formatCurrency(devis.montant_ttc - devis.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total TTC</span>
                <span className="text-[#FF4D00]">{formatCurrency(devis.montant_ttc)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature ou Formulaire */}
        {devis.signature_client ? (
          // Devis déjà signé - Afficher la signature
          <Card className="border-green-300 bg-green-50/50">
            <CardHeader className="bg-green-100/50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-6 h-6" />
                Devis signé
              </CardTitle>
              <CardDescription className="text-green-600">
                Ce document a été signé électroniquement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Signé par</h4>
                  <p className="font-semibold">{devis.signature_nom}</p>
                  {devis.signature_email && (
                    <p className="text-sm text-gray-600">{devis.signature_email}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Date de signature</h4>
                  <p className="font-semibold">{devis.signature_date ? formatDate(devis.signature_date) : '-'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-3">Signature</h4>
                <div className="border rounded-lg bg-white p-4 flex justify-center">
                  <img 
                    src={devis.signature_client} 
                    alt="Signature"
                    className="max-h-24"
                  />
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-green-700 font-medium">
                  ✓ Signature électronique valide - Conforme eIDAS
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Pas encore signé - Afficher le formulaire
          <Card className="border-[#FF4D00]/30">
            <CardHeader className="bg-[#FF4D00]/5">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                Signez ce devis
              </CardTitle>
              <CardDescription>
                En signant ce document, vous acceptez les conditions et tarifs proposés.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Formulaire nom/email */}
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
                      placeholder="Votre prénom"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.signer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, signer_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              
              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de signature *
                </label>
                
                {/* Onglets de sélection */}
                <div className="flex border border-gray-300 rounded-md mb-4">
                  <button
                    type="button"
                    onClick={() => setSignatureType('draw')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md transition-colors ${
                      signatureType === 'draw'
                        ? 'bg-[#FF4D00] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ✍️ Dessiner
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureType('text')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md transition-colors ${
                      signatureType === 'text'
                        ? 'bg-[#FF4D00] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    📝 Texte
                  </button>
                </div>

                {/* Contenu de la signature selon le type */}
                {signatureType === 'draw' ? (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">
                      Dessinez votre signature ci-dessous
                    </div>
                    <SignaturePad onChange={handleSignatureChange} />
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-4 text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Votre signature sera générée automatiquement avec :
                    </div>
                    <div className="text-lg font-medium text-gray-800 italic">
                      {formData.first_name && formData.last_name 
                        ? `${formData.first_name} ${formData.last_name}`
                        : 'Prénom Nom'
                      }
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Style d'écriture manuscrite
                    </div>
                  </div>
                )}

                {/* Aperçu de la signature finale */}
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2">
                    Aperçu de la signature finale :
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                    {signatureType === 'draw' && signatureData && !signatureData.isEmpty ? (
                      <div className="flex justify-center">
                        <img 
                          src={signatureData.dataUrl} 
                          alt="Aperçu signature" 
                          className="max-h-16 border border-gray-200 rounded"
                        />
                      </div>
                    ) : signatureType === 'text' && formData.first_name && formData.last_name ? (
                      <div className="text-center">
                        <div className="text-xl italic text-gray-800" style={{ fontFamily: 'cursive' }}>
                          {formData.first_name} {formData.last_name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-sm">
                        {signatureType === 'draw' 
                          ? 'Dessinez votre signature pour voir l\'aperçu'
                          : 'Remplissez votre prénom et nom pour voir l\'aperçu'
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bouton de soumission */}
              <button
                onClick={handleSignatureSubmit}
                disabled={signing}
                className="w-full bg-[#FF4D00] hover:bg-[#E64400] text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signature en cours...
                  </>
                ) : (
                  'Signer le devis'
                )}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Document généré par MY CHARLIE • Signature électronique conforme eIDAS
        </p>
      </div>
    </div>
  )
}