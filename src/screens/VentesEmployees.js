import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  SectionList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import { Search } from 'lucide-react-native'
import Header from '../componants/Header'
import LoadingScreen from '../componants/LoadingScreen'
import COLORS from '../constants/couleurs'

/** Retourne une clé "jour" unique (YYYY-MM-DD) pour regrouper les ventes par jour */
function getDateKey(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return 'Sans date'
  const trimmed = dateStr.trim()
  if (!trimmed) return 'Sans date'
  const d = new Date(trimmed)
  if (isNaN(d.getTime())) return 'Sans date'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Formate une clé jour pour affichage (ex: 05/03/2025) */
function formatDateLabel(dateKey) {
  if (!dateKey || dateKey === 'Sans date') return dateKey
  const [y, m, d] = dateKey.split('-')
  return [d, m, y].filter(Boolean).join('/')
}



const VentesEmployees = () => {
  const { user } = useContext(AuthContext)
  const [ventes, setVentes] = useState([])
  const [search, setSearch] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedKeys, setExpandedKeys] = useState(new Set())

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const fetchVentes = async (page = 1, append = false, isSearch = false) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setInitialLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
      return
    }
    if (isSearch) setSearchLoading(true)
    else if (append) setLoadingMore(true)

    try {
      const payload = {
        totalPage: String(page),
        client_name: search.trim(),
        email: search.trim(),
        employee_name: search.trim(),
        phone: search.trim(),
        entreprise_id,
      }

      const response = await api.post(
        '/sellprox/vente/liste',
        payload
      )

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        employee_id: item.employee_id ?? item.user_id ?? '',
        employee_name: item.employee_name || 'Employé',
        client_name: item.client_name || '-',
        email: item.email || '',
        phone: item.phone || '',
        total: Number(item.total) || 0,
        date: item.date || '',
        proforma_id: item.proforma_id,
        bon_commande_id: item.bon_commande_id,
      }))

      setVentes((prev) => (append ? [...prev, ...formatted] : formatted))
      setCurrentPage(Number(response.data?.currentPage) || page)
      setTotalPages(Number(response.data?.totalPages) || 1)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les ventes',
      })
    } finally {
      setInitialLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
    }
  }

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await fetchVentes(1, false, false)
    setRefreshing(false)
  }, [search])

  useEffect(() => {
    fetchVentes(1, false, false)
  }, [user?.entreprise_id])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVentes(1, false, true)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  const handleLoadMore = () => {
    if (loadingMore || searchLoading) return
    if (currentPage >= totalPages) return
    fetchVentes(currentPage + 1, true, false)
  }

  const groupedByDateThenEmployee = useMemo(() => {
    const dateMap = new Map()
    ventes.forEach((sale) => {
      const dateKey = getDateKey(sale.date)
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, employees: new Map() })
      }
      const dateGroup = dateMap.get(dateKey)
      const empKey = sale.employee_id || sale.employee_name || 'unknown'
      if (!dateGroup.employees.has(empKey)) {
        dateGroup.employees.set(empKey, {
          employee_id: empKey,
          employee_name: sale.employee_name || 'Employé',
          total: 0,
          count: 0,
          sales: [],
        })
      }
      const emp = dateGroup.employees.get(empKey)
      emp.total += Number(sale.total) || 0
      emp.count += 1
      emp.sales.push(sale)
    })
    return Array.from(dateMap.entries())
      .sort((a, b) => (b[0] < a[0] ? -1 : b[0] > a[0] ? 1 : 0))
      .map(([, group]) => {
        const employees = Array.from(group.employees.values()).sort((a, b) => b.total - a.total)
        employees.forEach((emp) => {
          emp.sectionKey = `${group.date}_${emp.employee_id}`
        })
        return { date: group.date, data: employees }
      })
  }, [ventes])

  const sections = useMemo(
    () => groupedByDateThenEmployee.map((g) => ({ title: g.date, data: g.data })),
    [groupedByDateThenEmployee]
  )

  if (initialLoading) {
    return <LoadingScreen message="Chargement..." />
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Header agentName="Agent connecte" />

      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.title}>Ventes par employé</Text>
            <Text style={styles.subtitle}>
              {ventes.length} vente(s) enregistrée(s)
            </Text>
          </View>
        </View>

       

        {searchLoading ? (
          <View style={styles.searchLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Recherche...</Text>
          </View>
        ) : null}

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.sectionKey || `${item.employee_id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune vente trouvée.</Text>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{formatDateLabel(section.title)}</Text>
            </View>
          )}
          renderItem={({ item, section }) => {
            const expandKey = `${section.title}_${item.employee_id}`
            const isExpanded = expandedKeys.has(expandKey)
            return (
              <View style={styles.employeeCard}>
                <TouchableOpacity
                  style={styles.employeeHeader}
                  onPress={() => toggleExpanded(expandKey)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.employeeName}>{item.employee_name}</Text>
                    <Text style={styles.employeeMeta}>
                      {item.count} vente(s) · {isExpanded ? 'Masquer' : 'Afficher'}
                    </Text>
                  </View>
                  <Text style={styles.employeeTotal}>
                    {Number(item.total || 0).toLocaleString()} FCFA
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.salesList}>
                    {item.sales.map((sale) => (
                      <View key={sale.id} style={styles.saleRow}>
                        <View style={styles.saleInfo}>
                          <Text style={styles.saleClient}>
                            {sale.client_name || '-'}
                          </Text>
                          <Text style={styles.saleMeta}>
                            {sale.phone || sale.email || '-'}
                          </Text>
                          <Text style={styles.saleMeta}>{sale.date || '-'}</Text>
                        </View>
                        <Text style={styles.saleTotal}>
                          {Number(sale.total || 0).toLocaleString()} FCFA
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          }}
        />
      </View>
    </View>
  )
}

export default VentesEmployees

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  pageHeader: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.muted,
    marginTop: 4,
  },
  searchRow: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  dateHeader: {
    backgroundColor: COLORS.bg,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 6,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  employeeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  employeeMeta: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 12,
  },
  employeeTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  salesList: {
    marginTop: 12,
    gap: 12,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 12,
  },
  saleInfo: {
    flex: 1,
    marginRight: 10,
  },
  saleClient: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  saleMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  saleTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.muted,
    marginTop: 20,
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
})