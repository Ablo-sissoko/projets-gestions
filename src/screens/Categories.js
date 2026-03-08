import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Modal from 'react-native-modal'
import { Modalize } from 'react-native-modalize'
import Toast from 'react-native-toast-message'
import { Search, Plus, Pencil, Eye, Tag, FileText } from 'lucide-react-native'
import Header from '../componants/Header'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import LoadingScreen from '../componants/LoadingScreen'
import COLORS from '../constants/couleurs'



const Categories = () => {
  const { user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('produits')
  const [searchQuery, setSearchQuery] = useState('')
  const [productCategories, setProductCategories] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [editMode, setEditMode] = useState('add')
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: '1',
  })

  const sheetRef = useRef(null)

  useEffect(() => {
    refreshAll(true)
  }, [user?.entreprise_id])

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshAll(false, true)
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const refreshAll = async (withLoading = false, isSearch = false) => {
    if (withLoading) setInitialLoading(true)
    if (isSearch) setSearchLoading(true)
    try {
      await Promise.all([fetchProductCategories(), fetchExpenseCategories()])
    } finally {
      setInitialLoading(false)
      setSearchLoading(false)
      setRefreshing(false)
    }
  }

  const fetchProductCategories = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.get(
        `/sellprox/categories/read/${entreprise_id}`
      )
      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []
      const formatted = results.map((item) => ({
        id: String(item.id),
        name: String(item.name || '').replace(/\s+/g, ' ').trim(),
        slug: item.slug || '',
        status: item.status,
      }))
      setProductCategories(formatted)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les catégories produits',
      })
    }
  }

  const fetchExpenseCategories = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.get(
        `/sellprox/comptabilite/depenses/category/listes/${entreprise_id}`
      )
      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []
      const formatted = results.map((item) => ({
        id: String(item.id),
        name: item.name || item.nom || '',
        description: item.description || item.desc || '',
      }))
      setExpenseCategories(formatted)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les catégories dépenses',
      })
    }
  }

  const openAdd = () => {
    setEditMode('add')
    setForm({
      name: '',
      description: '',
      status: '1',
    })
    sheetRef.current?.open()
  }

  const openEdit = (item) => {
    setEditMode('edit')
    setForm({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      status: item.status === 0 ? '0' : '1',
    })
    sheetRef.current?.open()
  }

  const saveExpenseCategory = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' })
      return
    }
    try {
      const payload = {
        name: form.name || '',
        description: form.description || '',
        entreprise_id,
      }

      if (editMode === 'add') {
        const response = await api.post(
          '/sellprox/comptabilite/depenses/category/create',
          payload
        )
        const ok = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
        if (!ok) {
          Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Création impossible' })
          return
        }
        Toast.show({ type: 'success', text1: 'Succès', text2: 'Catégorie dépense créée' })
      } else {
        const response = await api.post(
          `/sellprox/comptabilite/depenses/category/update/${form.id}`,
          payload
        )
        const okUpdate = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
        if (!okUpdate) {
          Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Mise à jour impossible' })
          return
        }
        Toast.show({ type: 'success', text1: 'Succès', text2: 'Catégorie dépense modifiée' })
      }
      sheetRef.current?.close()
      setForm({ name: '', description: '', status: '1' })
      fetchExpenseCategories()
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Erreur lors de l\'enregistrement',
      })
    }
  }

  const saveProductCategory = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' })
      return
    }
    try {
      const payload = {
        entreprise_id,
        category_name: form.name || '',
        status: '1',
      }

      if (editMode === 'add') {
        const response = await api.post(
          '/sellprox/categories/create',
          payload
        )
        const ok = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
        if (!ok) {
          Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Création impossible' })
          return
        }
        Toast.show({ type: 'success', text1: 'Succès', text2: 'Catégorie produit créée' })
      } else {
        const response = await api.post(
          `/sellprox/categories/update/${form.id}`,
          payload
        )
        const ok = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
        if (!ok) {
          Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Mise à jour impossible' })
          return
        }
        Toast.show({ type: 'success', text1: 'Succès', text2: 'Catégorie produit modifiée' })
      }
      sheetRef.current?.close()
      setForm({ name: '', description: '', status: '1' })
      fetchProductCategories()
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Erreur lors de l\'enregistrement',
      })
    }
  }

  const deleteProductCategory = async (item) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' })
      return
    }
    try {
      const response = await api.post(
        '/sellprox/categories/delete',
        {
          entreprise_id,
          id: item.id,
        }
      )
      const ok = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
      if (!ok) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Suppression impossible' })
        return
      }
      Toast.show({ type: 'success', text1: 'Succès', text2: 'Catégorie supprimée' })
      fetchProductCategories()
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Erreur lors de la suppression',
      })
    }
  }

  const saveCategory = () => {
    if (activeTab === 'depenses') {
      return saveExpenseCategory()
    }
    return saveProductCategory()
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return productCategories
    return productCategories.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query)
    )
  }, [searchQuery, productCategories])

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return expenseCategories
    return expenseCategories.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query)
    )
  }, [searchQuery, expenseCategories])

  const renderProductCategory = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.ref}>ID #{item.id}</Text>
        <Text style={styles.badge}>
          {item.status === 1 ? 'Activé' : 'Désactivé'}
        </Text>
      </View>
      <InfoRow icon={FileText} label="Nom" value={item.name} />
     
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => setSelectedCategory({ type: 'produit', data: item })}
        >
          <Text style={styles.muted}>Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionIcon}>
          <Pencil size={18} color={COLORS.muted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteProductCategory(item)}>
          <Text style={styles.actionDanger}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderExpenseCategory = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.ref}>ID #{item.id}</Text>
      </View>
      <InfoRow icon={FileText} label="Nom" value={item.name} />
      <InfoRow
        icon={Tag}
        label="Description"
        value={item.description || 'Aucune description'}
      />
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setSelectedCategory({ type: 'depense', data: item })}>
          <Text style={styles.actionMuted}>Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionIcon}>
          <Pencil size={18} color={COLORS.muted} />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (initialLoading) {
    return <LoadingScreen />
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <Header agentName="Agent connecte" />
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true)
              refreshAll(false)
            }} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.title}>Catégories</Text>
              <Text style={styles.subtitle}>Produits & dépenses</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={openAdd}>
              <Plus size={18} color="#000000" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'produits' && styles.tabActive]}
              onPress={() => setActiveTab('produits')}
            >
              <Text style={[styles.tabText, activeTab === 'produits' && styles.tabTextActive]}>
                Produits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'depenses' && styles.tabActive]}
              onPress={() => setActiveTab('depenses')}
            >
              <Text style={[styles.tabText, activeTab === 'depenses' && styles.tabTextActive]}>
                Dépenses
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={18} color={COLORS.muted} />
            <TextInput
              placeholder="Rechercher..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>

          {searchLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : null}

          <View style={{ gap: 16, marginTop: 16 }}>
            {activeTab === 'produits'
              ? filteredProducts.map(renderProductCategory)
              : filteredExpenses.map(renderExpenseCategory)}
            {activeTab === 'produits' && filteredProducts.length === 0 ? (
              <Text style={styles.emptyText}>Aucune catégorie produit</Text>
            ) : null}
            {activeTab === 'depenses' && filteredExpenses.length === 0 ? (
              <Text style={styles.emptyText}>Aucune catégorie dépense</Text>
            ) : null}
          </View>
        </ScrollView>

        <Modal
          isVisible={!!selectedCategory}
          onBackdropPress={() => setSelectedCategory(null)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Détails</Text>
            {selectedCategory?.type === 'produit' ? (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Nom</Text>
                  <Text style={styles.modalValue}>{selectedCategory.data.name}</Text>
                </View>
                {/* <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Slug</Text>
                  <Text style={styles.modalValue}>{selectedCategory.data.slug || '-'}</Text>
                </View> */}
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Statut</Text>
                  <Text style={styles.modalValue}>
                    {selectedCategory.data.status === 1 ? 'Activé' : 'Désactivé'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Nom</Text>
                  <Text style={styles.modalValue}>{selectedCategory?.data?.name}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={styles.modalValue}>
                    {selectedCategory?.data?.description || '-'}
                  </Text>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modalize ref={sheetRef} adjustToContentHeight>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>
              {editMode === 'add' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
            </Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Nom"
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholderTextColor={COLORS.muted}
            />
            {activeTab === 'depenses' ? (
              <TextInput
                style={[styles.sheetInput, styles.textArea]}
                placeholder="Description"
                value={form.description}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, description: value }))
                }
                placeholderTextColor={COLORS.muted}
                multiline
              />
            ) : null}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetButton, styles.sheetButtonGhost]}
                onPress={() => sheetRef.current?.close()}
              >
                <Text style={styles.sheetButtonGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetButton} onPress={saveCategory}>
                <Text style={styles.sheetButtonText}>
                  {editMode === 'add' ? 'Créer' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modalize>
      </View>
    </KeyboardAvoidingView>
  )
}

const InfoRow = ({ icon: Icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon size={16} color={COLORS.muted} />
    <Text style={styles.infoText}>
      {label} : <Text style={styles.infoValue}>{value}</Text>
    </Text>
  </View>
)

export default Categories

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.card },
  content: { flex: 1, padding: 16, backgroundColor: COLORS.bg },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 4 },
  addButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  addButtonText: { color: '#000000', fontWeight: '600' },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { color: COLORS.muted, fontWeight: '600' },
  tabTextActive: { color: '#000000', fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  loadingText: { color: COLORS.muted, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ref: { fontWeight: '700', color: COLORS.primary },
  badge: {
    backgroundColor: '#ECFDF5',
    color: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  infoText: { color: COLORS.text, fontWeight: '500' },
  infoValue: { fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionPrimary: { color: COLORS.primary, fontWeight: '600' },
  actionIcon: { paddingHorizontal: 6 },
  actionDanger: { color: '#B91C1C', fontWeight: '700' },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 24 },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  modalRow: { marginBottom: 10 },
  modalLabel: { fontSize: 12, color: COLORS.muted },
  modalValue: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  modalClose: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: { color: COLORS.white, fontWeight: '700' },
  sheetContent: { padding: 20, gap: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sheetInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusText: { color: COLORS.muted, fontWeight: '600' },
  statusTextActive: { color: COLORS.white, fontWeight: '700' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  sheetButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetButtonText: { color: '#000000', fontWeight: '700', fontSize: 16 },
  sheetButtonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetButtonGhostText: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
})