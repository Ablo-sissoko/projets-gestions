import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const CrmDevisPrestations = () => {
  const clients = [
    { nom: 'Societe Alpha', contact: 'M. Keita', statut: 'Actif' },
    { nom: 'Clinique Niarela', contact: 'Mme Traore', statut: 'Prospect' },
  ]

  const devis = [
    { ref: 'DV-2026-014', montant: '1 800 000 FCFA', statut: 'Envoye' },
    { ref: 'DV-2026-015', montant: '950 000 FCFA', statut: 'Accepte' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>CRM & Devis</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Base clients</Text>
        {clients.map((item) => (
          <View key={item.nom} style={styles.row}>
            <Text style={styles.rowLabel}>{item.nom}</Text>
            <Text style={styles.rowSub}>{item.contact}</Text>
            <Text style={styles.rowTag}>{item.statut}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Generateur de devis & contrats</Text>
        {devis.map((item) => (
          <View key={item.ref} style={styles.row}>
            <Text style={styles.rowLabel}>{item.ref}</Text>
            <Text style={styles.rowSub}>{item.montant}</Text>
            <Text style={styles.rowTag}>{item.statut}</Text>
          </View>
        ))}
        <Text style={styles.helperText}>
          Signature electronique integree et conversion devis > contrat.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Suivi de prospection</Text>
        <Text style={styles.helperText}>
          Relance auto: 3 jours après devis non repondu.
        </Text>
      </View>
    </ScrollView>
    </View>
  )
}

export default CrmDevisPrestations

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
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
  helperText: { color: COLORS.muted, fontSize: 12, marginTop: 10 },
})
