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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Toast from 'react-native-toast-message'
import Modal from 'react-native-modal'
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import {
  Filter,
  Plus,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  Pencil,
  UserX,
} from 'lucide-react-native'
import Header from '../componants/Header'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import LoadingScreen from '../componants/LoadingScreen'
import COLORS from '../constants/couleurs'

const ClientsHeader = React.memo(function ClientsHeader({
  totalCount,
  openAdd,
  openFilters,
}) {
  return (
    <>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>
            Gestion & suivi des clients
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openAdd}>
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { flex: 1 }]}>
          <Text style={styles.totalLabel}>Total clients</Text>
          <Text style={styles.totalCount}>{totalCount}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={openFilters}
        >
          <Filter size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </>
  )
})

/* ===================== COMPONENT ===================== */
const Clients = () => {
  const { user } = useContext(AuthContext)
  const [clients, setClients] = useState([])
  const [filter, setFilter] = useState('all')
  const [filterForm, setFilterForm] = useState({
    nom_customer: '',
    nom_entreprise: '',
    telephone: '',
    status: '',
  })
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [showFilterStatusPicker, setShowFilterStatusPicker] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDataCount, setTotalDataCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [viewClient, setViewClient] = useState(null)
  const [editMode, setEditMode] = useState('add')
  const [form, setForm] = useState({
    id: '',
    nom_entreprise: '',
    nom_customer: '',
    email: '',
    telephone: '',
    adresse: '',
    status: '',
    user_id: '',
  })
  
  const bottomSheetRef = useRef(null)
  const filterSheetRef = useRef(null)
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
    refreshClients(1, false)
  }, [user?.entreprise_id])

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshClients(1, false)
    }, 350)
    return () => clearTimeout(timeout)
  }, [filterForm])

  const refreshClients = async (page = 1, append = false) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setInitialLoading(false)
      setLoadingMore(false)
      return
    }
    setLoadingMore(true)

    try {
      const status = filterForm.status || (filter === 'active' ? '1' : filter === 'inactive' ? '0' : '')

      const response = await api.post('/sellprox/clients/search', {
        entreprise_id,
        totalPage: String(page),
        nom_customer: filterForm.nom_customer || '',
        nom_entreprise: filterForm.nom_entreprise || '',
        telephone: filterForm.telephone || '',
        adresse: filterForm.adresse || '',
        status,
      })

      let data = response.data
      if (typeof data === 'string') {
        const jsonStart = data.lastIndexOf('{')
        if (jsonStart !== -1) {
          try {
            data = JSON.parse(data.slice(jsonStart))
          } catch (_) {
            data = {}
          }
        } else {
          data = {}
        }
      }

      const rawList = data?.resultat ?? data?.data ?? data?.clients ?? data?.results
      const results = Array.isArray(rawList) ? rawList : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        company: item.nom_entreprise || '-',
        clientName: item.nom_customer || '-',
        contactName: item.nom_customer || '-',
        status: item.status === 1 ? 'Activé' : 'Désactivé',
        statusValue: item.status,
        email: item.email || '-',
        phone: item.telephone || '-',
        address: item.adresse || '-',
        dateEnreg: item.dateEnreg || '',
        dateModif: item.dateModif || '',
      }))

      const nextPage = Number(data?.currentPage || page)
      const nextTotal = Number(data?.totalPages || 1)
      const totalFromApi = Number(data?.totalData ?? data?.total ?? 0)

      setCurrentPage(nextPage)
      setTotalPages(nextTotal)
      if (!append) setTotalDataCount(totalFromApi > 0 ? totalFromApi : results.length)
      setClients((prev) => (append ? [...prev, ...formatted] : formatted))
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les clients',
      })
      throw error
    } finally {
      setInitialLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) return
    refreshClients(currentPage + 1, true)
  }

  const openFilters = () => {
    filterSheetRef.current?.expand()
  }

  const resetFilters = () => {
    setFilterForm({
      nom_customer: '',
      nom_entreprise: '',
      telephone: '',
      status: '',
    })
    setFilter('all')
    filterSheetRef.current?.close()
    refreshClients(1, false)
  }

  const applyFilters = () => {
    filterSheetRef.current?.close()
    refreshClients(1, false)
  }

  const getStatusLabel = (value, allowAll = false) => {
    if (allowAll && value === '') return 'Tous'
    if (value === '1') return 'Activé'
    if (value === '0') return 'Désactivé'
    return ''
  }

  const renderStatusPicker = ({
    visible,
    allowAll = false,
    onSelect,
    onClose,
  }) => {
    const options = allowAll
      ? [
        { label: 'Tous', value: '' },
        { label: 'Activé', value: '1' },
        { label: 'Désactivé', value: '0' },
      ]
      : [
        { label: 'Activé', value: '1' },
        { label: 'Désactivé', value: '0' },
      ]

    return (
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        style={styles.pickerModal}
      >
        <View style={styles.pickerContent}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Statut</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.pickerItem}
                onPress={() => {
                  onSelect(option.value)
                  onClose()
                }}
              >
                <Text style={styles.pickerItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    )
  }
  
  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshClients(1, false)
      Toast.show({
        type: 'success',
        text1: 'Liste actualisée',
        text2: 'Clients récupérés',
      })
    } catch (_) {}
    finally {
      setRefreshing(false)
    }
  }, [])

  const openAdd = () => {
    setEditMode('add')
    setForm({
      id: '',
      nom_entreprise: '',
      nom_customer: '',
      email: '',
      telephone: '',
      adresse: '',
      status: '',
      user_id: '',
    })
    bottomSheetRef.current?.expand()
  }

  const openEdit = (client) => {
    setEditMode('edit')
    setForm({
      id: client.id,
      nom_entreprise: client.company === '-' ? '' : client.company,
      nom_customer: client.clientName === '-' ? '' : client.clientName,
      email: client.email === '-' ? '' : client.email,
      telephone: client.phone === '-' ? '' : client.phone,
      adresse: client.address === '-' ? '' : client.address,
      status: String(client.statusValue ?? '1'),
      user_id: '',
    })
    bottomSheetRef.current?.expand()
  }

  const saveClient = async () => {
    if (!form.nom_customer) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Le nom du client est requis',
      })
      return
    }

    const user_id = user?.id
    const entreprise_id = user?.entreprise_id
    if (!user_id || !entreprise_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' })
      return
    }

    try {
      const payload = {
        entreprise_id,
        nom_entreprise: form.nom_entreprise,
        nom_customer: form.nom_customer,
        email: form.email,
        telephone: form.telephone,
        adresse: form.adresse,
        user_id,
      }

      if (editMode === 'add') {
        await api.post('/sellprox/clients/create', payload)
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Client créé avec succès',
        })
      } else {
        await api.post(`/sellprox/clients/update/${form.id}`, {
          ...payload,
          status: form.status || '1',
        })
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Client modifié avec succès',
        })
      }

      bottomSheetRef.current?.close()
      refreshClients(1, false)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || 'Une erreur est survenue',
      })
    }
  }

  const StatusBadge = ({ status }) => {
    const isActive = status === 'Activé'
    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)' },
        ]}
      >
        {isActive ? (
          <CheckCircle size={14} color={COLORS.success} />
        ) : (
          <XCircle size={14} color={COLORS.danger} />
        )}
        <Text style={[styles.statusText, { color: isActive ? COLORS.success : COLORS.danger }]}>
          {status}
        </Text>
      </View>
    )
  }

  const renderClientItem = ({ item }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientTop}>
        <Text style={styles.clientId}>ID #{item.id}</Text>
        <StatusBadge status={item.status} />
      </View>

      <Info icon={Building} label="Entreprise" value={item.company} />
      <Info icon={User} label="Client" value={item.clientName} />
      <Info icon={Mail} label="Email" value={item.email} />
      <Info icon={Phone} label="Téléphone" value={item.phone} />
      <Info icon={MapPin} label="Adresse" value={item.address} />

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setViewClient(item)} style={styles.actionBtn1}>
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

  const ListFooter = () => {
    if (clients.length === 0 && !initialLoading) {
      return (
        <View style={styles.emptyContainer}>
          <UserX size={48} color={COLORS.muted} />
          <Text style={styles.emptyText}>Aucun client trouvé</Text>
        </View>
      )
    }

    if (currentPage < totalPages) {
      return (
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
      )
    }

    return null
  }

  const listHeader = useMemo(
    () => (
      <ClientsHeader
        totalCount={totalDataCount}
        openAdd={openAdd}
        openFilters={openFilters}
      />
    ),
    [totalDataCount, openAdd, openFilters]
  )

  if (initialLoading) {
    return <LoadingScreen />
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
    >
      <View style={styles.wrapper}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

        <Header agentName="Agent connecté" />

        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClientItem}
          ListHeaderComponent={listHeader}
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

        {/* Modal Détails Client */}
        <Modal
          isVisible={!!viewClient}
          onBackdropPress={() => setViewClient(null)}
          onBackButtonPress={() => setViewClient(null)}
        >
          <View style={styles.modalCard}>
            {viewClient && (
              <>
                <Text style={styles.modalTitle}>Détails du client</Text>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>ID</Text>
                  <Text style={styles.modalValue}>{viewClient.id}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Entreprise</Text>
                  <Text style={styles.modalValue}>{viewClient.company}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Contact</Text>
                  <Text style={styles.modalValue}>{viewClient.contactName}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Statut</Text>
                  <StatusBadge status={viewClient.status} />
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Email</Text>
                  <Text style={styles.modalValue}>{viewClient.email}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Téléphone</Text>
                  <Text style={styles.modalValue}>{viewClient.phone}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Adresse</Text>
                  <Text style={styles.modalValue}>{viewClient.address}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setViewClient(null)}
                >
                  <Text style={styles.modalCloseText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>

        {/* Modal Statut */}
        {renderStatusPicker({
          visible: showStatusPicker,
          allowAll: false,
          onSelect: (value) => {
            setForm((prev) => ({ ...prev, status: value }))
          },
          onClose: () => setShowStatusPicker(false),
        })}

        {renderStatusPicker({
          visible: showFilterStatusPicker,
          allowAll: true,
          onSelect: (value) => {
            setFilterForm((prev) => ({ ...prev, status: value }))
          },
          onClose: () => setShowFilterStatusPicker(false),
        })}
        
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
                  {editMode === 'add' ? 'Ajouter un client' : 'Modifier le client'}
                </Text>

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Nom de l'entreprise"
                  value={form.nom_entreprise}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, nom_entreprise: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Nom du client *"
                  value={form.nom_customer}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, nom_customer: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Email"
                  value={form.email}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, email: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Téléphone"
                  value={form.telephone}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, telephone: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                  keyboardType="phone-pad"
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Adresse"
                  value={form.adresse}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, adresse: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                />

                {editMode === 'edit' && (
                  <TouchableOpacity
                    style={[styles.sheetInput, styles.selectButton]}
                    onPress={() => setShowStatusPicker(true)}
                  >
                    <Text style={form.status ? styles.selectText : styles.selectPlaceholder}>
                      {getStatusLabel(form.status) || 'Sélectionner un statut'}
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.sheetButtonGhost]}
                    onPress={() => bottomSheetRef.current?.close()}
                  >
                    <Text style={styles.sheetButtonGhostText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetButton} onPress={saveClient}>
                    <Text style={styles.sheetButtonText}>
                      {editMode === 'add' ? 'Ajouter' : 'Modifier'}
                    </Text>
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
                <Text style={styles.sheetTitle}>Filtrer les clients</Text>

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Nom du client"
                  value={filterForm.nom_customer}
                  onChangeText={(value) =>
                    setFilterForm((prev) => ({ ...prev, nom_customer: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Nom de l'entreprise"
                  value={filterForm.nom_entreprise}
                  onChangeText={(value) =>
                    setFilterForm((prev) => ({ ...prev, nom_entreprise: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Téléphone"
                  value={filterForm.telephone}
                  onChangeText={(value) =>
                    setFilterForm((prev) => ({ ...prev, telephone: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  style={[styles.sheetInput, styles.selectButton]}
                  onPress={() => setShowFilterStatusPicker(true)}
                >
                  <Text style={filterForm.status ? styles.selectText : styles.selectPlaceholder}>
                    {getStatusLabel(filterForm.status, true) || 'Tous les statuts'}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 4 },
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
  totalLabel: { fontSize: 15, color: COLORS.muted, fontWeight: '500' },
  totalCount: { fontSize: 17, color: COLORS.text, fontWeight: '700' },
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
  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.muted, fontWeight: '500' },
  filterTextActive: { color: COLORS.white, fontWeight: '600' },
  loadMoreButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadMoreText: { color: COLORS.white, fontWeight: '700' },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
  },
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
  clientCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  clientTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clientId: { fontWeight: '700', color: COLORS.primary },
  statusBadge: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  infoText: { color: COLORS.text, fontWeight: '500' },
  infoValue: { fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopColor: COLORS.border,
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
    marginBottom: 16,
  },
  modalRow: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 2,
  },
  modalValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.white,
    fontWeight: '700',
  },
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
  selectText: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  selectPlaceholder: { color: COLORS.muted, fontSize: 15 },

  pickerContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeText: { color: COLORS.primary, fontWeight: '600', fontSize: 16 },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerItemText: { fontSize: 16, color: COLORS.text },
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
  sheetButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  sheetButtonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetButtonGhostText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
})

export default Clients