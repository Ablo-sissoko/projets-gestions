import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const ProductionLabo = () => {
  const feuilleRoute = [
    { label: 'Baguettes tradition', qty: 150 },
    { label: 'Pains complets', qty: 60 },
    { label: 'Tartes aux pommes', qty: 40 },
  ]

  const fiches = [
    { name: 'Brioche maison', cout: '1 250 FCFA / pièce' },
    { name: 'Croissant beurre', cout: '480 FCFA / pièce' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Production & Labo</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Feuille de route quotidienne</Text>
        {feuilleRoute.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.qty}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fiches techniques</Text>
        {fiches.map((item) => (
          <View key={item.name} style={styles.row}>
            <Text style={styles.rowLabel}>{item.name}</Text>
            <Text style={styles.rowValue}>{item.cout}</Text>
          </View>
        ))}
        <Text style={styles.helperText}>
          Calcul automatique du coût de revient (matières premières + énergie + main-d'œuvre).
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Calculateur de pétrissage</Text>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Température ambiante</Text>
          <Text style={styles.kpiValue}>28°C</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Hydratation recommandée</Text>
          <Text style={styles.kpiValue}>64%</Text>
        </View>
        <Text style={styles.helperText}>
          Ajustez automatiquement eau/farine selon la température.
        </Text>
      </View>
    </ScrollView>
    </View>
  )
}

export default ProductionLabo

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
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
  },
  kpiBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  kpiLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  kpiValue: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 4,
  },
})
