import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const StocksAchats = () => {
  const stocks = [
    { label: 'Farine T45', qty: '120 kg', status: 'OK' },
    { label: 'Beurre', qty: '18 kg', status: 'Critique' },
    { label: 'Levure', qty: '9 kg', status: 'OK' },
  ]

  const commandes = [
    { label: 'Bon #BC-214', fournisseur: 'Agro Mali', etat: 'À valider' },
    { label: 'Bon #BC-215', fournisseur: 'Laiterie', etat: 'Envoyé' },
  ]

  const receptions = [
    { label: 'BL-202', lot: 'L-9921', dlc: '12/03/2026' },
    { label: 'BL-203', lot: 'L-9922', dlc: '14/03/2026' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Stocks & Achats</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Inventaire dynamique</Text>
          {stocks.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.qty}</Text>
              <Text style={[styles.rowTag, item.status === 'Critique' && styles.tagDanger]}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Commandes fournisseurs</Text>
          {commandes.map((item) => (
            <View key={item.label} style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowSub}>{item.fournisseur}</Text>
              </View>
              <Text style={styles.rowTag}>{item.etat}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Réception & traçabilité</Text>
          {receptions.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowSub}>Lot {item.lot}</Text>
              <Text style={styles.rowTag}>DLC {item.dlc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default StocksAchats

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
  tagDanger: {
    color: COLORS.danger,
  },
})
