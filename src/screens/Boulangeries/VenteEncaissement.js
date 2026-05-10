import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const VenteEncaissement = () => {
  const caisseRapide = [
    { label: 'Baguette', price: '250 FCFA' },
    { label: 'Croissant', price: '400 FCFA' },
    { label: 'Sandwich', price: '1 200 FCFA' },
  ]

  const tables = [
    { label: 'Table 1', status: 'Occupée', delay: '12 min' },
    { label: 'Table 4', status: 'Libre', delay: '-' },
    { label: 'Table 7', status: 'En attente', delay: '8 min' },
  ]

  const cloture = [
    'Compter le fond de caisse',
    'Vérifier les écarts',
    'Exporter le rapport journalier',
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Vente & Encaissement</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Caisse rapide</Text>
        {caisseRapide.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Plan de salle</Text>
        {tables.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowSub}>{item.status}</Text>
            <Text style={styles.rowTag}>{item.delay}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clôture de caisse</Text>
        {cloture.map((item) => (
          <View key={item} style={styles.stepRow}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default VenteEncaissement

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
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    color: COLORS.text,
    fontWeight: '600',
  },
  rowSub: {
    color: COLORS.muted,
    fontSize: 12,
  },
  rowValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  rowTag: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  stepText: {
    color: COLORS.text,
    fontWeight: '600',
  },
})
