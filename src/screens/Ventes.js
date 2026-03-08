import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Dimensions,
} from 'react-native'
import Modal from 'react-native-modal'
import { WebView } from 'react-native-webview'
import { QrCode, Search, ShoppingCart, Printer } from 'lucide-react-native'
import Header from '../componants/Header'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import { useNavigation, useRoute } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from "expo-camera"
import Toast from 'react-native-toast-message'
import COLORS from '../constants/couleurs'
import LoadingScreen from '../componants/LoadingScreen'

const RECEIPT_BASE_URL = 'https://deegipay.com/backend_pos/pdf/recu_paiement.php?id='

const recu_impression = 'https://deegipay.com/backend_pos/pdf/recu_impression.php?id='




const SalesHeader = React.memo(function SalesHeader({
  search,
  setSearch,
  searchLoading,
  categories,
  category,
  setCategory,
  cameraPermission,
  requestPermission,
  setScannerVisible,
}) {
  return (
    <View>
      {searchLoading ? (
        <View style={styles.searchLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.searchLoadingText}>Chargement...</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 15 }}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.muted} />
          <TextInput
            placeholder="Rechercher un produit..."
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={async () => {
            if (!cameraPermission?.granted) {
              await requestPermission()
            }
            setScannerVisible(true)
          }}
        >
          <QrCode size={20} color={COLORS.white} />
          <Text style={styles.scanButtonText}>Scanner</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => {
          const active = category === item
          return (
            <TouchableOpacity
              onPress={() => setCategory(item)}
              style={[
                styles.categoryChip,
                active && styles.categoryActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
})

export default function SalesScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { user } = useContext(AuthContext)
  const [cart, setCart] = useState([])
  const [category, setCategory] = useState('TOUT')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(['TOUT'])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)


  // 🔥 MODAL STATES
  const [clientModalVisible, setClientModalVisible] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(false)
  // 🔥 MODAL pour le produit scanné
  const [scannedProductModal, setScannedProductModal] = useState(false)
  const [currentScannedProduct, setCurrentScannedProduct] = useState(null)
  // 🔥 MODAL pour le scanner intégré
  const [cameraPermission, requestPermission] = useCameraPermissions()
  const [scannerVisible, setScannerVisible] = useState(false)
  const [scanned, setScanned] = useState(false)

  const [clientForm, setClientForm] = useState({
    nom_entreprise: "",
    nom_customer: "",
    telephone: "",
    email: "",
    adresse: "",
  })
  const [receiptModalVisible, setReceiptModalVisible] = useState(false)
  const [lastSaleId, setLastSaleId] = useState(null)



  useEffect(() => {
    if (route.params?.barcode) {
      searchProductByBarcode(route.params.barcode)
      navigation.setParams({ barcode: undefined })
    }
  }, [route.params?.barcode])

  const fetchClients = useCallback(async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      setClientsLoading(true)
      const response = await api.post('/sellprox/clients/search', {
        entreprise_id,
        totalPage: '1',
        nom_customer: '',
        nom_entreprise: '',
        telephone: '',
        adresse: '',
        status: '1',
      })
      setClients(response.data?.resultat || [])
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les clients',
      })
    } finally {
      setClientsLoading(false)
    }
  }, [user?.entreprise_id])

  useEffect(() => {
    if (clientModalVisible) {
      setSelectedClient(null)
      fetchClients()
    }
  }, [clientModalVisible, fetchClients])

  /* 🛒 CART LOGIC */
  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === product.id)
      if (found) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (product) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === product.id)
      if (!found) return prev
      if (found.qty <= 1) {
        return prev.filter((p) => p.id !== product.id)
      }
      return prev.map((p) =>
        p.id === product.id ? { ...p, qty: p.qty - 1 } : p
      )
    })
  }

  const total = useMemo(
    () => cart.reduce((s, p) => s + p.price * p.qty, 0),
    [cart]
  )

  useEffect(() => {
    refreshProducts(1, false, false)
    fetchCategories()
  }, [user?.entreprise_id])

  useEffect(() => {
    if (!search.trim()) return
    const timeout = setTimeout(() => {
      refreshProducts(1, false, true)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  const fetchCategories = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.get(`/sellprox/categories/read/${entreprise_id}`)
      const list = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []
      const formatted = list.map((item) => item.name).filter(Boolean)
      setCategories(['TOUT', ...formatted])
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les catégories',
      })
    }
  }

  const refreshProducts = async (page = 1, append = false, isSearch = false) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    if ((append && loading && !isSearch) || (searchLoading && isSearch)) return
    if (append && !hasMore) return
    if (page === 1 && !isSearch) {
      setLoading(true)
    } else if (isSearch) {
      setSearchLoading(true)
    }

    try {
      const response = await api.post('/sellprox/product/search', {
        totalPage: String(page),
        nom: search.trim(),
        id_category: '',
        id_product: '',
        code_barre: '',
        entreprise_id,
      })

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        name: item.product_name || '-',
        price: Number(item.price) || 0,
        prix_achat: item.prix_achat,
        category: item.category_name || '-',
        category_name: item.category_name || '-',
        category_id: item.category_id ? String(item.category_id) : '',
        status: item.status,
        image: item.img_url,
      }))

      const nextPage = Number(response.data?.currentPage || page)
      const nextTotal = Number(response.data?.totalPages || 1)
      const nextHasMore = Number.isFinite(nextTotal)
        ? nextPage < nextTotal
        : formatted.length > 0

      setCurrentPage(nextPage)
      setTotalPages(nextTotal)
      setHasMore(nextHasMore)
      setProducts((prev) => (append ? [...prev, ...formatted] : formatted))
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les produits',
      })
      throw error
    } finally {
      setLoading(false)
      setSearchLoading(false)
      setRefreshing(false)
    }
  }

  // 🔥 Fonction de scan avec modal
  const searchProductByBarcode = async (barcode) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.post('/sellprox/product/search', {
        totalPage: '1',
        nom: '',
        id_category: '',
        id_product: '',
        code_barre: barcode,
        entreprise_id,
      })

      const results = response.data?.resultat || []
      if (!results.length) {
        Toast.show({
          type: 'error',
          text1: 'Produit non trouvé',
          text2: 'Aucun produit pour ce code-barres',
        })
        return
      }

      const item = results[0]
      const formatted = {
        id: String(item.id),
        name: item.product_name,
        price: Number(item.price) || 0,
        prix_achat: item.prix_achat,
        category: item.category_name,
        category_name: item.category_name,
        category_id: String(item.category_id),
        status: item.status,
        image: item.img_url,
      }

      // ✅ Ouvrir le modal avec le produit scanné
      setCurrentScannedProduct(formatted)
      setScannedProductModal(true)

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur scan',
        text2: error.response?.data?.message || error.message || 'Erreur lors du scan',
      })
    }
  }

  // 🔥 Gestionnaire de scan depuis le modal caméra
  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return

    setScanned(true)
    await searchProductByBarcode(data)

    setTimeout(() => {
      setScannerVisible(false)
      setScanned(false)
    }, 500)
  }

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshProducts(1, false, false)
      Toast.show({
        type: 'success',
        text1: 'Liste actualisée',
        text2: 'Produits récupérés',
      })
    } catch (_) {}
    finally {
      setRefreshing(false)
    }
  }, [])

  const handleLoadMore = () => {
    if (loading || searchLoading) return
    if (!hasMore) return
    refreshProducts(currentPage + 1, true, false)
  }

  const filteredProducts = useMemo(() => {
    if (category === 'TOUT') return products
    return products.filter(
      (product) =>
        (product.category || '').trim() === (category || '').trim()
    )
  }, [category, products])

  const cartMap = useMemo(() => {
    const map = {}
    cart.forEach((item) => {
      map[item.id] = item
    })
    return map
  }, [cart])

  const handlePay = () => {
    if (!cart.length){
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Ajoutez au moins un produit au panier' })
      return
    }
    setClientModalVisible(true)
  }

  const finalizeSale = async () => {
    const hasClient = selectedClient || (clientForm.nom_customer?.trim())
    if (!hasClient) {
      Toast.show({ type: 'error', text1: 'Client requis', text2: 'Choisissez un client ou créez-en un.' })
      return
    }

    setCreating(true)
    try {
      const entreprise_id = user?.entreprise_id
      if (!user?.id || !entreprise_id) {
        setCreating(false)
        return
      }
      const employeeName = `${user?.prenom || ''} ${user?.nom || ''}`.trim()

      const now = new Date()
      const date = now.toISOString().slice(0, 19).replace('T', ' ')

      const payload = {
        client_name: selectedClient?.nom_customer ?? clientForm.nom_customer ?? '',
        email: selectedClient?.email ?? clientForm.email ?? '',
        phone: selectedClient?.telephone ?? clientForm.telephone ?? '',
        proforma_id: '1',
        user_id: user?.id,
        employee_id: user?.id,
        employee_name: employeeName || '',
        entreprise_id: entreprise_id,
        date,
        items: cart.map((item) => ({
          id: Number(item.id),
          product_name: item.name,
          prix_achat: Number(item.prix_achat) || 0,
          price: Number(item.price) || 0,
          category_id: Number(item.category_id) || 0,
          status: item.status ? 1 : 0,
          category_name: item.category_name || item.category || '',
          quantity: item.qty,
        })),
      }

      const response = await api.post('/sellprox/vente/create', payload)

      const ok = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
      Toast.show({
        text1: response.data?.msg || 'Vente enregistrée',
        type: ok ? 'success' : 'error',
      })

      if (ok) {
        const saleId = response.data?.sale_id ?? response.data?.id
        if (saleId != null && saleId !== '') {
          setLastSaleId(String(saleId))
          setReceiptModalVisible(true)
        }
        setCart([])
        setClientModalVisible(false)
        setShowClientForm(false)
        setSelectedClient(null)
        setClientForm({ nom_entreprise: '', nom_customer: '', telephone: '', email: '', adresse: '' })
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Erreur lors de la vente',
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <View style={styles.container}>
      <Header agentName="Agent connecte" />

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsContent}
        ListHeaderComponent={
          <SalesHeader
            search={search}
            setSearch={setSearch}
            searchLoading={searchLoading}
            categories={categories}
            category={category}
            setCategory={setCategory}
            cameraPermission={cameraPermission}
            requestPermission={requestPermission}
            setScannerVisible={setScannerVisible}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.emptyText}>Aucun produit trouvé.</Text>
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        renderItem={({ item }) => {
          const inCart = cartMap[item.id]

          return (
            <View style={styles.productItem}>
              <View style={styles.productCard}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => addToCart(item)}
                >
                  <Image
                    source={{
                      uri: item.image || 'https://via.placeholder.com/400',
                    }}
                    style={styles.image}
                    onError={() => {}}
                  />
                  <Text
                    style={styles.productName}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.price}>
                    {Number(item.price || 0).toLocaleString()} FCFA
                  </Text>
                </TouchableOpacity>

                <View style={styles.cartActions}>
                  <TouchableOpacity
                    style={styles.cartActionButton}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.cartActionText}>
                      Ajouter
                    </Text>
                  </TouchableOpacity>

                  {inCart && (
                    <TouchableOpacity
                      style={[
                        styles.cartActionButton,
                        styles.cartActionDanger,
                      ]}
                      onPress={() => removeFromCart(item)}
                    >
                      <Text
                        style={[
                          styles.cartActionText,
                          styles.cartActionTextDanger,
                        ]}
                      >
                        Retirer ({inCart.qty})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )
        }}
      />

      {/* 🛒 CART FOOTER */}
      <View style={styles.cartBar}>
        <View>
          <Text style={styles.cartItems}>
            <ShoppingCart size={16} /> {cart.length} article(s)
          </Text>
          <Text style={styles.cartTotal}>
            {Number(total || 0).toLocaleString()} FCFA
          </Text>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePay}
          disabled={creating || !cart.length}
        >
          <Text style={styles.payText}>PAYER</Text>
        </TouchableOpacity>
      </View>

      {/* 🔥 MODAL SCANNER CAMERA INTÉGRÉ */}
      <Modal
        isVisible={scannerVisible}
        style={{ margin: 0 }}
        onBackdropPress={() => setScannerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.black }}>
          {cameraPermission?.granted ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "code128", "qr"],
              }}
              onBarcodeScanned={
                scanned ? undefined : handleBarCodeScanned
              }
            />
          ) : (
            <View style={styles.center}>
              <Text style={{ color: COLORS.white }}>
                Permission caméra requise
              </Text>
            </View>
          )}

          {/* Bouton fermer */}
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 40,
              alignSelf: "center",
              backgroundColor: COLORS.primary,
              padding: 14,
              borderRadius: 16,
            }}
            onPress={() => setScannerVisible(false)}
          >
            <Text style={{ color: COLORS.white, fontWeight: "700" }}>
              Fermer
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 🔥 MODAL PRODUIT SCANNÉ */}
      <Modal
        isVisible={scannedProductModal}
        onBackdropPress={() => setScannedProductModal(false)}
        onBackButtonPress={() => setScannedProductModal(false)}
        backdropOpacity={0.7}
      >
        <View style={styles.modalCardPro}>
          {currentScannedProduct && (
            <>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: currentScannedProduct.image }}
                  style={styles.modalImagePro}
                />
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>
                    {currentScannedProduct.price.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>

              <Text style={styles.modalTitlePro}>{currentScannedProduct.name}</Text>

              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtnPro}
                  onPress={() => removeFromCart(currentScannedProduct)}
                >
                  <Text style={styles.qtyTextPro}>−</Text>
                </TouchableOpacity>

                <View style={styles.qtyDisplay}>
                  <Text style={styles.qtyDisplayText}>
                    {cart.find((p) => p.id === currentScannedProduct.id)?.qty || 0}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.qtyBtnPro}
                  onPress={() => addToCart(currentScannedProduct)}
                >
                  <Text style={styles.qtyTextPro}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.addBtnPro}
                onPress={() => setScannedProductModal(false)}
              >
                <Text style={styles.addTextPro}>Ajouter au panier</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* 🔥 MODAL CLIENT UNIQUE — onglets Clients / Nouveau */}
      <Modal
        isVisible={clientModalVisible}
        onBackdropPress={() => {
          setClientModalVisible(false)
          setShowClientForm(false)
        }}
        onBackButtonPress={() => {
          setClientModalVisible(false)
          setShowClientForm(false)
        }}
        backdropOpacity={0.7}
      >
        <View style={styles.clientModal}>
          <Text style={styles.modalTitle}>Client</Text>

          <View style={styles.clientTabs}>
            <TouchableOpacity
              style={[styles.clientTab, !showClientForm && styles.clientTabActive]}
              onPress={() => setShowClientForm(false)}
            >
              <Text style={[styles.clientTabText, !showClientForm && styles.clientTabTextActive]}>
                Clients
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.clientTab, showClientForm && styles.clientTabActive]}
              onPress={() => {
                setSelectedClient(null)
                setShowClientForm(true)
              }}
            >
              <Text style={[styles.clientTabText, showClientForm && styles.clientTabTextActive]}>
                Nouveau
              </Text>
            </TouchableOpacity>
          </View>

          {!showClientForm ? (
            <>
              {clientsLoading ? (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{ marginVertical: 24 }}
                />
              ) : (
                <FlatList
                  data={clients}
                  keyExtractor={(item) => String(item.id)}
                  style={{ maxHeight: 300, width: '100%' }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.clientItemPro,
                        selectedClient?.id === item.id && styles.clientItemSelected,
                      ]}
                      onPress={() => setSelectedClient(item)}
                    >
                      <Text style={styles.clientName}>{item.nom_customer || '-'}</Text>
                      <Text style={styles.clientPhone}>{item.telephone || ''}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={{ color: COLORS.muted, paddingVertical: 16 }}>Aucun client</Text>
                  }
                />
              )}
            </>
          ) : (
            <ScrollView
              style={{ width: '100%' }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                placeholder="Nom client *"
                placeholderTextColor={COLORS.muted}
                style={styles.inputPro}
                value={clientForm.nom_customer}
                onChangeText={(t) => setClientForm({ ...clientForm, nom_customer: t })}
              />
              <TextInput
                placeholder="Téléphone"
                placeholderTextColor={COLORS.muted}
                style={styles.inputPro}
                value={clientForm.telephone}
                onChangeText={(t) => setClientForm({ ...clientForm, telephone: t })}
                keyboardType="phone-pad"
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor={COLORS.muted}
                style={styles.inputPro}
                value={clientForm.email}
                onChangeText={(t) => setClientForm({ ...clientForm, email: t })}
                keyboardType="email-address"
              />
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.payButtonModal}
            onPress={finalizeSale}
            disabled={creating || (!selectedClient && !clientForm.nom_customer?.trim())}
          >
            {creating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.payButtonText}>FINALISER LE PAIEMENT</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 🔥 MODAL REÇU DE VENTE */}
      <Modal
        isVisible={receiptModalVisible}
        onBackdropPress={() => setReceiptModalVisible(false)}
        onBackButtonPress={() => setReceiptModalVisible(false)}
        backdropOpacity={0.7}
        style={{ margin: 16 }}
      >
        <View style={styles.receiptModal}>
          <Text style={styles.receiptModalTitle}>Reçu de vente</Text>
          {lastSaleId ? (
            <>
              <View style={styles.receiptWebViewWrap}>
                <WebView
                  source={{ uri: `${RECEIPT_BASE_URL}${lastSaleId}` }}
                  style={styles.receiptWebView}
                  scrollEnabled
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.receiptLoading}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  )}
                />
              </View>
              <TouchableOpacity
                style={styles.receiptPrintButton}
                onPress={() => Linking.openURL(`${recu_impression}${lastSaleId}`)}
              >
                <Printer size={20} color={COLORS.white} />
                <Text style={styles.receiptPrintText}>Imprimer</Text>
              </TouchableOpacity>
            </>
          ) : null}
          <TouchableOpacity
            style={[styles.receiptPrintButton, { backgroundColor: COLORS.border, marginTop: 8 }]}
            onPress={() => setReceiptModalVisible(false)}
          >
            <Text style={[styles.receiptPrintText, { color: COLORS.text }]}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginTop: 12,
    gap: 8,
  },
  scanButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  scanButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  searchLoadingText: {
    color: COLORS.muted,
    fontWeight: '600'
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  categories: {
    paddingVertical: 14,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  productRow: {
    gap: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  productsContent: {
    paddingBottom: 140,
    paddingHorizontal: 16,
  },
  productItem: {
    width: '48%',
  },
  productCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 10,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  productName: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 14,
    color: "#3d3d3d",
  },
  price: {
    marginTop: 6,
    fontWeight: '700',
    color: "#000000",
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.muted,
    paddingVertical: 24,
  },
  cartActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  cartActionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  cartActionDanger: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  cartActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  cartActionTextDanger: {
    color: COLORS.danger,
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    padding: 14,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItems: {
    fontSize: 13,
    color: COLORS.muted,
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 14,
  },
  payText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles pour les modals react-native-modal
  modalCardPro: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  modalImagePro: {
    width: 150,
    height: 150,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
  },
  priceBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  priceBadgeText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  modalTitlePro: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.text,
    marginVertical: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 16,
  },
  qtyBtnPro: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyTextPro: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  qtyDisplay: {
    width: 60,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyDisplayText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  addBtnPro: {
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    minWidth: 120,
  },
  addTextPro: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  clientItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  clientItemSelected: {
    backgroundColor: COLORS.primary + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  clientModal: {
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 22,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
  },
  clientTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  clientTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  clientTabActive: {
    backgroundColor: COLORS.primary,
  },
  clientTabText: {
    fontWeight: '700',
    color: COLORS.muted,
  },
  clientTabTextActive: {
    color: COLORS.white,
  },
  clientItemPro: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  clientName: {
    fontWeight: '700',
    color: COLORS.text,
  },
  clientPhone: {
    fontSize: 13,
    color: COLORS.muted,
  },
  inputPro: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  payButtonModal: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  receiptModal: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  receiptModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
  },
  receiptWebViewWrap: {
    height: Dimensions.get('window').height * 0.5,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
  },
  receiptWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  receiptLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  receiptPrintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  receiptPrintText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
})