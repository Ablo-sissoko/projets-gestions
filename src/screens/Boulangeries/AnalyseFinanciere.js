import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const AnalyseFinanciere = () => {
  const pertes = [
    { label: 'Invendus pains', value: '18 unités' },
    { label: 'Viennoiseries', value: '12 unités' },
  ]

  const marges = [
    { label: 'Baguette tradition', status: 'Très rentable' },
    { label: 'Sandwich', status: 'Rentable' },
    { label: 'Tarte spéciale', status: 'À revoir' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Analyse & Pilotage Financier</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rapport de pertes (casse)</Text>
        {pertes.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Analyse des marges</Text>
        {marges.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowTag}>{item.status}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Export comptable</Text>
        <Text style={styles.helperText}>
          Exporter toutes les ventes et achats en un clic pour le comptable.
        </Text>
        <View style={styles.exportBox}>
          <Text style={styles.exportText}>Export journalier prêt</Text>
        </View>
      </View>
    </ScrollView>
    </View>
  )
}

export default AnalyseFinanciere

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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    color: COLORS.text,
    fontWeight: '600',
  },
  rowValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  rowTag: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  exportBox: {
    marginTop: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
  },
  exportText: {
    color: COLORS.text,
    fontWeight: '600',
  },
})
