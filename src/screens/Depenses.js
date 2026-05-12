import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import Modal from 'react-native-modal'
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  Search,
  Filter,
  Plus,
  Wallet,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Pencil,
  Trash2,
  X,
  Eye,
} from 'lucide-react-native'
import Header from '../componants/Header'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import LoadingScreen from '../componants/LoadingScreen'
import Toast from 'react-native-toast-message'
import COLORS from '../constants/couleurs'
import { Dropdown } from 'react-native-element-dropdown'

/* ===================== MODAL MODE RÈGLEMENT ===================== */
const ModeReglementModal = ({ visible, onSelect, onClose }) => {
  const modes = [
    { id: 'virement', name: 'Virement bancaire' },
    { id: 'cash', name: 'En cash' }
  ]

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.selectionModal}
      animationIn="fadeIn"
      animationOut="fadeOut"
    >
      <View style={styles.selectionModalContent}>
        <View style={styles.selectionModalHeader}>
          <Text style={styles.selectionModalTitle}>Mode de règlement</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.selectionModalItem}
              onPress={() => {
                onSelect(mode)
                onClose()
              }}
            >
              <Text style={styles.selectionModalItemText}>{mode.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

/* ===================== COMPONENT ===================== */
const Depenses = () => {
  const { user } = useContext(AuthContext)
  const [depenses, setDepenses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [depensesTotal, setDepensesTotal] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [viewDepense, setViewDepense] = useState(null)
  const [editMode, setEditMode] = useState('add')
  const [form, setForm] = useState({
    comptes_id: '',
    depenses_cat_id: '',
    mode_reglement: '',
    montant: '',
    date: '',
    details: '',
  })
  const [filterForm, setFilterForm] = useState({
    comptes_id: '',
    depenses_cat_id: '',
    mode_reglement: '',
    dateDepart: '',
    dateFin: '',
  })
  const [comptesList, setComptesList] = useState([])
  const [categoriesList, setCategoriesList] = useState([])

  // États pour les modals
  const [showModeReglementModal, setShowModeReglementModal] = useState(false)
  const [showFilterModeReglementModal, setShowFilterModeReglementModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showFilterDateDepartPicker, setShowFilterDateDepartPicker] = useState(false)
  const [showFilterDateFinPicker, setShowFilterDateFinPicker] = useState(false)

  const bottomSheetRef = useRef(null)
  const filterSheetRef = useRef(null)
  const searchTimeout = useRef(null)

  const sheetSnapPoints = useMemo(() => ['60%'], [])
  const filterSnapPoints = useMemo(() => ['60%'], [])

  const renderSheetBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.35}
        pressBehavior="close"
      />
    ),
    []
  )

  useEffect(() => {
    refreshDepenses(1, false, false)
  }, [user?.entreprise_id])

  useEffect(() => {
    fetchComptes()
    fetchCategories()
  }, [user?.entreprise_id])

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      refreshDepenses(1, false, true)
    }, 500)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [searchQuery])

  useEffect(() => {
    refreshDepenses(1, false, true)
  }, [filterForm])

  const fetchComptes = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.post('/sellprox/comptabilite/compte/search', {
        totalPage: '1',
        num_compte: '',
        nom_compte: '',
        status: '',
        entreprise_id,
      })

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        name: item.nom_compte || item.num_compte || `Compte ${item.id}`,
        numero: item.num_compte || '',
      }))


      setComptesList(formatted)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les comptes',
      })
    }
  }

  const fetchCategories = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.get(`/sellprox/comptabilite/depenses/category/listes/${entreprise_id}`)

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        name: item.name,
      }))

      setCategoriesList(formatted)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les catégories',
      })
    }
  }

  const refreshDepenses = async (page = 1, append = false, isSearch = false) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setInitialLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
      return
    }
    if (isSearch) {
      setSearchLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const response = await api.post('/sellprox/comptabilite/depenses/search', {
        totalPage: String(page),
        comptes_id: filterForm.comptes_id || '',
        depenses_cat_id: filterForm.depenses_cat_id || '',
        mode_reglement: filterForm.mode_reglement || '',
        dateDepart: filterForm.dateDepart || '',
        dateFin: filterForm.dateFin || '',
        entreprise_id,
      })

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        reference: String(item.id),
        montant: Number(item.montant) || 0,
        categorie: item.category_name || '',
        mode: item.mode_reglement || '',
        compte: item.nom_compte || item.num_compte || '',
        details: item.details || '',
        date: item.date || '',
        createdAt: item.dateEnreg || '',
        comptes_id: item.comptes_id ? String(item.comptes_id) : '',
        depenses_cat_id: item.depenses_cat_id ? String(item.depenses_cat_id) : '',
        mode_reglement: item.mode_reglement || '',
      }))

      const nextPage = Number(response.data?.currentPage || page)
      const nextTotal = Number(response.data?.totalPages || 1)
      const totalValue = Number(response.data?.depenses_total)
      const nextTotalDepenses = Number.isFinite(totalValue) ? totalValue : null

      setCurrentPage(nextPage)
      setTotalPages(nextTotal)
      setDepensesTotal(nextTotalDepenses)

      if (page === 1) {
        setDepenses(formatted)
      } else {
        setDepenses((prev) => {
          const existingIds = new Set(prev.map(d => d.id))
          const newDepenses = formatted.filter(d => !existingIds.has(d.id))
          return [...prev, ...newDepenses]
        })
      }

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les dépenses',
      })
      throw error
    } finally {
      setInitialLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) return
    refreshDepenses(currentPage + 1, true, false)
  }

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshDepenses(1, false, false)
      Toast.show({
        type: 'success',
        text1: 'Liste actualisée',
        text2: 'Dépenses récupérées',
      })
    } catch (_) { }
    finally {
      setRefreshing(false)
    }
  }, [filterForm])

  const openFilters = () => {
    filterSheetRef.current?.expand()
  }

  const resetFilters = () => {
    setFilterForm({
      comptes_id: '',
      depenses_cat_id: '',
      mode_reglement: '',
      dateDepart: '',
      dateFin: '',
    })
    filterSheetRef.current?.close()
    refreshDepenses(1, false, true)
  }

  const applyFilters = () => {
    filterSheetRef.current?.close()
    refreshDepenses(1, false, true)
  }

  const filteredDepenses = useMemo(() => {
    if (!searchQuery.trim()) return depenses

    const query = searchQuery.toLowerCase().trim()
    return depenses.filter((d) =>
      (d.reference ?? '').toLowerCase().includes(query) ||
      (d.categorie ?? '').toLowerCase().includes(query) ||
      (d.compte ?? '').toLowerCase().includes(query) ||
      (d.mode ?? '').toLowerCase().includes(query) ||
      (d.details ?? '').toLowerCase().includes(query)
    )
  }, [searchQuery, depenses])

  const openAdd = () => {
    setEditMode('add')
    setForm({
      comptes_id: '',
      depenses_cat_id: '',
      mode_reglement: '',
      montant: '',
      date: '',
      details: '',
    })
    bottomSheetRef.current?.expand()
  }

  const openEdit = (depense) => {
    setEditMode('edit')
    setForm({
      id: depense.id,
      comptes_id: depense.comptes_id || '',
      depenses_cat_id: depense.depenses_cat_id || '',
      mode_reglement: depense.mode_reglement || depense.mode || '',
      montant: String(depense.montant),
      date: depense.date,
      details: depense.details,
    })
    bottomSheetRef.current?.expand()
  }

  const saveDepense = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' })
      return
    }
    try {
      const payload = {
        comptes_id: form.comptes_id,
        depenses_cat_id: form.depenses_cat_id,
        mode_reglement: form.mode_reglement || '',
        montant: form.montant,
        date: form.date || '',
        details: form.details || '',
        entreprise_id,
      }

      if (editMode === 'add') {
        await api.post('/sellprox/comptabilite/depenses/create', payload)
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Dépense créée avec succès',
        })
      } else {
        await api.post(`/sellprox/comptabilite/depenses/update/${form.id}`, payload)
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Dépense modifiée avec succès',
        })
      }

      bottomSheetRef.current?.close()
      refreshDepenses(1, false, false)

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Une erreur est survenue',
      })
    }
  }

  const renderDepenseItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.ref}>ID #{item.reference}</Text>
        <Text style={styles.amount}>
          {item.montant.toLocaleString()} FCFA
        </Text>
      </View>

      <Info icon={Wallet} label="Catégorie" value={item.categorie} />
      <Info icon={CreditCard} label="Mode" value={item.mode} />
      <Info icon={Building2} label="Compte" value={item.compte} />
      <Info icon={FileText} label="Détails" value={item.details} />
      <Info icon={Calendar} label="Date" value={item.date} />
      <Info icon={Calendar} label="Enregistré" value={item.createdAt} />

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setViewDepense(item)} style={styles.actionBtn1}>
          <Eye size={18} color={COLORS.white} />
          <Text style={styles.actionPrimary}>Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
          <Pencil size={18} color={COLORS.white} />
          <Text style={styles.actionMuted}>Modifier</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const ListHeader = useMemo(() => {
    return (
      <>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.title}>Dépenses</Text>
            <Text style={styles.subtitle}>Suivi & gestion des dépenses</Text>
            {depensesTotal !== null ? (
              <Text style={styles.total}>
                Total : {depensesTotal.toLocaleString()} FCFA
              </Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.addButtonText}>Créer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={COLORS.muted} />
            <TextInput
              placeholder="Rechercher une dépense..."
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              blurOnSubmit={false}
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : null}
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={openFilters}>
            <Filter size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </>
    )
  }, [searchQuery, searchLoading, depensesTotal])
  const ListFooter = () => (
    <>
      {filteredDepenses.length > 0 && currentPage < totalPages && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.loadMoreText}>Charger plus</Text>
          )}
        </TouchableOpacity>
      )}
    </>
  )

  if (initialLoading) {
    return <LoadingScreen />
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.wrapper}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <Header agentName="Agent connecté" />

        <FlatList
          data={filteredDepenses}
          keyExtractor={(item) => item.id}
          renderItem={renderDepenseItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          initialNumToRender={10}
        />

        {/* Modal Détails */}
        <Modal
          isVisible={!!viewDepense}
          onBackdropPress={() => setViewDepense(null)}
          onBackButtonPress={() => setViewDepense(null)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Détails de la dépense</Text>
            {viewDepense && (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>ID</Text>
                  <Text style={styles.modalValue}>{viewDepense.reference}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Montant</Text>
                  <Text style={styles.modalValue}>{viewDepense.montant} FCFA</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Catégorie</Text>
                  <Text style={styles.modalValue}>{viewDepense.categorie}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Mode</Text>
                  <Text style={styles.modalValue}>{viewDepense.mode}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Compte</Text>
                  <Text style={styles.modalValue}>{viewDepense.compte}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Détails</Text>
                  <Text style={styles.modalValue}>{viewDepense.details}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <Text style={styles.modalValue}>{viewDepense.date || '-'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Créé le</Text>
                  <Text style={styles.modalValue}>{viewDepense.createdAt || '-'}</Text>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setViewDepense(null)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <ModeReglementModal
          visible={showModeReglementModal}
          onSelect={(mode) => setForm(prev => ({ ...prev, mode_reglement: mode.name }))}
          onClose={() => setShowModeReglementModal(false)}
        />

        <ModeReglementModal
          visible={showFilterModeReglementModal}
          onSelect={(mode) => setFilterForm(prev => ({ ...prev, mode_reglement: mode.name }))}
          onClose={() => setShowFilterModeReglementModal(false)}
        />

        {/* DatePicker */}
        {showDatePicker && (
          <DateTimePicker
            value={form.date ? new Date(form.date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false)
              if (selectedDate) {
                const formatted = selectedDate.toISOString().split('T')[0]
                setForm((p) => ({ ...p, date: formatted }))
              }
            }}
          />
        )}

        {showFilterDateDepartPicker && (
          <DateTimePicker
            value={filterForm.dateDepart ? new Date(filterForm.dateDepart) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowFilterDateDepartPicker(false)
              if (selectedDate) {
                const formatted = selectedDate.toISOString().split('T')[0]
                setFilterForm((p) => ({ ...p, dateDepart: formatted }))
              }
            }}
          />
        )}

        {showFilterDateFinPicker && (
          <DateTimePicker
            value={filterForm.dateFin ? new Date(filterForm.dateFin) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowFilterDateFinPicker(false)
              if (selectedDate) {
                const formatted = selectedDate.toISOString().split('T')[0]
                setFilterForm((p) => ({ ...p, dateFin: formatted }))
              }
            }}
          />
        )}

        {/* Bottom Sheet Ajout/Modification */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={sheetSnapPoints}
          enablePanDownToClose
          backdropComponent={renderSheetBackdrop}
        >
          <BottomSheetFlatList
            data={[]}
            keyExtractor={(_, index) => String(index)}
            keyboardShouldPersistTaps="handled"
            renderItem={() => null}
            ListHeaderComponent={
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>
                  {editMode === 'add' ? 'Nouvelle dépense' : 'Modifier la dépense'}
                </Text>

                <Dropdown
                  style={[styles.sheetInput, styles.dropdown]}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelected}
                  inputSearchStyle={styles.dropdownSearchInput}
                  data={comptesList}
                  search
                  maxHeight={280}
                  labelField="name"
                  valueField="id"
                  placeholder="Compte *"
                  searchPlaceholder="Rechercher…"
                  value={form.comptes_id || null}
                  onChange={(item) =>
                    setForm((p) => ({ ...p, comptes_id: item.id }))
                  }
                  containerStyle={styles.dropdownContainer}
                  itemTextStyle={styles.dropdownItemText}
                  flatListProps={{
                    bounces: false,
                    contentContainerStyle: { paddingBottom: 16 },
                  }}
                />

                <Dropdown
                  style={[styles.sheetInput, styles.dropdown]}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelected}
                  inputSearchStyle={styles.dropdownSearchInput}
                  data={categoriesList}
                  search
                  maxHeight={280}
                  labelField="name"
                  valueField="id"
                  placeholder="Catégorie *"
                  searchPlaceholder="Rechercher…"
                  value={form.depenses_cat_id || null}
                  onChange={(item) =>
                    setForm((p) => ({ ...p, depenses_cat_id: item.id }))
                  }
                  containerStyle={styles.dropdownContainer}
                  itemTextStyle={styles.dropdownItemText}
                  flatListProps={{
                    bounces: false,
                    contentContainerStyle: { paddingBottom: 16 },
                  }}
                />

                <TouchableOpacity
                  style={[styles.sheetInput, styles.selectButton]}
                  onPress={() => setShowModeReglementModal(true)}
                >
                  <Text style={!form.mode_reglement ? styles.selectPlaceholder : styles.selectText}>
                    {form.mode_reglement || 'Mode de règlement'}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Montant"
                  value={form.montant}
                  onChangeText={(value) => setForm((p) => ({ ...p, montant: value }))}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.muted}
                />

                <TouchableOpacity
                  style={[styles.sheetInput, styles.sheetInputWithIcon]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color={COLORS.muted} />
                  <Text
                    style={[
                      styles.sheetInputIconText,
                      !form.date ? styles.selectPlaceholder : styles.selectText,
                    ]}
                  >
                    {form.date || 'Sélectionner une date'}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.sheetInput, styles.textArea]}
                  placeholder="Détails"
                  value={form.details}
                  onChangeText={(value) => setForm((p) => ({ ...p, details: value }))}
                  placeholderTextColor={COLORS.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.sheetButtonGhost]}
                    onPress={() => bottomSheetRef.current?.close()}
                  >
                    <Text style={styles.sheetButtonGhostText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetButton} onPress={saveDepense}>
                    <Text style={styles.sheetButtonText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        </BottomSheet>

        {/* Bottom Sheet Filtres */}
        <BottomSheet
          ref={filterSheetRef}
          index={-1}
          snapPoints={filterSnapPoints}
          enablePanDownToClose
          backdropComponent={renderSheetBackdrop}
        >
          <BottomSheetFlatList
            data={[]}
            keyExtractor={(_, index) => String(index)}
            keyboardShouldPersistTaps="handled"
            renderItem={() => null}
            ListHeaderComponent={
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Filtrer les dépenses</Text>

                <Dropdown
                  style={[styles.sheetInput, styles.dropdown]}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelected}
                  inputSearchStyle={styles.dropdownSearchInput}
                  data={comptesList}
                  search
                  maxHeight={280}
                  labelField="name"
                  valueField="id"
                  placeholder="Tous les comptes"
                  searchPlaceholder="Rechercher…"
                  value={filterForm.comptes_id || null}
                  onChange={(item) =>
                    setFilterForm((p) => ({ ...p, comptes_id: item.id }))
                  }
                  containerStyle={styles.dropdownContainer}
                  itemTextStyle={styles.dropdownItemText}
                  flatListProps={{
                    bounces: false,
                    contentContainerStyle: { paddingBottom: 16 },
                  }}
                />

                <Dropdown
                  style={[styles.sheetInput, styles.dropdown]}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelected}
                  inputSearchStyle={styles.dropdownSearchInput}
                  data={categoriesList}
                  search
                  maxHeight={280}
                  labelField="name"
                  valueField="id"
                  placeholder="Toutes les catégories"
                  searchPlaceholder="Rechercher…"
                  value={filterForm.depenses_cat_id || null}
                  onChange={(item) =>
                    setFilterForm((p) => ({ ...p, depenses_cat_id: item.id }))
                  }
                  containerStyle={styles.dropdownContainer}
                  itemTextStyle={styles.dropdownItemText}
                  flatListProps={{
                    bounces: false,
                    contentContainerStyle: { paddingBottom: 16 },
                  }}
                />

                <TouchableOpacity
                  style={[styles.sheetInput, styles.selectButton]}
                  onPress={() => setShowFilterModeReglementModal(true)}
                >
                  <Text style={!filterForm.mode_reglement ? styles.selectPlaceholder : styles.selectText}>
                    {filterForm.mode_reglement || 'Tous les modes'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetInput, styles.sheetInputWithIcon]}
                  onPress={() => setShowFilterDateDepartPicker(true)}
                >
                  <Calendar size={20} color={COLORS.muted} />
                  <Text
                    style={[
                      styles.sheetInputIconText,
                      !filterForm.dateDepart ? styles.selectPlaceholder : styles.selectText,
                    ]}
                  >
                    {filterForm.dateDepart || 'Date début'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetInput, styles.sheetInputWithIcon]}
                  onPress={() => setShowFilterDateFinPicker(true)}
                >
                  <Calendar size={20} color={COLORS.muted} />
                  <Text
                    style={[
                      styles.sheetInputIconText,
                      !filterForm.dateFin ? styles.selectPlaceholder : styles.selectText,
                    ]}
                  >
                    {filterForm.dateFin || 'Date fin'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.sheetButtonGhost]}
                    onPress={resetFilters}
                  >
                    <Text style={styles.sheetButtonGhostText}>Réinitialiser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetButton} onPress={applyFilters}>
                    <Text style={styles.sheetButtonText}>Appliquer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        </BottomSheet>
      </View>
    </KeyboardAvoidingView>
  )
}

const Info = ({ icon: Icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon size={16} color={COLORS.muted} />
    <Text style={styles.infoText}>
      {label} : <Text style={styles.infoValue}>{value}</Text>
    </Text>
  </View>
)

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.fond },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: { marginTop: 4, color: COLORS.muted },
  total: { marginTop: 6, color: COLORS.success, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  addButtonText: { color: COLORS.white, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12 },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadMoreButton: {
    marginTop: 16,
    marginBottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  loadMoreText: { color: COLORS.white, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ref: { fontWeight: '700', color: COLORS.primary },
  amount: { fontSize: 16, fontWeight: '700', color: COLORS.success },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  infoText: { color: COLORS.text, fontWeight: '500' },
  infoValue: { fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  actionBtn1: {
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
  actionBtn: {
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
    backgroundColor: COLORS.card,
  },
  actionPrimary: { color: COLORS.white, fontWeight: '600' },
  actionMuted: { color: COLORS.white },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalRow: { marginBottom: 10 },
  modalLabel: { fontSize: 12, color: COLORS.muted },
  modalValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  modalClose: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: { color: COLORS.white, fontWeight: '700' },

  // Styles pour les modals de sélection
  selectionModal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: '80%',
    maxHeight: '70%',
    padding: 16,
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectionModalItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionModalItemText: {
    fontSize: 16,
    color: COLORS.text,
  },

  // Styles du bottom sheet (alignés sur Clients.js)
  sheetContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  sheetInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    color: COLORS.text,
    marginBottom: 12,
    fontSize: 15,
    minHeight: 48,
  },
  selectButton: {
    justifyContent: 'center',
  },
  sheetInputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetInputIconText: {
    flex: 1,
    fontSize: 15,
  },
  selectText: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  selectPlaceholder: { color: COLORS.muted, fontSize: 15 },
  dropdown: {
    minHeight: 48,
    height: 48,
    justifyContent: 'center',
    paddingVertical: 0,
  },
  dropdownPlaceholder: {
    color: COLORS.muted,
    fontSize: 15,
  },
  dropdownSelected: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownSearchInput: {
    height: 40,
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownItemText: {
    color: COLORS.text,
    fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  sheetButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  sheetButtonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetButtonGhostText: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
})

export default Depenses