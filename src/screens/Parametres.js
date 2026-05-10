import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  User,
  Users,
  Key,
  FileSignature,
  CreditCard,
  Crown,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  Calendar,
  Users as UsersIcon,
  DollarSign,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import Header from "../componants/Header";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";
import COLORS from "../constants/couleurs";

export default function ParametresScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [abonnement, setAbonnement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const checkAbonnement = async () => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id || !token) return;

    try {
      setLoading(true);

      const response = await api.post(
        "/sellprox/abonnement/check",
        {
          token,
          entreprise_id,
        }
      );

      if (response.data && response.data.resultat) {
        setAbonnement(response.data.resultat);
        Toast.show({ type: "success", text1: "Abonnement", text2: "Vérification réussie" });
      } else if (response.data && response.data.data) {
        setAbonnement(response.data.data);
        Toast.show({ type: "success", text1: "Abonnement", text2: "Vérification réussie" });
      } else {
        setAbonnement(null);
      }

    } catch (error) {
      if (error.response?.status === 401) {
        Toast.show({ type: "error", text1: "Session expirée", text2: "Veuillez vous reconnecter" });
      } else if (error.response?.status === 404) {
        setAbonnement(null);
      } else {
        Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de vérifier l'abonnement" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAbonnement();
  }, [user?.entreprise_id, token]);

  const fetchPlans = async () => {
    navigation.navigate("Abonnements");
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Formater le prix
  const formatPrix = (prix) => {
    if (!prix && prix !== 0) return "N/A";
    return `${Number(prix).toLocaleString()} FCFA`;
  };

  // Vérifier si l'abonnement est actif
  const isAbonnementActif = () => {
    if (!abonnement) return false;

    const statut = abonnement.statut_abonnement || abonnement.statut || abonnement.status;
    return statut === "actif" || statut === "ACTIF" || statut === "1" || statut === 1;
  };

  // Calculer les jours restants
  const getJoursRestants = () => {
    if (!abonnement) return 0;

    const dateFin = abonnement.date_fin || abonnement.end_date;
    if (!dateFin) return 0;

    try {
      const fin = new Date(dateFin);
      const now = new Date();
      const diffTime = fin - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  };

  const statutActif = isAbonnementActif();
  const joursRestants = getJoursRestants();
  const dateDebut = formatDate(abonnement?.date_debut || abonnement?.start_date);
  const dateFin = formatDate(abonnement?.date_fin || abonnement?.end_date);
  const planName = abonnement?.plan_name || abonnement?.nom_plan || "Standard";

  return (
    <View style={styles.container}>

      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header agentName="Agent connecté" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>
            Gestion du compte & abonnement
          </Text>
        </View>

        {/* ===== CARTE ABONNEMENT ===== */}
        <View style={styles.subscriptionCard}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Vérification en cours...</Text>
            </View>
          ) : (
            <>
              {/* Header avec icône */}
              <View style={styles.subscriptionHeader}>
                <View style={styles.iconCircle}>
                  <Crown size={22} color="#000000" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.subscriptionTitle}>
                    {abonnement ? planName : "Aucun abonnement"}
                  </Text>

                  <View style={styles.statusContainer}>
                    {abonnement && statutActif ? (
                      <View style={styles.statusRow}>
                        <CheckCircle size={14} color={COLORS.success} />
                        <Text style={[styles.statusText, { color: COLORS.success }]}>
                          Actif
                        </Text>
                      </View>
                    ) : abonnement ? (
                      <View style={styles.statusRow}>
                        <X size={14} color={COLORS.danger} />
                        <Text style={[styles.statusText, { color: COLORS.danger }]}>
                          Expiré
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Badge de statut */}
                {abonnement && (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: statutActif
                          ? "#DCFCE7"
                          : "#FEE2E2",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: statutActif
                          ? COLORS.success
                          : COLORS.danger,
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      {statutActif ? "ACTIF" : "EXPIRÉ"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Informations textuelles au lieu de la barre de progression */}
              {abonnement && (
                <View style={styles.infoContainer}>
                  {/* Statut détaillé */}
                  <View style={styles.infoRow}>
                    <Clock size={16} color={COLORS.muted} />
                    <Text style={styles.infoLabel}>Statut:</Text>
                    <Text style={[
                      styles.infoValue,
                      { color: statutActif ? COLORS.success : COLORS.danger }
                    ]}>
                      {statutActif ? "Actif" : "Expiré"}
                    </Text>
                  </View>

                  {/* Jours restants */}
                  {statutActif && (
                    <View style={styles.infoRow}>
                      <Calendar size={16} color={COLORS.muted} />
                      <Text style={styles.infoLabel}>Jours restants:</Text>
                      <Text style={styles.infoValue}>
                        {joursRestants} jour{joursRestants > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}

                  {/* Période */}
                  <View style={styles.infoRow}>
                    <Calendar size={16} color={COLORS.muted} />
                    <Text style={styles.infoLabel}>Période:</Text>
                    <Text style={styles.infoValue}>
                      {dateDebut} - {dateFin}
                    </Text>
                  </View>

                  {/* Utilisateurs max (si disponible) */}
                  {abonnement.max_users && (
                    <View style={styles.infoRow}>
                      <UsersIcon size={16} color={COLORS.muted} />
                      <Text style={styles.infoLabel}>Utilisateurs max:</Text>
                      <Text style={styles.infoValue}>{abonnement.max_users}</Text>
                    </View>
                  )}

                  {/* Prix (si disponible) */}
                  {abonnement.prix && (
                    <View style={styles.infoRow}>
                      <DollarSign size={16} color={COLORS.muted} />
                      <Text style={styles.infoLabel}>Prix:</Text>
                      <Text style={styles.infoValue}>{formatPrix(abonnement.prix)}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Message si pas d'abonnement */}
              {!abonnement && (
                <Text style={styles.noSubscriptionText}>
                  Vous n'avez pas encore d'abonnement actif. Souscrivez un plan pour accéder à toutes les fonctionnalités.
                </Text>
              )}

              {/* Actions */}
              <View style={styles.actionsRow}>
                <ActionButton
                  icon={<CreditCard size={18} color={COLORS.white} />}
                  text="Voir les plans"
                  primary={COLORS.white}
                  onPress={fetchPlans}
                />

                <ActionButton
                  icon={<RefreshCw size={18} color={COLORS.primary} />}
                  text="Vérifier"
                  onPress={checkAbonnement}
                />
              </View>
            </>
          )}
        </View>

        {/* ===== MENU ===== */}
        <View style={styles.menuSection}>
         
          <MenuItem
            icon={<Users size={20} color={COLORS.primary} />}
            title="Utilisateurs"
            onPress={() => navigation.navigate("Utilisateurs")}
          />
          <MenuItem
            icon={<Key size={20} color={COLORS.primary} />}
            title="Gestion entreprise"
            onPress={() => navigation.navigate("Entreprise")}
          />
          <MenuItem
            icon={<FileSignature size={20} color={COLORS.primary} />}
            title="Signature"
            onPress={() => navigation.navigate("Signature")}
          />
        </View>
      </ScrollView>

      {/* MODAL DES PLANS D'ABONNEMENT */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Plans d'abonnement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {loadingPlans ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.modalLoadingText}>Chargement des plans...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <View key={plan.id} style={styles.planCard}>
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>{plan.nom}</Text>
                        <View style={styles.planBadge}>
                          <Text style={styles.planPrice}>{formatPrix(plan.prix)}</Text>
                        </View>
                      </View>

                      <Text style={styles.planDescription}>{plan.description}</Text>

                      <View style={styles.planDetails}>
                        <View style={styles.planDetailItem}>
                          <Clock size={16} color={COLORS.primary} />
                          <Text style={styles.planDetailText}>
                            {plan.duree_jours} jours
                          </Text>
                        </View>

                        <View style={styles.planDetailItem}>
                          <UsersIcon size={16} color={COLORS.primary} />
                          <Text style={styles.planDetailText}>
                            {plan.max_users} utilisateur{plan.max_users > 1 ? 's' : ''}
                          </Text>
                        </View>

                        {plan.max_pos && (
                          <View style={styles.planDetailItem}>
                            <CreditCard size={16} color={COLORS.primary} />
                            <Text style={styles.planDetailText}>
                              {plan.max_pos} point{plan.max_pos > 1 ? 's' : ''} de vente
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Indicateur si c'est le plan actuel */}
                      {abonnement && statutActif && planName === plan.nom && (
                        <View style={styles.currentPlanBadge}>
                          <CheckCircle size={14} color={COLORS.success} />
                          <Text style={styles.currentPlanText}>Plan actuel</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={() => {
                          setModalVisible(false);
                          // Naviguer vers l'écran de souscription avec le plan sélectionné
                          navigation.navigate("Abonnements", { plan });
                        }}
                      >
                        <Text style={styles.subscribeButtonText}>Souscrire</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noPlansText}>Aucun plan disponible</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===== COMPOSANTS ===== */

const MenuItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      {icon}
      <Text style={styles.menuText}>{title}</Text>
    </View>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
);

const ActionButton = ({ icon, text, primary, onPress }) => (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      primary && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    ]}
    onPress={onPress}
  >
    {icon}
    <Text
      style={[
        styles.actionText,
        primary && { color: "#000000" },
      ]}
    >
      {text}
    </Text>
  </TouchableOpacity>
);

/* ===== STYLES ===== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 14,
  },

  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 14,
  },

  subscriptionCard: {
    margin: 16,
    padding: 22,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  subscriptionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  statusContainer: {
    marginTop: 2,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },

  infoContainer: {
    marginTop: 10,
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  infoLabel: {
    fontSize: 13,
    color: COLORS.muted,
    width: 100,
  },

  infoValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
    flex: 1,
  },

  noSubscriptionText: {
    marginTop: 15,
    marginBottom: 10,
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  actionText: {
    fontWeight: "600",
    color: COLORS.text,
    fontSize: 13,
  },

  menuSection: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },

  menuItem: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  menuText: {
    fontWeight: "600",
    fontSize: 15,
    color: COLORS.text,
  },

  arrow: {
    fontSize: 22,
    color: COLORS.muted,
  },

  // Styles du modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  modalScroll: {
    padding: 20,
  },

  modalLoading: {
    padding: 40,
    alignItems: "center",
  },

  modalLoadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 14,
  },

  planCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  planBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  planPrice: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  planDescription: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 12,
  },

  planDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 15,
  },

  planDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  planDetailText: {
    color: COLORS.text,
    fontSize: 12,
  },

  currentPlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },

  currentPlanText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "600",
  },

  subscribeButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  subscribeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  noPlansText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 16,
    padding: 30,
  },
});