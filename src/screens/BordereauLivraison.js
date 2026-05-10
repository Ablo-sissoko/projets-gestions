import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { Plus, Search, User, Users, Phone, Calendar, FileText, Eye, Download, Truck, Package, MapPin, Mail } from 'lucide-react-native';
import Header from '../componants/Header';
import { AuthContext } from '../context/AuthContext';
import api from '../api/Axios';
import { TextInput } from 'react-native-gesture-handler';
import Pdf from 'react-native-pdf';
import COLORS from '../constants/couleurs';

const BonDeLivraison = () => {
  const { user, token } = useContext(AuthContext);
  
  // État pour le client
  const [clientNom, setClientNom] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  
  // État pour le livreur
  const [livreurNom, setLivreurNom] = useState('');
  const [livreurPhone, setLivreurPhone] = useState('');
  const [livreurMatricule, setLivreurMatricule] = useState('');
  
  // État pour les produits
  const [produits, setProduits] = useState([]);
  const [produitsAPI, setProduitsAPI] = useState([]);
  const [loadingProduits, setLoadingProduits] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // État pour les bons de livraison
  const [livraisons, setLivraisons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingLivraisons, setLoadingLivraisons] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // États pour les modals
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [produitVisible, setProduitVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const clientModal = useRef(null);
  
  // Statuts possibles pour un bon de livraison
  const statusOptions = [
    { value: 'en_attente', label: 'En attente', color: COLORS.warning || '#ffc107' },
    { value: 'en_cours', label: 'En cours de livraison', color: COLORS.info || '#17a2b8' },
    { value: 'livree', label: 'Livrée', color: COLORS.success || '#28a745' },
    { value: 'annulee', label: 'Annulée', color: COLORS.danger || '#dc3545' },
  ];
  
  const getStatusLabel = (status) => {
    const found = statusOptions.find(s => s.value === status);
    return found ? found.label : status;
  };
  
  const getStatusColor = (status) => {
    const found = statusOptions.find(s => s.value === status);
    return found ? found.color : COLORS.muted;
  };
  
  const totalGeneral = useMemo(
    () => produits.reduce((sum, item) => sum + Number(item.qte || 0) * Number(item.prix || 0), 0),
    [produits]
  );
  
  const fetchProduits = async () => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) return;
    try {
      setLoadingProduits(true);
      const response = await api.post('/sellprox/product/search', {
        totalPage: '1',
        nom: productSearch.trim(),
        id_category: '',
        id_product: '',
        code_barre: '',
        entreprise_id,
      });
      const results = Array.isArray(response.data?.resultat) ? response.data.resultat : [];
      const formatted = results.map((item) => ({
        id: String(item.id),
        nom: item.product_name || '-',
        prix: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
        image: item.img_url,
      }));
      setProduitsAPI(formatted);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les produits',
      });
    } finally {
      setLoadingProduits(false);
    }
  };
  
  const updateProduitQty = (id, delta) => {
    setProduits((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, qte: Number(p.qte || 0) + delta } : p
      );
      return next.filter((p) => Number(p.qte || 0) > 0);
    });
  };
  
  const getSelectedQty = (id) => {
    const found = produits.find((p) => p.id === id);
    return Number(found?.qte || 0);
  };
  
  const adjustProduitFromApi = (item, delta) => {
    setProduits((prev) => {
      const exist = prev.find((p) => p.id === item.id);
      const currentQty = Number(exist?.qte || 0);
      const stock = Number(item.stock || 0);
      if (delta > 0) {
        if (stock > 0 && currentQty >= stock) {
          Toast.show({ type: 'error', text1: 'Stock', text2: 'Stock insuffisant' });
          return prev;
        }
        if (exist) {
          return prev.map((p) =>
            p.id === item.id ? { ...p, qte: currentQty + 1 } : p
          );
        }
        return [...prev, { id: item.id, nom: item.nom, qte: 1, prix: item.prix }];
      }
      if (!exist) return prev;
      const nextQty = currentQty - 1;
      if (nextQty <= 0) return prev.filter((p) => p.id !== item.id);
      return prev.map((p) => (p.id === item.id ? { ...p, qte: nextQty } : p));
    });
  };
  
  const createBonLivraison = async () => {
    if (!clientNom.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Nom du client requis' });
      return;
    }
    if (!livreurNom.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Nom du livreur requis' });
      return;
    }
    if (!produits.length) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Ajoute au moins un produit' });
      return;
    }
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Session invalide' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_nom: clientNom,
        client_phone: clientPhone,
        client_email: clientEmail,
        client_adresse: clientAdresse,
        livreur_nom: livreurNom,
        livreur_phone: livreurPhone,
        livreur_matricule: livreurMatricule,
        employee_id: user?.id || user?.employee_id || '1',
        employee_name: `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Employé',
        total: String(totalGeneral || 0),
        entreprise_id,
        status: 'en_attente',
        lignes: produits.map(item => ({
          id: String(item.id),
          product_name: item.nom,
          quantite: String(item.qte),
          prix_unitaire: String(item.prix),
          total_ligne: String(item.qte * item.prix),
        })),
      };
      const response = await api.post('/sellprox/bonlivraison/create', payload);
      if (response.data?.status !== 1) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.message || 'Création échouée' });
        return;
      }
      Toast.show({ type: 'success', text1: 'Succès', text2: 'Bon de livraison créé' });
      setProduits([]);
      setClientNom('');
      setClientPhone('');
      setClientEmail('');
      setClientAdresse('');
      setLivreurNom('');
      setLivreurPhone('');
      setLivreurMatricule('');
      clientModal.current?.close();
      fetchLivraisons(1, false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de créer le bon de livraison',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const fetchLivraisons = async (page = 1, append = false) => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) {
      setLoadingLivraisons(false);
      return;
    }
    try {
      if (!append) setLoadingLivraisons(true);
      const response = await api.post('/sellprox/rapports/search', {
        totalPage: String(page),
        client_name: '',
        employee_name: '',
        phone: '',
        entreprise_id,
        type: '',
        status: '',
        date_debut: '',
        date_fin: '',
      });
      const results = Array.isArray(response.data?.resultat) ? response.data.resultat : [];
      const filtered = results.filter(item =>
        String(item.type || '').toLowerCase().includes('livraison')
      );
      const source = filtered.length ? filtered : results;
      const formatted = source.map(item => ({
        id: String(item.id),
        employee_name: item.employee_name || '-',
        client_name: item.client_name || '-',
        email: item.email || '',
        phone: item.phone || '',
        total: Number(item.total) || 0,
        date: item.date || '',
        url: item.url_fichier || '',
        status: item.status || 'en_attente',
        adresse: item.adresse || '',
        livreur_nom: item.livreur_nom || '-',
      }));
      setLivraisons(prev => (append ? [...prev, ...formatted] : formatted));
      setCurrentPage(Number(response.data?.currentPage) || page);
      setTotalPages(Number(response.data?.totalPages) || 1);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les bons de livraison',
      });
    } finally {
      setLoadingLivraisons(false);
    }
  };
  
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.post('/sellprox/bonlivraison/update-status', {
        id,
        status: newStatus,
        entreprise_id: user?.entreprise_id,
      });
      if (response.data?.status === 1) {
        Toast.show({ type: 'success', text1: 'Succès', text2: 'Statut mis à jour' });
        fetchLivraisons(1, false);
      } else {
        Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.message || 'Mise à jour échouée' });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de mettre à jour le statut',
      });
    }
    setStatusModalVisible(false);
    setSelectedStatus('');
  };
  
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await fetchLivraisons(1, false);
    setRefreshing(false);
  }, []);
  
  useEffect(() => {
    fetchLivraisons();
  }, [user?.entreprise_id]);
  
  useEffect(() => {
    if (!produitVisible) return;
    const timeout = setTimeout(() => {
      fetchProduits();
    }, 400);
    return () => clearTimeout(timeout);
  }, [productSearch, produitVisible]);
  
  const handleLoadMore = () => {
    if (loadingLivraisons || currentPage >= totalPages) return;
    fetchLivraisons(currentPage + 1, true);
  };
  
  const openPreview = async (item) => {
    if (!item.url) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Aucun fichier PDF disponible' });
      return;
    }
    try {
      setPdfUrl({
        uri: item.url,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: true,
      });
      setPdfVisible(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: "Impossible d'ouvrir le PDF" });
    }
  };
  
  const openDetail = (item) => {
    setSelectedLivraison(item);
    setDetailVisible(true);
  };
  
  const openStatusModal = (item) => {
    setSelectedLivraison(item);
    setSelectedStatus(item.status || 'en_attente');
    setStatusModalVisible(true);
  };
  
  const downloadLivraison = async (item) => {
    if (!item.url) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Aucun lien de téléchargement' });
      return;
    }
    const ok = await Linking.canOpenURL(item.url);
    if (!ok) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Lien invalide' });
      return;
    }
    Linking.openURL(item.url);
  };
  
  const renderStatusBadge = (status) => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <Header agentName="Agent connecté" />
        
        <FlatList
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16 }}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>Bons de Livraison</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => clientModal.current?.open()}>
                  <Plus size={18} color="#000000" />
                  <Text style={styles.addButtonText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          data={livraisons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.ref}>BL #{item.id}</Text>
                  {renderStatusBadge(item.status)}
                </View>
                <Text style={styles.amount}>{item.total.toLocaleString()} FCFA</Text>
              </View>
              <InfoRow icon={User} label="Client" value={item.client_name} />
              <InfoRow icon={Truck} label="Livreur" value={item.livreur_nom || '-'} />
              <InfoRow icon={Users} label="Employé" value={item.employee_name} />
              <InfoRow icon={Phone} label="Contact" value={item.phone || item.email || '-'} />
              <InfoRow icon={Calendar} label="Date" value={item.date} />
              {item.adresse && <InfoRow icon={MapPin} label="Adresse" value={item.adresse} />}
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openDetail(item)} style={styles.actionBtn1}>
                  <Eye size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openStatusModal(item)} style={styles.actionBtnStatus}>
                  <Text style={styles.actionStatusText}>Statut</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openPreview(item)} style={styles.actionBtn}>
                  <FileText size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadLivraison(item)} style={styles.actionBtn}>
                  <Download size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            loadingLivraisons ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.emptyText}>Aucun bon de livraison trouvé.</Text>
            )
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
        
        {/* Modal Client et Livreur */}
        <Modalize ref={clientModal} handleStyle={{ backgroundColor: COLORS.primary }} adjustToContentHeight>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Informations Client</Text>
            <TextInput placeholder="Nom du client" placeholderTextColor="#999" style={styles.modalInput} value={clientNom} onChangeText={setClientNom} />
            <TextInput placeholder="Téléphone" placeholderTextColor="#999" style={styles.modalInput} value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />
            <TextInput placeholder="Email" placeholderTextColor="#999" style={styles.modalInput} value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput placeholder="Adresse de livraison" placeholderTextColor="#999" style={styles.modalInput} value={clientAdresse} onChangeText={setClientAdresse} />
            
            <Text style={[styles.modalTitle, { marginTop: 16 }]}>Informations Livreur</Text>
            <TextInput placeholder="Nom du livreur" placeholderTextColor="#999" style={styles.modalInput} value={livreurNom} onChangeText={setLivreurNom} />
            <TextInput placeholder="Téléphone du livreur" placeholderTextColor="#999" style={styles.modalInput} value={livreurPhone} onChangeText={setLivreurPhone} keyboardType="phone-pad" />
            <TextInput placeholder="Matricule / Véhicule" placeholderTextColor="#999" style={styles.modalInput} value={livreurMatricule} onChangeText={setLivreurMatricule} />
            
            <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
              <Text style={styles.sectionTitle}>Produits</Text>
              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => {
                  fetchProduits();
                  setProduitVisible(true);
                }}
              >
                <Text style={styles.addProductText}>Ajouter produit</Text>
              </TouchableOpacity>
            </View>
            
            {!!produits.length && (
              <>
                <Text style={{ fontWeight: '700', marginTop: 12 }}>Produits sélectionnés</Text>
                {produits.map((item) => (
                  <View key={item.id} style={styles.productCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{item.nom}</Text>
                      <Text style={styles.details}>
                        {item.qte} x {item.prix.toLocaleString()} FCFA
                      </Text>
                      <Text style={styles.details}>
                        Total: {(item.qte * item.prix).toLocaleString()} FCFA
                      </Text>
                    </View>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateProduitQty(item.id, -1)}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.qte}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateProduitQty(item.id, 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Général:</Text>
                  <Text style={styles.totalAmount}>{totalGeneral.toLocaleString()} FCFA</Text>
                </View>
              </>
            )}
            
            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 16, marginBottom: 30 }]}
              onPress={createBonLivraison}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Créer le bon de livraison</Text>}
            </TouchableOpacity>
          </ScrollView>
        </Modalize>
        
        {/* Modal Produit */}
        <Modal isVisible={produitVisible} onBackdropPress={() => setProduitVisible(false)} backdropOpacity={0.6}>
          <View style={styles.productModal}>
            <Text style={styles.modalTitle}>Sélectionner un produit</Text>
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
              {loadingProduits ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
              ) : (
                <FlatList
                  data={produitsAPI}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.productApiCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700' }}>{item.nom}</Text>
                        <Text>{item.prix.toLocaleString()} FCFA</Text>
                        <Text>Stock: {item.stock}</Text>
                      </View>
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => adjustProduitFromApi(item, -1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{getSelectedQty(item.id)}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => adjustProduitFromApi(item, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>Aucun produit disponible.</Text>}
                />
              )}
            </View>
            <TouchableOpacity style={[styles.saveBtn, { marginTop: 20 }]} onPress={() => setProduitVisible(false)}>
              <Text style={styles.saveText}>Valider les produits</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        
        {/* Modal Statut */}
        <Modal isVisible={statusModalVisible} onBackdropPress={() => setStatusModalVisible(false)} backdropOpacity={0.6}>
          <View style={styles.statusModal}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            <Text style={styles.statusModalSubtitle}>
              Bon #BL{selectedLivraison?.id}
            </Text>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  selectedStatus === option.value && { borderColor: option.color, backgroundColor: option.color + '10' }
                ]}
                onPress={() => setSelectedStatus(option.value)}
              >
                <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                <Text style={[styles.statusOptionText, selectedStatus === option.value && { color: option.color, fontWeight: '700' }]}>
                  {option.label}
                </Text>
                {selectedStatus === option.value && (
                  <View style={[styles.statusCheck, { backgroundColor: option.color }]}>
                    <Text style={styles.statusCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.statusModalActions}>
              <TouchableOpacity
                style={[styles.statusCancelBtn]}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.statusCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusConfirmBtn]}
                onPress={() => updateStatus(selectedLivraison?.id, selectedStatus)}
              >
                <Text style={styles.statusConfirmText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Modal PDF */}
        <Modal isVisible={pdfVisible} onBackdropPress={() => setPdfVisible(false)} style={styles.pdfModal} backdropOpacity={0.9}>
          <View style={styles.pdfPreviewContainer}>
            <View style={styles.pdfPreviewHeader}>
              <Text style={styles.pdfPreviewTitle}>Aperçu Bon de livraison</Text>
              <TouchableOpacity onPress={() => setPdfVisible(false)} style={styles.pdfCloseBtn}>
                <Text style={styles.pdfCloseText}>Fermer</Text>
              </TouchableOpacity>
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
                    Toast.show({ type: 'error', text1: 'Erreur', text2: "Impossible d'afficher le PDF" });
                  }}
                />
              ) : null}
            </View>
          </View>
        </Modal>
        
        {/* Modal Détail */}
        <RNModal visible={detailVisible} animationType="slide" transparent>
          <View style={styles.detailOverlay}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Détail bon de livraison</Text>
              {selectedLivraison && (
                <>
                  <Text style={styles.detailText}>Client: {selectedLivraison.client_name}</Text>
                  <Text style={styles.detailText}>Total: {Number(selectedLivraison.total || 0).toLocaleString()} FCFA</Text>
                  <Text style={styles.detailText}>Employé: {selectedLivraison.employee_name}</Text>
                  <Text style={styles.detailText}>Date: {selectedLivraison.date}</Text>
                  <Text style={styles.detailText}>Téléphone: {selectedLivraison.phone || '-'}</Text>
                  <Text style={styles.detailText}>Email: {selectedLivraison.email || '-'}</Text>
                  <Text style={styles.detailText}>Adresse: {selectedLivraison.adresse || '-'}</Text>
                  <Text style={styles.detailText}>Livreur: {selectedLivraison.livreur_nom || '-'}</Text>
                  <Text style={styles.detailText}>Statut: {getStatusLabel(selectedLivraison.status)}</Text>
                </>
              )}
              <TouchableOpacity style={[styles.saveBtn, { marginTop: 20 }]} onPress={() => setDetailVisible(false)}>
                <Text style={styles.saveText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNModal>
      </View>
    </KeyboardAvoidingView>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon size={16} color={COLORS.muted} />
    <Text style={styles.infoText}>
      {label} : <Text style={styles.infoValue}>{value}</Text>
    </Text>
  </View>
);

export default BonDeLivraison;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  addButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: { color: '#000000', fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginVertical: 12, color: COLORS.text },
  addProductButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addProductText: { color: COLORS.text, fontWeight: '600' },
  productCard: {
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
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ref: { fontWeight: '700', color: COLORS.primary, fontSize: 14 },
  amount: { fontSize: 16, fontWeight: '700', color: COLORS.success },
  productName: { fontSize: 15, fontWeight: '600' },
  details: { color: COLORS.muted, marginTop: 2, fontSize: 12 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontWeight: '700', color: COLORS.text, fontSize: 16 },
  qtyValue: { fontWeight: '700', minWidth: 24, textAlign: 'center', fontSize: 16 },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  totalAmount: { fontSize: 18, fontWeight: '700', color: COLORS.success },
  saveBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#000000', fontWeight: '600', fontSize: 16 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 6, alignItems: 'center' },
  infoText: { color: COLORS.text, fontWeight: '500', fontSize: 13 },
  infoValue: { fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtn1: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  actionBtnStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.info || '#17a2b8',
  },
  actionStatusText: { color: COLORS.white, fontWeight: '600', fontSize: 12 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 8, padding: 20 },
  productModal: {
    height: '80%',
    backgroundColor: COLORS.card,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productModalListWrap: { flex: 1, minHeight: 0 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: COLORS.text },
  modalInput: { backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
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
  searchInput: { flex: 1, color: COLORS.text },
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
  pdfCloseBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  pdfCloseText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  pdfPreviewContent: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20,
  },
  pdfViewer: { flex: 1 },
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
  statusModal: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
  },
  statusModalSubtitle: {
    color: COLORS.muted,
    marginBottom: 20,
    fontSize: 14,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  statusCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCheckText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  statusCancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statusCancelText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  statusConfirmBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  statusConfirmText: {
    color: '#000000',
    fontWeight: '600',
  },
});