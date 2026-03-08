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
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { Plus, Search, User, Users, Phone, Calendar, FileText, Eye, Download } from 'lucide-react-native';
import Header from '../componants/Header';
import { AuthContext } from '../context/AuthContext';
import api from '../api/Axios';
import { TextInput } from 'react-native-gesture-handler';
import Pdf from 'react-native-pdf';
import COLORS from '../constants/couleurs';

const Commandes = () => {
  const { user, token } = useContext(AuthContext);
  const [clientNom, setClientNom] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');

  const [produits, setProduits] = useState([]);
  const [produitsAPI, setProduitsAPI] = useState([]);
  const [loadingProduits, setLoadingProduits] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [commandes, setCommandes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingCommandes, setLoadingCommandes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [produitVisible, setProduitVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);

  const clientModal = useRef(null);

  const totalGeneral = useMemo(
    () => produits.reduce((sum, item) => sum + Number(item.qte || 0) * Number(item.prix || 0), 0),
    [produits]
  );

  const fetchProduits = async () => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) return;
    try {
      setLoadingProduits(true);

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
      );

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : [];

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

  const createCommande = async () => {
    if (!clientNom.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Nom du client requis' });
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
        employee_id: user?.id || user?.employee_id || '1',
        employee_name: `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Employé',
        total: String(totalGeneral || 0),
        entreprise_id,
        lignes: produits.map(item => ({
          id: String(item.id),
          product_name: item.nom,
          quantite: String(item.qte),
          prix_unitaire: String(item.prix),
          total_ligne: String(item.qte * item.prix),
        })),
      };
      const response = await api.post(
        '/sellprox/boncommande/create',
        payload
      );
      if (response.data?.status !== 1) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: response.data?.message || 'Création échouée' });
        return;
      }
      Toast.show({ type: 'success', text1: 'Succès', text2: 'Commande créée' });
      setProduits([]);
      setClientNom('');
      setClientPhone('');
      setClientEmail('');
      setClientAdresse('');
      clientModal.current?.close();
      fetchCommandes(1, false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de créer la commande',
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchCommandes = async (page = 1, append = false) => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) {
      setLoadingCommandes(false);
      return;
    }
    try {
      if (!append) setLoadingCommandes(true);

      const response = await api.post(
        '/sellprox/rapports/search',
        {
          totalPage: String(page),
          client_name: '',
          employee_name: '',
          phone: '',
          entreprise_id,
          type: '',
          status: '',
          date_debut: '',
          date_fin: '',
        }
      );

      const results = Array.isArray(response.data?.resultat) ? response.data.resultat : [];
      const filtered = results.filter(item =>
        String(item.type || '').toLowerCase().includes('commande')
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
      }));
      setCommandes(prev => (append ? [...prev, ...formatted] : formatted));
      setCurrentPage(Number(response.data?.currentPage) || page);
      setTotalPages(Number(response.data?.totalPages) || 1);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || 'Impossible de charger les commandes',
      });
    } finally {
      setLoadingCommandes(false);
    }
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await fetchCommandes(1, false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchCommandes();
  }, [user?.entreprise_id]);

  useEffect(() => {
    if (!produitVisible) return;
    const timeout = setTimeout(() => {
      fetchProduits();
    }, 400);
    return () => clearTimeout(timeout);
  }, [productSearch, produitVisible]);

  const handleLoadMore = () => {
    if (loadingCommandes || currentPage >= totalPages) return;
    fetchCommandes(currentPage + 1, true);

  };

  const openPreview = async (cmd) => {
    if (!cmd.url) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Aucun fichier PDF disponible' });
      return;
    }
    try {
      setPdfUrl({
        uri: cmd.url,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: true,
      });
      setPdfVisible(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: "Impossible d'ouvrir le PDF" });
    }
  };
  const openDetail = (cmd) => {
    setSelectedCommande(cmd);
    setDetailVisible(true);
  };

  const downloadCommande = async (cmd) => {
    if (!cmd.url) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Aucun lien de téléchargement' });
      return;
    }
    const ok = await Linking.canOpenURL(cmd.url);
    if (!ok) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Lien invalide' });
      return;
    }
    Linking.openURL(cmd.url);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <Header agentName="Agent connecté" />

        {/* Liste des commandes */}
        <FlatList
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16 }}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>Bon de Commandes</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => clientModal.current?.open()}>
                  <Plus size={18} color="#000000" />
                  <Text style={styles.addButtonText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          data={commandes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.ref}>ID #{item.id}</Text>
                <Text style={styles.amount}>{item.total.toLocaleString()} FCFA</Text>
              </View>
              <InfoRow icon={User} label="Client" value={item.client_name} />
              <InfoRow icon={Users} label="Employé" value={item.employee_name} />
              <InfoRow icon={Phone} label="Contact" value={item.phone || item.email || '-'} />
              <InfoRow icon={Calendar} label="Date" value={item.date} />
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openDetail(item)} style={styles.actionBtn1}>
                  <Eye size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openPreview(item)} style={styles.actionBtn}>
                  <FileText size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadCommande(item)} style={styles.actionBtn}>
                  <Download size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            loadingCommandes ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.emptyText}>Aucun bon de commande trouvé.</Text>
            )
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />

        {/* Modal Client */}
        <Modalize ref={clientModal} handleStyle={{ backgroundColor: COLORS.primary }} adjustToContentHeight>
          <View style={{ padding: 16 }}>
            <Text style={styles.modalTitle}>Informations Client</Text>
            <TextInput placeholder="Nom" placeholderTextColor="#999" style={styles.modalInput} value={clientNom} onChangeText={setClientNom} />
            <TextInput placeholder="Téléphone" placeholderTextColor="#999" style={styles.modalInput} value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />
            <TextInput placeholder="Email" placeholderTextColor="#999" style={styles.modalInput} value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput placeholder="Adresse" placeholderTextColor="#999" style={styles.modalInput} value={clientAdresse} onChangeText={setClientAdresse} />
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
                  <View key={item.id} style={styles.card}>
                    <View>
                      <Text style={styles.productName}>{item.nom}</Text>
                      <Text style={styles.details}>
                        {item.qte} x {item.prix} FCFA
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
              </>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 16 }]}
              onPress={createCommande}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        </Modalize>

        {/* Modal Produit */}
        <Modal
          isVisible={produitVisible}
          onBackdropPress={() => setProduitVisible(false)}
          backdropOpacity={0.6}
        >
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
                      <View>
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
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>Aucun produit disponible.</Text>
                  }
                />
              )}
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 20 }]}
              onPress={() => setProduitVisible(false)}
            >
              <Text style={styles.saveText}>Enregistrer les produits</Text>
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
              <Text style={styles.pdfPreviewTitle}>Aperçu Bon de commande</Text>
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

        <RNModal visible={detailVisible} animationType="slide" transparent>
          <View style={styles.detailOverlay}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Détail commande</Text>
              {selectedCommande && (
                <>
                  <Text style={styles.detailText}>Client: {selectedCommande.client_name}</Text>
                  <Text style={styles.detailText}>
                    Total: {Number(selectedCommande.total || 0).toLocaleString()} FCFA
                  </Text>
                  <Text style={styles.detailText}>Employé: {selectedCommande.employee_name}</Text>
                  <Text style={styles.detailText}>Date: {selectedCommande.date}</Text>
                  <Text style={styles.detailText}>Téléphone: {selectedCommande.phone || '-'}</Text>
                  <Text style={styles.detailText}>Email: {selectedCommande.email || '-'}</Text>
                </>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 20 }]}
                onPress={() => setDetailVisible(false)}
              >
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

export default Commandes;

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
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  productName: { fontSize: 15, fontWeight: '600' },
  details: { color: COLORS.muted, marginTop: 4 },
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
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, padding: 16, borderTopWidth: 1, borderColor: COLORS.border },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#000000', fontWeight: '600', fontSize: 16 },
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
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 8 },
  productModalWrap: { margin: 0, justifyContent: 'flex-end' },
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
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalInput: { backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
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
  pdfCloseBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  pdfCloseText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  pdfPreviewContent: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20,
  },
  pdfViewer: { flex: 1 },
  previewHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111',
  },
  previewTitle: { color: '#fff', fontSize: 18 },
  previewClose: { color: '#ff4444', fontSize: 16 },
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
});