import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from "react-native"
import Modal from "react-native-modal"
import { Modalize } from "react-native-modalize"
import DateTimePicker from "@react-native-community/datetimepicker"
import {
  Plus,
  ArrowRightLeft,
  Calendar,
  X,
  Search,
  Filter,
  FileText,
  Pencil,
  Eye,
} from "lucide-react-native"
import Header from "../componants/Header"
import { AuthContext } from "../context/AuthContext"
import api from "../api/Axios"
import LoadingScreen from "../componants/LoadingScreen"
import Toast from "react-native-toast-message"
import COLORS from "../constants/couleurs"

/* ===================== MODAL COMPTE ===================== */
const CompteModal = ({ visible, title, options, onSelect, onClose }) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modalCenter}
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropOpacity={0.5}
      useNativeDriver={true}
    >
      <View style={styles.modalCenterContent}>
        <View style={styles.modalCenterHeader}>
          <Text style={styles.modalCenterTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.modalCenterItem}
              onPress={() => {
                onSelect(option)
                onClose()
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCenterItemText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

/* ===================== COMPONENT ===================== */
export default function TransfertsScreen() {
  const { user } = useContext(AuthContext)
  const [transferts, setTransferts] = useState([])
  const [comptesList, setComptesList] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewTransfert, setViewTransfert] = useState(null)
  const [editMode, setEditMode] = useState("add")
  const [form, setForm] = useState({
    from: "",
    to: "",
    date: "",
    montant: "",
    commentaire: "",
  })
  const [showFromModal, setShowFromModal] = useState(false)
  const [showToModal, setShowToModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [filterForm, setFilterForm] = useState({
    from: "",
    to: "",
    dateDebut: "",
    dateFin: "",
  })
  const [showFilterFromModal, setShowFilterFromModal] = useState(false)
  const [showFilterToModal, setShowFilterToModal] = useState(false)
  const [showFilterDateDebutPicker, setShowFilterDateDebutPicker] = useState(false)
  const [showFilterDateFinPicker, setShowFilterDateFinPicker] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const bottomSheetRef = useRef(null)
  const filterSheetRef = useRef(null)

  const fetchComptes = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) return
    try {
      const response = await api.post("/sellprox/comptabilite/compte/search", {
        totalPage: "1",
        num_compte: "",
        nom_compte: "",
        status: "",
        entreprise_id,
      });

      const results = Array.isArray(response.data?.resultat)
        ? response.data.resultat
        : [];

      const formatted = results.map((item) => ({
        id: String(item.id),
        name: item.nom_compte || item.num_compte || `Compte ${item.id}`,
      }));

      setComptesList(formatted);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Impossible de charger les comptes",
      });
      throw error;
    }
  };

  const fetchTransferts = async (withLoading = false) => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      if (withLoading) setInitialLoading(false)
      return
    }
    try {
      if (withLoading) {
        setInitialLoading(true);
      }
      const response = await api.post("/sellprox/comptabilite/compte/transfert/search", {
        totalPage: "1",
        sender_id: "",
        recever_id: "",
        dateDepart: "",
        dateFin: "",
        entreprise_id,
      });

      const formatted = response.data.resultat.map((item) => ({
        id: String(item.id),
        from: item.sender_name,
        to: item.recever_name,
        date: item.date,
        amount: Number(item.montant) || 0,
        commentaire: item.commentaire,
        createdAt: item.dateEnreg,
        dateEnreg: item.dateEnreg,
        dateModif: item.dateModif,
      }));

      setTransferts(formatted);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || error.message || "Impossible de charger les transferts",
      });
      throw error;
    } finally {
      if (withLoading) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTransferts(true).catch(() => {});
    fetchComptes().catch(() => {});
  }, [user?.entreprise_id]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTransferts(false), fetchComptes()]);
      Toast.show({
        type: "success",
        text1: "Liste actualisée",
        text2: "Transferts récupérés",
      });
    } catch (_) {}
    finally {
      setRefreshing(false);
    }
  }, []);

  // Filtrage local instantané
  const filteredTransferts = useMemo(() => {
    if (!searchQuery.trim()) return transferts

    const query = searchQuery.toLowerCase().trim()
    return transferts.filter((t) => {
      return (
        (t.from?.toLowerCase() || '').includes(query) ||
        (t.to?.toLowerCase() || '').includes(query) ||
        (t.id?.toLowerCase() || '').includes(query) ||
        (t.commentaire?.toLowerCase() || '').includes(query)
      )
    })
  }, [transferts, searchQuery])

  // Filtres supplémentaires
  const finalFilteredTransferts = useMemo(() => {
    let filtered = filteredTransferts

    if (filterForm.from) {
      filtered = filtered.filter(t => t.from === filterForm.from)
    }
    if (filterForm.to) {
      filtered = filtered.filter(t => t.to === filterForm.to)
    }
    if (filterForm.dateDebut) {
      filtered = filtered.filter(t => t.date >= filterForm.dateDebut)
    }
    if (filterForm.dateFin) {
      filtered = filtered.filter(t => t.date <= filterForm.dateFin)
    }

    return filtered
  }, [filteredTransferts, filterForm])

  const total = useMemo(
    () => finalFilteredTransferts.reduce((sum, t) => sum + t.amount, 0),
    [finalFilteredTransferts]
  )

  const openAdd = () => {
    setEditMode("add")
    setForm({
      from: "",
      to: "",
      date: new Date().toISOString().split("T")[0],
      montant: "",
      commentaire: "",
    })
    bottomSheetRef.current?.open()
  }

  const openEdit = (transfert) => {
    setEditMode("edit")
    setForm({
      id: transfert.id,
      from: transfert.from,
      to: transfert.to,
      date: transfert.date,
      montant: String(transfert.amount),
      commentaire: transfert.commentaire || "",
      createdAt: transfert.createdAt,
    })
    bottomSheetRef.current?.open()
  }

  const openFilters = () => {
    filterSheetRef.current?.open()
  }

  const saveTransfert = async () => {
    const entreprise_id = user?.entreprise_id
    if (!entreprise_id) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Session invalide" })
      return
    }
    const employeeName =
      `${user?.prenom || ""} ${user?.nom || ""}`.trim() || "Employé"

    try {
      if (editMode === "add") {
        const sender = comptesList.find((c) => c.name === form.from)
        const recever = comptesList.find((c) => c.name === form.to)

        const payload = {
          sender_id: sender?.id || "",
          recever_id: recever?.id || "",
          sender_name: form.from || sender?.name || "",
          recever_name: form.to || recever?.name || "",
          employee_name: employeeName,
          montant: String(form.montant || ""),
          date: form.date || "",
          commentaire: form.commentaire || "",
          entreprise_id,
        }

        const response = await api.post(
          "/sellprox/comptabilite/compte/transfert/create",
          payload
        )

        if (response.data?.status === 1) {
          bottomSheetRef.current?.close()
          await fetchTransferts(false)
          Toast.show({
            text1: "Succès",
            text2: "Transfert créé avec succès",
            type: "success",
          })
        }
        return
      }

      // Modification - seulement montant et date
      const response = await api.post(
        `/sellprox/comptabilite/compte/transfert/update/${form.id}`,
        {
          montant: String(form.montant || ""),
          date: form.date || "",
          entreprise_id,
        }
      )

      if (response.data?.status === 1) {
        bottomSheetRef.current?.close()
        await fetchTransferts(false)
        Toast.show({
          text1: "Succès",
          text2: "Transfert modifié avec succès",
          type: "success",
        })
      }
    } catch (error) {
      Toast.show({
        text1: "Erreur",
        text2: error.response?.data?.message || "Une erreur est survenue",
        type: "error",
      })
    }
  }

  const resetFilters = () => {
    setFilterForm({
      from: "",
      to: "",
      dateDebut: "",
      dateFin: "",
    })
  }

  const applyFilters = () => {
    filterSheetRef.current?.close()
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.ref}>ID #{item.id}</Text>
        <Text style={styles.amount}>
          {item.amount.toLocaleString()} FCFA
        </Text>
      </View>

      <Info icon={ArrowRightLeft} label="Du compte" value={item.from} />
      <Info icon={ArrowRightLeft} label="Au compte" value={item.to} />
      {item.commentaire ? (
        <Info icon={FileText} label="Commentaire" value={item.commentaire} />
      ) : null}
      <Info icon={Calendar} label="Date" value={item.date} />
      <Info icon={Calendar} label="Créé" value={item.createdAt} />
      <Info icon={Calendar} label="Modifié" value={item.dateModif} />

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setViewTransfert(item)} style={styles.actionBtn1}>
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

  const ListHeader = useMemo(() => {
    return (
      <>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.title}>Transferts</Text>
            <Text style={styles.subtitle}>Transferts entre comptes</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.addButtonText}>Créer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={COLORS.muted} />
            <TextInput
              placeholder="Rechercher par compte, ID, commentaire..."
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={openFilters}>
            <Filter size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total des transferts</Text>
          <Text style={styles.totalAmount}>
            {total.toLocaleString()} FCFA
          </Text>
        </View>
      </>
    )
  }, [searchQuery, total])
  const ListFooter = () => (
    <>
      {finalFilteredTransferts.length === 0 && !initialLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucun transfert trouvé</Text>
        </View>
      )}
    </>
  )

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

      <FlatList
        data={finalFilteredTransferts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {/* Modals Compte centrés */}
      <CompteModal
        visible={showFromModal}
        title="Sélectionner un compte source"
        options={comptesList}
        onSelect={(option) => setForm(prev => ({ ...prev, from: option.name }))}
        onClose={() => setShowFromModal(false)}
      />

      <CompteModal
        visible={showToModal}
        title="Sélectionner un compte destination"
        options={comptesList}
        onSelect={(option) => setForm(prev => ({ ...prev, to: option.name }))}
        onClose={() => setShowToModal(false)}
      />

      <CompteModal
        visible={showFilterFromModal}
        title="Filtrer par compte source"
        options={comptesList}
        onSelect={(option) => setFilterForm(prev => ({ ...prev, from: option.name }))}
        onClose={() => setShowFilterFromModal(false)}
      />

      <CompteModal
        visible={showFilterToModal}
        title="Filtrer par compte destination"
        options={comptesList}
        onSelect={(option) => setFilterForm(prev => ({ ...prev, to: option.name }))}
        onClose={() => setShowFilterToModal(false)}
      />

      {/* Modal Détails */}
      <Modal
        isVisible={!!viewTransfert}
        onBackdropPress={() => setViewTransfert(null)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Détails du transfert</Text>
          {viewTransfert && (
            <>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>ID</Text>
                <Text style={styles.modalValue}>{viewTransfert.id}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Date</Text>
                <Text style={styles.modalValue}>{viewTransfert.date}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Du compte</Text>
                <Text style={styles.modalValue}>{viewTransfert.from}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Au compte</Text>
                <Text style={styles.modalValue}>{viewTransfert.to}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Montant</Text>
                <Text style={styles.modalValue}>{viewTransfert.amount.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Commentaire</Text>
                <Text style={styles.modalValue}>{viewTransfert.commentaire || '-'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Créé le</Text>
                <Text style={styles.modalValue}>{viewTransfert.createdAt}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Modifié le</Text>
                <Text style={styles.modalValue}>{viewTransfert.dateModif || '-'}</Text>
              </View>
            </>
          )}
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setViewTransfert(null)}
          >
            <Text style={styles.modalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* DatePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={form.date ? new Date(form.date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false)
            if (selectedDate) {
              const formatted = selectedDate.toISOString().split("T")[0]
              setForm((p) => ({ ...p, date: formatted }))
            }
          }}
        />
      )}

      {showFilterDateDebutPicker && (
        <DateTimePicker
          value={filterForm.dateDebut ? new Date(filterForm.dateDebut) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowFilterDateDebutPicker(false)
            if (selectedDate) {
              const formatted = selectedDate.toISOString().split("T")[0]
              setFilterForm((p) => ({ ...p, dateDebut: formatted }))
            }
          }}
        />
      )}

      {showFilterDateFinPicker && (
        <DateTimePicker
          value={filterForm.dateFin ? new Date(filterForm.dateFin) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowFilterDateFinPicker(false)
            if (selectedDate) {
              const formatted = selectedDate.toISOString().split("T")[0]
              setFilterForm((p) => ({ ...p, dateFin: formatted }))
            }
          }}
        />
      )}

      {/* Bottom Sheet Ajout/Modification */}
      <Modalize
        ref={bottomSheetRef}
        adjustToContentHeight
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          keyboardShouldPersistTaps: "handled",
        }}
        modalStyle={styles.modalize}
        handleStyle={styles.handle}
        overlayStyle={styles.overlay}
        withHandle
        panGestureEnabled
        closeOnOverlayTap
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sheetScrollContent}
        >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>
            {editMode === "add" ? "Nouveau transfert" : "Modifier le transfert"}
          </Text>

          {editMode === "add" ? (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Du Compte</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowFromModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={!form.from ? styles.selectPlaceholder : styles.selectText}>
                    {form.from || "Sélectionner un compte source"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Au Compte</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowToModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={!form.to ? styles.selectPlaceholder : styles.selectText}>
                    {form.to || "Sélectionner un compte destination"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Commentaire</Text>
                <TextInput
                  style={[styles.sheetInput, styles.textArea]}
                  placeholder="Commentaire"
                  value={form.commentaire}
                  onChangeText={(value) =>
                    setForm((p) => ({ ...p, commentaire: value }))
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={COLORS.muted}
                  textAlignVertical="top"
                />
              </View>
            </>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={18} color={COLORS.muted} />
              <Text style={styles.dateButtonText}>
                {form.date || "Sélectionner une date"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Montant</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Montant"
              value={form.montant}
              onChangeText={(value) =>
                setForm((p) => ({ ...p, montant: value }))
              }
              keyboardType="numeric"
              placeholderTextColor={COLORS.muted}
            />
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonGhost]}
              onPress={() => bottomSheetRef.current?.close()}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetButtonGhostText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetButton}
              onPress={saveTransfert}
              disabled={editMode === "add" ? (!form.from || !form.to || !form.montant) : !form.montant}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </Modalize>

      {/* Bottom Sheet Filtres */}
      <Modalize
        ref={filterSheetRef}
        adjustToContentHeight
        modalStyle={styles.modalize}
        handleStyle={styles.handle}
        overlayStyle={styles.overlay}
        withHandle
        panGestureEnabled
        closeOnOverlayTap
        scrollViewProps={{
          keyboardShouldPersistTaps: 'handled',
          showsVerticalScrollIndicator: false
        }}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Filtrer les transferts</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Du Compte</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowFilterFromModal(true)}
              activeOpacity={0.7}
            >
              <Text style={!filterForm.from ? styles.selectPlaceholder : styles.selectText}>
                {filterForm.from || "Tous les comptes sources"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Au Compte</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowFilterToModal(true)}
              activeOpacity={0.7}
            >
              <Text style={!filterForm.to ? styles.selectPlaceholder : styles.selectText}>
                {filterForm.to || "Tous les comptes destinations"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date début</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFilterDateDebutPicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={18} color={COLORS.muted} />
              <Text style={styles.dateButtonText}>
                {filterForm.dateDebut || "Sélectionner"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date fin</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFilterDateFinPicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={18} color={COLORS.muted} />
              <Text style={styles.dateButtonText}>
                {filterForm.dateFin || "Sélectionner"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonGhost]}
              onPress={() => {
                resetFilters()
                filterSheetRef.current?.close()
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetButtonGhostText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonPrimary]}
              onPress={applyFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
    </View>
    </KeyboardAvoidingView>
  )
}

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
  listContent: { padding: 16, paddingBottom: 30 },

  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    alignItems: "center",
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
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12 },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  totalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: { color: COLORS.muted, fontWeight: "500" },
  totalAmount: { fontSize: 18, fontWeight: "700", color: COLORS.primary },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  ref: { fontWeight: "700", color: COLORS.primary },
  amount: { fontSize: 16, fontWeight: "700", color: COLORS.success },
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  infoText: { color: COLORS.text, fontWeight: "500" },
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

  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: { color: COLORS.muted, fontSize: 16 },

  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalLabel: { fontSize: 12, color: COLORS.muted },
  modalValue: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  modalClose: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseText: { color: COLORS.white, fontWeight: "700" },

  // Styles pour les modals centrés
  modalCenter: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCenterContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: "80%",
    maxHeight: "70%",
    padding: 16,
  },
  modalCenterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCenterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  modalCenterItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCenterItemText: {
    fontSize: 16,
    color: COLORS.text,
  },

  // Styles Modalize
  modalize: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
  sheetScrollContent: {
    paddingBottom: 24,
  },
  sheetContent: { padding: 20, gap: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  formGroup: { gap: 8 },
  formLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },

  selectButton: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: { color: COLORS.text, fontSize: 15, fontWeight: "500" },
  selectPlaceholder: { color: COLORS.muted, fontSize: 15 },

  dateButton: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateButtonText: { color: COLORS.text, fontSize: 15, flex: 1 },

  sheetInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  sheetActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  sheetButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  sheetButtonPrimary: { backgroundColor: COLORS.primary },
  sheetButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  sheetButtonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetButtonGhostText: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
})