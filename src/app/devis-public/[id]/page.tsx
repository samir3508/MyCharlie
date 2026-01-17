'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

interface DevisData {
  id: string
  numero: string
  date_creation: string
  date_expiration?: string
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  statut: string
  titre?: string
  description?: string
  pdf_url?: string
  signature_url?: string
  signature_client?: string
  signature_nom?: string
  signature_email?: string
  signature_date?: string
  client: {
    nom_complet: string
    email: string
    telephone?: string
  }
  tenant: {
    company_name: string
    address?: string
    phone?: string
    email?: string
  }
  lignes: Array<{
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

export default function PublicDevisPage({ params }: PageProps) {
  const { id } = use(params)
  const [devis, setDevis] = useState<DevisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDevis = async () => {
      try {
        console.log('[PUBLIC DEVIS PAGE] Fetching devis with ID:', id)
        const apiUrl = `/api/devis/public/${id}`
        console.log('[PUBLIC DEVIS PAGE] API URL:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('[PUBLIC DEVIS PAGE] Response status:', response.status)
        console.log('[PUBLIC DEVIS PAGE] Response ok:', response.ok)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
          console.error('[PUBLIC DEVIS PAGE] Error response:', errorData)
          setError(errorData.error || `Erreur ${response.status}: Devis non trouvé`)
          return
        }
        
        const result = await response.json()
        console.log('[PUBLIC DEVIS PAGE] Success, devis data:', result)
        setDevis(result.data)
      } catch (err) {
        console.error('[PUBLIC DEVIS PAGE] Fetch error:', err)
        setError(`Erreur lors du chargement du devis: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDevis()
    } else {
      setError('ID du devis manquant')
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du devis...</p>
        </div>
      </div>
    )
  }

  if (error || !devis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Devis non trouvé</h2>
            <p className="text-gray-600 mb-4">{error || 'Le devis que vous recherchez n\'existe pas ou n\'est plus disponible.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSigned = !!devis.signature_client
  const canSign = !!devis.signature_url && !isSigned

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">Devis {devis.numero}</CardTitle>
                <p className="text-gray-600">{devis.titre || 'Sans titre'}</p>
              </div>
              <div className="text-right">
                {isSigned ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Signé</span>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <span className="text-sm">En attente de signature</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          {devis.pdf_url && (
            <Button asChild className="flex-1">
              <a href={devis.pdf_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le PDF
              </a>
            </Button>
          )}
          {canSign && (
            <Button asChild className="flex-1" variant="default">
              <Link href={devis.signature_url!}>
                <FileText className="h-4 w-4 mr-2" />
                Signer le devis
              </Link>
            </Button>
          )}
        </div>

        {/* Devis Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Détails du devis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-semibold">{new Date(devis.date_creation).toLocaleDateString('fr-FR')}</p>
              </div>
              {devis.date_expiration && (
                <div>
                  <p className="text-sm text-gray-600">Date d'expiration</p>
                  <p className="font-semibold">{new Date(devis.date_expiration).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </div>
            
            {devis.description && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-800">{devis.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lignes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Détail des prestations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Désignation</th>
                    <th className="text-right p-2">Qté</th>
                    <th className="text-right p-2">Prix unitaire HT</th>
                    <th className="text-right p-2">TVA</th>
                    <th className="text-right p-2">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {devis.lignes.map((ligne, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <div className="font-semibold">{ligne.designation}</div>
                        {ligne.description_detaillee && (
                          <div className="text-sm text-gray-600">{ligne.description_detaillee}</div>
                        )}
                      </td>
                      <td className="text-right p-2">{ligne.quantite} {ligne.unite}</td>
                      <td className="text-right p-2">{ligne.prix_unitaire_ht.toFixed(2)} €</td>
                      <td className="text-right p-2">{ligne.tva_pct}%</td>
                      <td className="text-right p-2 font-semibold">{ligne.total_ttc.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Totaux */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant HT</span>
                  <span className="font-semibold">{devis.montant_ht.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA</span>
                  <span className="font-semibold">{devis.montant_tva.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total TTC</span>
                  <span className="text-orange-600">{devis.montant_ttc.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Info */}
        {isSigned && (
          <Card>
            <CardHeader>
              <CardTitle>Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Signé par</p>
                <p className="font-semibold">{devis.signature_nom}</p>
                <p className="text-sm text-gray-600">{devis.signature_email}</p>
                {devis.signature_date && (
                  <p className="text-sm text-gray-600">
                    Le {new Date(devis.signature_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Devis généré par {devis.tenant.company_name}</p>
          {devis.tenant.email && <p>{devis.tenant.email}</p>}
        </div>
      </div>
    </div>
  )
}
