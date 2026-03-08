import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, Dimensions, RefreshControl } from 'react-native'
import { BarChart, LineChart } from 'react-native-chart-kit'
import { Package, ShoppingCart, Store, Users } from 'lucide-react-native'
import Header from '../componants/Header'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import COLORS from '../constants/couleurs'

const screenWidth = Dimensions.get('window').width

const chartConfig = {
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(61,61,61,${opacity})`,
  labelColor: () => COLORS.muted,
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: COLORS.border,
  },
}

/** Convertit un libellé type "lundi 02/03" en abréviation jour: L, M, Mr, J, V, S, D */
function weekLabelToShort(label) {
  if (!label || typeof label !== 'string') return label
  const s = label.toLowerCase().trim()
  if (s.startsWith('lundi')) return 'L'
  if (s.startsWith('mardi')) return 'M'
  if (s.startsWith('mercredi')) return 'Mr'
  if (s.startsWith('jeudi')) return 'J'
  if (s.startsWith('vendredi')) return 'V'
  if (s.startsWith('samedi')) return 'S'
  if (s.startsWith('dimanche')) return 'D'
  return label
}

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  const [annualData, setAnnualData] = useState({
    labels: [],
    ventes: [],
    depenses: [],
    benefices: [],
  });
  const [weekData, setWeekData] = useState({
    labels: [],
    datasets: [],
  });
  const [productTotal, setProductTotal] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [ventesTotal, setVentesTotal] = useState(0);
  const [selectedAnnualMetric, setSelectedAnnualMetric] = useState('all');
  const [selectedWeekMetric, setSelectedWeekMetric] = useState('all');
  const [refreshing, setRefreshing] = useState(false);


  const getStatistics = useCallback(async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const [
        annual,
        product,
        employee,
        ventes,
        week,
      ] = await Promise.all([
        api.get(`/sellprox/statistics/annual/${entreprise_id}`),
        api.get(`/sellprox/statistics/product/${entreprise_id}`),
        api.get(`/sellprox/statistics/employee/${entreprise_id}`),
        api.get(`/sellprox/statistics/ventes/total/${entreprise_id}`),
        api.get(`/sellprox/statistics/week/${entreprise_id}`),
      ]);


      setAnnualData({
        labels:
          Array.isArray(annual.data?.labels) && annual.data.labels.length
            ? annual.data.labels.map(String)
            : ['-'],
        ventes:
          Array.isArray(annual.data?.ventes) && annual.data.ventes.length
            ? annual.data.ventes.map((v) => Number(v) || 0)
            : [0],
        depenses:
          Array.isArray(annual.data?.depenses) && annual.data.depenses.length
            ? annual.data.depenses.map((v) => Number(v) || 0)
            : [0],
        benefices:
          Array.isArray(annual.data?.benefices) && annual.data.benefices.length
            ? annual.data.benefices.map((v) => Number(v) || 0)
            : [0],
      });

      setWeekData({
        labels:
          Array.isArray(week.data?.labels) && week.data.labels.length
            ? week.data.labels
            : ['-'],
        datasets:
          Array.isArray(week.data?.datasets) && week.data.datasets.length
            ? week.data.datasets.map((ds) => ({
                ...ds,
                data:
                  Array.isArray(ds.data) && ds.data.length
                    ? ds.data.map((v) => Number(v) || 0)
                    : [0],
              }))
            : [{ data: [0] }],
      });
      setProductTotal(Number(product.data?.total) || 0);
      setEmployeeCount(Number(employee.data?.nbre) || 0);
      setVentesTotal(Number(ventes.data?.sommeTotal) || 0);
    } catch (error) {
      console.log('ERROR:', error);
    }
  }, [user?.entreprise_id])

  useEffect(() => {
    getStatistics()
  }, [getStatistics])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await getStatistics()
    setRefreshing(false)
  }, [getStatistics])



  const totalBenefice = useMemo(() => {
    return annualData.benefices.reduce((sum, value) => sum + (Number(value) || 0), 0);
  }, [annualData]);

  const annualDatasets = useMemo(() => {
    if (selectedAnnualMetric === 'all') {
      return [
        { data: annualData.ventes, color: () => COLORS.warning },
        { data: annualData.depenses, color: () => COLORS.danger },
        { data: annualData.benefices, color: () => COLORS.success },
      ];
    }

    if (selectedAnnualMetric === 'depenses') {
      return [{ data: annualData.depenses, color: () => COLORS.danger }];
    }

    if (selectedAnnualMetric === 'benefices') {
      return [{ data: annualData.benefices, color: () => COLORS.success }];
    }

    return [{ data: annualData.ventes, color: () => COLORS.warning }];
  }, [annualData, selectedAnnualMetric]);

  const weekDatasets = useMemo(() => {
    const base =
      selectedWeekMetric === 'all'
        ? weekData.datasets
        : weekData.datasets.filter(
          (dataset) =>
            dataset.label?.toLowerCase() === selectedWeekMetric
        );

    return base.map((dataset) => {
      const label = dataset.label?.toLowerCase();

      if (label === 'ventes') {
        return { ...dataset, color: () => COLORS.warning };
      }

      if (label === 'depenses') {
        return { ...dataset, color: () => COLORS.danger };
      }

      if (label === 'benefice' || label === 'benefices') {
        return { ...dataset, color: () => COLORS.success };
      }

      return dataset;
    });
  }, [weekData, selectedWeekMetric]);

  const weekChartLabels = useMemo(() => {
    const raw = weekData.labels.length ? weekData.labels : ['-']
    return raw.map(weekLabelToShort)
  }, [weekData.labels]);

  const statsCards = [
    { label: 'Ventes (FCFA)', value: ventesTotal.toLocaleString(), icon: ShoppingCart },
    { label: 'Produits', value: productTotal.toLocaleString(), icon: Package },
    { label: 'Employés', value: employeeCount.toLocaleString(), icon: Users },
    { label: 'Bénéfice', value: totalBenefice.toLocaleString(), icon: Store },
  ];

  return (
    <View style={styles.wrapper}>
      <Header />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenue {user?.prenom} {user?.nom} 👋</Text>
          <Text style={styles.subtitle}>Tableau de bord</Text>
        </View>

        <View style={styles.cards}>
          {statsCards.map((item, index) => {
            const Icon = item.icon
            return (
              <View key={index} style={styles.card}>
                <View style={styles.iconBox}>
                  <Icon size={18} color={COLORS.text} />
                </View>
                <Text style={styles.value}>{item.value}</Text>
                <Text style={styles.label}>{item.label}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.graphCard}>
          <View style={styles.graphHeader}>
            <Text style={styles.graphTitle}>Statistiques annuelles</Text>
            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'Tous' },
                { key: 'ventes', label: 'Ventes' },
                { key: 'depenses', label: 'Dépenses' },
                { key: 'benefices', label: 'Bénéfices' },
              ].map((item) => (
                <Text
                  key={item.key}
                  style={[
                    styles.filterChip,
                    selectedAnnualMetric === item.key && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedAnnualMetric(item.key)}
                >
                  {item.label}
                </Text>
              ))}
            </View>
          </View>

          <BarChart
            data={{
              labels: annualData.labels.length
                ? annualData.labels.map(String)
                : ['-'],
              datasets:
                annualDatasets.length &&
                annualDatasets.some((ds) => ds.data.length)
                  ? annualDatasets
                  : [{ data: [0] }],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            chartConfig={chartConfig}
            fromZero
            showValuesOnTopOfBars
            style={styles.chart}
          />
        </View>

        <View style={styles.graphCard}>
          <View style={styles.graphHeader}>
            <Text style={styles.graphTitle}>Aperçu hebdomadaire</Text>
            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'Tous' },
                { key: 'benefice', label: 'Bénéfice' },
                { key: 'ventes', label: 'Ventes' },
                { key: 'depenses', label: 'Dépenses' },
              ].map((item) => (
                <Text
                  key={item.key}
                  style={[
                    styles.filterChip,
                    selectedWeekMetric === item.key && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedWeekMetric(item.key)}
                >
                  {item.label}
                </Text>
              ))}
            </View>
          </View>

          <LineChart
            data={{
              labels: weekChartLabels,
              datasets:
                weekDatasets.length && weekDatasets.some((ds) => ds.data.length)
                  ? weekDatasets
                  : [{ data: [0] }],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </View>
  )
}

export default Dashboard

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.fond,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.muted,
    marginTop: 4,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
  },
  iconBox: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  label: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  graphCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  graphTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 12,
    marginBottom: 8,
    color: COLORS.text,
  },
  graphHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  chart: {
    borderRadius: 16,
  },
})