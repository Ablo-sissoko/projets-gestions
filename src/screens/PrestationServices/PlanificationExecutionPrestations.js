import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const PlanificationExecutionPrestations = () => {
  const gantt = [
    { tache: 'Audit initial', date: '10 Fev', status: 'Termine' },
    { tache: 'Mise en oeuvre', date: '12-16 Fev', status: 'En cours' },
    { tache: 'Validation client', date: '18 Fev', status: 'Planifie' },
  ]

  const temps = [
    { mission: 'Site client A', duree: '05h 40m' },
    { mission: 'Support remote', duree: '02h 10m' },
  ]

  const team = [
    { nom: 'Ibrahim', role: 'Lead', notif: 'Assigne' },
    { nom: 'Aminata', role: 'Technicienne', notif: 'Assigne' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Planification & Execution</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Vue Calendrier / Gantt</Text>
        {gantt.map((item) => (
          <View key={item.tache} style={styles.row}>
            <Text style={styles.rowLabel}>{item.tache}</Text>
            <Text style={styles.rowSub}>{item.date}</Text>
            <Text style={styles.rowTag}>{item.status}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Feuille de temps (time-tracking)</Text>
        {temps.map((item) => (
          <View key={item.mission} style={styles.row}>
            <Text style={styles.rowLabel}>{item.mission}</Text>
            <Text style={styles.rowTag}>{item.duree}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Assignation des taches</Text>
        {team.map((item) => (
          <View key={item.nom} style={styles.row}>
            <Text style={styles.rowLabel}>{item.nom}</Text>
            <Text style={styles.rowSub}>{item.role}</Text>
            <Text style={styles.rowTag}>{item.notif}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default PlanificationExecutionPrestations

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
})
