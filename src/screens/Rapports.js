import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
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
  Hash,
  Eye,
} from "lucide-react-native";

import Header from "../componants/Header";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";
import LoadingScreen from "../componants/LoadingScreen";
import Pdf from "react-native-pdf";
import COLORS from "../constants/couleurs";

const ENTERPRISE_ID = "172881c9-0fa0-11f1-b6a3-00163e6e7997";

/* ===================== DATA ===================== */


/* ===================== COMPONENT ===================== */
export default function RapportsScreen() {
  const { user, token } = useContext(AuthContext);
  const [rapports, setRapports] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const filterRef = useRef(null);

  useEffect(() => {
    refreshRapports(1, false, false);
  }, [user?.entreprise_id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshRapports(1, false, true);
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, typeFilter]);

  const refreshRapports = async (page = 1, append = false, isSearch = false) => {
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
      const response = await api.post(
        "/sellprox/rapports/search",
        {
          totalPage: String(page),
          client_name: query || "",
          employee_name: query || "",
          phone: query || "",
          type: typeFilter || "",
          entreprise_id,
        }
      );

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : [];

      const formatted = results.map((item) => ({
        id: String(item.id),
        reference: String(item.id_type ?? item.id),
        type: item.type,
        date: item.date,
        employe: item.employee_name || "-",
        client: item.client_name || "-",
        email: item.email || "-",
        telephone: item.phone || "-",
        total: Number(item.total) || 0,
        url: item.url_fichier || "",
      }));

      const nextPage = Number(response.data?.currentPage || page);
      const nextTotal = Number(response.data?.totalPages || 1);

      setCurrentPage(nextPage);
      setTotalPages(nextTotal);
      setRapports((prev) => (append ? [...prev, ...formatted] : formatted));
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Impossible de charger les rapports",
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
    refreshRapports(currentPage + 1, true, false);
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await refreshRapports(1, false, false);
    setRefreshing(false);
  }, [search, typeFilter]);

  const openProformaPDF = async (report) => {
    try {
      if (!report.url) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Aucun fichier PDF disponible" });
        return;
      }

      setPdfUrl({
        uri: report.url,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: true,
      });

      setPdfVisible(true);
    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Impossible d'ouvrir le PDF" });
    }
  };

  const downloadPDF = async (report) => {
    try {
      if (!report.url) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Aucun fichier PDF disponible" });
        return;
      }

      const supported = await Linking.canOpenURL(report.url);
      if (!supported) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Lien invalide" });
        return;
      }

      Linking.openURL(report.url);
    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de télécharger" });
    }
  };

  /* ===================== FILTER ===================== */
  const filtered = useMemo(() => rapports, [rapports]);

  /* ===================== RENDER ===================== */
  if (initialLoading) {
    return <LoadingScreen />;
  }

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
        <Text style={styles.title}>Rapports</Text>
        <Text style={styles.subtitle}>Historique des revenus</Text>

        {/* RAPPORTS TOTAL */}
        <View style={styles.searchRow}>
          <View style={styles.reportTotalBox}>

            <View style={styles.reportTotalContent}>
              <FileText size={20} color={COLORS.primary} />
              <Text style={styles.reportTotalLabel}>Rapports total</Text>

            </View>
            <Text style={styles.reportTotalCount}>{filtered.length}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => filterRef.current?.open()}
          >
            <Filter size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* LIST */}
        {filtered.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => openProformaPDF(r)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.ref}>Ref #{r.reference}</Text>
              <Text style={styles.amount}>
                {r.total.toLocaleString()} FCFA
              </Text>
            </View>

            <Info icon={Calendar} label="Date" value={r.date} />
            <Info icon={FileText} label="Type" value={r.type} />
            <Info icon={User} label="Employé" value={r.employe} />
            <Info icon={User} label="Client" value={r.client} />
            <Info icon={Mail} label="Email" value={r.email} />
            <Info icon={Phone} label="Téléphone" value={r.telephone} />

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setSelected(r)} style={styles.actionBtn}>
                <Eye size={18} color={COLORS.white} />
                <Text style={styles.actionMuted}>Voir détails</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadPDF(r)} style={styles.actionBtn1}>
                <Download size={18} color={COLORS.white} />
                <Text style={styles.actionMuted}>Télécharger</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

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

      {/* MODAL DETAILS */}
      <Modal isVisible={!!selected} onBackdropPress={() => setSelected(null)}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Détails du rapport</Text>

          {selected &&
            [
              ["Référence", selected.reference],
              ["Type", selected.type],
              ["Date", selected.date],
              ["Employé", selected.employe],
              ["Client", selected.client],
              ["Email", selected.email],
              ["Téléphone", selected.telephone],
              ["Total", `${selected.total.toLocaleString()} FCFA`],
            ].map(([l, v]) => (
              <View key={l} style={styles.modalRow}>
                <Text style={styles.modalLabel}>{l}</Text>
                <Text style={styles.modalValue}>{v}</Text>
              </View>
            ))}

          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelected(null)}
          >
            <Text style={styles.modalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* PREVIEW PDF - Modal react-native-modal */}
      <Modal
        isVisible={pdfVisible}
        onBackdropPress={() => setPdfVisible(false)}
        style={styles.pdfModal}
        backdropOpacity={0.9}
      >
        <View style={styles.pdfPreviewContainer}>
          <View style={styles.pdfPreviewHeader}>
            <Text style={styles.pdfPreviewTitle}>Aperçu PDF</Text>
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
                  Toast.show({ type: "error", text1: "Erreur", text2: "Impossible d'afficher le PDF" });
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      {/* FILTER SHEET */}
      <Modalize ref={filterRef} adjustToContentHeight>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Filtrer par type</Text>

          {["Vente", "Facture Proforma", "Bon de commande"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.filterOption, typeFilter === t && styles.filterOptionActive]}
              onPress={() => {
                setTypeFilter(t);
                filterRef.current?.close();
                refreshRapports(1, false, true);
              }}
            >
              <Text style={[styles.filterOptionText, typeFilter === t && styles.filterOptionTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.resetFilter}
            onPress={() => {
              setTypeFilter("");
              filterRef.current?.close();
              refreshRapports(1, false, true);
            }}
          >
            <Text style={styles.resetFilterText}>Réinitialiser</Text>
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

  title: { fontSize: 26, fontWeight: "700", color: COLORS.text },
  subtitle: { marginBottom: 16, color: COLORS.muted },

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
  reportTotalContent: { flex: 1, flexDirection:'row' ,gap:10},
  reportTotalLabel: { fontSize: 13, color: COLORS.muted, marginBottom: 2 },
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

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
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

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  ref: { fontWeight: "700", color: COLORS.primary },
  amount: { fontWeight: "700", color: COLORS.success },

  infoRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  infoText: { color: COLORS.text },
  infoValue: { fontWeight: "600" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
    borderColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
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
  actionBtn1: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
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
  actionPrimary: { color: COLORS.primary, fontWeight: "600" },
  actionMuted: { color: COLORS.white },

  modalCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalRow: { marginBottom: 10 },
  modalLabel: { color: COLORS.muted, fontSize: 13 },
  modalValue: { fontWeight: "600", color: COLORS.text },
  modalClose: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalCloseText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },

  sheetContent: { padding: 20, paddingBottom: 28 },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: COLORS.text },
  filterOption: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterOptionActive: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.primary,
  },
  filterOptionText: { fontSize: 15, color: COLORS.text },
  filterOptionTextActive: { color: COLORS.primary, fontWeight: "600" },
  resetFilter: { marginTop: 16, paddingVertical: 12, alignItems: "center" },
  resetFilterText: { color: COLORS.primary, fontWeight: "600", fontSize: 15 },

  pdfModal: { margin: 0, justifyContent: "flex-end" },
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pdfPreviewTitle: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
  pdfCloseBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  pdfCloseText: { color: COLORS.danger, fontSize: 16, fontWeight: "600" },
  pdfPreviewContent: { flex: 1, backgroundColor: "#1a1a1a" },
  pdfViewer: { flex: 1 },
});
