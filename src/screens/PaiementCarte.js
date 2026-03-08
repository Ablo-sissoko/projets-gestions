import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";
import Toast from "react-native-toast-message";
import COLORS from "../constants/couleurs";

export default function PaiementCarte() {
  const navigation = useNavigation();
  const route = useRoute();
  const { checkoutUrl = "", returnUrl = "" } = route.params || {};

  const [loading, setLoading] = useState(true);

  const onNavigationStateChange = useCallback(
    (navState) => {
      const url = navState?.url || "";
      if (url.includes("success") || (returnUrl && url.includes(returnUrl))) {
        Toast.show({
          type: "success",
          text1: "Succès",
          text2: "Paiement carte réussi",
        });
        navigation.goBack();
      }
      if (url.includes("cancel") || url.includes("cancelPayment")) {
        Toast.show({
          type: "info",
          text1: "Annulé",
          text2: "Paiement annulé",
        });
        navigation.goBack();
      }
    },
    [returnUrl, navigation]
  );

  if (!checkoutUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement par carte</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Aucune URL de paiement.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement par carte</Text>
      </View>

      <View style={styles.webViewWrap}>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={onNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webView}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement du formulaire...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  webViewWrap: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
