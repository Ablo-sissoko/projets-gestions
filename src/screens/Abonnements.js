import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { Modalize } from "react-native-modalize";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";
import Toast from "react-native-toast-message";
import { Users, Monitor, Calendar, Smartphone, Info } from "lucide-react-native";
import COLORS from "../constants/couleurs";

const LOGO = require("../../assets/logo-deegipos-v2.png");


export default function Abonnements() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const modalRef = useRef(null);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPay, setLoadingPay] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [order, setOrder] = useState("");

  const [merchantId, setMerchantId] = useState("");
  const [userId, setUserId] = useState("");
  const [payToken, setPayToken] = useState("");
  const [step, setStep] = useState("CHOIX");
  const [nomMarchand, setNomMarchand] = useState("");
  const [produitReference, setProduitReference] = useState("");
  const [montant, setMontant] = useState("");
  const [returnUrl, setReturnUrl] = useState("");

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);


  useEffect(() => {
    fetchPlans();
    fetchPaymentMethods();
  }, [user?.entreprise_id]);

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.post("/sellprox/paiement/methode/active");

      if (res.data.status === 1) {
        setPaymentMethods(res.data.resultat || []);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de charger les moyens de paiement" });
    } finally {
      setLoadingMethods(false);
    }
  };

  const fetchPlans = async () => {
    if (!user?.entreprise_id) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/sellprox/abonnement/plans");

      setPlans(res.data.resultat || []);
    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de charger les offres" });
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (plan) => {
    const entreprise_id = user?.entreprise_id;
    if (!entreprise_id) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Session expirée" });
      return;
    }

    setSelectedPlan(plan);
    setStep("CHOIX");
    modalRef.current?.open();

    setLoadingPay(true);
    try {
      const initRes = await api.post("/sellprox/abonnement/payer", {
        plan_id: plan.id,
        entreprise_id,
      });

      if (initRes.data.status !== 1) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Erreur initialisation paiement" });
        return;
      }

      const paymentData = initRes.data.data || {};
      const {
        produit_reference,
        id_user,
        id_marchand,
        nom_marchand,
        montant,
        checkout,
        payment_url,
        return_url,
      } = paymentData;

      setUserId(id_user);
      setMerchantId(id_marchand);
      setNomMarchand(nom_marchand || "");
      setMontant(montant);
      setProduitReference(produit_reference || "");
      setOrder(produit_reference || "");
      setCheckoutUrl(payment_url || checkout || null);
      setReturnUrl(return_url || "");
    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Erreur initialisation paiement" });
    } finally {
      setLoadingPay(false);
    }
  };

  /* ================= CHOIX MÉTHODE (carte ou Orange Money) ================= */
  const startPayment = async (method) => {
    setLoadingPay(true);
    try {
      const optionRes = await axios.post(
        "https://deegipay.com/payment/api/v1/marchands/pay/option",
        {
          option: method,
          user_id: userId,
          merchant_id: merchantId,
          montant: montant,
          lang: "fr",
          choix: "Live",
          codeMarchand: nomMarchand,
          order: produitReference,
        }
      );

      if (optionRes.data.status !== 1) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Erreur option paiement" });
        return;
      }

      const optionData = optionRes.data.resultat?.[0];
      if (!optionData) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Réponse invalide" });
        return;
      }

      if (method === "carte") {
        const urlCarte = optionData.payment_url || checkoutUrl;
        modalRef.current?.close();
        navigation.navigate("PaiementCarte", {
          checkoutUrl: urlCarte,
          returnUrl: returnUrl || "",
        });
      }

      if (method === "orangemoney") {
        setPayToken(optionData.pay_token);
        setStep("OTP");
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Erreur paiement" });
    } finally {
      setLoadingPay(false);
    }
  };

  /* ================= FINALISER ================= */
  const finalizePayment = async () => {
    try {
      if (!payToken) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Token invalide" });
        return;
      }

      if (!phone || !otp) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Veuillez remplir tous les champs" });
        return;
      }

      const res = await axios.post(
        "https://deegipay.com/payment/api/v1/marchands/pay/option/finaliser/prod",
        {
          pay_token: payToken,
          numero: phone,
          otp: otp,
        }
      );

      if (res.data.status === 1) {
        Toast.show({ type: "success", text1: "Succès", text2: "Paiement réussi" });

        setPhone("");
        setOtp("");
        setPayToken("");
        setStep("CHOIX");

        modalRef.current?.close();
        fetchPlans();
      } else {
        Toast.show({ type: "error", text1: "Erreur", text2: res.data.message || "Paiement échoué" });
      }

    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur", text2: "OTP invalide" });
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.header}>
            <Image source={LOGO} style={styles.logo} />
            <Text style={styles.title}>Choisissez votre abonnement</Text>
            <Text style={styles.subtitle}>
              Accédez à toutes les fonctionnalités SellProx
            </Text>
          </View>

          {plans.map((plan, index) => (
            <View key={plan.id} style={styles.card}>
              {index === 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>POPULAIRE</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.nom}</Text>
              <Text style={styles.price}>
                {plan.prix.toLocaleString()} FCFA
              </Text>
              <Text style={styles.duration}>
                / {plan.duree_jours} jours
              </Text>

              <Text style={styles.description}>{plan.description}</Text>

              <View style={styles.features}>
                <Feature icon={Users} text={`${plan.max_users} utilisateurs`} />
                <Feature icon={Monitor} text={`${plan.max_pos} POS`} />
                <Feature icon={Calendar} text={`${plan.duree_jours} jours`} />
              </View>

              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={() => openModal(plan)}
              >
                <Text style={styles.subscribeText}>S’abonner</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* ================= MODAL ================= */}
        <Modalize ref={modalRef} adjustToContentHeight>

          {step === "CHOIX" && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Choisir un moyen de paiement
              </Text>

              {loadingMethods ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={styles.paymentItem}
                    onPress={() => startPayment(method.mots_cle)}
                  >
                    <Image
                      source={{ uri: method.logo }}
                      style={styles.paymentLogo}
                    />
                    <Text style={styles.paymentText}>
                      {method.nom}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {step === "OTP" && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Paiement Orange Money</Text>

              <TextInput
                placeholder="Téléphone"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
              />

              <View style={styles.infoMessage}>
                <Info size={18} color={"red"} />
                <Text style={styles.infoMessageText}>
                  Obtenez votre code de paiement depuis votre menu USSD Orange Money : <Text style={{ fontWeight: "bold", fontSize: 16 }}>#144#77#</Text>
                </Text>
              </View>

              <TextInput
                placeholder="Code de paiement (6 chiffres)"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
              />

              <TouchableOpacity
                style={styles.btn}
                onPress={finalizePayment}
                disabled={loadingPay}
              >
                {loadingPay ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Valider</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Modalize>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================= FEATURE ================= */
const Feature = ({ icon: Icon, text }) => (
  <View style={styles.featureItem}>
    <Icon size={18} color={COLORS.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);
/* ================= STYLES ================= */
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    width: 90,
    height: 90,
    resizeMode: "contain",
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    color: COLORS.muted,
    marginTop: 5,
    textAlign: "center",
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
  },

  badge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },

  price: {
    fontSize: 34,
    fontWeight: "800",
    marginTop: 10,
    color: COLORS.text,
  },

  duration: {
    color: COLORS.muted,
    marginBottom: 15,
  },

  description: {
    color: COLORS.text,
    marginBottom: 20,
  },

  features: {
    gap: 12,
    marginBottom: 25,
  },

  featureItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  featureText: {
    color: COLORS.text,
  },

  subscribeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  subscribeText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  /* ===== MODAL ===== */

  modalContent: {
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },

  payBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  payText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },

  /* ===== INPUT OTP ===== */

  infoMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primary + "18",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoMessageText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 15,
    backgroundColor: COLORS.card,
  },

  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    backgroundColor: COLORS.card,
  },

  paymentLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 15,
  },

  paymentText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
});