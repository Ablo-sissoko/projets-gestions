import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const ApprovisionnementTransferts = () => {
  const achatsUv = [
    { date: '27/02/2026', fournisseur: 'Master Bamako', cash: '2 000 000 FCFA', uv: '2 000 000 FCFA OM' },
    { date: '25/02/2026', fournisseur: 'Grossiste Moov', cash: '500 000 FCFA', uv: '500 000 FCFA Moov' },
  ]

  const collecteurs = [
    { heure: '18:05', montant: '3 400 000 FCFA', operateur: 'Collecte Orange' },
    { heure: '17:42', montant: '800 000 FCFA', operateur: 'Collecte Wave' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Approvisionnement (rechargement UV)</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Achats d&apos;UV (cash → UV)</Text>
        {achatsUv.map((a, i) => (
          <View key={i} style={styles.block}>
            <Text style={styles.rowLabel}>{a.date} · {a.fournisseur}</Text>
            <Text style={styles.helperText}>Cash donné : {a.cash}</Text>
            <Text style={styles.rowValue}>UV reçues : {a.uv}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Passages collecteurs</Text>
        {collecteurs.map((c, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowLabel}>{c.heure}</Text>
            <Text style={styles.rowSub}>{c.operateur}</Text>
            <Text style={styles.rowValue}>{c.montant}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default ApprovisionnementTransferts

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
  block: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
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
  rowValue: { color: COLORS.primary, fontWeight: '700' },
  helperText: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
})
