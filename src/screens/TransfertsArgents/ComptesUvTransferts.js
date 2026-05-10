import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const ComptesUvTransferts = () => {
  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>UV personnel vs UV business</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Compte business (caisse)</Text>
        <Text style={styles.bigValue}>2 000 000 FCFA UV</Text>
        <Text style={styles.helperText}>Réservé aux opérations clients et à la liquidité du point.</Text>
      </View>

      <View style={[styles.card, styles.cardPerso]}>
        <Text style={styles.sectionTitle}>Compte personnel (gérant)</Text>
        <Text style={styles.bigValue}>350 000 FCFA UV</Text>
        <Text style={styles.helperText}>
          Séparé pour éviter de mélanger l&apos;argent propre et la caisse — comptabilité claire.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Règles</Text>
        <Text style={styles.bullet}>• Transferts business → seulement pour opérations agréées</Text>
        <Text style={styles.bullet}>• Retraits perso → traçabilité obligatoire</Text>
        <Text style={styles.bullet}>• Rapprochement périodique des deux soldes</Text>
      </View>
    </ScrollView>
    </View>
  )
}

export default ComptesUvTransferts

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
  cardPerso: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  bigValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  helperText: { color: COLORS.muted, fontSize: 12, marginTop: 8 },
  bullet: { color: COLORS.text, fontSize: 13, marginBottom: 8 },
})
