import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const SuiviInterventionsPrestations = () => {
  const interventions = [
    { client: 'Hotel Bamako', zone: 'Hamdallaye', etat: 'En route' },
    { client: 'Bureau Delta', zone: 'ACI 2000', etat: 'En cours' },
  ]

  const rapports = [
    { ref: 'INT-2201', photos: 'Avant/Apres', signature: 'OK' },
    { ref: 'INT-2202', photos: 'Avant/Apres', signature: 'En attente' },
  ]

  const checks = [
    'Verification equipements',
    'Validation securite',
    'Nettoyage final controle',
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Suivi des Interventions</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Geolocalisation & itineraires</Text>
        {interventions.map((item) => (
          <View key={item.client} style={styles.row}>
            <Text style={styles.rowLabel}>{item.client}</Text>
            <Text style={styles.rowSub}>{item.zone}</Text>
            <Text style={styles.rowTag}>{item.etat}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rapports d'intervention</Text>
        {rapports.map((item) => (
          <View key={item.ref} style={styles.row}>
            <Text style={styles.rowLabel}>{item.ref}</Text>
            <Text style={styles.rowSub}>{item.photos}</Text>
            <Text style={styles.rowTag}>{item.signature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Check-lists qualite</Text>
        {checks.map((item) => (
          <View key={item} style={styles.checkRow}>
            <View style={styles.dot} />
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default SuiviInterventionsPrestations

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.text, fontWeight: '600' },
  rowSub: { color: COLORS.muted, fontSize: 12 },
  rowTag: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, backgroundColor: COLORS.primary },
  checkText: { color: COLORS.text, fontWeight: '600' },
})
