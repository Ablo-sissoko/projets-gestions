import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const SecuriteTransferts = () => {
  const agences = [
    { nom: 'Point A · Bamako', cash: '420 000 FCFA', uv: '1 100 000 FCFA' },
    { nom: 'Point B · Kalaban', cash: '180 000 FCFA', uv: '650 000 FCFA' },
  ]

  const acces = [
    { role: 'Agent', annulation: 'Bloqué', validation: 'Oui' },
    { role: 'Gérant', annulation: 'Oui', validation: 'Oui' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Sécurité & contrôle</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Multi-caisses / multi-agences</Text>
        {agences.map((a) => (
          <View key={a.nom} style={styles.block}>
            <Text style={styles.rowLabel}>{a.nom}</Text>
            <Text style={styles.helperText}>Cash {a.cash} · UV {a.uv}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Gestion des accès</Text>
        {acces.map((x) => (
          <View key={x.role} style={styles.row}>
            <Text style={styles.rowLabel}>{x.role}</Text>
            <Text style={styles.rowSub}>Annul. {x.annulation}</Text>
            <Text style={styles.rowTag}>{x.validation}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preuve de transaction</Text>
        <Text style={styles.helperText}>Reçu numérique (WhatsApp / SMS) ou impression thermique.</Text>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Générer un reçu (exemple)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  )
}

export default SecuriteTransferts

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
  block: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.text, fontWeight: '600' },
  rowSub: { color: COLORS.muted, fontSize: 11 },
  rowTag: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  helperText: { color: COLORS.muted, fontSize: 12, marginTop: 8 },
  btn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: COLORS.white, fontWeight: '700' },
})
