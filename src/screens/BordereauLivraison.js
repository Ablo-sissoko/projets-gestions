import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import Modal from "react-native-modal";
import { Modalize } from "react-native-modalize";
import Toast from "react-native-toast-message";

import {
  Filter,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Download,
  Eye,
  Truck,
  MapPin,
  Package,
} from "lucide-react-native";

import Header from "../componants/Header";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";
import LoadingScreen from "../componants/LoadingScreen";
import Pdf from "react-native-pdf";
import COLORS from "../constants/couleurs";

/* ===================== COMPONENT ===================== */
export default function BordereauLivraisonScreen() {
  const { user, token } = useContext(AuthContext);
  const [bordereaux, setBordereaux] = useState([]);
  const [search, setSearch] = useState("");
  const [detailBordereau, setDetailBordereau] = useState(null);
  const [previewBordereau, setPreviewBordereau] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");

  const filterRef = useRef(null);

  useEffect(() => {
    fetchBordereaux(1, false, false);
  }, [user?.entreprise_id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBordereaux(1, false, true);
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, filterDateDebut, filterDateFin]);

  const fetchBordereaux = async (page = 1, append = false, isSearch = false) => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) {
      setInitialLoading(false);
      setSearchLoading(false);
      setLoadingMore(false);
      return;
    }

    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const query = search.trim();
      const response = await api.post("/sellprox/rapports/search", {
        totalPage: String(page),
        client_name: query || "",
        employee_name: query || "",
        phone: query || "",
        type: "Vente", // Filtrer uniquement les ventes
        entreprise_id,
        date_debut: filterDateDebut || "",
        date_fin: filterDateFin || "",
      });

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : [];

      // Filtrer pour ne garder que les ventes
      const ventes = results.filter(item => 
        String(item.type || "").toLowerCase() === "vente"
      );

      const formatted = ventes.map((item) => {
        /** Id vente pour le PDF : paramètre `id` du script PHP = `id_type` (pas `item.id`) */
        const venteId =
          item.id_type != null && String(item.id_type).trim() !== ""
            ? String(item.id_type).trim()
            : "";

        return {
          id: String(item.id),
          vente_id: venteId,
          reference: String(item.id_type ?? item.id),
          type: item.type,
          date: item.date,
          employe: item.employee_name || "-",
          client: item.client_name || "-",
          email: item.email || "-",
          telephone: item.phone || "-",
          adresse: item.adresse || item.client_adresse || "-",
          total: Number(item.total) || 0,
          url: item.url_fichier || "",
          livreur: item.livreur_nom || "À assigner",
          status: item.status || "en_attente",
        };
      });

      const nextPage = Number(response.data?.currentPage || page);
      const nextTotal = Number(response.data?.totalPages || 1);

      setCurrentPage(nextPage);
      setTotalPages(nextTotal);
      setBordereaux((prev) => (append ? [...prev, ...formatted] : formatted));
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Impossible de charger les bordereaux",
      });
    } finally {
      setInitialLoading(false);
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore) return;
    if (currentPage >= totalPages) return;
    fetchBordereaux(currentPage + 1, true, false);
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await fetchBordereaux(1, false, false);
    setRefreshing(false);
  }, [search, filterDateDebut, filterDateFin]);

  // Générer l'URL du PDF de bordereau de livraison
  const getBordereauUrl = (venteId) => {
    return `https://deegipay.com/backend_pos/pdf/borderau_livraison.php?id=${venteId}`;
  };

  const getPdfSourceForBordereau = useCallback(
    (bordereau) => {
      const vid = bordereau?.vente_id;
      if (!vid) return null;
      const uri = getBordereauUrl(vid);
      return {
        uri,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: true,
      };
    },
    [token]
  );

  const downloadBordereau = async (bordereau) => {
    try {
      const vid = bordereau?.vente_id;
      if (!vid) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Identifiant de vente introuvable pour ce bordereau",
        });
        return;
      }
      const url = getBordereauUrl(vid);
      
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Lien invalide" });
        return;
      }

      Linking.openURL(url);
    } catch (e) {
      Toast.show({ 
        type: "error", 
        text1: "Erreur", 
        text2: "Impossible de télécharger le bordereau" 
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      en_attente: { label: "En attente", color: "#ffc107", bg: "#ffc10720" },
      en_cours: { label: "En cours", color: "#17a2b8", bg: "#17a2b820" },
      livree: { label: "Livrée", color: "#28a745", bg: "#28a74520" },
      annulee: { label: "Annulée", color: "#dc3545", bg: "#dc354520" },
    };
    const config = statusConfig[status] || statusConfig.en_attente;
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  /* ===================== RENDER ===================== */
  if (initialLoading) {
    return <LoadingScreen />;
  }

  const previewPdfSource = previewBordereau
    ? getPdfSourceForBordereau(previewBordereau)
    : null;

  return (
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
        {/* HEADER */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Bordereaux de Livraison</Text>
          <Text style={styles.subtitle}>
            Gestion des bons de livraison des ventes
          </Text>
        </View>

        {/* STATS */}
        <View style={styles.searchRow}>
          <View style={styles.reportTotalBox}>
            <View style={styles.reportTotalContent}>
              <Truck size={20} color={COLORS.primary} />
              <Text style={styles.reportTotalLabel}>Total bordereaux</Text>
            </View>
            <Text style={styles.reportTotalCount}>{bordereaux.length}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => filterRef.current?.open()}
          >
            <Filter size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* LISTE DES BORDEREAUX */}
        {searchLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          bordereaux.map((b) => (
            <View key={b.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.cardTapArea}
                onPress={() => {
                  setPreviewBordereau(b);
                  setDetailBordereau(null);
                }}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.ref}>BL #{b.reference}</Text>
                    {getStatusBadge(b.status)}
                  </View>
                  <Text style={styles.amount}>
                    {b.total.toLocaleString()} FCFA
                  </Text>
                </View>

                <Info icon={User} label="Client" value={b.client} />
                <Info icon={Package} label="Produits" value={`${b.type || "Vente"}`} />
                <Info icon={User} label="Employé" value={b.employe} />
                <Info icon={Calendar} label="Date" value={b.date} />
                <Info icon={Phone} label="Téléphone" value={b.telephone} />
                <Info icon={Mail} label="Email" value={b.email} />
                {b.adresse !== "-" && (
                  <Info icon={MapPin} label="Adresse" value={b.adresse} />
                )}
                <Info icon={Truck} label="Livreur" value={b.livreur} />
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setDetailBordereau(b);
                    setPreviewBordereau(null);
                  }}
                  style={styles.actionBtn}
                >
                  <Eye size={18} color={COLORS.white} />
                  <Text style={styles.actionText}>Détails</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => downloadBordereau(b)}
                  style={styles.actionBtn1}
                >
                  <Download size={18} color={COLORS.white} />
                  <Text style={styles.actionText}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {bordereaux.length === 0 && !searchLoading && (
          <View style={styles.emptyContainer}>
            <Truck size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>Aucun bordereau de livraison trouvé</Text>
            <Text style={styles.emptySubtext}>
              Les ventes effectuées apparaîtront ici
            </Text>
          </View>
        )}

        {bordereaux.length > 0 && currentPage < totalPages && (
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
        )}
      </ScrollView>

      {/* MODAL DÉTAILS (texte uniquement) */}
      <Modal
        isVisible={!!detailBordereau}
        onBackdropPress={() => setDetailBordereau(null)}
        style={styles.detailModalWrap}
        backdropOpacity={0.55}
        avoidKeyboard
      >
        <View style={styles.modalCardOuter}>
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderTitleRow}>
              <FileText size={22} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Détails du bordereau</Text>
            </View>
            <TouchableOpacity onPress={() => setDetailBordereau(null)} hitSlop={12}>
              <Text style={styles.modalHeaderClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {detailBordereau &&
              [
                ["N° Bordereau", detailBordereau.reference],
                ["Client", detailBordereau.client],
                ["Téléphone", detailBordereau.telephone],
                ["Email", detailBordereau.email],
                ["Adresse", detailBordereau.adresse],
                ["Date", detailBordereau.date],
                ["Employé", detailBordereau.employe],
                ["Livreur", detailBordereau.livreur],
                [
                  "Statut",
                  detailBordereau.status === "livree"
                    ? "Livrée"
                    : detailBordereau.status === "en_cours"
                      ? "En cours"
                      : detailBordereau.status === "annulee"
                        ? "Annulée"
                        : "En attente",
                ],
                ["Total", `${detailBordereau.total.toLocaleString()} FCFA`],
              ].map(([l, v]) => (
                <View key={l} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{l}</Text>
                  <Text style={styles.modalValue}>{v}</Text>
                </View>
              ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setDetailBordereau(null)}
          >
            <Text style={styles.modalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* MODAL APERÇU PDF (carte) */}
      <Modal
        isVisible={!!previewBordereau}
        onBackdropPress={() => setPreviewBordereau(null)}
        style={styles.previewModalWrap}
        backdropOpacity={0.9}
      >
        <View style={styles.pdfPreviewContainer}>
          <View style={styles.pdfPreviewHeader}>
            <View style={styles.pdfPreviewTitleRow}>
              <Truck size={20} color={COLORS.white} />
              <Text style={styles.pdfPreviewTitle}>Aperçu — Bordereau</Text>
            </View>
            <TouchableOpacity
              onPress={() => setPreviewBordereau(null)}
              style={styles.pdfCloseBtn}
            >
              <Text style={styles.pdfCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pdfPreviewBody}>
            {previewPdfSource ? (
              <Pdf
                source={previewPdfSource}
                style={styles.pdfViewer}
                trustAllCerts={false}
                enablePaging
                renderActivityIndicator={() => (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                )}
                onError={() => {
                  Toast.show({
                    type: "error",
                    text1: "Erreur",
                    text2: "Impossible d'afficher l'aperçu du PDF",
                  });
                }}
              />
            ) : previewBordereau ? (
              <View style={styles.pdfEmbedPlaceholder}>
                <Text style={styles.pdfEmbedPlaceholderText}>
                  Aperçu indisponible (identifiant de vente manquant).
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* FILTER SHEET */}
      <Modalize ref={filterRef} adjustToContentHeight>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Filtrer les bordereaux</Text>

          <Text style={styles.filterLabel}>Recherche</Text>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchInputPlaceholder}>Nom client ou employé</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor={COLORS.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <Text style={styles.filterLabel}>Période</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateInput} onPress={() => {}}>
              <Text style={styles.dateText}>
                {filterDateDebut || "Date début"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateInput} onPress={() => {}}>
              <Text style={styles.dateText}>
                {filterDateFin || "Date fin"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetFilter}
            onPress={() => {
              setSearch("");
              setFilterDateDebut("");
              setFilterDateFin("");
              filterRef.current?.close();
              fetchBordereaux(1, false, true);
            }}
          >
            <Text style={styles.resetFilterText}>Réinitialiser les filtres</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </View>
  );
}

/* ===================== INFO ROW ===================== */
const Info = ({ icon: Icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon size={16} color={COLORS.muted} />
    <Text style={styles.infoText}>
      {label} : <Text style={styles.infoValue}>{value}</Text>
    </Text>
  </View>
);

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },

  headerSection: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.text },
  subtitle: { marginTop: 4, color: COLORS.muted, fontSize: 14 },

  searchRow: { flexDirection: "row", gap: 12, marginBottom: 16, alignItems: "center" },
  reportTotalBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportTotalContent: { flex: 1, flexDirection: 'row', gap: 10, alignItems: "center" },
  reportTotalLabel: { fontSize: 13, color: COLORS.muted },
  reportTotalCount: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  filterButton: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTapArea: {
    paddingBottom: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ref: { fontWeight: "700", color: COLORS.primary, fontSize: 14 },
  amount: { fontWeight: "700", color: COLORS.success, fontSize: 16 },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: "600" },

  infoRow: { flexDirection: "row", gap: 10, marginBottom: 6, alignItems: "center" },
  infoText: { color: COLORS.text, fontSize: 13, flex: 1 },
  infoValue: { fontWeight: "600" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
    borderColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  actionBtn1: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.info || "#17a2b8",
  },
  actionText: { color: COLORS.white, fontWeight: "600", fontSize: 13 },

  loadMoreButton: {
    marginTop: 4,
    marginBottom: 20,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  loadMoreText: { color: "#fff", fontWeight: "700" },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { color: COLORS.muted, fontSize: 16, marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 8 },

  detailModalWrap: {
    margin: 0,
    justifyContent: "flex-end",
  },
  modalCardOuter: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: "92%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  modalHeaderClose: {
    fontSize: 22,
    color: COLORS.muted,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  modalScroll: { maxHeight: 480 },
  modalScrollContent: { paddingBottom: 12 },
  modalRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  modalValue: { fontWeight: "600", color: COLORS.text, flex: 1, textAlign: "right" },
  previewModalWrap: {
    margin: 0,
    justifyContent: "flex-end",
  },
  pdfPreviewContainer: {
    height: "90%",
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  pdfPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.text,
  },
  pdfPreviewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pdfPreviewTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },
  pdfCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pdfCloseBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  pdfPreviewBody: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  pdfViewer: {
    flex: 1,
    width: "100%",
  },
  pdfEmbedPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pdfEmbedPlaceholderText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
  },
  modalClose: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalCloseText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },

  sheetContent: { padding: 20, paddingBottom: 28 },
  sheetTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20, color: COLORS.text, textAlign: "center" },
  filterLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 16, color: COLORS.text },
  searchInputContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchInputPlaceholder: { position: "absolute", top: -8, left: 12, backgroundColor: COLORS.card, paddingHorizontal: 4, fontSize: 10, color: COLORS.muted },
  searchInput: { paddingVertical: 12, fontSize: 16, color: COLORS.text },
  dateRow: { flexDirection: "row", gap: 12 },
  dateInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dateText: { color: COLORS.text },
  resetFilter: { marginTop: 24, paddingVertical: 14, alignItems: "center", backgroundColor: COLORS.bg, borderRadius: 12 },
  resetFilterText: { color: COLORS.primary, fontWeight: "600", fontSize: 15 },
});