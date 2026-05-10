import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const FacturationFinancesPrestations = () => {
  const factures = [
    { ref: 'FAC-3101', client: 'Societe Alpha', etat: 'Payee' },
    { ref: 'FAC-3102', client: 'Clinique Niarela', etat: 'En retard' },
  ]

  const frais = [
    { label: 'Essence', montant: '24 000 FCFA' },
    { label: 'Materiel', montant: '55 000 FCFA' },
    { label: 'Repas mission', montant: '12 500 FCFA' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Facturation & Finances</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Facturation automatique</Text>
        <Text style={styles.helperText}>Transformation devis > facture en 1 clic.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Suivi des paiements</Text>
        {factures.map((item) => (
          <View key={item.ref} style={styles.row}>
            <Text style={styles.rowLabel}>{item.ref}</Text>
            <Text style={styles.rowSub}>{item.client}</Text>
            <Text style={[styles.rowTag, item.etat === 'En retard' && styles.tagDanger]}>
              {item.etat}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Gestion des frais</Text>
        {frais.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowTag}>{item.montant}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default FacturationFinancesPrestations

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: 32, backgroundColor: COLORS.bg },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  helperText: { color: COLORS.muted, fontSize: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.text, fontWeight: '600' },
  rowSub: { color: COLORS.muted, fontSize: 12 },
  rowTag: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  tagDanger: { color: COLORS.danger },
})
