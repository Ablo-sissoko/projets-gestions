import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import Modal from "react-native-modal";
import { useNavigation } from "@react-navigation/native";
import { Search, Plus, Edit, User, X, Calendar, ArrowLeft } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import COLORS from "../constants/couleurs";

function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "";
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function parseDate(str) {
    if (!str || typeof str !== "string") return null;
    const trimmed = str.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(/[/\-.]/);
    if (parts.length === 3) {
        const a = parseInt(parts[0], 10);
        const b = parseInt(parts[1], 10) - 1;
        const c = parseInt(parts[2], 10);
        if (isNaN(a) || isNaN(b) || isNaN(c)) return null;
        let day, month, year;
        if (a > 31) {
            year = a;
            month = b;
            day = c;
        } else {
            day = a;
            month = b;
            year = c;
        }
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
    }
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) return new Date(parsed);
    return null;
}

export default function UtilisateursScreen() {
    const navigation = useNavigation();
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [saving, setSaving] = useState(false);

    const [filters, setFilters] = useState({
        email: "",
        status: "",
        profession: "",
    });

    const [form, setForm] = useState({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        profil: "", // Changé de "profession" à "profil" pour correspondre au backend
        dateNaissance: "",
        ville: "",
        adresse: "",
    });

    const [formErrors, setFormErrors] = useState({});
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [dobDate, setDobDate] = useState(() => new Date(2000, 0, 1));

    /* ================= FETCH USERS ================= */
    const fetchUsers = async () => {
        const entreprise_id = user?.entreprise_id;
        if (!entreprise_id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(
                "/sellprox/utilisateurs/search",
                {
                    entreprise_id,
                    totalPage: 1,
                    email: filters.email,
                    status: filters.status,
                    profession: filters.profession,
                }
            );

            if (res.data.status === 1) {
                setUsers(res.data.resultat || []);
            } else {
                Toast.show({ type: "error", text1: "Erreur", text2: res.data.msg || "Erreur serveur" });
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de charger les utilisateurs" });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, [user?.entreprise_id, filters.email, filters.status, filters.profession]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    };

    /* ================= VALIDATION FORMULAIRE ================= */
    const validateForm = () => {
        const errors = {};

        if (!form.nom.trim()) errors.nom = "Le nom est requis";
        if (!form.prenom.trim()) errors.prenom = "Le prénom est requis";
        if (!form.email.trim()) {
            errors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            errors.email = "L'email n'est pas valide";
        }
        if (!form.telephone.trim()) errors.telephone = "Le téléphone est requis";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /* ================= SAVE ================= */
    const saveUser = async () => {
        if (!validateForm()) {
            Toast.show({ type: "error", text1: "Erreur", text2: "Veuillez remplir tous les champs obligatoires" });
            return;
        }

        const entreprise_id = user?.entreprise_id;
        if (!entreprise_id) {
            Toast.show({ type: "error", text1: "Erreur", text2: "Session expirée. Veuillez vous reconnecter." });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                entreprise_id,
                nom: form.nom.trim(),
                prenom: form.prenom.trim(),
                email: form.email.trim().toLowerCase(),
                dateNaissance: form.dateNaissance || "",
                ville: form.ville || "",
                adresse: form.adresse || "",
                telephone: form.telephone.trim(),
                profil: form.profil,
                profession: form.profil, // le backend attend aussi "profession" (app.php)
            };

            let response;

            if (editingUser) {
                response = await api.post(
                    `/sellprox/utilisateurs/update/${editingUser.id}`,
                    payload
                );
            } else {
                response = await api.post(
                    "/sellprox/register",
                    payload
                );
            }

            // Le backend peut renvoyer du HTML (warning PHP) + JSON : extraire le JSON si besoin
            let data = response.data;
            if (typeof data === "string") {
                const jsonStart = data.lastIndexOf("{");
                if (jsonStart !== -1) {
                    try {
                        data = JSON.parse(data.slice(jsonStart));
                    } catch (_) {
                        data = { status: 0, msg: "Réponse serveur invalide" };
                    }
                } else {
                    data = { status: 0, msg: "Réponse serveur invalide" };
                }
            }

            if (data.status === 1) {
                Toast.show({
                    type: "success",
                    text1: "Succès",
                    text2: editingUser ? "Utilisateur modifié" : "Utilisateur créé",
                });
                setModalVisible(false);
                resetForm();
                fetchUsers();
            } else {
                Toast.show({ type: "error", text1: "Erreur", text2: data.msg || "Une erreur est survenue" });
            }
        } catch (error) {
            if (error.response) {
                const errorMsg = error.response.data?.msg ||
                    error.response.data?.message ||
                    `Erreur ${error.response.status}`;
                Toast.show({ type: "error", text1: "Erreur", text2: errorMsg });
            } else if (error.request) {
                Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de contacter le serveur" });
            } else {
                Toast.show({ type: "error", text1: "Erreur", text2: "Erreur lors de l'enregistrement" });
            }
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            profil: "",
            dateNaissance: "",
            ville: "",
            adresse: "",
        });
        setFormErrors({});
        setShowDobPicker(false);
    };

    const openCreate = () => {
        setEditingUser(null);
        resetForm();
        setModalVisible(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setForm({
            nom: user.nom || "",
            prenom: user.prenom || "",
            email: user.email || "",
            telephone: user.telephone || "",
            profil: user.profil || user.profession || "COMPTABILITE",
            dateNaissance: user.dateNaissance || "",
            ville: user.ville || "",
            adresse: user.adresse || "",
        });
        setFormErrors({});
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetForm();
        setEditingUser(null);
    };

    /* ================= STATUS COLOR ================= */
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
            case "actif":
                return { backgroundColor: COLORS.success };
            case "blocked":
            case "bloqué":
                return { backgroundColor: COLORS.danger };
            case "pending":
            case "en_attente":
                return { backgroundColor: COLORS.warning };
            default:
                return { backgroundColor: COLORS.muted };
        }
    };

    /* ================= RENDER ITEM ================= */
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <User size={20} color="#000000" />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                        {item.nom} {item.prenom}
                    </Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>

                <View style={[styles.badge, getStatusStyle(item.status)]}>
                    <Text style={styles.badgeText}>
                        {item.status || "inconnu"}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.profession}>
                    {item.profil || item.profession || "Non défini"}
                </Text>

                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEdit(item)}
                >
                    <Edit size={16} color="#000000" />
                </TouchableOpacity>
            </View>
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
            <View style={styles.simpleHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.simpleHeaderTitle}>Utilisateurs</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text style={styles.title}>Gestion des utilisateurs</Text>

                {/* FILTRES */}
                <View style={styles.searchBox}>
                    <Search size={18} color={COLORS.muted} />
                    <TextInput
                        placeholder="Rechercher par email..."
                        placeholderTextColor={COLORS.muted}
                        style={{ flex: 1, paddingVertical: 8 }}
                        value={filters.email}
                        onChangeText={(t) => setFilters({ ...filters, email: t })}
                    />
                </View>

                {/* LISTE DES UTILISATEURS */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : users.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <User size={50} color={COLORS.muted} />
                        <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        renderItem={renderItem}
                        scrollEnabled={false}
                    />
                )}
            </ScrollView>

            {/* BOUTON FLOATING ACTION */}
            <TouchableOpacity style={styles.fab} onPress={openCreate}>
                <Plus size={26} color="#000000" />
            </TouchableOpacity>

            {/* MODAL DE CRÉATION/ÉDITION */}
            <Modal
                isVisible={modalVisible}
                onBackdropPress={closeModal}
                onBackButtonPress={closeModal}
                avoidKeyboard={true}
            >
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                        </Text>
                        <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                            <X size={20} color={COLORS.muted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <TextInput
                            placeholder="Nom "
                            placeholderTextColor={COLORS.muted}
                            style={[styles.input, formErrors.nom && styles.inputError]}
                            value={form.nom}
                            onChangeText={(t) => setForm({ ...form, nom: t })}
                        />
                        {formErrors.nom && <Text style={styles.errorText}>{formErrors.nom}</Text>}

                        <TextInput
                            placeholder="Prénom "
                            placeholderTextColor={COLORS.muted}
                            style={[styles.input, formErrors.prenom && styles.inputError]}
                            value={form.prenom}
                            onChangeText={(t) => setForm({ ...form, prenom: t })}
                        />
                        {formErrors.prenom && <Text style={styles.errorText}>{formErrors.prenom}</Text>}

                        <TextInput
                            placeholder="Email "
                            placeholderTextColor={COLORS.muted}
                            style={[styles.input, formErrors.email && styles.inputError]}
                            value={form.email}
                            onChangeText={(t) => setForm({ ...form, email: t })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

                        <TextInput
                            placeholder="Téléphone "
                            placeholderTextColor={COLORS.muted}
                            style={[styles.input, formErrors.telephone && styles.inputError]}
                            value={form.telephone}
                            onChangeText={(t) => setForm({ ...form, telephone: t })}
                            keyboardType="phone-pad"
                        />
                        {formErrors.telephone && <Text style={styles.errorText}>{formErrors.telephone}</Text>}

                        <Text style={styles.label}>Date de naissance</Text>
                        <TouchableOpacity
                            style={styles.dateTouchable}
                            onPress={() => {
                                const parsed = parseDate(form.dateNaissance || "");
                                setDobDate(parsed || new Date(2000, 0, 1));
                                setShowDobPicker(true);
                            }}
                        >
                            <Calendar size={18} color={COLORS.muted} />
                            <Text style={[styles.dateTouchableText, !form.dateNaissance && styles.datePlaceholder]}>
                                {form.dateNaissance ? (formatDate(parseDate(form.dateNaissance)) || form.dateNaissance) : "Choisir une date"}
                            </Text>
                        </TouchableOpacity>
                        {showDobPicker && (
                            <>
                                <DateTimePicker
                                    value={dobDate}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    maximumDate={new Date()}
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === "android") setShowDobPicker(false);
                                        if (selectedDate) {
                                            setDobDate(selectedDate);
                                            setForm((prev) => ({ ...prev, dateNaissance: formatDate(selectedDate) }));
                                        }
                                    }}
                                />
                                {Platform.OS === "ios" && (
                                    <TouchableOpacity style={styles.dateConfirmBtn} onPress={() => setShowDobPicker(false)}>
                                        <Text style={styles.dateConfirmText}>Valider la date</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        <TextInput
                            placeholder="Ville"
                            placeholderTextColor={COLORS.muted}
                            style={styles.input}
                            value={form.ville}
                            onChangeText={(t) => setForm({ ...form, ville: t })}
                        />

                        <TextInput
                            placeholder="Adresse"
                            placeholderTextColor={COLORS.muted}
                            style={styles.input}
                            value={form.adresse}
                            onChangeText={(t) => setForm({ ...form, adresse: t })}
                        />

                        <Text style={styles.label}>Profil </Text>
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.roleBtn,
                                    form.profil === "ADMIN" && styles.roleActive,
                                ]}
                                onPress={() => setForm({ ...form, profil: "ADMIN" })}
                            >
                                <Text style={form.profil === "ADMIN" ? styles.roleActiveText : styles.roleText}>
                                    ADMIN
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleBtn,
                                    form.profil === "COMPTABILITE" && styles.roleActive,
                                ]}
                                onPress={() => setForm({ ...form, profil: "COMPTABILITE" })}
                            >
                                <Text style={form.profil === "COMPTABILITE" ? styles.roleActiveText : styles.roleText}>
                                    COMPTABILITÉ
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleBtn,
                                    form.profil === "COMMERCIAL" && styles.roleActive,
                                ]}
                                onPress={() => setForm({ ...form, profil: "COMMERCIAL" })}
                            >
                                <Text style={form.profil === "COMMERCIAL" ? styles.roleActiveText : styles.roleText}>
                                    COMMERCIAL
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={saveUser}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveText}>
                                    {editingUser ? "Mettre à jour" : "Enregistrer"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
        </KeyboardAvoidingView>
    );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg
    },
    simpleHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === "android" ? 36 : 12,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    simpleHeaderTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 20,
        color: COLORS.text,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 14,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 10,
    },
    card: {
        backgroundColor: COLORS.card,
        padding: 18,
        borderRadius: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text
    },
    email: {
        color: COLORS.muted,
        fontSize: 13,
        marginTop: 2
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    footer: {
        marginTop: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
    },
    profession: {
        color: COLORS.muted,
        fontWeight: "600",
        fontSize: 14,
    },
    editBtn: {
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 8,
    },
    fab: {
        position: "absolute",
        bottom: 30,
        right: 25,
        backgroundColor: COLORS.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modal: {
        backgroundColor: COLORS.card,
        padding: 22,
        borderRadius: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
    },
    closeBtn: {
        padding: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        fontSize: 14,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 5,
    },
    dateTouchable: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
    },
    dateTouchableText: {
        fontSize: 15,
        color: COLORS.text,
    },
    datePlaceholder: {
        color: COLORS.muted,
    },
    dateConfirmBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 16,
    },
    dateConfirmText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    roleContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 20,
        gap: 10,
    },
    roleBtn: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: COLORS.card,
        fontWeight: "700",
    },
    roleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    roleText: {
        color: COLORS.text,
        fontWeight: "500",
        fontSize: 11,
    },
    roleActiveText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 11,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveText: {
        color: "#000000",
        fontWeight: "700",
        fontSize: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.muted,
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.muted,
        fontSize: 16,
    },
});