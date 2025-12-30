import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export type FactureLigne = {
  designation: string
  description_detaillee?: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  tva_pct: number
  total_ht: number
  total_ttc: number
}

export type FacturePDFData = {
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
    iban?: string
    bic?: string
    banque?: string
  }
  numero: string
  type?: string
  statut?: string
  date_emission: string
  date_echeance?: string
  objet?: string
  devis_numero?: string
  client: {
    nom: string
    adresse: string
    cp: string
    ville: string
    telephone: string
    email: string
  }
  lignes: FactureLigne[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  notes?: string
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  h1: { fontSize: 18, fontWeight: 700 },
  muted: { color: '#555' },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cellDesc: { flex: 4 },
  cellQty: { flex: 1, textAlign: 'right' },
  cellUnit: { flex: 1, textAlign: 'right' },
  cellAmount: { flex: 2, textAlign: 'right' },
  totals: { marginTop: 10, alignSelf: 'flex-end', width: '50%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  footer: { marginTop: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
    .format(amount)
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')

export function FacturePDF({ data }: { data: FacturePDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.h1}>FACTURE</Text>
            <Text style={styles.muted}>N° {data.numero}</Text>
          </View>
          <Text>{data.entreprise.nom}</Text>
          <Text style={styles.muted}>{data.entreprise.adresse}</Text>
          <Text style={styles.muted}>SIRET : {data.entreprise.siret}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <Text>{data.client.nom}</Text>
          <Text style={styles.muted}>{data.client.adresse}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.cellDesc}>Désignation</Text>
            <Text style={styles.cellQty}>Qté</Text>
            <Text style={styles.cellUnit}>Unité</Text>
            <Text style={styles.cellAmount}>Total HT</Text>
          </View>
          {data.lignes.map((l, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.cellDesc}>{l.designation}</Text>
              <Text style={styles.cellQty}>{l.quantite}</Text>
              <Text style={styles.cellUnit}>{l.unite}</Text>
              <Text style={styles.cellAmount}>{formatCurrency(l.total_ht)}</Text>
            </View>
          ))}

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Total HT</Text>
              <Text>{formatCurrency(data.montant_ht)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>TVA</Text>
              <Text>{formatCurrency(data.montant_tva)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontWeight: 700 }}>Total TTC</Text>
              <Text style={{ fontWeight: 700 }}>{formatCurrency(data.montant_ttc)}</Text>
            </View>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.muted}>{data.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.muted}>
            {data.entreprise.nom} — {data.entreprise.forme_juridique || 'SAS'} — TVA : {data.entreprise.tva_intra || 'Non applicable'}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
