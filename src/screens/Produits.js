import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
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
  Image,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Modal as RNModal,
  Alert,
} from 'react-native'
import Modal from 'react-native-modal'
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { Dropdown } from 'react-native-element-dropdown'
import {
  Search,
  Filter,
  Plus,
  Package,
  Layers,
  CheckCircle,
  XCircle,
  DollarSign,
  Camera,
  QrCode,
  Eye,
  Pencil,
} from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import Header from '../componants/Header'
import { AuthContext } from '../context/AuthContext'
import api from '../api/Axios'
import LoadingScreen from '../componants/LoadingScreen'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import { CameraView, useCameraPermissions } from "expo-camera"
import COLORS from '../constants/couleurs'

/** POST relatif à api baseURL — URL complète : …/sellprox/encaissement/services/create/new */
const SELLPROX_SERVICE_CREATE_NEW = '/sellprox/encaissement/services/create/new'

const sellproxProductLogoUpdatePath = (productId) =>
  `/sellprox/product/update/logo/${productId}`

/* ===================== COMPOSANT HEADER LISTE ===================== */
const ListHeaderComponent = React.memo(({
  title,
  subtitle,
  onAddPress,
  searchQuery,
  onSearchChange,
  onFilterPress,
  searchLoading,
  mode,
  onModeChange
}) => {
  return (
    <>
      <View style={styles.headerRow}>
    <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
    </View>

        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.muted} />
          <TextInput
            placeholder={mode === 'service' ? 'Rechercher un service...' : 'Rechercher un produit...'}
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={onFilterPress}>
          <Filter size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {searchLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : null}

    </>
  )
})

/* ===================== COMPOSANT PRINCIPAL ===================== */
const Products = () => {
  const { user } = useContext(AuthContext)
  const [products, setProducts] = useState([])
  const [mode, setMode] = useState('product')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterForm, setFilterForm] = useState({
    nom: '',
    id_category: '',
    id_product: '',
    code_barre: '',
  })
  const [categoriesList, setCategoriesList] = useState([])
  const [unitsList, setUnitsList] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [viewProduct, setViewProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editMode, setEditMode] = useState('add')
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [form, setForm] = useState({
    id: '',
    product_name: '',
    description: '',
    prix_achat: '',
    price: '',
    category_id: '',
    stock: '',
    stock_min: '',
    code_barre: '',
    unite_product: '',
    image: null,
    /** Aperçu uniquement (édition produit), pas un fichier à envoyer avec /product/update */
    imageUrlExisting: '',
    entreprise_id: '',
    user_id: '',
  })

  // Modals visibility

  // Scanner states
  const [cameraPermission, requestPermission] = useCameraPermissions()
  const [scannerVisible, setScannerVisible] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [scanningForField, setScanningForField] = useState(null)

  const bottomSheetRef = useRef(null)
  const filterSheetRef = useRef(null)
  const deleteSheetRef = useRef(null)
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
    refreshProducts(1, false, false)
  }, [user?.entreprise_id])

  useFocusEffect(
    useCallback(() => {
      const id = user?.entreprise_id
      if (!id) return
      fetchCategories()
      fetchUnits()
    }, [user?.entreprise_id])
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshProducts(1, false, true)
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery, filter, filterForm])

  const refreshProducts = async (page = 1, append = false, isSearch = false) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    if (isSearch) {
      setSearchLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const query = searchQuery.trim()
      const response = await api.post('/sellprox/product/search', {
        totalPage: String(page),
        nom: filterForm.nom || query || '',
        id_category: filterForm.id_category || '',
        id_product: filterForm.id_product || '',
        code_barre: filterForm.code_barre || '',
        entreprise_id,
      })

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []

      const formatted = results.map((item) => ({
        id: String(item.id),
        productName: item.product_name || '-',
        category: item.category_name || '-',
        category_slug: item.category_slug || '-',
        price: Number(item.price) || 0,
        prix_achat: item.prix_achat,
        stock: Number(item.stock) || 0,
        stock_min: item.stock_min,
        status: item.status === 1 ? 'Activé' : 'Désactivé',
        description: item.description,
        code_barre: item.code_barre,
        unite_product: item.unite_product,
        category_id: item.category_id ? String(item.category_id) : '',
        img_url: item.img_url,
        img_name: item.img_name,
        img_original_name: item.img_original_name,
        img_size: item.img_size,
        taux_marge: item.taux_marge,
        types: item.types,

      }))


      const nextPage = Number(response.data?.currentPage || page)
      const nextTotal = Number(response.data?.totalPages || 1)

      setCurrentPage(nextPage)
      setTotalPages(nextTotal)
      setProducts((prev) => (append ? [...prev, ...formatted] : formatted))
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les produits',
      })
      throw error
    } finally {
      setInitialLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      setCategoriesLoading(false)
      return
    }
    try {
      const response = await api.get(`/sellprox/categories/read/${entreprise_id}`)
      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []
      const formatted = results.map((item) => ({
        id: String(item.id),
        name: item.nom || item.name || `Catégorie ${item.id}`,
      }))
      setCategoriesList(formatted)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les catégories',
      })
    } finally {
      setCategoriesLoading(false)
    }
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Nom de catégorie requis',
      })
      return
    }
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    setCreatingCategory(true)
    try {
      const response = await api.post('/sellprox/categories/create', {
        entreprise_id,
        category_name: newCategoryName,
      })
      const ok = response.data?.status === 1 || response.data?.status === true
      if (ok) {
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Catégorie créée',
        })
        const newCat = response.data?.resultat
        setNewCategoryName('')
        setCategoryModalVisible(false)
        await fetchCategories()
        if (newCat?.id) {
          setForm(prev => ({ ...prev, category_id: String(newCat.id) }))
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: response.data?.msg || 'Erreur création',
        })
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message,
      })
    } finally {
      setCreatingCategory(false)
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await api.get('/sellprox/product/unite/read')
      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : []
      const formatted = results.map((item) => ({
        id: String(item.id),
        name: item.nom_court || item.nom || `Unité ${item.id}`,
      }))
      setUnitsList(formatted)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les unités',
      })
    }
  }

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return
    if (currentPage >= totalPages) return
    refreshProducts(currentPage + 1, true, false)
  }, [loadingMore, currentPage, totalPages])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshProducts(1, false, false)
      await Promise.all([fetchCategories(), fetchUnits()])
      Toast.show({
        type: 'success',
        text1: 'Liste actualisée',
        text2: 'Produits et catégories à jour',
      })
    } catch (_) { }
    finally {
      setRefreshing(false)
    }
  }, [filterForm, searchQuery])

  const openFilters = useCallback(() => {
    filterSheetRef.current?.expand()
  }, [])

  const resetFilters = useCallback(() => {
    setFilterForm({
      nom: '',
      id_category: '',
      id_product: '',
      code_barre: '',
    })
    setFilter('all')
    filterSheetRef.current?.close()
    refreshProducts(1, false, true)
  }, [])

  const applyFilters = useCallback(() => {
    filterSheetRef.current?.close()
    refreshProducts(1, false, true)
  }, [])

  const filteredProducts = useMemo(() => {
    if (filter === 'available') {
      return products.filter((p) => p.status === 'Disponible')
    }
    if (filter === 'out') {
      return products.filter((p) => p.status === 'Rupture')
    }
    return products
  }, [products, filter])

  const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/400x400.png?text=Image'

  const getProductImageUrl = useCallback((product) => {
    const base = String(product?.img_url || '').trim()
    const name = String(product?.img_name || '').trim()

    if (!base) return IMAGE_PLACEHOLDER

    if (base.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return base
    }

    if (name) {
      return `${base}${name}`
    }

    return IMAGE_PLACEHOLDER
  }, [])

  const openAdd = useCallback(() => {
    setEditMode('add')
    setForm({
      id: '',
      product_name: '',
      description: '',
      prix_achat: '',
      price: '',
      category_id: '',
      stock: '',
      stock_min: '',
      code_barre: '',
      unite_product: '',
      image: null,
      imageUrlExisting: '',
      entreprise_id: '',
      user_id: '',
    })

    bottomSheetRef.current?.expand()


  }, [])

  const openEdit = useCallback((product) => {
    setEditMode('edit')
    const previewUrl = getProductImageUrl(product)
    setForm({
      id: product.id,
      product_name: product.productName === '-' ? '' : product.productName,
      description: product.description || '',
      prix_achat: product.prix_achat ? String(product.prix_achat) : '',
      price: product.price ? String(product.price) : '',
      category_id: product.category_id || '',
      stock: String(product.stock ?? ''),
      stock_min: product.stock_min ? String(product.stock_min) : '',
      code_barre: product.code_barre || '',
      unite_product: product.unite_product || '',
      image: null,
      imageUrlExisting: previewUrl !== IMAGE_PLACEHOLDER ? previewUrl : '',
      entreprise_id: user?.entreprise_id ?? '',
      user_id: user?.id ?? '',
    })
    bottomSheetRef.current?.expand()
  }, [user, getProductImageUrl])

  const productImagePickerOptions = {
    mediaType: 'photo',
    includeBase64: false,
    maxHeight: 1000,
    maxWidth: 1000,
    quality: 0.8,
  }

  const onProductImagePickerResult = useCallback((response) => {
    if (response.didCancel) return
    const errMsg = response.errorMessage || response.error
    if (response.errorCode || errMsg) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errMsg || 'Impossible d\'obtenir l\'image (caméra ou galerie).',
      })
      return
    }
    if (!response.assets?.length) return
    const asset = response.assets[0]
    const fileName =
      asset.fileName || asset.uri?.split('/').pop() || `photo_${Date.now()}.jpg`
    const mimeType = asset.type || 'image/jpeg'
    setForm((prev) => ({
      ...prev,
      image: {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      },
    }))
  }, [])

  const openProductImageGallery = useCallback(() => {
    launchImageLibrary(
      { ...productImagePickerOptions, selectionLimit: 1 },
      onProductImagePickerResult
    )
  }, [onProductImagePickerResult])

  const openProductImageCamera = useCallback(() => {
    launchCamera(productImagePickerOptions, onProductImagePickerResult)
  }, [onProductImagePickerResult])

  const pickProductImage = useCallback(() => {
    Alert.alert(
      'Image du produit',
      'Prendre une photo ou choisir une image dans la galerie.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Galerie', onPress: openProductImageGallery },
        { text: 'Appareil photo', onPress: openProductImageCamera },
      ]
    )
  }, [openProductImageGallery, openProductImageCamera])

  // Gestionnaire de scan pour le code barre
  const handleBarCodeScanned = useCallback(async ({ data }) => {
    if (scanned) return

    setScanned(true)

    if (scanningForField === 'code_barre') {
      setForm(prev => ({ ...prev, code_barre: data }))
    }

    setTimeout(() => {
      setScannerVisible(false)
      setScanned(false)
      setScanningForField(null)
    }, 500)
  }, [scanned, scanningForField])

  const openScanner = useCallback((field) => {
    setScanningForField(field)
    setScannerVisible(true)
  }, [])

  const saveProduct = async () => {
    if (!form.product_name || !form.category_id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez remplir tous les champs obligatoires',
      })
      return
    }

    const entreprise_id = user?.entreprise_id
    const user_id = user?.id
    if (!entreprise_id || !user_id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Session expirée. Veuillez vous reconnecter.',
      })
      return
    }

    const buildImageFile = () => {
      if (!form.image?.uri) return null
      return {
        uri: Platform.OS === 'ios' ? form.image.uri.replace('file://', '') : form.image.uri,
        name: form.image.name || `photo_${Date.now()}.jpg`,
        type: form.image.type || 'image/jpeg',
      }
    }

    try {
      const formData = new FormData()

      if (editMode === 'add') {
        const imageFile = buildImageFile()
        if (imageFile) formData.append('image', imageFile)
      }

      formData.append('entreprise_id', String(entreprise_id))
      formData.append('user_id', String(user_id))
      formData.append('product_name', String(form.product_name))
      formData.append('description', String(form.description || ''))
      formData.append('prix_achat', String(form.prix_achat || '0'))
      formData.append('price', String(form.price || '0'))
      formData.append('category_id', String(form.category_id))
      formData.append('stock', String(form.stock || '0'))
      formData.append('stock_min', String(form.stock_min || '0'))
      formData.append('code_barre', String(form.code_barre || ''))
      formData.append('unite_product', String(form.unite_product || ''))

      if (editMode === 'add') {
        const response = await api.post('/sellprox/product/create', formData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        })

        if (response.data) {
          if (response.data.status === 1 || response.data.status === true) {
            Toast.show({
              type: 'success',
              text1: 'Succès',
              text2: 'Produit créé avec succès !',
            })
            bottomSheetRef.current?.close()
            refreshProducts(1, false, false)
          } else {
            Toast.show({
              type: 'error',
              text1: 'Erreur',
              text2: response.data.msg || 'Erreur lors de la création',
            })
          }
        }
      } else {
        formData.append('id', String(form.id))
        const response = await api.post('/sellprox/product/update', formData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        })

        if (response.data) {
          const ok = response.data.status === 1 || response.data.status === true || response.data.status === 200 || response.status === 200
          if (ok) {
            const imageFile = buildImageFile()
            let logoFailMsg = null
            if (imageFile) {
              try {
                const logoFd = new FormData()
                logoFd.append('image', imageFile)
                const logoRes = await api.post(sellproxProductLogoUpdatePath(form.id), logoFd, {
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'multipart/form-data',
                  },
                  timeout: 60000,
                })
                const logoOk =
                  logoRes.data?.status === 1 ||
                  logoRes.data?.status === true ||
                  logoRes.data?.status === 200 ||
                  logoRes.status === 200
                if (!logoOk) {
                  logoFailMsg = logoRes.data?.msg || 'Échec du téléversement de l’image'
                }
              } catch (logoErr) {
                logoFailMsg =
                  logoErr.response?.data?.msg ||
                  logoErr.response?.data?.message ||
                  'Échec du téléversement de l’image'
              }
            }
            Toast.show({
              type: logoFailMsg ? 'info' : 'success',
              text1: logoFailMsg ? 'Produit enregistré' : 'Succès',
              text2: logoFailMsg
                ? `${response.data.msg || 'Modifications enregistrées.'} — ${logoFailMsg}`
                : response.data.msg || 'Produit modifié avec succès !',
            })
            bottomSheetRef.current?.close()
            refreshProducts(1, false, false)
          } else {
            Toast.show({
              type: 'error',
              text1: 'Erreur',
              text2: response.data.msg || 'Erreur lors de la modification',
            })
          }
        }
      }

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Une erreur est survenue',
      })
    }
  }

  const saveService = async () => {
    const entreprise_id = user?.entreprise_id
    const user_id = user?.id
    if (!entreprise_id || !user_id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Session expirée. Veuillez vous reconnecter.',
      })
      return
    }
    if (!form.product_name?.trim() || !form.category_id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Nom et catégorie obligatoires',
      })
      return
    }
    const priceNum = Number(String(form.price).replace(/\s/g, '').replace(',', '.'))
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Indiquez un prix valide',
      })
      return
    }

    try {
      const payload = {
        entreprise_id: String(entreprise_id),
        user_id: Number(user_id),
        product_name: String(form.product_name).trim(),
        description: String(form.description || '').trim(),
        price: priceNum,
        category_id: Number(form.category_id),
        unite_product: String(form.unite_product || '').trim(),
        types: 'Service',
      }

      let response
      if (form.image?.uri) {
        const fd = new FormData()
        fd.append('entreprise_id', String(entreprise_id))
        fd.append('user_id', String(user_id))
        fd.append('product_name', payload.product_name)
        fd.append('description', payload.description)
        fd.append('price', String(priceNum))
        fd.append('category_id', String(form.category_id))
        fd.append('unite_product', payload.unite_product)
        fd.append('types', 'Service')
        const imageFile = {
          uri: Platform.OS === 'ios' ? form.image.uri.replace('file://', '') : form.image.uri,
          name: form.image.name || `photo_${Date.now()}.jpg`,
          type: form.image.type || 'image/jpeg',
        }
        fd.append('image', imageFile)
        response = await api.post(SELLPROX_SERVICE_CREATE_NEW, fd, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        })
      } else {
        response = await api.post(SELLPROX_SERVICE_CREATE_NEW, payload, {
          headers: { Accept: 'application/json' },
          timeout: 60000,
        })
      }

      const ok =
        response.data?.status === 1 ||
        response.data?.status === 200 ||
        response.data?.status === true ||
        response.status === 200

      if (ok) {
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: response.data?.msg || 'Service créé',
        })
        bottomSheetRef.current?.close()
        refreshProducts(1, false, false)
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: response.data?.msg || response.data?.message || 'Erreur lors de la création',
        })
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2:
          error.response?.data?.message ||
          error.response?.data?.msg ||
          error.message ||
          'Une erreur est survenue',
      })
    }
  }

  const StatusBadge = useCallback(({ status }) => {
    const isAvailable = status === 'Activé'
    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: isAvailable ? COLORS.bg : COLORS.card, borderWidth: 1, borderColor: isAvailable ? COLORS.success : COLORS.danger },
        ]}
      >
        {isAvailable ? (
          <CheckCircle size={14} color={COLORS.success} />
        ) : (
          <XCircle size={14} color={COLORS.danger} />
        )}
        <Text
          style={[
            styles.statusText,
            { color: isAvailable ? COLORS.success : COLORS.danger },
          ]}
        >
          {status}
        </Text>
      </View>
    )
  }, [])

  // Render product card for FlatList
  const renderProductCard = useCallback(({ item }) => {
    const imageUrl = getProductImageUrl(item)
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.code}> ID : #{item.id} </Text>
          <Text style={styles.infoText}>
            <StatusBadge status={item.status} />
          </Text>
        </View>

        <View style={styles.cardImageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.types}</Text>
          </View>
        </View>

        <Text style={styles.productName}>{item.productName}</Text>

        <View style={styles.infoRow}>
          <Layers size={16} color={COLORS.muted} />
          <Text style={styles.infoText}>{item.category}</Text>
        </View>

        <View style={styles.infoRow}>
          <Package size={16} color={COLORS.muted} />
          <Text style={styles.infoText}>Stock : {item.stock} {item.unite_product}</Text>
        </View>
        <View style={styles.infoRow}>
          <DollarSign size={16} color={COLORS.muted} />
          <Text style={styles.infoText1}>{Number(item.price || 0).toLocaleString()} FCFA</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setViewProduct(item)} style={styles.actionBtn1}>
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
  }, [getProductImageUrl, StatusBadge, openEdit])

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
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ListHeaderComponent
              title="Produits"
              subtitle="Catalogue & gestion du stock"
              onAddPress={openAdd}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterPress={openFilters}
              searchLoading={searchLoading}
              mode={mode}
              onModeChange={setMode}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun produit trouvé</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />

        {/* MODAL SCANNER CAMERA */}
        <Modal
          isVisible={scannerVisible}
          style={{ margin: 0 }}
          onBackdropPress={() => {
            setScannerVisible(false)
            setScanningForField(null)
          }}
        >
          <View style={{ flex: 1, backgroundColor: "black", marginVertical: 90, marginHorizontal: 10, borderRadius: 10, overflow: 'hidden' }}>
            {cameraPermission?.granted ? (
              <CameraView
                style={{ flex: 1, }}
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
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>
                    Autoriser
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => {
                setScannerVisible(false)
                setScanningForField(null)
              }}
            >
              <Text style={styles.closeScannerText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* MODAL DÉTAILS PRODUIT */}
        <Modal
          isVisible={!!viewProduct}
          onBackdropPress={() => setViewProduct(null)}
          onBackButtonPress={() => setViewProduct(null)}
        >
          <View style={styles.modalCard}>
            {viewProduct ? (
              <>
                <Text style={styles.modalTitle}>Détails du produit</Text>
                <Image
                  source={{ uri: getProductImageUrl(viewProduct) }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                {[
                  ['Produit', viewProduct.productName],
                  ['Catégorie', viewProduct.category],
                  [
                    'Prix',
                    viewProduct.price !== null && viewProduct.price !== undefined
                      ? `${Number(viewProduct.price).toLocaleString()} FCFA`
                      : '-',
                  ],
                  [
                    'Prix achat',
                    viewProduct.prix_achat !== null &&
                      viewProduct.prix_achat !== undefined
                      ? Number(viewProduct.prix_achat).toLocaleString()
                      : '-',
                  ],
                  ['Stock', viewProduct.stock],
                  ['Stock minimum', viewProduct.stock_min],
                  [
                    'Unité de produit',
                    viewProduct.unite_product !== null &&
                      viewProduct.unite_product !== undefined
                      ? `${viewProduct.unite_product} `
                      : '-',
                  ],
                  ['Code barre', viewProduct.code_barre || '-'],
                ].map(([label, value]) => (
                  <View key={label} style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{label}</Text>
                    <Text style={styles.modalValue} numberOfLines={1}>
                      {value === null || value === undefined || value === ''
                        ? '-'
                        : typeof value === 'number'
                          ? value.toLocaleString()
                          : String(value)}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setViewProduct(null)}
                >
                  <Text style={styles.modalCloseText}>Fermer</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </Modal>

        {/* BOTTOM SHEET AJOUT/MODIFICATION PRODUIT */}
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
                <View style={styles.switchContainer}>
                  <TouchableOpacity
                    style={[styles.switchBtn, mode === 'product' && styles.switchActive]}
                    onPress={() => setMode('product')}
                  >
                    <Text style={mode === 'product' ? styles.switchTextActive : styles.switchText}>
                      Produits
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.switchBtn, mode === 'service' && styles.switchActive]}
                    onPress={() => setMode('service')}
                  >
                    <Text style={mode === 'service' ? styles.switchTextActive : styles.switchText}>
                      Services
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sheetTitle}>
                  {mode === 'product'
                    ? (editMode === 'add' ? 'Ajouter un produit' : 'Modifier le produit')
                    : 'Ajouter un service'}
                </Text>

                {mode === 'product' ? (
                  <>
                    <TextInput
                      style={styles.sheetInput}
                      placeholder="Produit *"
                      value={form.product_name}
                      onChangeText={(value) =>
                        setForm((prev) => ({ ...prev, product_name: value }))
                      }
                      placeholderTextColor={COLORS.muted}
                    />

                    <View style={styles.dropdownRowWithAction}>

                      {
                        categoriesLoading ? (
                          <View style={styles.emptyCategoryBox}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          </View>
                        ) : !categoriesList || categoriesList.length === 0 ? (
                          <View style={styles.emptyCategoryBox}>
                            <Text style={styles.emptyCategoryTitle}>
                              Aucune catégorie disponible.
                            </Text>
                            <Text style={styles.emptyCategoryText}>
                              Créez une nouvelle catégorie via le bouton ci‑dessous
                              ou allez à l’écran des catégories.
                            </Text>
                            <TouchableOpacity
                              style={[styles.addCategoryBtn, styles.addCategoryBtnEmpty]}
                              onPress={() => setCategoryModalVisible(true)}
                            >
                              <Plus size={16} color={COLORS.white} />
                              <Text style={styles.addCategoryText}>Créer</Text>
                            </TouchableOpacity>
                          </View>
                        ) : <Dropdown
                          style={[styles.dropdown, styles.dropdownFlex]}
                          placeholderStyle={styles.dropdownPlaceholder}
                          selectedTextStyle={styles.dropdownSelected}
                          inputSearchStyle={styles.dropdownSearchInput}
                          data={categoriesList}
                          search
                          maxHeight={300}
                          labelField="name"
                          valueField="id"
                          placeholder="Catégorie *"
                          searchPlaceholder="Rechercher..."
                          value={form.category_id}
                          onChange={(item) => setForm(prev => ({ ...prev, category_id: item.id }))}
                          containerStyle={styles.dropdownContainer}
                          itemTextStyle={styles.dropdownItemText}
                          flatListProps={{
                            bounces: false,
                            contentContainerStyle: { paddingBottom: 20 },
                          }}
                        />
                      }
                    </View>

                    <TextInput
                      style={[styles.sheetInput, styles.textArea]}
                      placeholder="Description"
                      value={form.description}
                      onChangeText={(value) =>
                        setForm((prev) => ({ ...prev, description: value }))
                      }
                      placeholderTextColor={COLORS.muted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />

                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={pickProductImage}
                    >
                      <Text style={styles.imagePickerText}>
                        {form.image?.uri || form.imageUrlExisting
                          ? 'Changer l’image (photo ou galerie)'
                          : 'Ajouter une image (photo ou galerie)'}
                      </Text>
                    </TouchableOpacity>

                    {form.image?.uri || form.imageUrlExisting ? (
                      <Image
                        source={{ uri: form.image?.uri || form.imageUrlExisting }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    ) : null}

                    <View style={styles.rowInputs}>
                      <TextInput
                        style={[styles.sheetInput, { flex: 1, marginRight: 8 }]}
                        placeholder="Prix d'achat"
                        value={form.prix_achat}
                        onChangeText={(value) =>
                          setForm((prev) => ({ ...prev, prix_achat: value }))
                        }
                        placeholderTextColor={COLORS.muted}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.sheetInput, { flex: 1 }]}
                        placeholder="Prix *"
                        value={form.price}
                        onChangeText={(value) =>
                          setForm((prev) => ({ ...prev, price: value }))
                        }
                        placeholderTextColor={COLORS.muted}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.rowInputs}>
                      <TextInput
                        style={[styles.sheetInput, { flex: 1, marginRight: 8 }]}
                        placeholder="Stock"
                        value={form.stock}
                        onChangeText={(value) =>
                          setForm((prev) => ({ ...prev, stock: value }))
                        }
                        placeholderTextColor={COLORS.muted}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.sheetInput, { flex: 1 }]}
                        placeholder="Stock min"
                        value={form.stock_min}
                        onChangeText={(value) =>
                          setForm((prev) => ({ ...prev, stock_min: value }))
                        }
                        placeholderTextColor={COLORS.muted}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.barcodeRow}>
                      <TextInput
                        style={[styles.sheetInput, { flex: 1 }]}
                        placeholder="Code barre"
                        value={form.code_barre}
                        onChangeText={(value) =>
                          setForm((prev) => ({ ...prev, code_barre: value }))
                        }
                        placeholderTextColor={COLORS.muted}
                      />
                      <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => openScanner('code_barre')}
                      >
                        <QrCode size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dropdownRow}>
                      <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.dropdownPlaceholder}
                        selectedTextStyle={styles.dropdownSelected}
                        inputSearchStyle={styles.dropdownSearchInput}
                        data={unitsList}
                        search
                        maxHeight={300}
                        labelField="name"
                        valueField="name"
                        placeholder="Unité"
                        searchPlaceholder="Rechercher..."
                        value={form.unite_product}
                        onChange={(item) => setForm(prev => ({ ...prev, unite_product: item.name }))}
                        containerStyle={styles.dropdownContainer}
                        itemTextStyle={styles.dropdownItemText}
                        flatListProps={{
                          bounces: false,
                          contentContainerStyle: { paddingBottom: 20 },
                        }}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <TextInput
                      style={styles.sheetInput}
                      placeholder="Nom du service *"
                      value={form.product_name}
                      onChangeText={(value) =>
                        setForm((prev) => ({ ...prev, product_name: value }))
                      }
                      placeholderTextColor={COLORS.muted}
                    />

                    <View style={styles.dropdownRowWithAction}>
                      {categoriesLoading ? (
                        <View style={styles.emptyCategoryBox}>
                          <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                      ) : !categoriesList || categoriesList.length === 0 ? (
                        <View style={styles.emptyCategoryBox}>
                          <Text style={styles.emptyCategoryTitle}>Aucune catégorie disponible.</Text>
                          <TouchableOpacity
                            style={[styles.addCategoryBtn, styles.addCategoryBtnEmpty]}
                            onPress={() => setCategoryModalVisible(true)}
                          >
                            <Plus size={16} color={COLORS.white} />
                            <Text style={styles.addCategoryText}>Créer</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Dropdown
                          style={[styles.dropdown, styles.dropdownFlex]}
                          placeholderStyle={styles.dropdownPlaceholder}
                          selectedTextStyle={styles.dropdownSelected}
                          inputSearchStyle={styles.dropdownSearchInput}
                          data={categoriesList}
                          search
                          maxHeight={300}
                          labelField="name"
                          valueField="id"
                          placeholder="Catégorie *"
                          searchPlaceholder="Rechercher..."
                          value={form.category_id}
                          onChange={(item) => setForm((prev) => ({ ...prev, category_id: item.id }))}
                          containerStyle={styles.dropdownContainer}
                          itemTextStyle={styles.dropdownItemText}
                          flatListProps={{
                            bounces: false,
                            contentContainerStyle: { paddingBottom: 20 },
                          }}
                        />
                      )}
                    </View>

                    <TextInput
                      style={[styles.sheetInput, styles.textArea]}
                      placeholder="Description"
                      value={form.description}
                      onChangeText={(value) =>
                        setForm((prev) => ({ ...prev, description: value }))
                      }
                      placeholderTextColor={COLORS.muted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />

                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={pickProductImage}
                    >
                      <Text style={styles.imagePickerText}>
                        {form.image?.uri
                          ? 'Changer l’image (photo ou galerie)'
                          : 'Ajouter une image (photo ou galerie)'}
                      </Text>
                    </TouchableOpacity>

                    {form.image?.uri ? (
                      <Image
                        source={{ uri: form.image.uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    ) : null}

                    <TextInput
                      style={styles.sheetInput}
                      placeholder="Prix de vente *"
                      value={form.price}
                      onChangeText={(value) =>
                        setForm((prev) => ({ ...prev, price: value }))
                      }
                      placeholderTextColor={COLORS.muted}
                      keyboardType="numeric"
                    />

                    <View style={styles.dropdownRow}>
                      <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.dropdownPlaceholder}
                        selectedTextStyle={styles.dropdownSelected}
                        inputSearchStyle={styles.dropdownSearchInput}
                        data={unitsList}
                        search
                        maxHeight={300}
                        labelField="name"
                        valueField="name"
                        placeholder="Unité (ex. pc)"
                        searchPlaceholder="Rechercher..."
                        value={form.unite_product}
                        onChange={(item) => setForm((prev) => ({ ...prev, unite_product: item.name }))}
                        containerStyle={styles.dropdownContainer}
                        itemTextStyle={styles.dropdownItemText}
                        flatListProps={{
                          bounces: false,
                          contentContainerStyle: { paddingBottom: 20 },
                        }}
                      />
                    </View>
                  </>
                )}

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.sheetButtonGhost]}
                    onPress={() => bottomSheetRef.current?.close()}
                  >
                    <Text style={styles.sheetButtonGhostText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetButton}
                    onPress={mode === 'product' ? saveProduct : saveService}
                  >
                    <Text style={styles.sheetButtonText}>
                      {editMode === 'add' ? 'Ajouter' : 'Enregistrer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        </BottomSheet>

        {/* BOTTOM SHEET FILTRES */}
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
                <Text style={styles.sheetTitle}>Filtrer les produits</Text>

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Nom du produit"
                  value={filterForm.nom}
                  onChangeText={(value) =>
                    setFilterForm((prev) => ({ ...prev, nom: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="Code barre"
                  value={filterForm.code_barre}
                  onChangeText={(value) =>
                    setFilterForm((prev) => ({ ...prev, code_barre: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                />

                <TextInput
                  style={styles.sheetInput}
                  placeholder="ID produit"
                  value={filterForm.id_product}
                  onChangeText={(value) =>
                    setFilterForm((prev) => ({ ...prev, id_product: value }))
                  }
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                />

                <View style={styles.dropdownRow}>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelected}
                    inputSearchStyle={styles.dropdownSearchInput}
                    data={categoriesList}
                    search
                    maxHeight={300}
                    labelField="name"
                    valueField="id"
                    placeholder="Catégorie"
                    searchPlaceholder="Rechercher..."
                    value={filterForm.id_category}
                    onChange={(item) => setFilterForm(prev => ({ ...prev, id_category: item.id }))}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.dropdownItemText}
                    flatListProps={{
                      bounces: false,
                      contentContainerStyle: { paddingBottom: 20 },
                    }}
                  />
                </View>

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

        <RNModal
          visible={categoryModalVisible}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.categoryModal}>
              <Text style={styles.modalTitle}>Nouvelle catégorie</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="Nom de la catégorie"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholderTextColor={COLORS.muted}
              />
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={[styles.sheetButton, styles.sheetButtonGhost]}
                  onPress={() => setCategoryModalVisible(false)}
                >
                  <Text style={styles.sheetButtonGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetButton}
                  onPress={createCategory}
                  disabled={creatingCategory}
                >
                  {creatingCategory ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.sheetButtonText}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </RNModal>
      </View>
    </KeyboardAvoidingView>
  )
}

export default Products

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.fond },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  closeScannerButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 16,
  },
  closeScannerText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: { color: COLORS.muted, fontWeight: '600' },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  switchTextActive: {
    color: COLORS.white,
    fontWeight: '700',
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
  card: {
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 10,
  },
  code: { fontWeight: '700', color: COLORS.primary },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: COLORS.bg,
  },
  cardImageWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  typeBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderTopLeftRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderColor: '#cdcde6'
  },

  typeBadgeText: {
    color: '#00000000',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  infoText: { color: COLORS.text, fontWeight: '500' },
  infoText1: { color: COLORS.white, fontWeight: '600' },
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
    backgroundColor: 'white',
  },
  actionPrimary: { color: COLORS.white, fontWeight: '600' },
  actionMuted: { color: COLORS.white },
  actionDanger: { color: COLORS.danger, fontWeight: '600' },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyStateText: { color: COLORS.muted, fontWeight: '600' },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  modalValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  modalImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 15,
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
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  sheetSubtitle: {
    color: COLORS.muted,
    marginBottom: 20,
  },
  sheetInput: {
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scanButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  imagePickerButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePickerText: { color: COLORS.primary, fontWeight: '700' },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  selectText: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  selectPlaceholder: { color: COLORS.muted, fontSize: 15 },
  dropdownRow: {
    marginBottom: 12,
  },
  dropdownRowWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dropdown: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownFlex: {
    flex: 1,
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
    fontSize: 14,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    flex: 1,
  },
  addCategoryText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: '600',
  },
  addCategoryBtnEmpty: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  emptyCategoryBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  emptyCategoryTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyCategoryText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModal: {
    width: '85%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
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
  sheetButtonDanger: {
    backgroundColor: COLORS.danger,
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
  // Styles pour les modals de sélection
  selectionModal: {
    justifyContent: 'center',
    margin: 20,
  },
  selectionModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    maxHeight: '80%',
    minHeight: '40%',
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectionModalClose: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  selectionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionItemSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  selectionItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectionItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
})