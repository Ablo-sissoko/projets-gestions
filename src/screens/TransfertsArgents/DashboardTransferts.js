import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const DashboardTransferts = () => {
  const uvParOperateur = [
    { label: 'Orange Money', solde: '1 200 000 FCFA' },
    { label: 'Moov Money', solde: '500 000 FCFA' },
    { label: 'Wave', solde: '300 000 FCFA' },
  ]

  const alertes = [
    { message: 'Cash en caisse sous le seuil (50 000 FCFA restants)', level: 'danger' },
    { message: 'Solde Moov proche du minimum opérationnel', level: 'warning' },
  ]

  const cashPhysique = '850 000 FCFA'
  const totalUv = '2 000 000 FCFA'
  const grandTotal = '2 850 000 FCFA'

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Liquidité totale</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Position de cash</Text>
        <Text style={styles.bigValue}>{cashPhysique}</Text>
        <Text style={styles.helperText}>Espèces physiques en caisse</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Balance UV par opérateur</Text>
        {uvParOperateur.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.solde}</Text>
          </View>
        ))}
        <View style={[styles.row, styles.rowTotal]}>
          <Text style={styles.rowLabel}>Sous-total UV</Text>
          <Text style={styles.rowValue}>{totalUv}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Grand total</Text>
        <Text style={styles.grandTotal}>{grandTotal}</Text>
        <Text style={styles.helperText}>Cash + UV (fonds de commerce réel)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alertes seuil critique</Text>
        {alertes.map((a) => (
          <View
            key={a.message}
            style={[styles.alertBox, a.level === 'danger' ? styles.alertDanger : styles.alertWarning]}
          >
            <Text style={styles.alertText}>{a.message}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default DashboardTransferts

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  bigValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  grandTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowTotal: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  rowLabel: {
    color: COLORS.text,
    fontWeight: '600',
  },
  rowValue: {
    color: COLORS.text,
    fontWeight: '700',
  },
  alertBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  alertDanger: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  alertWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  alertText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
})
