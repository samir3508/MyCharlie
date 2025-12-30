import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Image,
} from '@react-pdf/renderer'

// Colors
const COLORS = {
  black: '#000000',
  orange: '#FF4D00',
  white: '#FFFFFF',
  gray: '#666666',
  lightGray: '#F5F5F5',
  borderGray: '#E0E0E0',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
    backgroundColor: COLORS.white,
  },
  // Header
  header: {
    backgroundColor: COLORS.orange,
    padding: 18,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.white,
    marginBottom: 4,
  },
  companyNameOrange: {
    color: COLORS.black,
  },
  companyDetails: {
    fontSize: 8,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 1.5,
  },
  documentInfo: {
    textAlign: 'right',
  },
  docTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.white,
    marginBottom: 2,
  },
  docNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.white,
  },
  // Content
  content: {
    padding: 20,
    paddingTop: 10,
    flex: 1,
  },
  // Info section
  infoSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  infoCard: {
    flex: 0.45,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.orange,
  },
  clientName: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.black,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 2,
    lineHeight: 1.3,
  },
  infoLabel: {
    fontWeight: 600,
    color: COLORS.gray,
  },
  // Prestations
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.black,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.orange,
  },
  // Table
  tableContainer: {
    marginBottom: 15,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.black,
    padding: 6,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontWeight: 600,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    padding: 6,
    backgroundColor: COLORS.white,
  },
  tableRowAlt: {
    backgroundColor: COLORS.lightGray,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.black,
  },
  tableCellDesc: { flex: 4 },
  tableCellQty: { flex: 1, textAlign: 'center' },
  tableCellUnit: { flex: 1, textAlign: 'center' },
  tableCellPrice: { flex: 1.5, textAlign: 'right' },
  tableCellTva: { flex: 1, textAlign: 'center' },
  tableCellTotal: { flex: 1.5, textAlign: 'right', fontWeight: 600 },
  // Summary section
  summarySection: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  conditionsBox: {
    flex: 1.2,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  conditionsTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.black,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.orange,
  },
  conditionsText: {
    fontSize: 8,
    color: COLORS.black,
    marginBottom: 3,
    lineHeight: 1.3,
  },
  totalsBox: {
    flex: 0.8,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  totalRowAlt: {
    backgroundColor: COLORS.lightGray,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: 500,
    color: COLORS.gray,
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.black,
  },
  totalRowFinal: {
    backgroundColor: COLORS.orange,
    padding: 8,
  },
  totalLabelFinal: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.white,
  },
  totalValueFinal: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.white,
  },
  // Validity alert
  validityAlert: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: COLORS.orange,
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  validityText: {
    fontSize: 9,
    color: COLORS.black,
    fontWeight: 600,
  },
  validityDate: {
    color: COLORS.orange,
    fontWeight: 700,
  },
  // Signature
  signatureSection: {
    marginTop: 10,
  },
  signatureBox: {
    borderWidth: 2,
    borderColor: COLORS.orange,
    borderRadius: 10,
    padding: 20,
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.black,
    textTransform: 'uppercase',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.orange,
  },
  signatureFields: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  signatureField: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.gray,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    paddingBottom: 5,
    minHeight: 25,
  },
  signatureConsent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 10,
  },
  signatureCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: COLORS.orange,
    borderRadius: 4,
  },
  signatureConsentText: {
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.black,
  },
  signatureNote: {
    fontSize: 8,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 10,
  },
  // Footer
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
    backgroundColor: COLORS.lightGray,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray,
    lineHeight: 1.3,
  },
  footerBold: {
    fontWeight: 700,
    color: COLORS.black,
  },
})

// Format currency
const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
  // Remplacer l'espace insécable par un espace normal pour le PDF
  return formatted.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ')
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export type DevisLigne = {
  designation: string
  description_detaillee?: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  tva_pct: number
  total_ht: number
  total_ttc: number
}

export type DevisPDFData = {
  entreprise: {
    nom: string
    adresse: string
    cp: string
    ville: string
    telephone: string
    email: string
    siret: string
    forme_juridique?: string
    tva_intra?: string
  }
  numero: string
  date_creation: string
  date_validite: string
  titre?: string
  client: {
    nom: string
    adresse?: string
    cp?: string
    ville?: string
    telephone?: string
    email?: string
  }
  adresse_chantier?: string
  lignes: DevisLigne[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  conditions_paiement?: string
  delai_execution?: string
  notes?: string
  signature_url?: string
  signature?: {
    image: string
    nom: string
    email?: string
    date: string
  }
}

export function DevisPDF({ data }: { data: DevisPDFData }) {
  // Debug: Vérifier les données de signature
  console.log('=== PDF TEMPLATE SIGNATURE DEBUG ===')
  console.log('data.signature:', !!data.signature)
  console.log('data.signature?.image:', !!data.signature?.image)
  console.log('data.signature?.nom:', data.signature?.nom)
  console.log('data.signature?.email:', data.signature?.email)
  console.log('data.signature?.date:', data.signature?.date)
  console.log('=====================================')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {data.entreprise.nom || 'MY LÉO'}
            </Text>
            <Text style={styles.companyDetails}>
              {data.entreprise.adresse && `${data.entreprise.adresse}\n`}
              {(data.entreprise.cp || data.entreprise.ville) && `${data.entreprise.cp} ${data.entreprise.ville}\n`}
              {data.entreprise.telephone && `Tél : ${data.entreprise.telephone}\n`}
              {data.entreprise.email && `Email : ${data.entreprise.email}\n`}
              {data.entreprise.siret && `SIRET : ${data.entreprise.siret}`}
            </Text>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.docTitle}>DEVIS</Text>
            <Text style={styles.docNumber}>N° {data.numero}</Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* Info Cards */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Client</Text>
              <Text style={styles.clientName}>{data.client.nom}</Text>
              {data.client.telephone && (
                <Text style={styles.infoText}>Tél : {data.client.telephone}</Text>
              )}
              {data.client.email && (
                <Text style={styles.infoText}>Email : {data.client.email}</Text>
              )}
              {data.adresse_chantier && (
                <Text style={[styles.infoText, { marginTop: 5, fontWeight: 600 }]}>
                  Chantier : {data.adresse_chantier}
                </Text>
              )}
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Informations</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Date : </Text>
                {formatDate(data.date_creation)}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Validité : </Text>
                {formatDate(data.date_validite)}
              </Text>
              {data.titre && (
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Projet : </Text>
                  <Text style={{ fontWeight: 700 }}>{data.titre}</Text>
                </Text>
              )}
            </View>
          </View>

          {/* Prestations */}
          <Text style={styles.sectionTitle}>Détail des prestations</Text>
          <View style={styles.tableContainer}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableCellDesc]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellQty]}>Qté</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellUnit]}>Unité</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellPrice]}>Prix HT</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellTva]}>TVA</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellTotal]}>Total HT</Text>
            </View>
            {/* Rows */}
            {data.lignes.map((ligne, index) => (
              <View 
                key={index} 
                style={[
                  styles.tableRow,
                  ...(index % 2 === 1 ? [styles.tableRowAlt] : [])
                ]}
              >
                <View style={styles.tableCellDesc}>
                  <Text style={[styles.tableCell, { fontWeight: 600 }]}>{ligne.designation}</Text>
                  {ligne.description_detaillee && (
                    <Text style={[styles.tableCell, { color: COLORS.gray, fontSize: 8, marginTop: 2 }]}>
                      {ligne.description_detaillee}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.tableCellQty]}>{ligne.quantite}</Text>
                <Text style={[styles.tableCell, styles.tableCellUnit]}>{ligne.unite}</Text>
                <Text style={[styles.tableCell, styles.tableCellPrice]}>
                  {formatCurrency(ligne.prix_unitaire_ht)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellTva]}>{ligne.tva_pct}%</Text>
                <Text style={[styles.tableCell, styles.tableCellTotal]}>
                  {formatCurrency(ligne.total_ht)}
                </Text>
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.conditionsBox}>
              <Text style={styles.conditionsTitle}>Conditions et modalités</Text>
              {data.conditions_paiement && (
                <Text style={styles.conditionsText}>
                  <Text style={{ fontWeight: 700 }}>Paiement : </Text>
                  {data.conditions_paiement}
                </Text>
              )}
              {data.delai_execution && (
                <Text style={styles.conditionsText}>
                  <Text style={{ fontWeight: 700 }}>Délai d'exécution : </Text>
                  {data.delai_execution}
                </Text>
              )}
              {data.notes && (
                <Text style={styles.conditionsText}>
                  <Text style={{ fontWeight: 700 }}>Notes : </Text>
                  {data.notes}
                </Text>
              )}
            </View>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total HT</Text>
                <Text style={styles.totalValue}>{formatCurrency(data.montant_ht)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowAlt]}>
                <Text style={styles.totalLabel}>TVA</Text>
                <Text style={styles.totalValue}>{formatCurrency(data.montant_tva)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={styles.totalLabelFinal}>TOTAL TTC</Text>
                <Text style={styles.totalValueFinal}>{formatCurrency(data.montant_ttc)}</Text>
              </View>
            </View>
          </View>

          {/* Validity Alert */}
          <View style={styles.validityAlert}>
            <Text style={styles.validityText}>
              Ce devis est valable jusqu'au{' '}
              <Text style={styles.validityDate}>{formatDate(data.date_validite)}</Text>
            </Text>
          </View>

          {/* Section Signature - Compacte */}
          <View style={{ marginTop: 12 }}>
            <View style={{ 
              borderWidth: 2, 
              borderColor: COLORS.orange, 
              borderRadius: 10, 
              padding: 20 
            }}>
              <Text style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                color: COLORS.black, 
                textTransform: 'uppercase', 
                marginBottom: 15, 
                paddingBottom: 10, 
                borderBottomWidth: 2, 
                borderBottomColor: COLORS.orange 
              }}>
                Signature électronique
              </Text>
              
              {data.signature ? (
                // Devis signé - Aperçu complet
                <View>
                  {/* Header signature */}
                  <View style={{ 
                    backgroundColor: '#D1FAE5', 
                    borderRadius: 8, 
                    padding: 12, 
                    marginBottom: 15 
                  }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ 
                          width: 8, 
                          height: 8, 
                          backgroundColor: '#10B981', 
                          borderRadius: 4 
                        }} />
                        <Text style={{ 
                          fontSize: 10, 
                          fontWeight: 700, 
                          color: '#059669' 
                        }}>
                          Document signé électroniquement
                        </Text>
                      </View>
                      <Text style={{ 
                        fontSize: 8, 
                        color: '#059669', 
                        fontWeight: 600 
                      }}>
                        ✓ Valide
                      </Text>
                    </View>
                  </View>

                  {/* Titres alignés sur la même ligne */}
                  <View style={{ 
                    flexDirection: 'row', 
                    gap: 20, 
                    marginBottom: 10 
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 7, 
                        color: COLORS.gray, 
                        textTransform: 'uppercase', 
                        fontWeight: 600 
                      }}>
                        Signé par
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 7, 
                        color: COLORS.gray, 
                        textTransform: 'uppercase', 
                        fontWeight: 600 
                      }}>
                        Date de signature
                      </Text>
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <Text style={{ 
                        fontSize: 7, 
                        color: COLORS.gray, 
                        textTransform: 'uppercase', 
                        fontWeight: 600 
                      }}>
                        Aperçu de la signature
                      </Text>
                    </View>
                  </View>

                  {/* Contenu aligné sur la même ligne */}
                  <View style={{ 
                    flexDirection: 'row', 
                    gap: 20, 
                    marginBottom: 15,
                    alignItems: 'flex-start'
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: COLORS.black 
                      }}>
                        {data.signature.nom}
                      </Text>
                      {data.signature.email && (
                        <Text style={{ 
                          fontSize: 8, 
                          color: COLORS.gray, 
                          marginTop: 2 
                        }}>
                          {data.signature.email}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: COLORS.black 
                      }}>
                        {formatDate(data.signature.date)}
                      </Text>
                      <Text style={{ 
                        fontSize: 8, 
                        color: COLORS.gray, 
                        marginTop: 2 
                      }}>
                        {new Date(data.signature.date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <View style={{ 
                        backgroundColor: COLORS.white, 
                        borderRadius: 6, 
                        padding: 8, 
                        borderWidth: 1, 
                        borderColor: COLORS.borderGray,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Image 
                          src={data.signature.image} 
                          style={{ 
                            width: 100, 
                            height: 40 
                          }} 
                        />
                      </View>
                    </View>
                  </View>

                  {/* Mentions légales */}
                  <View style={{ 
                    marginTop: 12, 
                    paddingTop: 10, 
                    borderTopWidth: 1, 
                    borderTopColor: COLORS.borderGray 
                  }}>
                    <Text style={{ 
                      fontSize: 7, 
                      color: COLORS.gray, 
                      textAlign: 'center', 
                      fontStyle: 'italic' 
                    }}>
                      Signature électronique conforme au règlement eIDAS - 
                      Valeur juridique équivalente à une signature manuscrite
                    </Text>
                  </View>
                </View>
              ) : data.signature_url ? (
                // Pas signé - Signature manuelle + Zone signature électronique style capture
                <View>
                  {/* Signature manuelle */}
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 8, fontWeight: 700, marginBottom: 4, color: COLORS.black }}>
                      SIGNATURE :
                    </Text>
                    <View style={{ 
                      borderBottomWidth: 1, 
                      borderBottomColor: COLORS.black,
                      height: 1,
                      marginBottom: 12,
                    }} />
                  </View>
                  
                  {/* Zone signature électronique */}
                  <View style={{
                    borderWidth: 2,
                    borderColor: COLORS.orange,
                    borderRadius: 6,
                    padding: 10,
                    backgroundColor: '#FFF5F0',
                  }}>
                    <Text style={{ 
                      fontSize: 9, 
                      fontWeight: 700, 
                      marginBottom: 6,
                      color: COLORS.black,
                      textTransform: 'uppercase'
                    }}>
                      SIGNATURE ÉLECTRONIQUE
                    </Text>
                    <Text style={{ 
                      fontSize: 8, 
                      color: COLORS.black,
                      marginBottom: 8,
                      lineHeight: 1.3
                    }}>
                      Pour signer ce devis électroniquement, cliquez sur le bouton ci-dessous :
                    </Text>
                    <Link src={data.signature_url} style={{ textDecoration: 'none' }}>
                      <View style={{
                        backgroundColor: COLORS.orange,
                        borderRadius: 6,
                        padding: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 14, marginRight: 6 }}>✏️</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 600 }}>
                          Signer ce devis
                        </Text>
                      </View>
                    </Link>
                  </View>
                </View>
              ) : (
                // Pas de signature configurée
                <View style={{ textAlign: 'center', padding: 10 }}>
                  <Text style={{ fontSize: 8, color: COLORS.gray }}>
                    Signature non configurée
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 }}>
            <Text style={styles.footerText}>
              <Text style={styles.footerBold}>{data.entreprise.nom}</Text> — {data.entreprise.forme_juridique || 'SAS'}
            </Text>
            <Text style={styles.footerText}>
              SIRET : {data.entreprise.siret}
            </Text>
            {data.entreprise.tva_intra && (
              <Text style={styles.footerText}>
                TVA : {data.entreprise.tva_intra}
              </Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
