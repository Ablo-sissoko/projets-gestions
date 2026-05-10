import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Dimensions,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import BottomSheet, { BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet'
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

/** POST relatif à api baseURL — URL complète : https://deegipay.com/backend_pos/api/v1/sellprox/clients/create */
const SELLPROX_CLIENTS_CREATE = '/sellprox/clients/create'

/** Hauteur max de la carte client (centrée à l’écran) */
const CLIENT_MODAL_SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.78)



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

const ProductCard = React.memo(function ProductCard({ item, inCart, onAdd, onRemove }) {
  return (
    <View style={styles.productItem}>
      <View style={styles.productCard}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onAdd(item)}
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
            onPress={() => onAdd(item)}
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
              onPress={() => onRemove(item)}
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
  const [clientListSearch, setClientListSearch] = useState('')
  // 🔥 MODAL pour le scanner intégré
  const [cameraPermission, requestPermission] = useCameraPermissions()
  const [scannerVisible, setScannerVisible] = useState(false)
  const [scannedProductsList, setScannedProductsList] = useState([])
  const [isScanning, setIsScanning] = useState(true)

  const [clientForm, setClientForm] = useState({
    nom_entreprise: "",
    nom_customer: "",
    telephone: "",
    email: "",
    adresse: "",
  })
  const [receiptModalVisible, setReceiptModalVisible] = useState(false)
  const [lastSaleId, setLastSaleId] = useState(null)
  const [fastClientName, setFastClientName] = useState('')
  const [fastPhone, setFastPhone] = useState('')
  const [fastCreating, setFastCreating] = useState(false)

  const scannerSheetRef = useRef(null)
  const receiptSheetRef = useRef(null)
  const fastSheetRef = useRef(null)
  const scannerSnapPoints = useMemo(() => ['85%'], [])
  const receiptSnapPoints = useMemo(() => ['90%'], [])
  const fastSnapPoints = useMemo(() => ['50%'], [])



  useEffect(() => {
    if (route.params?.barcode) {
      addScannedProductByBarcode(route.params.barcode)
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
      setClientListSearch('')
      fetchClients()
    }
  }, [clientModalVisible, fetchClients])

  const filteredClients = useMemo(() => {
    const q = clientListSearch.trim().toLowerCase()
    if (!q) return clients
    const qq = q.replace(/\s/g, '')
    return clients.filter((c) => {
      const name = String(c.nom_customer || '').toLowerCase()
      const phone = String(c.telephone || '').toLowerCase().replace(/\s/g, '')
      const email = String(c.email || '').toLowerCase()
      const ent = String(c.nom_entreprise || '').toLowerCase()
      return (
        name.includes(q) ||
        phone.includes(qq) ||
        email.includes(q) ||
        ent.includes(q)
      )
    })
  }, [clients, clientListSearch])

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

  const addScannedProductByBarcode = async (barcode) => {
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
        barcode,
        scannedAt: new Date().toISOString(),
      }

      setScannedProductsList((prev) => {
        const existing = prev.find((p) => p.id === formatted.id)
        if (existing) {
          return prev.map((p) =>
            p.id === formatted.id
              ? { ...p, qty: (p.qty || 1) + 1 }
              : p
          )
        }
        return [...prev, { ...formatted, qty: 1 }]
      })

      Toast.show({
        type: 'success',
        text1: 'Produit scanné',
        text2: `${formatted.name} ajouté à la liste`,
      })
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
    if (!isScanning) return
    setIsScanning(false)

    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setIsScanning(true)
      return
    }

    try {
      await addScannedProductByBarcode(data)
    } finally {
      setTimeout(() => {
        setIsScanning(true)
      }, 1500)
    }
  }

  const addScannedToCart = (scannedProduct) => {
    addToCart(scannedProduct)
    setScannedProductsList((prev) => prev.filter((p) => p.id !== scannedProduct.id))
    Toast.show({
      type: 'success',
      text1: 'Ajouté au panier',
      text2: `${scannedProduct.name} a été ajouté au panier`,
    })
  }

  const addAllScannedToCart = () => {
    scannedProductsList.forEach((product) => {
      for (let i = 0; i < (product.qty || 1); i += 1) {
        addToCart(product)
      }
    })
    const totalAdded = scannedProductsList.reduce(
      (sum, p) => sum + (p.qty || 1),
      0
    )
    setScannedProductsList([])
    setScannerVisible(false)
    Toast.show({
      type: 'success',
      text1: 'Succès',
      text2: `${totalAdded} produit(s) ajouté(s) au panier`,
    })
  }

  const removeScannedProduct = (productId) => {
    setScannedProductsList((prev) => prev.filter((p) => p.id !== productId))
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

  const renderItem = useCallback(({ item }) => {
    const inCart = cartMap[item.id]
    return (
      <ProductCard
        item={item}
        inCart={inCart}
        onAdd={addToCart}
        onRemove={removeFromCart}
      />
    )
  }, [cartMap, addToCart, removeFromCart])

  useEffect(() => {
    if (scannerVisible) {
      scannerSheetRef.current?.expand()
    } else {
      scannerSheetRef.current?.close()
    }
  }, [scannerVisible])

  useEffect(() => {
    if (receiptModalVisible) {
      receiptSheetRef.current?.expand()
    } else {
      receiptSheetRef.current?.close()
    }
  }, [receiptModalVisible])

  const handleScannerSheetChange = useCallback((index) => {
    if (index === -1) {
      setScannerVisible(false)
      setScannedProductsList([])
      setIsScanning(true)
    }
  }, [])

  const closeClientModal = useCallback(() => {
    setClientModalVisible(false)
    setShowClientForm(false)
    setClientListSearch('')
  }, [])

  const handleReceiptSheetChange = useCallback((index) => {
    if (index === -1) {
      setReceiptModalVisible(false)
    }
  }, [])

  const handlePay = () => {
    if (!cart.length){
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Ajoutez au moins un produit au panier' })
      return
    }
    setClientModalVisible(true)
  }

  const handleFastPay = () => {
    if (!cart.length) {
      Toast.show({
        type: 'error',
        text1: 'Panier vide',
      })
      return
    }
    fastSheetRef.current?.expand()
  }

  const submitFastSale = async () => {
    try {
      setFastCreating(true)
      const entreprise_id = user?.entreprise_id
      if (!entreprise_id || !user?.id) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Session expirée. Veuillez vous reconnecter.',
        })
        return
      }

      const now = new Date()
      const date = now.toISOString().slice(0, 19).replace('T', ' ')

      const payload = {
        entreprise_id,
        client_name: fastClientName || 'Client rapide',
        phone: fastPhone || '',
        proforma_id: "1",
        employee_id: user?.id,
        employee_name: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        date,
        items: cart.map(item => ({
          id: Number(item.id),
          nom: item.name,
          prix: Number(item.price),
          quantity: item.qty
        }))
      }

      const response = await api.post('/sellprox/vente/encaissement/create', payload)
      const ok = response.data?.status === 1 || response.status === 200

      if (ok) {
        Toast.show({
          type: 'success',
          text1: 'Vente rapide effectuée 🚀',
        })
        setCart([])
        setFastClientName('')
        setFastPhone('')
        fastSheetRef.current?.close()
      } else {
        throw new Error(response.data?.msg || 'Erreur lors de la vente rapide')
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message,
      })
    } finally {
      setFastCreating(false)
    }
  }

  const finalizeSale = async () => {
    if (!selectedClient && !showClientForm) {
      Toast.show({
        type: 'error',
        text1: 'Client requis',
        text2: 'Sélectionnez un client dans la liste ou utilisez l’onglet Nouveau.',
      })
      return
    }
    if (showClientForm && !selectedClient) {
      if (!clientForm.nom_customer?.trim() || !clientForm.telephone?.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Client incomplet',
          text2: 'Indiquez au minimum le nom et le téléphone.',
        })
        return
      }
    }

    setCreating(true)
    try {
      const entreprise_id = user?.entreprise_id
      const user_id = user?.id
      if (!user_id || !entreprise_id) {
        setCreating(false)
        return
      }

      let saleClient = selectedClient
      if (showClientForm && !selectedClient) {
        try {
          const createPayload = {
            entreprise_id,
            nom_entreprise: clientForm.nom_entreprise?.trim() || '',
            nom_customer: clientForm.nom_customer.trim(),
            email: clientForm.email?.trim() || '',
            telephone: clientForm.telephone.trim(),
            adresse: clientForm.adresse?.trim() || '',
            user_id,
           
          }
          const createRes = await api.post(SELLPROX_CLIENTS_CREATE, createPayload)

          console.log(createRes.data)
          
          const createOk =
            createRes.data?.status === 1 ||
            createRes.data?.status === 200 ||
            createRes.data?.status === true ||
            createRes.status === 200
          if (!createOk) {
            Toast.show({
              type: 'error',
              text1: 'Création client',
              text2: createRes.data?.msg || createRes.data?.message || 'Impossible d’enregistrer le client',
            })
            return
          }
          const raw = createRes.data?.resultat ?? createRes.data?.client ?? createRes.data?.data
          saleClient = {
            id: raw?.id ?? raw?.client_id,
            nom_customer: clientForm.nom_customer.trim(),
            email: clientForm.email?.trim() || '',
            telephone: clientForm.telephone.trim(),
          }
          fetchClients()
        } catch (err) {
          Toast.show({
            type: 'error',
            text1: 'Création client',
            text2: err.response?.data?.message || err.response?.data?.msg || err.message || 'Erreur serveur',
          })
          return
        }
      }

      const employeeName = `${user?.prenom || ''} ${user?.nom || ''}`.trim()

      const now = new Date()
      const date = now.toISOString().slice(0, 19).replace('T', ' ')

      const payload = {
        client_name: saleClient?.nom_customer ?? clientForm.nom_customer ?? '',
        email: saleClient?.email ?? clientForm.email ?? '',
        phone: saleClient?.telephone ?? clientForm.telephone ?? '',
        proforma_id: '1',
        user_id,
        employee_id: user_id,
        employee_name: employeeName || '',
        entreprise_id,
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
        renderItem={renderItem}
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

        <View style={styles.cartActionsRow}>
          <TouchableOpacity
            style={styles.fastPayButton}
            onPress={handleFastPay}
          >
            <Text style={styles.fastPayTextSmall}>⚡ Vente rapide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePay}
            disabled={creating || !cart.length}
          >
            <Text style={styles.payText}>PAYER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔥 BOTTOM SHEET SCANNER */}
      <BottomSheet
        ref={scannerSheetRef}
        index={-1}
        snapPoints={scannerSnapPoints}
        enablePanDownToClose
        onChange={handleScannerSheetChange}
      >
        <BottomSheetView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View style={styles.cameraContainer}>
            {scannerVisible && cameraPermission?.granted ? (
              <CameraView
                style={styles.cameraView}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["ean13", "ean8", "code128", "qr"],
                }}
                onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
              />
            ) : (
              <View style={styles.center}>
                <Text style={styles.cameraPermissionText}>
                  Permission caméra requise
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                  <Text style={styles.permissionButtonText}>Autoriser</Text>
                </TouchableOpacity>
              </View>
            )}

            {isScanning && scannerVisible && (
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanText}>Scannez un code-barres</Text>
              </View>
            )}
          </View>

          <View style={styles.scannedListContainer}>
            <View style={styles.scannedListHeader}>
              <Text style={styles.scannedListTitle}>
                Produits scannés ({scannedProductsList.reduce((sum, p) => sum + (p.qty || 1), 0)})
              </Text>
              {scannedProductsList.length > 0 && (
                <TouchableOpacity onPress={() => setScannedProductsList([])}>
                  <Text style={styles.clearAllText}>Tout effacer</Text>
                </TouchableOpacity>
              )}
            </View>

            {scannedProductsList.length === 0 ? (
              <View style={styles.emptyScannedList}>
                <QrCode size={48} color={COLORS.muted} />
                <Text style={styles.emptyScannedText}>
                  Scannez des produits pour les voir apparaître ici
                </Text>
              </View>
            ) : (
              <FlatList
                data={scannedProductsList}
                keyExtractor={(item) => `${item.id}-${item.scannedAt}`}
                style={styles.scannedList}
                renderItem={({ item }) => (
                  <View style={styles.scannedItem}>
                    <Image
                      source={{ uri: item.image || 'https://via.placeholder.com/50' }}
                      style={styles.scannedItemImage}
                    />
                    <View style={styles.scannedItemInfo}>
                      <Text style={styles.scannedItemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.scannedItemPrice}>
                        {item.price.toLocaleString()} FCFA
                      </Text>
                      <View style={styles.scannedItemQty}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => {
                            setScannedProductsList((prev) =>
                              prev
                                .map((p) =>
                                  p.id === item.id && (p.qty || 1) > 1
                                    ? { ...p, qty: (p.qty || 1) - 1 }
                                    : p
                                )
                                .filter((p) => (p.qty || 1) > 0)
                            )
                          }}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{item.qty || 1}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => {
                            setScannedProductsList((prev) =>
                              prev.map((p) =>
                                p.id === item.id
                                  ? { ...p, qty: (p.qty || 1) + 1 }
                                  : p
                              )
                            )
                          }}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.scannedItemActions}>
                      <TouchableOpacity
                        style={styles.addSingleButton}
                        onPress={() => addScannedToCart(item)}
                      >
                        <Text style={styles.addSingleButtonText}>Ajouter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeScannedProduct(item.id)}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            {scannedProductsList.length > 0 && (
              <View style={styles.scannerActions}>
                <TouchableOpacity
                  style={[styles.scannerActionButton, styles.addAllButton]}
                  onPress={addAllScannedToCart}
                >
                  <ShoppingCart size={20} color={COLORS.white} />
                  <Text style={styles.scannerActionText}>
                    Ajouter tout ({scannedProductsList.reduce((sum, p) => sum + (p.qty || 1), 0)})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scannerActionButton, styles.continueScanButton]}
                  onPress={() => {
                    Toast.show({
                      type: 'info',
                      text1: 'Scan continu',
                      text2: 'Continuez à scanner des produits',
                    })
                  }}
                >
                  <QrCode size={20} color={COLORS.primary} />
                  <Text style={[styles.scannerActionText, { color: COLORS.primary }]}>
                    Scanner plus
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => setScannerVisible(false)}
            >
              <Text style={styles.closeScannerText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Modal choix client — liste scrollable, bouton finaliser fixe en bas */}
      <Modal
        visible={clientModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeClientModal}
      >
        <View style={styles.clientRnModalOuter}>
          <Pressable style={styles.clientRnModalBackdrop} onPress={closeClientModal} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.clientRnModalSheetWrap,
              showClientForm ? styles.clientRnModalSheetWrapCompact : styles.clientRnModalSheetWrapExpanded,
            ]}
          >
            <View
              style={[
                styles.clientRnModalInner,
                !showClientForm && styles.clientRnModalInnerExpanded,
              ]}
            >
              <View style={styles.clientModalHeader}>
                <View style={styles.clientModalTitleRow}>
                  <Text style={styles.modalTitle}>Client</Text>
                  <TouchableOpacity onPress={closeClientModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.clientModalClose}>Fermer</Text>
                  </TouchableOpacity>
                </View>

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
                      setClientListSearch('')
                      setShowClientForm(true)
                    }}
                  >
                    <Text style={[styles.clientTabText, showClientForm && styles.clientTabTextActive]}>
                      Nouveau
                    </Text>
                  </TouchableOpacity>
                </View>

                {!showClientForm ? (
                  <View style={styles.clientSearchRow}>
                    <Search size={18} color={COLORS.muted} />
                    <TextInput
                      placeholder="Rechercher un client (nom, tél., e-mail)…"
                      placeholderTextColor={COLORS.muted}
                      style={styles.clientSearchInput}
                      value={clientListSearch}
                      onChangeText={setClientListSearch}
                      autoCapitalize="none"
                      autoCorrect={false}
                      clearButtonMode="while-editing"
                    />
                  </View>
                ) : null}

                {!showClientForm && clientsLoading ? (
                  <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                    style={{ marginVertical: 24 }}
                  />
                ) : null}

                {showClientForm ? (
                  <View style={{ width: '100%' }}>
                    <TextInput
                      placeholder="Nom client *"
                      placeholderTextColor={COLORS.muted}
                      style={styles.inputPro}
                      value={clientForm.nom_customer}
                      onChangeText={(t) => setClientForm({ ...clientForm, nom_customer: t })}
                    />
                    <TextInput
                      placeholder="Téléphone *"
                      placeholderTextColor={COLORS.muted}
                      style={styles.inputPro}
                      value={clientForm.telephone}
                      onChangeText={(t) => setClientForm({ ...clientForm, telephone: t })}
                      keyboardType="phone-pad"
                    />
                    <TextInput
                      placeholder="Email (facultatif)"
                      placeholderTextColor={COLORS.muted}
                      style={styles.inputPro}
                      value={clientForm.email}
                      onChangeText={(t) => setClientForm({ ...clientForm, email: t })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                ) : null}
              </View>

              {!showClientForm ? (
                <FlatList
                  data={filteredClients}
                  keyExtractor={(item, index) => String(item?.id ?? index)}
                  keyboardShouldPersistTaps="handled"
                  style={styles.clientSheetList}
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
                    !clientsLoading ? (
                      <Text style={{ color: COLORS.muted, paddingVertical: 16, textAlign: 'center' }}>
                        {clients.length === 0
                          ? 'Aucun client'
                          : clientListSearch.trim()
                            ? 'Aucun client ne correspond à votre recherche'
                            : 'Aucun client'}
                      </Text>
                    ) : null
                  }
                />
              ) : null}

              <View
                style={[
                  styles.clientSheetFooter,
                  showClientForm && styles.clientSheetFooterCompact,
                ]}
              >
                <TouchableOpacity
                  style={styles.payButtonModalFooter}
                  onPress={finalizeSale}
                  disabled={
                    creating ||
                    !(
                      selectedClient ||
                      (showClientForm &&
                        clientForm.nom_customer?.trim() &&
                        clientForm.telephone?.trim())
                    )
                  }
                >
                  {creating ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.payButtonText}>FINALISER LE PAIEMENT</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 🔥 BOTTOM SHEET REÇU DE VENTE */}
      <BottomSheet
        ref={receiptSheetRef}
        index={-1}
        snapPoints={receiptSnapPoints}
        enablePanDownToClose
        onChange={handleReceiptSheetChange}
      >
        <BottomSheetFlatList
          data={[]}
          keyExtractor={(_, index) => String(index)}
          renderItem={null}
          ListHeaderComponent={
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
          }
        />
      </BottomSheet>

      {/* ⚡ BOTTOM SHEET VENTE RAPIDE */}
      <BottomSheet
        ref={fastSheetRef}
        index={-1}
        snapPoints={fastSnapPoints}
        enablePanDownToClose
      >
        <BottomSheetFlatList
          data={[]}
          keyExtractor={(_, index) => String(index)}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.fastContainer}>
              <Text style={styles.fastTitle}>Vente rapide</Text>

              <TextInput
                placeholder="Nom client (optionnel)"
                value={fastClientName}
                onChangeText={setFastClientName}
                style={styles.fastInput}
                placeholderTextColor={COLORS.muted}
              />

              <TextInput
                placeholder="Téléphone"
                value={fastPhone}
                onChangeText={setFastPhone}
                style={styles.fastInput}
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
              />

              <View style={styles.fastTotalBox}>
                <Text style={styles.fastTotalLabel}>Total</Text>
                <Text style={styles.fastTotalValue}>
                  {Number(total || 0).toLocaleString()} FCFA
                </Text>
              </View>

              <TouchableOpacity
                style={styles.fastPayBtn}
                onPress={submitFastSale}
                disabled={fastCreating}
              >
                {fastCreating ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.fastPayText}>Encaisser</Text>
                )}
              </TouchableOpacity>
            </View>
          }
        />
      </BottomSheet>
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
  cartActionsRow: {
    flexDirection: 'row',
    gap: 8,
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
  fastPayButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  payText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  fastPayTextSmall: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    height: Dimensions.get('window').height * 0.4,
    backgroundColor: COLORS.black,
    position: 'relative',
  },
  cameraView: {
    flex: 1,
  },
  cameraPermissionText: {
    color: COLORS.white,
    marginBottom: 16,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanText: {
    position: 'absolute',
    bottom: 20,
    color: COLORS.white,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
  },
  scannedListContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  scannedListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scannedListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearAllText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyScannedList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyScannedText: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 14,
  },
  scannedList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scannedItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  scannedItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
  },
  scannedItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scannedItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  scannedItemPrice: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  scannedItemQty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 24,
    textAlign: 'center',
  },
  scannedItemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addSingleButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSingleButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  scannerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  scannerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addAllButton: {
    backgroundColor: COLORS.primary,
  },
  continueScanButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  scannerActionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  closeScannerButton: {
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeScannerText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
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
  clientRnModalOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  clientRnModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  clientRnModalSheetWrap: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  /** Onglet Clients : hauteur fixe pour la liste scrollable */
  clientRnModalSheetWrapExpanded: {
    height: CLIENT_MODAL_SHEET_HEIGHT,
  },
  /** Onglet Nouveau : hauteur suivant le contenu (plafonnée) */
  clientRnModalSheetWrapCompact: {
    maxHeight: CLIENT_MODAL_SHEET_HEIGHT,
  },
  clientRnModalInner: {
    flexDirection: 'column',
  },
  clientRnModalInnerExpanded: {
    flex: 1,
  },
  clientModalHeader: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 8,
  },
  clientModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  clientModalClose: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.muted,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 0,
  },
  clientSheetList: {
    flex: 1,
  },
  clientSheetFooter: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  clientSheetFooterCompact: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  payButtonModalFooter: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  clientTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  clientSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: COLORS.bg,
    gap: 10,
  },
  clientSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
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
  fastContainer: {
    padding: 20,
  },
  fastTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  fastInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    marginBottom: 12,
    fontSize: 15,
  },
  fastTotalBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fastTotalLabel: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  fastTotalValue: {
    color: COLORS.text,
    fontWeight: '800',
  },
  fastPayBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  fastPayText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
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