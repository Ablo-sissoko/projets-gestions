import React, { useCallback, useContext, useMemo, useRef, useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import Modal from "react-native-modal"
import { Modalize } from "react-native-modalize"
import {
  Plus,
  Filter,
  Eye,
  Pencil,
  Hash,
  Wallet,
  Calendar,
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react-native"
import Header from "../componants/Header"
import { AuthContext } from "../context/AuthContext"
import api from "../api/Axios"
import LoadingScreen from "../componants/LoadingScreen"
import Toast from "react-native-toast-message"
import COLORS from "../constants/couleurs"

/* ===================== COMPONENT ===================== */
export default function ComptesScreen() {
  const { user } = useContext(AuthContext)
  const [comptes, setComptes] = useState([])
  const [filterStatut, setFilterStatut] = useState("")
  const [viewCompte, setViewCompte] = useState(null)
  const [editMode, setEditMode] = useState("add")
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const sheetRef = useRef(null)
  const filterRef = useRef(null)

  const [form, setForm] = useState({
    nom: "",
    numero: "",
    solde: "",
    commentaire: "",
  })

  useEffect(() => {
    refreshComptes(1, false, false);
  }, [user?.entreprise_id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshComptes(1, false, true);
    }, 350);
    return () => clearTimeout(timeout);
  }, [filterStatut]);

  const filteredComptes = useMemo(() => {
    return comptes.filter((c) => !filterStatut || c.statut === filterStatut)
  }, [comptes, filterStatut])

  /* ===================== ACTIONS ===================== */
  const openAdd = async () => {
    setEditMode("add");
    setForm({
      nom: "",
      numero: "",
      solde: "",
      commentaire: "",
    })
    requestAnimationFrame(() => {
      sheetRef.current?.open()
    })
  }

  const openEdit = (c) => {
    setEditMode("edit")
    setForm({
      ...c,
      solde: String(c.solde),
      statut: c.statut,
    })
    requestAnimationFrame(() => {
      sheetRef.current?.open()
    })
  }

  const saveCompte = async () => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Session invalide" });
      return;
    }
    if (!form.nom || !form.numero) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez remplir le nom et le numéro du compte",
      });
      return;
    }

    const payload = {
      num_compte: form.numero,
      nom_compte: form.nom,
      solde_initiale: form.solde || "0",
      commentaire: form.commentaire || "",
      entreprise_id,
    };

    if (editMode === "edit" && form.statut) {
      payload.status = form.statut === "Actif" ? 1 : 0;
    }

    try {
      if (editMode === "add") {
        const response = await api.post(
          "/sellprox/comptabilite/compte/create",
          payload
        );

        if (response.data?.status === 1) {
          Toast.show({
            type: "success",
            text1: "Succès",
            text2: "Compte créé avec succès",
          });
          await refreshComptes(1, false, false);
        }
      } else {
        const response = await api.post(
          `/sellprox/comptabilite/compte/update/${form.id}`,
          payload
        );

        if (response.data?.status === 1) {
          Toast.show({
            type: "success",
            text1: "Succès",
            text2: "Compte modifié avec succès",
          });
          await refreshComptes(1, false, false);
        }
      }

      sheetRef.current?.close();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Une erreur est survenue",
      });
    }
  };

  const resetFilters = () => {
    setFilterStatut("")
  }

  const refreshComptes = async (page = 1, append = false, isSearch = false) => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) {
      setInitialLoading(false);
      setLoadingMore(false);
      return;
    }
    setLoadingMore(true);
    try {
      const response = await api.post(
        "/sellprox/comptabilite/compte/search",
        {
          totalPage: String(page),
          num_compte: "",
          nom_compte: "",
          status:
            filterStatut === "Actif"
              ? "1"
              : filterStatut === "Désactivé"
                ? "0"
                : "",
          entreprise_id,
        }
      );

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : [];

      const formatted = results.map((item) => ({
        id: item.id,
        nom: item.nom_compte,
        numero: item.num_compte,
        solde: Number(item.solde_initiale) || 0,
        statut: item.status === 1 ? "Actif" : "Désactivé",
        commentaire: item.commentaire,
        createdAt: item.dateEnreg,
        updatedAt: item.dateModif,
      }));

      const nextPage = Number(response.data?.currentPage || page);
      const nextTotal = Number(response.data?.totalPages || 1);

      setCurrentPage(nextPage);
      setTotalPages(nextTotal);
      setComptes((prev) => (append ? [...prev, ...formatted] : formatted));
    } catch (error) {
      console.log("ERREUR REFRESH:", error.response?.data || error.message);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore) return;
    if (currentPage >= totalPages) return;
    refreshComptes(currentPage + 1, true);
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshComptes(1, false, false);
      Toast.show({
        type: "success",
        text1: "Liste actualisée",
        text2: "Comptes récupérés",
      });
    } catch (_) { }
    finally {
      setRefreshing(false);
    }
  }, [filterStatut]);

  const StatusBadge = ({ status }) => {
    const isActive = status === "Actif";
    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: isActive
              ? "rgba(16,185,129,0.12)"
              : "rgba(239,68,68,0.08)",
          },
        ]}
      >
        {isActive ? (
          <CheckCircle size={14} color={COLORS.success} />
        ) : (
          <XCircle size={14} color={COLORS.danger} />
        )}
        <Text
          style={[
            styles.statusText,
            { color: isActive ? COLORS.success : COLORS.danger },
          ]}
        >
          {status}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.nom}</Text>
        <StatusBadge status={item.statut} />
      </View>

      <Info icon={Hash} label="N° Compte" value={item.numero} />
      <Info
        icon={Wallet}
        label="Solde"
        value={`${item.solde.toLocaleString()} FCFA`}
      />
      <Info icon={Calendar} label="Modifié" value={item.updatedAt} />
      <Info icon={Calendar} label="Créé" value={item.createdAt} />

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setViewCompte(item)} style={styles.actionBtn1}>
          <Eye size={18} color={COLORS.white} />
          <Text style={styles.actionPrimary}>Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
          <Pencil size={18} color={COLORS.white} />
          <Text style={styles.actionMuted}>Modifier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.title}>Comptes</Text>
          <Text style={styles.subtitle}>
            Gestion des comptes financiers
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openAdd}>
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.addButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { flex: 1 }]}>
          <Text style={styles.totalLabel}>Total comptes</Text>
          <Text style={styles.totalCount}>{comptes.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => filterRef.current?.open()}
        >
          <Filter size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <Text style={{ color: COLORS.muted, fontSize: 16 }}>Aucun compte trouvé</Text>
    </View>
  );

  /* ===================== RENDER ===================== */
  if (initialLoading) {
    return <LoadingScreen message="Chargement des comptes..." />;
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
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        data={filteredComptes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />

      {/* Pagination Button */}
      {currentPage < totalPages && !loadingMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreText}>
            {loadingMore ? "Chargement..." : "Charger plus"}
          </Text>
        </TouchableOpacity>
      )}

      {/* VIEW MODAL */}
      <Modal isVisible={!!viewCompte} onBackdropPress={() => setViewCompte(null)}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Détails du compte</Text>
          {viewCompte &&
            [
              ["Nom", viewCompte.nom, null],
              ["Numéro", viewCompte.numero, null],
              ["Solde", `${viewCompte.solde.toLocaleString()} FCFA`, null],
              ["Statut", viewCompte.statut, "badge"],
              ["Commentaire", viewCompte.commentaire || "-", null],
              ["Créé", viewCompte.createdAt, null],
              ["Mis à jour", viewCompte.updatedAt, null],
            ].map(([l, v, type]) => (
              <View key={l} style={styles.modalRow}>
                <Text style={styles.modalLabel}>{l}</Text>
                {type === "badge" ? (
                  <StatusBadge status={v} />
                ) : (
                  <Text style={styles.modalValue}>{v}</Text>
                )}
              </View>
            ))}

          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setViewCompte(null)}
          >
            <Text style={styles.modalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ADD / EDIT */}
      <Modalize
        ref={sheetRef}
        adjustToContentHeight
        modalStyle={styles.modalize}
        handleStyle={styles.handle}
        overlayStyle={styles.overlay}
        openAnimationConfig={{ timing: { duration: 380 } }}
        closeAnimationConfig={{ timing: { duration: 320 } }}
        withHandle
        panGestureEnabled
        closeOnOverlayTap
      >

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetTitle}>
            {editMode === "add"
              ? "Nouveau compte"
              : "Modifier le compte"}
          </Text>

          {[
            ["nom", "Nom du compte"],
            ["numero", "Numéro"],
            ["solde", "Solde initial"],
            ["commentaire", "Commentaire"],
          ].map(([field, label]) => (
            <TextInput
              key={field}
              placeholder={label}
              style={styles.sheetInput}
              value={form[field]?.toString()}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, [field]: v }))
              }
              keyboardType={field === "solde" ? "numeric" : "default"}
              placeholderTextColor={COLORS.muted}
            />
          ))}

          {editMode === "edit" && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Statut du compte</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    form.statut === "Actif" && styles.statusButtonActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, statut: "Actif" }))}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      form.statut === "Actif" && styles.statusButtonTextActive,
                    ]}
                  >
                    Actif
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    form.statut === "Désactivé" && styles.statusButtonInactive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, statut: "Désactivé" }))}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      form.statut === "Désactivé" && styles.statusButtonTextInactive,
                    ]}
                  >
                    Désactivé
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.sheetButton}
            onPress={saveCompte}
          >
            <Text style={styles.sheetButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        </ScrollView>

      </Modalize>

      {/* FILTER MODAL */}
      <Modalize
        ref={filterRef}
        adjustToContentHeight
        modalStyle={styles.modalize}
        handleStyle={styles.handle}
        overlayStyle={styles.overlay}
        openAnimationConfig={{ timing: { duration: 380 } }}
        closeAnimationConfig={{ timing: { duration: 320 } }}
        withHandle
        panGestureEnabled
        closeOnOverlayTap
      >
        <View style={styles.filterSheetContent}>
          {/* Header avec icône */}
          <View style={styles.filterHeader}>
            <Filter size={20} color={COLORS.primary} />
            <Text style={styles.filterHeaderTitle}>Filtrer les comptes</Text>
            <TouchableOpacity onPress={() => filterRef.current?.close()}>
              <Text style={styles.filterCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {/* Section Statut */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Statut</Text>
            <View style={styles.filterChips}>
              {["Actif", "Désactivé"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.filterChip,
                    filterStatut === s && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setFilterStatut(s)
                    filterRef.current?.close()
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterStatut === s && styles.filterChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Séparateur */}
          <View style={styles.filterDivider} />

          {/* Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.filterResetBtn}
              onPress={() => {
                resetFilters()
                filterRef.current?.close()
              }}
            >
              <RotateCcw size={16} color={COLORS.muted} />
              <Text style={styles.filterResetText}>Réinitialiser</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterApplyBtn}
              onPress={() => filterRef.current?.close()}
            >
              <Text style={styles.filterApplyText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
    </View>
    </KeyboardAvoidingView>
  )
}

/* ===================== INFO ===================== */
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
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },

  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.text },
  subtitle: { marginTop: 4, color: COLORS.muted },

  addButton: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  addButtonText: { color: COLORS.white, fontWeight: "600" },

  searchRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalLabel: { fontSize: 15, color: COLORS.muted, fontWeight: "500" },
  totalCount: { fontSize: 17, color: COLORS.text, fontWeight: "700" },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  statusBadge: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: "center",
  },
  statusText: { fontSize: 12, fontWeight: "700" },

  infoRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  infoText: { color: COLORS.text },
  infoValue: { fontWeight: "600" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.card,
  },
  actionPrimary: { color: COLORS.white, fontWeight: "600" },
  actionMuted: { color: COLORS.white },

  loadMoreButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  loadMoreText: { color: COLORS.primary, fontWeight: "700" },

  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  modalRow: { marginBottom: 10 },
  modalLabel: { fontSize: 12, color: COLORS.muted },
  modalValue: { fontWeight: "600" },

  modalize: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: COLORS.card,
  },
  handle: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginTop: 10,
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetScroll: { flexGrow: 0 },
  sheetContent: { padding: 20, paddingBottom: 32, gap: 12 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  sheetInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sheetButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  sheetButtonText: { color: COLORS.white, fontWeight: "700" },
  filterOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterText: { fontSize: 16 },
  resetFilter: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetFilterText: { color: COLORS.primary, fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: COLORS.text, fontWeight: "600" },
  modalClose: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseText: { color: COLORS.white, fontWeight: "600" },
  statusContainer: {
    marginVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8,
    fontWeight: "500",
  },
  statusButtons: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  statusButtonActive: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.primary,
  },
  statusButtonInactive: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.danger,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },
  statusButtonTextActive: {
    color: COLORS.white,
  },
  statusButtonTextInactive: {
    color: COLORS.danger,
  },
  // Nouveaux styles pour le filtre redesigné
  filterSheetContent: {
    padding: 20,
    backgroundColor: COLORS.card,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginLeft: 12,
  },
  filterCloseText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 12,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bg,
  },
  filterChipText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.muted,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  filterResetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  filterResetText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.muted,
  },
  filterApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterApplyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
})