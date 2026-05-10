import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const RessourcesHumaines = () => {
  const planning = [
    { label: 'Boulangers matin', detail: '04h00 - 12h00' },
    { label: 'Vente midi', detail: '11h00 - 15h00' },
    { label: 'Service soir', detail: '17h00 - 22h00' },
  ]

  const pointage = [
    { label: 'Arrivées', value: '12' },
    { label: 'Retards', value: '2' },
    { label: 'Heures sup', value: '6h' },
  ]

  const documents = [
    'Contrats employés',
    'Fiches de paie',
    'Certificats médicaux',
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Ressources Humaines</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Planning interactif</Text>
        {planning.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.detail}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pointage digital</Text>
        <View style={styles.metricGrid}>
          {pointage.map((item) => (
            <View key={item.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={styles.metricValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Documents RH</Text>
        {documents.map((item) => (
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

export default RessourcesHumaines

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
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  metricValue: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 6,
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
