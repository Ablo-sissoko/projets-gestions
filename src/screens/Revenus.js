import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
} from "react-native"
import Modal from "react-native-modal"
import {
  Calendar,
  User,
  Package,
  TrendingUp,
  Eye,
  DollarSign,
  ShoppingBag,
  Tag,
  Filter,
} from "lucide-react-native"
import Header from "../componants/Header"
import { AuthContext } from "../context/AuthContext"
import api from "../api/Axios"
import LoadingScreen from "../componants/LoadingScreen"
import Toast from "react-native-toast-message"
import COLORS from "../constants/couleurs"

/* ===================== COMPONENT ===================== */
export default function RevenusScreen() {
  const { user } = useContext(AuthContext)
  const [revenus, setRevenus] = useState([])
  const [beneficeTotal, setBeneficeTotal] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [viewRevenu, setViewRevenu] = useState(null)

  const [filterCategoryName, setFilterCategoryName] = useState("")
  const [filterProductName, setFilterProductName] = useState("")
  const [filterEmployeeName, setFilterEmployeeName] = useState("")
  const [filterDateDepart, setFilterDateDepart] = useState("")
  const [filterDateFin, setFilterDateFin] = useState("")

  const [categoriesForFilter, setCategoriesForFilter] = useState([])
  const [employesForFilter, setEmployesForFilter] = useState([])
  const [pickerOpen, setPickerOpen] = useState(null)
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productOptions, setProductOptions] = useState([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)

  const loadCategoriesForFilter = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.get(`/sellprox/categories/read/${entreprise_id}`)
      const results = Array.isArray(response.data?.resultat) ? response.data.resultat : []
      const formatted = results.map((item) => ({
        id: String(item.id),
        name: String(item.name || "").replace(/\s+/g, " ").trim(),
      }))
      setCategoriesForFilter(formatted)
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Impossible de charger les catégories",
      })
    }
  }

  const loadEmployesFromVentes = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    const byKey = new Map()
    let page = 1
    let totalPages = 1
    try {
      do {
        const res = await api.post("/sellprox/vente/liste", {
          totalPage: String(page),
          client_name: "",
          email: "",
          employee_name: "",
          phone: "",
          entreprise_id,
        })
        const rows = Array.isArray(res.data?.resultat) ? res.data.resultat : []
        for (const row of rows) {
          const id = row.employee_id != null ? String(row.employee_id) : ""
          const name = String(row.employee_name || "").trim()
          if (!name) continue
          const key = id || name
          if (!byKey.has(key)) byKey.set(key, { id: key, name })
        }
        totalPages = Math.max(1, Number(res.data?.totalPages) || 1)
        page += 1
      } while (page <= totalPages && page <= 40)
      setEmployesForFilter(
        Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"))
      )
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Impossible de charger les employés",
      })
    }
  }

  const refreshRevenus = async (page = 1, append = false, overrides = null) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setInitialLoading(false)
      setLoadingMore(false)
      return
    }
    if (append) setLoadingMore(true)

    const product_name = (overrides?.product_name !== undefined ? overrides.product_name : filterProductName).trim()
    const employee_name = (overrides?.employee_name !== undefined ? overrides.employee_name : filterEmployeeName).trim()
    const dateDepart = (overrides?.dateDepart !== undefined ? overrides.dateDepart : filterDateDepart).trim()
    const dateFin = (overrides?.dateFin !== undefined ? overrides.dateFin : filterDateFin).trim()

    try {
      const response = await api.post(
        "/sellprox/comptabilite/revenu/liste",
        {
          totalPage: String(page),
          product_name,
          employee_name,
          dateDepart,
          dateFin,
          entreprise_id,
        }
      )

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []

      const formatted = results.map((item) => {
        const dateTime = item.date || ""
        const [datePart, timePart] = dateTime.split(" ")
        return {
          id: String(item.id),
          date: datePart || "",
          time: timePart || "",
          produit: item.product_name,
          categorie: item.category_name,
          employe: item.employee_name,
          quantite: Number(item.quantity) || 0,
          prixUnitaire: Number(item.prix_unit) || 0,
          prixAchat: Number(item.prix_achat) || 0,
          prixVente: Number(item.prix_vente) || 0,
          benefice: Number(item.benefice) || 0,
          createdAt: dateTime,
        }
      })

      const nextPage = Number(response.data?.currentPage || page)
      const nextTotal = Number(response.data?.totalPages || 1)
      const beneficeValue = Number(response.data?.benefice)
      const nextBenefice = Number.isFinite(beneficeValue) ? beneficeValue : null

      setCurrentPage(nextPage)
      setTotalPages(nextTotal)
      setBeneficeTotal(nextBenefice)
      setRevenus((prev) => (append ? [...prev, ...formatted] : formatted))
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Impossible de charger les revenus",
      })
      throw error
    } finally {
      setInitialLoading(false)
      setLoadingMore(false)
    }
  }

  const refreshAll = async () => {
    setRefreshing(true)
    try {
      await refreshRevenus(1, false)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!user?.entreprise_id) {
      setInitialLoading(false)
      return
    }
    loadCategoriesForFilter()
    loadEmployesFromVentes()
    refreshRevenus(1, false)
  }, [user?.entreprise_id])

  useEffect(() => {
    if (pickerOpen !== "prod" || !user?.entreprise_id) return
    const timeout = setTimeout(async () => {
      setProductSearchLoading(true)
      try {
        const response = await api.post("/sellprox/product/search", {
          totalPage: "1",
          nom: productSearchQuery.trim(),
          id_category: "",
          id_product: "",
          code_barre: "",
          entreprise_id: user.entreprise_id,
        })
        const results = Array.isArray(response.data?.resultat) ? response.data.resultat : []
        setProductOptions(
          results.map((item) => ({
            id: String(item.id),
            name: String(item.product_name || "").trim() || "-",
          }))
        )
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: error.response?.data?.message || error.message || "Impossible de charger les produits",
        })
        setProductOptions([])
      } finally {
        setProductSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [pickerOpen, productSearchQuery, user?.entreprise_id])

  const openProductPicker = () => {
    setProductSearchQuery("")
    setProductOptions([])
    setPickerOpen("prod")
  }

  const resetFilters = () => {
    setFilterCategoryName("")
    setFilterProductName("")
    setFilterEmployeeName("")
    setFilterDateDepart("")
    setFilterDateFin("")
  }

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) return
    refreshRevenus(currentPage + 1, true, null)
  }

  const openView = useCallback((item) => {
    setViewRevenu(item)
  }, [])

  const closeView = useCallback(() => {
    setViewRevenu(null)
  }, [])

  const displayRevenus = useMemo(() => {
    const c = filterCategoryName.trim()
    if (!c) return revenus
    return revenus.filter((r) => (r.categorie || "").trim() === c)
  }, [revenus, filterCategoryName])

  const totalBenefice = useMemo(() => {
    if (filterCategoryName.trim()) {
      return displayRevenus.reduce((sum, r) => sum + r.benefice, 0)
    }
    return beneficeTotal ?? revenus.reduce((sum, r) => sum + r.benefice, 0)
  }, [displayRevenus, filterCategoryName, beneficeTotal, revenus])

  const totalChiffreAffaires = useMemo(
    () => displayRevenus.reduce((sum, r) => sum + r.prixVente, 0),
    [displayRevenus]
  )

  const renderItem = useCallback(({ item }) => (
    <View style={styles.card}>
      {/* HEADER CARD */}
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <Calendar size={14} color={COLORS.muted} />
          <Text style={styles.date}>{item.date} {item.time}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
          <TrendingUp size={12} color={COLORS.white} />
          <Text style={styles.badgeText}>+{item.benefice.toLocaleString()} FCFA</Text>
        </View>
      </View>

      {/* PRODUIT */}
      <View style={styles.productContainer}>
        <View style={styles.row}>
          <Package size={18} color={COLORS.muted} />
          <Text style={styles.productName}>{item.produit}</Text>
        </View>
        <View style={styles.row}>
          <Tag size={14} color={COLORS.muted} />
          <Text style={styles.employeName}>{item.categorie}</Text>
        </View>

      </View>

      {/* EMPLOYE */}
      <View style={styles.employeContainer}>
        <User size={14} color={COLORS.muted} />
        <Text style={styles.employeName}>{item.employe}</Text>
      </View>

      {/* DETAILS */}
      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View >
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Quantité</Text>
            <Text style={styles.detailValue}>{item.quantite}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Prix unitaire</Text>
            <Text style={styles.detailValue}>{item.prixUnitaire.toLocaleString()} F</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Prix d'achat</Text>
            <Text style={styles.detailValue}>{item.prixAchat.toLocaleString()} F</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Prix de vente</Text>
            <Text style={styles.detailValue}>{item.prixVente.toLocaleString()} F</Text>
          </View>
        </View>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openView(item)}
        >
          <Eye size={18} color={COLORS.white} />
          <Text style={styles.actionText}>Voir</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [openView])

  const keyExtractor = useCallback((item) => item.id, [])

  const sectionsByDate = useMemo(() => {
    const byDate = new Map()
    displayRevenus.forEach((r) => {
      const d = r.date || ""
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d).push(r)
    })
    const sortedDates = Array.from(byDate.keys()).sort((a, b) => (b > a ? 1 : b < a ? -1 : 0))
    return sortedDates.map((date) => ({
      title: date,
      data: byDate.get(date),
    }))
  }, [displayRevenus])

  const renderSectionHeader = useCallback(({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Calendar size={16} color={COLORS.muted} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  ), [])

  const listHeader = (
    <>
      <Text style={styles.title}>Revenus</Text>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: COLORS.fond }]}>
          <DollarSign size={24} color={COLORS.primary} />
          <View>
            <Text style={[styles.statLabel, { color: COLORS.text }]}>Chiffre d'affaires</Text>
            <Text style={[styles.statValue, { color: COLORS.text }]}>{totalChiffreAffaires.toLocaleString()} F</Text>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.fond }]}>
          <TrendingUp size={24} color={COLORS.primary} />
          <View>
            <Text style={[styles.statLabel, { color: COLORS.text }]}>Bénéfice total</Text>
            <Text style={[styles.statValue, { color: COLORS.text }]}>{totalBenefice?.toLocaleString() ?? "-"} F</Text>
          </View>
        </View>
      </View>
    </>
  )


  const itemSeparator = () => <View style={{ height: 16 }} />

  
  const listFooter = () => {
    if (!loadingMore || currentPage >= totalPages) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    )
  }

  if (initialLoading) {
    return <LoadingScreen />
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Header agentName="Agent connecté" />

      <SectionList
        sections={sectionsByDate}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ItemSeparatorComponent={itemSeparator}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color={COLORS.muted} />
            <Text style={styles.emptyStateText}>Aucun revenu trouvé</Text>
          </View>
        }
      />

      <Modal
        isVisible={!!viewRevenu}
        onBackdropPress={closeView}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Détails de la vente</Text>
          {viewRevenu
            ? [
              ["Date", `${viewRevenu.date} ${viewRevenu.time}`],
              ["Produit", viewRevenu.produit],
              ["Catégorie", viewRevenu.categorie],
              ["Employé", viewRevenu.employe],
              ["Quantité", viewRevenu.quantite],
              ["Prix unitaire", `${viewRevenu.prixUnitaire.toLocaleString()} FCFA`],
              ["Prix d'achat", `${viewRevenu.prixAchat.toLocaleString()} FCFA`],
              ["Prix de vente", `${viewRevenu.prixVente.toLocaleString()} FCFA`],
              ["Bénéfice", `${viewRevenu.benefice.toLocaleString()} FCFA`],
              ["Enregistré le", viewRevenu.createdAt],
            ].map(([label, value]) => (
              <View key={label} style={styles.modalRow}>
                <Text style={styles.modalLabel}>{label}</Text>
                <Text style={styles.modalValue}>{value}</Text>
              </View>
            ))
            : null}
          <TouchableOpacity style={styles.modalClose} onPress={closeView}>
            <Text style={styles.modalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={pickerOpen === "cat"}
        onBackdropPress={() => setPickerOpen(null)}
        style={styles.pickerModalWrap}
      >
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Catégorie</Text>
            <TouchableOpacity onPress={() => setPickerOpen(null)}>
              <Text style={styles.pickerClose}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: "__all__", name: "Toutes les catégories" }, ...categoriesForFilter]}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setFilterCategoryName(item.id === "__all__" ? "" : item.name)
                  setPickerOpen(null)
                }}
              >
                <Text style={styles.pickerItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            style={styles.pickerList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>

      <Modal
        isVisible={pickerOpen === "emp"}
        onBackdropPress={() => setPickerOpen(null)}
        style={styles.pickerModalWrap}
      >
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Employé</Text>
            <TouchableOpacity onPress={() => setPickerOpen(null)}>
              <Text style={styles.pickerClose}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: "__all__", name: "Tous les employés" }, ...employesForFilter]}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setFilterEmployeeName(item.id === "__all__" ? "" : item.name)
                  setPickerOpen(null)
                }}
              >
                <Text style={styles.pickerItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            style={styles.pickerList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>

      <Modal
        isVisible={pickerOpen === "prod"}
        onBackdropPress={() => setPickerOpen(null)}
        style={styles.pickerModalWrap}
      >
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Produit</Text>
            <TouchableOpacity onPress={() => setPickerOpen(null)}>
              <Text style={styles.pickerClose}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.pickerSearch}
            placeholder="Rechercher un produit…"
            placeholderTextColor={COLORS.muted}
            value={productSearchQuery}
            onChangeText={setProductSearchQuery}
          />
          {productSearchLoading ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.primary} />
          ) : (
            <FlatList
              data={[{ id: "__all__", name: "Tous les produits" }, ...productOptions]}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setFilterProductName(item.id === "__all__" ? "" : item.name)
                    setPickerOpen(null)
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.pickerList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </Modal>
    </View>
  )
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.fond },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  listContent: { padding: 16, paddingBottom: 24 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingTop: 20,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.text },
  subtitle: { marginTop: 4, color: COLORS.muted },
  addButton: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  addButtonText: { color: COLORS.white, fontWeight: "600" },

  searchRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12 },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  statValue: { fontSize: 12, fontWeight: "600", color: COLORS.text },

  filtersBlock: {
    marginBottom: 16,
    gap: 10,
  },
  filtersTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
  },
  dateFiltersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterDateInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  filterActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  filterBtnGhost: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  filterBtnGhostText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
  },
  filterBtnPrimary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  filterBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },

  pickerModalWrap: {
    justifyContent: "flex-end",
    margin: 0,
  },
  pickerCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  pickerClose: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  pickerSearch: {
    marginTop: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  pickerList: {
    marginTop: 8,
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.text,
  },

  filterChipActive: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  filterTextActive: { color: COLORS.white, fontWeight: "500" },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  date: { fontSize: 12, color: COLORS.muted },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { color: COLORS.white, fontWeight: "700", fontSize: 12 },

  productContainer: { marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginLeft: 6 },
  category: { fontSize: 13, color: COLORS.muted, marginLeft: 24, marginTop: 2 },

  employeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  employeName: { fontSize: 14, color: COLORS.text, fontWeight: "500" },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: 'space-between',

    gap: 16,
    marginBottom: 12,


  },
  detailItem: { flex: 1, minWidth: "40%" },
  detailLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: COLORS.primary,
  },
  actionText: { fontSize: 14, color: COLORS.white, fontWeight: "500" },

  emptyState: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: { color: COLORS.muted, fontSize: 16, marginTop: 8 },

  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreButton: {
    marginTop: 16,
    marginBottom: 24,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  loadMoreText: { color: COLORS.white, fontWeight: "700" },

  // Modal styles
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalLabel: { fontSize: 12, color: COLORS.muted },
  modalValue: { fontSize: 14, color: COLORS.text, fontWeight: "600", flex: 1, textAlign: "right" },
  modalClose: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },

  // Bottom sheet styles
  modalize: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginTop: 10,
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetContent: { padding: 20, gap: 16 },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  sheetDescription: { color: COLORS.muted, marginBottom: 16, lineHeight: 22 },

  formGroup: { gap: 8 },
  formLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },

  selectButton: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: { color: COLORS.text, fontSize: 16 },
  selectPlaceholder: { color: COLORS.muted, fontSize: 16 },

  pickerModal: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 1000,
    elevation: 5,
    maxHeight: 250,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: { fontWeight: "600", color: COLORS.text, fontSize: 16 },
  pickerList: { padding: 8 },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerItemText: { color: COLORS.text, fontSize: 16 },

  dateButton: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateButtonText: { color: COLORS.text, fontSize: 16, flex: 1 },

  sheetInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },

  previewBenefice: {
    backgroundColor: COLORS.success + '10',
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  previewLabel: { fontSize: 14, color: COLORS.muted, fontWeight: "500" },
  previewValue: { fontSize: 16, fontWeight: "700", color: COLORS.success },

  sheetActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  sheetButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  sheetButtonPrimary: { backgroundColor: COLORS.primary },
  sheetButtonDanger: { backgroundColor: COLORS.danger },
  sheetButtonDisabled: { backgroundColor: COLORS.muted + '80' },
  sheetButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  sheetButtonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetButtonGhostText: { color: COLORS.text, fontWeight: "700", fontSize: 16 },

  resetFilter: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  resetFilterText: { color: COLORS.primary, fontWeight: "600", fontSize: 16 },
})