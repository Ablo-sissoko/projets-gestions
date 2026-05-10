import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const EspaceCollaborateursPrestations = () => {
  const disponibilites = [
    { nom: 'Aissata', statut: 'Disponible', conge: '-' },
    { nom: 'Moussa', statut: 'Conge', conge: '12-15 Fev' },
  ]

  const avis = [
    { client: 'Societe Alpha', note: '5/5', commentaire: 'Intervention rapide' },
    { client: 'Hotel Eden', note: '4/5', commentaire: 'Tres bon service' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Espace Collaborateurs</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Disponibilites & absences</Text>
        {disponibilites.map((item) => (
          <View key={item.nom} style={styles.row}>
            <Text style={styles.rowLabel}>{item.nom}</Text>
            <Text style={styles.rowSub}>{item.statut}</Text>
            <Text style={styles.rowTag}>{item.conge}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Evaluation satisfaction client</Text>
        {avis.map((item) => (
          <View key={item.client} style={styles.reviewRow}>
            <Text style={styles.rowLabel}>{item.client}</Text>
            <Text style={styles.rowTag}>{item.note}</Text>
            <Text style={styles.reviewText}>{item.commentaire}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default EspaceCollaborateursPrestations

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
  reviewRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reviewText: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 12,
  },
})
