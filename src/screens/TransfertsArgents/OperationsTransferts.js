import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const OperationsTransferts = () => {
  const dernieresOps = [
    { type: 'Dépôt', operateur: 'Orange Money', montant: '25 000 FCFA', commission: '500 FCFA' },
    { type: 'Retrait', operateur: 'Wave', montant: '10 000 FCFA', commission: '200 FCFA' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Opérations (Dépôts / Retraits)</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Saisie rapide</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>Orange Money</Text></TouchableOpacity>
          <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>Moov</Text></TouchableOpacity>
          <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>Wave</Text></TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          <TouchableOpacity style={styles.chipActive}><Text style={styles.chipTextActive}>Dépôt</Text></TouchableOpacity>
          <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>Retrait</Text></TouchableOpacity>
          <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>Transfert direct</Text></TouchableOpacity>
        </View>
        <Text style={styles.placeholder}>Téléphone · Montant (champs à brancher API)</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Commission agent (estimée)</Text>
          <Text style={styles.rowValue}>0 FCFA</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Vérification du titulaire</Text>
        <Text style={styles.helperText}>Afficher le nom du compte avant validation pour éviter les erreurs de numéro.</Text>
        <View style={styles.verifyBox}>
          <Text style={styles.verifyLabel}>Nom affiché (KYC)</Text>
          <Text style={styles.verifyValue}>— À vérifier —</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Scanner QR</Text>
        <TouchableOpacity style={styles.scanBtn}>
          <Text style={styles.scanBtnText}>Scanner (Wave / pièce d&apos;identité)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dernières opérations</Text>
        {dernieresOps.map((op, i) => (
          <View key={i} style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>{op.type} · {op.operateur}</Text>
              <Text style={styles.helperText}>Commission {op.commission}</Text>
            </View>
            <Text style={styles.rowValue}>{op.montant}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  )
}

export default OperationsTransferts

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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  chipText: { color: COLORS.text, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  placeholder: {
    color: COLORS.muted,
    fontSize: 13,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.text, fontWeight: '600' },
  rowValue: { color: COLORS.primary, fontWeight: '700' },
  helperText: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  verifyBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  verifyLabel: { color: COLORS.muted, fontSize: 12 },
  verifyValue: { color: COLORS.text, fontWeight: '700', marginTop: 4 },
  scanBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanBtnText: { color: COLORS.card, fontWeight: '700' },
})
