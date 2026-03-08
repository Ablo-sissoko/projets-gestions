import React, { useContext, useEffect, useMemo, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native"
import Header from "../componants/Header"
import Modal from "react-native-modal"
import Toast from "react-native-toast-message"
import LoadingScreen from "../componants/LoadingScreen"
import { AuthContext } from "../context/AuthContext"
import api from "../api/Axios"
import {
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Filter,
  Search,
} from "lucide-react-native"

const COLORS = {
  primary: "#e46c35",
  primaryLight: "#fef2e6",
  primaryDark: "#c54e1e",
  success: "#10b981",
  successLight: "#e6f7f0",
  danger: "#ef4444",
  dangerLight: "#fee9e7",
  warning: "#f59e0b",
  warningLight: "#fef3e2",
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#1e293b",
  textLight: "#64748b",
  muted: "#94a3b8",
  border: "#e2e8f0",
  white: "#ffffff",
  overlay: "rgba(0,0,0,0.5)",
}



export default function ProduitQuantiteScreen() {
  const { user } = useContext(AuthContext)
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState({})
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [expandedCards, setExpandedCards] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchProducts(1, false)
  }, [user?.entreprise_id])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, filterType])

  const fetchProducts = async (page = 1, append = false) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setLoading(false)
      setLoadingMore(false)
      return
    }
    try {
      if (append) {
        setLoadingMore(true)
      }

      const res = await api.post(
        "/sellprox/product/search",
        {
          totalPage: String(page),
          nom: "",
          id_category: "",
          id_product: "",
          code_barre: "",
          entreprise_id,
        }
      )

      const results = Array.isArray(res.data?.resultat) ? res.data.resultat : []
      setProducts((prev) => (append ? [...prev, ...results] : results))
      setCurrentPage(Number(res.data?.currentPage || page))
      setTotalPages(Number(res.data?.totalPages || 1))
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: e.response?.data?.message || e.message || "Impossible de charger les produits",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const filterProducts = useCallback(() => {
    let filtered = [...products]

    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterType === "low") {
      filtered = filtered.filter(
        (p) => Number(p.stock) <= Number(p.stock_min || 5)
      )
    } else if (filterType === "out") {
      filtered = filtered.filter((p) => Number(p.stock) === 0)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, filterType])

  const toggleSelect = (product) => {
    setSelected((prev) => {
      if (prev[product.id]) {
        const copy = { ...prev }
        delete copy[product.id]
        return copy
      }
      return {
        ...prev,
        [product.id]: {
          produit_id: product.id,
          quantite_change: "",
          type: "entree",
          motif: "",
        },
      }
    })
  }

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const updateField = (id, field, value) => {
    setSelected((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  const validateAdjustment = (item) => {
    const qty = Number(item.quantite_change)
    if (isNaN(qty) || qty <= 0) {
      return "Quantité invalide"
    }
    if (!item.motif?.trim()) {
      return "Motif requis"
    }
    return null
  }

  const saveAdjustments = async () => {
    const ajustements = Object.values(selected).filter((item) => {
      const qty = Number(item.quantite_change)
      return qty > 0 && item.motif?.trim()
    })

    if (!ajustements.length) {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Aucun ajustement valide à enregistrer",
      })
      return
    }

    try {
      setSaving(true)

      const payload = {
        ajustements: ajustements.map((a) => ({
          ...a,
          quantite_change: Number(a.quantite_change),
        })),
      }

      await api.post(
        "/sellprox/product/stocks/ajuster",
        payload
      )

      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Ajustement effectué avec succès",
      })
      setSelected({})
      fetchProducts(1, false)
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: e.response?.data?.message || e.message || "Erreur lors de l'ajustement",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore) return
    if (currentPage >= totalPages) return
    fetchProducts(currentPage + 1, true)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchProducts(1, false)
    setRefreshing(false)
  }, [])

  const getTypeIcon = (type) => {
    switch (type) {
      case "entree":
        return <TrendingUp size={16} color={COLORS.success} />
      case "sortie":
        return <TrendingDown size={16} color={COLORS.danger} />
      case "correction":
        return <RefreshCw size={16} color={COLORS.warning} />
      default:
        return null
    }
  }

  const getStockStatus = (stock, stockMin) => {
    const qty = Number(stock)
    const min = Number(stockMin || 5)
    if (qty <= 0) {
      return { color: COLORS.danger, label: "Rupture", bg: COLORS.dangerLight }
    }
    if (qty <= min) {
      return { color: COLORS.warning, label: "Stock faible", bg: COLORS.warningLight }
    }
    return { color: "#000000", label: "OK", bg: COLORS.successLight }
  }

  const renderItem = ({ item }) => {
    const isSelected = selected[item.id]
    const isExpanded = expandedCards[item.id]
    const stockStatus = getStockStatus(item.stock, item.stock_min)
    const selectedData = selected[item.id]
    const validationError = selectedData ? validateAdjustment(selectedData) : null

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#fff6ab54" }]}>
              <Package size={24} color={stockStatus.color} />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <View style={styles.stockContainer}>
                <Text style={styles.stockLabel}>Stock actuel:</Text>
                <Text style={[styles.stockValue, { color: stockStatus.color }]}>
                  {item.stock} unités
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: stockStatus.bg }]}>
              <Text style={[styles.statusText, { color: stockStatus.color }]}>
                {stockStatus.label}
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={COLORS.textLight} />
            ) : (
              <ChevronDown size={20} color={COLORS.textLight} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardBody}>
            <TouchableOpacity
              style={[
                styles.adjustButton,
                isSelected && styles.adjustButtonSelected,
              ]}
              onPress={() => toggleSelect(item)}
            >
              <Text
                style={[
                  styles.adjustButtonText,
                  isSelected && styles.adjustButtonTextSelected,
                ]}
              >
                {isSelected ? "✓ Ajustement en cours" : "+ Ajuster le stock"}
              </Text>
            </TouchableOpacity>

            {isSelected && selectedData && (
              <View style={styles.adjustForm}>
                <View style={styles.typeSelector}>
                  {[
                    { id: "entree", label: "Entrée", icon: TrendingUp, color: COLORS.success },
                    { id: "sortie", label: "Sortie", icon: TrendingDown, color: COLORS.danger },
                    { id: "correction", label: "Correction", icon: RefreshCw, color: COLORS.warning },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        selectedData.type === type.id && styles.typeButtonActive,
                        { borderColor: type.color },
                      ]}
                      onPress={() => updateField(item.id, "type", type.id)}
                    >
                      <type.icon
                        size={16}
                        color={
                          selectedData.type === type.id ? COLORS.white : type.color
                        }
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          {
                            color:
                              selectedData.type === type.id ? COLORS.white : type.color,
                          },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantité</Text>
                  <TextInput
                    placeholder="Saisir la quantité"
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      selectedData.quantite_change &&
                        Number(selectedData.quantite_change) > 0
                        ? styles.inputValid
                        : null,
                    ]}
                    placeholderTextColor={COLORS.muted}
                    value={String(selectedData.quantite_change || "")}
                    onChangeText={(v) => updateField(item.id, "quantite_change", v)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Motif de l'ajustement</Text>
                  <TextInput
                    placeholder="Ex: Inventaire, casse, retour..."
                    style={[
                      styles.input,
                      styles.textArea,
                      selectedData.motif?.trim() ? styles.inputValid : null,
                    ]}
                    placeholderTextColor={COLORS.muted}
                    value={selectedData.motif}
                    onChangeText={(v) => updateField(item.id, "motif", v)}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>

                {selectedData.quantite_change && selectedData.motif && (
                  <View style={styles.previewBox}>
                    <Text style={styles.previewLabel}>Récapitulatif</Text>
                    <View style={styles.previewRow}>
                      <View style={styles.previewIcon}>
                        {getTypeIcon(selectedData.type)}
                      </View>
                      <Text style={styles.previewText}>
                        {selectedData.type === "entree" ? "+" : "-"}
                        {selectedData.quantite_change} unités
                      </Text>
                    </View>
                    <Text style={styles.previewMotif}>Motif: {selectedData.motif}</Text>
                  </View>
                )}

                {validationError ? (
                  <View style={styles.validationRow}>
                    <AlertCircle size={16} color={COLORS.danger} />
                    <Text style={styles.validationText}>{validationError}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}
      </View>
    )
  }

  const selectedCount = Object.keys(selected).length
  const hasValidAdjustments = Object.values(selected).some(
    (item) => Number(item.quantite_change) > 0 && item.motif?.trim()
  )

  if (loading) {
    return <LoadingScreen message="Chargement des produits..." />
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Header agentName="Agent connecté" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Ajustement de stock</Text>
            <Text style={styles.headerSubtitle}>
              {filteredProducts.length} produit(s) • {selectedCount} sélectionné(s)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="Rechercher un produit..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>Chargement...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={64} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Essayez d'autres mots-clés"
                  : "Ajoutez des produits pour commencer"}
              </Text>
            </View>
          }
        />

        {selectedCount > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !hasValidAdjustments && styles.saveButtonDisabled,
              ]}
              onPress={saveAdjustments}
              disabled={saving || !hasValidAdjustments}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Save size={20} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>
                    Enregistrer ({selectedCount})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        isVisible={showFilters}
        onBackdropPress={() => setShowFilters(false)}
        onBackButtonPress={() => setShowFilters(false)}
        backdropOpacity={0.5}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrer les produits</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.filterLabel}>Type de stock</Text>
            {[
              { value: "all", label: "Tous les produits", icon: Package },
              { value: "low", label: "Stock faible", icon: AlertCircle },
              { value: "out", label: "En rupture", icon: X },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  filterType === option.value && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setFilterType(option.value)
                  setShowFilters(false)
                }}
              >
                <option.icon
                  size={20}
                  color={
                    filterType === option.value
                      ? COLORS.primary
                      : COLORS.textLight
                  }
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    filterType === option.value && styles.filterOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {filterType === option.value && (
                  <CheckCircle size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginRight: 6,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
  },
  adjustButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    alignItems: "center",
    marginBottom: 16,
  },
  adjustButtonSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  adjustButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  adjustButtonTextSelected: {
    color: COLORS.primary,
  },
  adjustForm: {
    gap: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputValid: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  previewBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  previewIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  previewText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  previewMotif: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 32,
  },
  validationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  validationText: {
    color: COLORS.danger,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.muted,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    gap: 16,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
  },
  modalOverlay: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  modalBody: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
    marginBottom: 4,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  filterOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  loadingMoreText: {
    color: COLORS.muted,
    fontWeight: "600",
  },
})
