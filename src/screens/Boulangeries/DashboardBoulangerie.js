import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React from 'react'
import COLORS from '../../constants/couleurs'
import Header from '../../componants/Header'

const DashboardBoulangerie = () => {
  const indicators = [
    { label: "Chiffre d'affaires", value: '1 250 000 FCFA', trend: '+8%' },
    { label: 'Commandes', value: '184', trend: '+12' },
    { label: 'Panier moyen', value: '6 800 FCFA', trend: '-2%' },
  ]

  const alerts = [
    { title: 'Farine T45', detail: 'Stock critique (3 jours)', level: 'danger' },
    { title: 'Livraison beurre', detail: 'Retard fournisseur (2h)', level: 'warning' },
    { title: 'Employé absent', detail: 'Labo - Team matin', level: 'warning' },
  ]

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Tableau de Bord Pilote</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Indicateurs flash</Text>
        <View style={styles.metricGrid}>
          {indicators.map((item) => (
            <View key={item.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricTrend}>{item.trend}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alertes critiques</Text>
        {alerts.map((alert) => (
          <View
            key={alert.title}
            style={[
              styles.alertRow,
              alert.level === 'danger' && styles.alertDanger,
              alert.level === 'warning' && styles.alertWarning,
            ]}
          >
            <View>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDetail}>{alert.detail}</Text>
            </View>
            <Text style={styles.alertTag}>{alert.level === 'danger' ? 'CRITIQUE' : 'ATTENTION'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Comparatif J-1 / N-1</Text>
        <View style={styles.compareBox}>
          <Text style={styles.compareLabel}>Objectif journalier</Text>
          <Text style={styles.compareValue}>1 400 000 FCFA</Text>
          <View style={styles.compareBar}>
            <View style={styles.compareFill} />
          </View>
          <Text style={styles.compareHint}>Vous êtes à 89% de l'objectif</Text>
        </View>
      </View>
    </ScrollView>
    </View>
  )
}

export default DashboardBoulangerie

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
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '47%',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  metricTrend: {
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 6,
    fontSize: 12,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  alertDanger: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEE2E2',
  },
  alertWarning: {
    borderColor: COLORS.warning,
    backgroundColor: '#FEF3C7',
  },
  alertTitle: {
    fontWeight: '700',
    color: COLORS.text,
  },
  alertDetail: {
    color: COLORS.muted,
    fontSize: 12,
  },
  alertTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  compareBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 14,
  },
  compareLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  compareValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 6,
  },
  compareBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  compareFill: {
    width: '89%',
    height: 8,
    backgroundColor: COLORS.primary,
  },
  compareHint: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.muted,
  },
})