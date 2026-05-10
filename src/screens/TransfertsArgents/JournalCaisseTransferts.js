import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const JournalCaisseTransferts = () => {
  const journal = [
    { heure: '09:12', libelle: 'Dépôt OM', sens: '+', cash: '—', uv: '+25 000' },
    { heure: '09:45', libelle: 'Retrait Wave', sens: '—', cash: '+10 000', uv: '—10 000' },
    { heure: '10:30', libelle: 'Achat UV master', sens: '—', cash: '—500 000', uv: '+500 000' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Journal de caisse & rapprochement</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Journal de bord (chronologique)</Text>
        {journal.map((l, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.time}>{l.heure}</Text>
            <View style={styles.flex1}>
              <Text style={styles.rowLabel}>{l.libelle}</Text>
              <Text style={styles.helperText}>Cash {l.cash} · UV {l.uv}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bilan fin de journée</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cash théorique</Text>
          <Text style={styles.rowValue}>845 200 FCFA</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cash compté</Text>
          <Text style={styles.rowValue}>845 000 FCFA</Text>
        </View>
        <View style={[styles.rowBetween, styles.ecart]}>
          <Text style={styles.rowLabel}>Écart</Text>
          <Text style={styles.ecartValue}>—200 FCFA</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rapport commissions</Text>
        <Text style={styles.helperText}>Hebdomadaire / mensuel — net perçu par l&apos;activité.</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Semaine en cours</Text>
          <Text style={styles.rowValue}>128 400 FCFA</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mois en cours</Text>
          <Text style={styles.rowValue}>512 000 FCFA</Text>
        </View>
      </View>
    </ScrollView>
    </View>
  )
}

export default JournalCaisseTransferts

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  time: { width: 48, color: COLORS.muted, fontWeight: '600', fontSize: 12 },
  flex1: { flex: 1 },
  rowLabel: { color: COLORS.text, fontWeight: '600' },
  rowValue: { color: COLORS.primary, fontWeight: '700' },
  helperText: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ecart: { borderBottomWidth: 0, marginTop: 8 },
  ecartValue: { color: COLORS.danger, fontWeight: '700' },
})
