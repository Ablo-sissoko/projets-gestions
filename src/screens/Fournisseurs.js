import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Modalize } from 'react-native-modalize'
import Toast from 'react-native-toast-message'
import {
  Plus,
  Phone,
  Mail,
  MapPin,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
} from 'lucide-react-native'
import Header from '../componants/Header'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import LoadingScreen from '../componants/LoadingScreen'
import Modal from 'react-native-modal'
import COLORS from '../constants/couleurs'



/* ===================== DATA ===================== */
const initialFournisseurs = []

/* ===================== COMPONENT ===================== */
const FournisseursScreen = () => {
  const { user } = useContext(AuthContext)
  const [search, setSearch] = useState('')
  const [fournisseurs, setFournisseurs] = useState(initialFournisseurs)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [editMode, setEditMode] = useState('add')
  const [viewFournisseur, setViewFournisseur] = useState(null)
  const [form, setForm] = useState({
    nom_entreprise: '',
    email: '',
    telephone: '',
    fax: '',
    adresse: '',
    status: '1',
  })
  const sheetRef = useRef(null)

  useEffect(() => {
    refreshFournisseurs(1, false, false)
  }, [user?.entreprise_id])

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshFournisseurs(1, false, true)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  const refreshFournisseurs = async (page = 1, append = false, isSearch = false) => {
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
      const query = search.trim()
      const response = await api.post(
        '/sellprox/fournisseurs/search',
        {
          totalPage: String(page),
          nom_entreprise: query,
          telephone: '',
          status: '',
          entreprise_id,
        }
      )
      const normalizeResponse = (data) => {
        if (typeof data === 'string') {
          const start = data.indexOf('{')
          const end = data.lastIndexOf('}')
          if (start !== -1 && end !== -1) {
            try {
              return JSON.parse(data.slice(start, end + 1))
            } catch (err) {
              return data
            }
          }
        }
        return data
      }

      const normalized = normalizeResponse(response.data)
      const results = Array.isArray(normalized?.resultat)
        ? normalized.resultat
        : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        nom: item.nom_entreprise || '-',
        email: item.email || '-',
        telephone: item.telephone || '-',
        adresse: item.adresse || '-',
        statut: Number(item.status) === 1 ? 'Activé' : 'Désactivé',
        statusValue: Number(item.status),
        fax: item.fax || '',
        dateEnreg: item.dateEnreg || '',
        dateModif: item.dateModif || '',
      }))

      const nextPage = Number(response.data?.currentPage || page)
      const nextTotal = Number(response.data?.totalPages || 1)

      setCurrentPage(nextPage)
      setTotalPages(nextTotal)
      setFournisseurs((prev) => (append ? [...prev, ...formatted] : formatted))
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les fournisseurs',
      })
    } finally {
      setInitialLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore) return
    if (currentPage >= totalPages) return
    refreshFournisseurs(currentPage + 1, true, false)
  }

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await refreshFournisseurs(1, false, false)
    setRefreshing(false)
  }, [search])

  const openAdd = () => {
    setEditMode('add')
    setForm({
      id: undefined,
      nom_entreprise: '',
      email: '',
      telephone: '',
      fax: '',
      adresse: '',
      status: '1',
    })
    sheetRef.current?.open()
  }

  const openEdit = (item) => {
    setEditMode('edit')
    setForm({
      id: item.id,
      nom_entreprise: item.nom,
      email: item.email === '-' ? '' : item.email,
      telephone: item.telephone === '-' ? '' : item.telephone,
      fax: item.fax || '',
      adresse: item.adresse === '-' ? '' : item.adresse,
      status: String(item.statusValue ?? 0),
    })
    sheetRef.current?.open()
  }

  const saveFournisseur = async () => {
    const entreprise_id = user?.entreprise_id
    const user_id = user?.id
    if (!entreprise_id || !user_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' })
      return
    }

    const payload = {
      nom_entreprise: form.nom_entreprise,
      email: form.email,
      telephone: form.telephone,
      fax: form.fax || '',
      adresse: form.adresse,
      status: form.status,
      entreprise_id,
      user_id,
    }

    try {
      if (editMode === 'add' || !form.id) {
        const response = await api.post(
          '/sellprox/fournisseurs/create',
          payload
        )

        if (response.data?.status !== 1) {
          Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Création échouée' })
          return
        }
        Toast.show({ type: 'success', text1: 'Succès', text2: response.data?.msg || 'Fournisseur créé' })
      } else {
        const response = await api.post(
          `/sellprox/fournisseurs/update/${form.id}`,
          payload
        )
        if (response.data?.status !== 1) {
          Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Mise à jour échouée' })
          return
        }
        Toast.show({ type: 'success', text1: 'Succès', text2: response.data?.msg || 'Fournisseur mis à jour' })
      }

      sheetRef.current?.close()
      setEditMode('add')
      refreshFournisseurs(1, false, false)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Erreur lors de l\'enregistrement',
      })
    }
  }

  const filtered = useMemo(() => fournisseurs, [fournisseurs])

  const StatusBadge = ({ statut }) => {
    const isActive = statut === 'Activé'

    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2',
          },
        ]}
      >
        {isActive ? (
          <CheckCircle size={14} color={COLORS.success} />
        ) : (
          <XCircle size={14} color={COLORS.danger} />
        )}
        <Text
          style={{
            color: isActive ? COLORS.success : COLORS.danger,
            fontSize: 12,
            fontWeight: '600',
          }}
        >
          {' '}{statut}
        </Text>
      </View>
    )
  }

  if (initialLoading) {
    return <LoadingScreen />
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.wrapper}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <Header agentName="Agent connecté" />

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
          }
        >

          {/* ===== Title ===== */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Fournisseurs</Text>
              <Text style={styles.subtitle}>
                Gestion & suivi des partenaires
              </Text>
            </View>
          </View>

          {/* ===== Search ===== */}
          <View style={styles.searchBox}>
            <Search size={18} color={COLORS.muted} />
            <TextInput
              placeholder="Rechercher une entreprise..."
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : null}
          </View>

          {/* ===== Cards ===== */}
          <View style={{ gap: 16, marginTop: 16 }}>
            {filtered.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.ref}>ID #{item.id}</Text>
                  <StatusBadge statut={item.statut} />
                </View>

                <Text style={styles.nom}>{item.nom}</Text>

                <InfoRow icon={Mail} label="Email" value={item.email} />
                <InfoRow icon={Phone} label="Téléphone" value={item.telephone} />
                <InfoRow icon={MapPin} label="Adresse" value={item.adresse} />

                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => setViewFournisseur(item)} style={styles.actionBtn1}>
                    <Eye size={18} color={COLORS.white} />
                    <Text style={styles.actionPrimary}>Voir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Edit size={18} color={COLORS.white} />
                    <Text style={styles.actionMuted}>Modifier</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {filtered.length > 0 && currentPage < totalPages ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loadMoreText}>Charger plus</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Plus size={24} color="#000000" />
        </TouchableOpacity>

        <Modalize ref={sheetRef} adjustToContentHeight>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>
              {editMode === 'add' ? 'Nouveau fournisseur' : 'Modifier le fournisseur'}
            </Text>
            {[
              ['nom_entreprise', 'Nom entreprise'],
              ['telephone', 'Téléphone'],
              ['email', 'Email'],
              ['adresse', 'Adresse'],
            ].map(([field, label]) => (
              <TextInput
                key={field}
                style={styles.sheetInput}
                placeholder={label}
                value={form[field]?.toString() || ''}
                onChangeText={(value) =>
                  setForm((p) => ({ ...p, [field]: value }))
                }
                placeholderTextColor={COLORS.muted}
              />
            ))}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetButton, styles.sheetButtonGhost]}
                onPress={() => sheetRef.current?.close()}
              >
                <Text style={styles.sheetButtonGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetButton} onPress={saveFournisseur}>
                <Text style={styles.sheetButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modalize>

        <Modal isVisible={!!viewFournisseur} onBackdropPress={() => setViewFournisseur(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Détails du fournisseur</Text>
            {viewFournisseur ? (
              [
                ['ID', viewFournisseur.id],
                ['Entreprise', viewFournisseur.nom],
                ['Email', viewFournisseur.email],
                ['Téléphone', viewFournisseur.telephone],
                ['Adresse', viewFournisseur.adresse],
                ['Statut', viewFournisseur.statut],
                ['Créé le', viewFournisseur.dateEnreg || '-'],
                ['Modifié le', viewFournisseur.dateModif || '-'],
              ].map(([label, value]) => (
                <View key={label} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{label}</Text>
                  <Text style={styles.modalValue}>{value}</Text>
                </View>
              ))
            ) : null}
            <TouchableOpacity style={styles.modalClose} onPress={() => setViewFournisseur(null)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  )
}

export default FournisseursScreen

const InfoRow = ({ icon: Icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon size={16} color={COLORS.muted} />
    <Text style={styles.infoText}>
      {label} : <Text style={styles.infoValue}>{value}</Text>
    </Text>
  </View>
)


const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16, paddingBottom: 200 },

  headerRow: { marginBottom: 20 },

  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 4 },

  searchBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  searchInput: { flex: 1, color: COLORS.text },

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
    marginBottom: 10,
  },

  ref: { fontWeight: '700', color: COLORS.primary },
  nom: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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

  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  loadMoreButton: {
    marginTop: 12,
    marginBottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  loadMoreText: { color: '#fff', fontWeight: '700' },
  sheetContent: { padding: 20, gap: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  sheetInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  sheetButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetButtonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetButtonText: { color: '#000000', fontWeight: '700' },
  sheetButtonGhostText: { color: COLORS.text, fontWeight: '700' },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  modalRow: { marginBottom: 8 },
  modalLabel: { color: COLORS.muted },
  modalValue: { fontWeight: '600', color: COLORS.text },
  modalClose: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: { color: '#000000', fontWeight: '700' },
})
