import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal as RNModal,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Modalize } from 'react-native-modalize'
import Modal from 'react-native-modal'
import Toast from 'react-native-toast-message'
import { Plus, Search, Trash2, User, Users, Calendar, FileText, Eye, Download } from 'lucide-react-native'
import Header from '../componants/Header'
import LoadingScreen from '../componants/LoadingScreen'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import Pdf from 'react-native-pdf'
import COLORS from '../constants/couleurs'


export default function ProformaDevisScreen() {
  const { user, token } = useContext(AuthContext)
  const [clientName, setClientName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')

  const [saving, setSaving] = useState(false)
  const [reports, setReports] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [productVisible, setProductVisible] = useState(false)
  const [pdfVisible, setPdfVisible] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const createSheetRef = useRef(null)
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.price),
        0
      ),
    [items]
  )

  const fetchProducts = useCallback(async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.post(
        '/sellprox/product/search',
        {
          totalPage: '1',
          nom: productSearch.trim(),
          id_category: '',
          id_product: '',
          code_barre: '',
          entreprise_id,
        }
      )
      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []
      const formatted = results.map((p) => ({
        id: String(p.id),
        name: p.product_name || '-',
        price: Number(p.price) || 0,
      }))
      setProducts(formatted)
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.response?.data?.msg || error.message || 'Impossible de charger les produits' })
    }
  }, [productSearch, user?.entreprise_id])

  const fetchReports = useCallback(async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setInitialLoading(false)
      return
    }
    try {
      const response = await api.post(
        '/sellprox/rapports/search',
        {
          totalPage: '1',
          client_name: '',
          employee_name: '',
          phone: '',
          type: 'Facture Proforma',
          entreprise_id,
        }
      )
      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []
      const filtered = results.filter((r) =>
        String(r.type || '').toLowerCase().includes('proforma') ||
        String(r.type || '').toLowerCase().includes('commande')
      )
      const formatted = filtered.map((r) => ({
        id: String(r.id),
        type: r.type || '-',
        client: r.client_name || '-',
        employee: r.employee_name || '-',
        total: Number(r.total) || 0,
        date: r.date || '-',
        url: r.url_fichier || '',
      }))
      setReports(formatted)
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.response?.data?.msg || error.message || 'Impossible de charger les rapports' })
    } finally {
      setInitialLoading(false)
    }
  }, [user?.entreprise_id])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts()
    }, 400)
    return () => clearTimeout(timeout)
  }, [productSearch, fetchProducts])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await fetchReports()
    setRefreshing(false)
  }, [fetchReports])

  const getSelectedQty = (id) => {
    const found = items.find((p) => p.id === id)
    return Number(found?.quantity || 0)
  }
  const adjustItemFromProduct = (product, delta) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id)
      const currentQty = Number(existing?.quantity || 0)
      if (delta > 0) {
        if (existing) {
          return prev.map((p) =>
            p.id === product.id ? { ...p, quantity: currentQty + 1 } : p
          )
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        ]
      }
      if (!existing) return prev
      const nextQty = currentQty - 1
      if (nextQty <= 0) return prev.filter((p) => p.id !== product.id)
      return prev.map((p) =>
        p.id === product.id ? { ...p, quantity: nextQty } : p
      )
    })
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  const createProforma = async () => {
    if (!clientName.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Nom client obligatoire' })
      return
    }

    if (!items.length) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Ajoute au moins un produit' })
      return
    }

    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' })
      return
    }

    setSaving(true)

    try {
      const payload = {
        client_name: clientName,
        email: email || '',
        phone: phone || '',
        date: date || '',
        employee_id: String(user?.employee_id || user?.id || 1),
        employee_name:
          `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Employé',
        entreprise_id,
        items: items.map((item) => ({
          product_name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      }

      const response = await api.post(
        '/sellprox/facture/proforma/create',
        payload
      )

      if (response.data?.status === 1) {
        Toast.show({ type: 'success', text1: 'Succès', text2: 'Proforma créée avec succès' })

        setItems([])
        setClientName('')
        setEmail('')
        setPhone('')
        setDate(new Date().toISOString().split('T')[0])

        createSheetRef.current?.close()
        await fetchReports()
      } else {
        Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.msg || 'Echec création' })
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur API', text2: error.response?.data?.msg || 'Impossible de créer le proforma' })
    } finally {
      setSaving(false)
    }
  }

  const openPreview = async (report) => {
    if (!report.url) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Aucun fichier PDF disponible' })
      return
    }
    try {
      setPdfUrl({
        uri: report.url,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: true,
      })
      setPdfVisible(true)
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: "Impossible d'ouvrir le PDF" })
    }
  }
  const downloadReport = async (report) => {
    if (!report.url) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Aucun lien de téléchargement' })
      return
    }
    const ok = await Linking.canOpenURL(report.url)
    if (!ok) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Lien invalide' })
      return
    }
    Linking.openURL(report.url)
  }
  const openDetail = (report) => {
    setSelectedReport(report)
    setDetailVisible(true)
  }

  if (initialLoading) {
    return <LoadingScreen message="Chargement des données..." />
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

        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}

          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
          }
          ListHeaderComponent={
            <View style={styles.pageHeader}>
              <Text style={styles.title}>Proformas ou Devis</Text>
              <Text style={styles.subtitle}>Historique des documents</Text>
            </View>
          }

          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.ref}>ID #{item.id}</Text>
                <Text style={styles.amount}>
                  {item.total.toLocaleString()} FCFA
                </Text>
              </View>
              <InfoRow icon={FileText} label="Type" value={item.type} />
              <InfoRow icon={User} label="Client" value={item.client} />
              <InfoRow icon={Users} label="Employé" value={item.employee} />
              <InfoRow icon={Calendar} label="Date" value={item.date} />
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openDetail(item)} style={styles.actionBtn1}>
                  <Eye size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openPreview(item)} style={styles.actionBtn}>
                  <FileText size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadReport(item)} style={styles.actionBtn}>
                  <Download size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun rapport trouvé.</Text>
          }
        />

        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => createSheetRef.current?.open()}
        >
          <Plus size={22} color="#000000" />
        </TouchableOpacity>

        <Modalize ref={createSheetRef} adjustToContentHeight>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Créer un Proforma</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du client"
              placeholderTextColor={COLORS.muted}
              value={clientName}
              onChangeText={setClientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              placeholderTextColor={COLORS.muted}
              value={phone}
              onChangeText={setPhone}
            />
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateInputRow}>
                <Text style={[styles.inputText, !date && styles.inputPlaceholder]}>
                  {date || 'Choisir une date'}
                </Text>
                <Calendar size={20} color={COLORS.muted} />
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false)
                    if (event?.type === 'set' && selectedDate) {
                      setDate(selectedDate.toISOString().split('T')[0])
                    }
                  } else if (selectedDate) {
                    setDate(selectedDate.toISOString().split('T')[0])
                  }
                }}
              />
            )}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.datePickerBtn}>
                  <Text style={styles.datePickerBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                fetchProducts()
                setProductVisible(true)
              }}
            >
              <Text style={styles.selectText}>Ajouter des produits</Text>
            </TouchableOpacity>

            {items.length ? (
              <View style={styles.itemsList}>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemMeta}>
                        {item.quantity} x {item.price} FCFA
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeItem(item.id)}
                    >
                      <Trash2 size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {total.toLocaleString()} FCFA
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={createProforma}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </View>
        </Modalize>

        <Modal
          isVisible={productVisible}
          onBackdropPress={() => setProductVisible(false)}
          backdropOpacity={0.6}
        >
          <View style={styles.productModal}>
            <Text style={styles.sheetTitle}>Sélectionner un produit</Text>
            <View style={styles.searchBox}>
              <Search size={16} color={COLORS.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                placeholderTextColor={COLORS.muted}
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>
            <View style={styles.productModalListWrap}>
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.productApiCard}>
    <View>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>
                        {item.price.toLocaleString()} FCFA
                      </Text>
                    </View>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => adjustItemFromProduct(item, -1)}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{getSelectedQty(item.id)}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => adjustItemFromProduct(item, 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Aucun produit disponible.</Text>
                }
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={() => setProductVisible(false)}
            >
              <Text style={styles.primaryButtonText}>Enregistrer les produits</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          isVisible={pdfVisible}
          onBackdropPress={() => setPdfVisible(false)}
          style={styles.pdfModal}
          backdropOpacity={0.9}
        >
          <View style={styles.pdfPreviewContainer}>
            <View style={styles.pdfPreviewHeader}>
              <Text style={styles.pdfPreviewTitle}>Aperçu Proforma</Text>
              <View style={styles.pdfPreviewHeaderActions}>
                <TouchableOpacity
                  onPress={() => pdfUrl?.uri && downloadReport({ url: pdfUrl.uri })}
                  style={styles.pdfHeaderBtn}
                >
                  <Download size={18} color={COLORS.white} />
                  <Text style={styles.pdfHeaderBtnText}>Télécharger</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPdfVisible(false)} style={styles.pdfCloseBtn}>
                  <Text style={styles.pdfCloseText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.pdfPreviewContent}>
              {pdfUrl ? (
                <Pdf
                  source={pdfUrl}
                  style={styles.pdfViewer}
                  trustAllCerts={false}
                  enablePaging={true}
                  renderActivityIndicator={() => (
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  )}
                  onLoadComplete={() => { }}
                  onError={() => {
                    Toast.show({ type: 'error', text1: 'Erreur', text2: "Impossible d'afficher le PDF" })
                  }}
                />
              ) : null}
            </View>
          </View>
        </Modal>

        <RNModal visible={detailVisible} animationType="slide" transparent>
          <View style={styles.detailOverlay}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Détail document</Text>
              {selectedReport && (
                <>
                  <Text style={styles.detailText}>Type: {selectedReport.type}</Text>
                  <Text style={styles.detailText}>Client: {selectedReport.client}</Text>
                  <Text style={styles.detailText}>Employé: {selectedReport.employee}</Text>
                  <Text style={styles.detailText}>Date: {selectedReport.date}</Text>
                  <Text style={styles.detailText}>
                    Total: {Number(selectedReport.total || 0).toLocaleString()} FCFA
                  </Text>
                </>
              )}
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 20 }]}
                onPress={() => setDetailVisible(false)}
              >
                <Text style={styles.primaryButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNModal>
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

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 16, paddingBottom: 80, gap: 16, },
  pageHeader: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 4 },
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
  amount: { fontSize: 16, fontWeight: '700', color: COLORS.success },
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
  actionPrimary: { color: COLORS.primary, fontWeight: '600' },
  actionMuted: { color: COLORS.muted },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 20 },
  floatingBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  sheetContent: { padding: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: { fontSize: 15, color: COLORS.text },
  inputPlaceholder: { color: COLORS.muted },
  datePickerActions: { paddingHorizontal: 14, paddingBottom: 12, alignItems: 'flex-end' },
  datePickerBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  datePickerBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  selectButton: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectText: { color: COLORS.text, fontWeight: '600' },
  itemsList: { gap: 10, marginBottom: 12 },
  itemRow: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontWeight: '600', color: COLORS.text },
  itemMeta: { color: COLORS.muted, marginTop: 4 },
  deleteBtn: {
    backgroundColor: COLORS.danger,
    padding: 8,
    borderRadius: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: { color: COLORS.muted, fontWeight: '600' },
  totalValue: { color: COLORS.text, fontWeight: '700' },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#000000', fontWeight: '700' },
  productModalWrap: { justifyContent: 'flex-end' },
  productModal: {
    height: '80%',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productModalListWrap: { flex: 1, minHeight: 0 },
  productApiCard: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontWeight: '700', color: COLORS.text },
  qtyValue: { fontWeight: '700', minWidth: 18, textAlign: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1 },
  pdfModal: { margin: 0, justifyContent: 'flex-end' },
  pdfPreviewContainer: {
    height: '50%',
    minHeight: 280,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  pdfPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pdfPreviewTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  pdfPreviewHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pdfHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  pdfHeaderBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  pdfCloseBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  pdfCloseText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  pdfPreviewContent: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20,
  },
  pdfViewer: { flex: 1 },
  previewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',   
  },
  previewLoadingText: { color: COLORS.text },
  previewButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  previewButtonText: { color: '#fff', fontWeight: '700' },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  detailTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  detailText: { color: COLORS.text, marginTop: 4 },
  productsList: { gap: 8 },
  productRow: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productName: { color: COLORS.text, fontWeight: '600' },
  productPrice: { color: COLORS.muted },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
  },
  loadingText: { color: COLORS.muted, fontWeight: '600' },
})