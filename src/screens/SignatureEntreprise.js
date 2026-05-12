import React, { useCallback, useContext, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import {
  launchImageLibrary,
  launchCamera,
} from "react-native-image-picker";
import Toast from "react-native-toast-message";
import { ArrowLeft, Camera, Images, Trash2 } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";
import COLORS from "../constants/couleurs";
import { StatusBar } from "expo-status-bar";

/** URL signature depuis le profil (login API ouSecureStore) — clés possibles côté backend */
function getSignatureUrlFromUser(user) {
  if (!user || typeof user !== "object") return null;
  const candidates = [
    user.signatureBoutique,
    user.signature_url,
    user.signatureUrl,
    typeof user.signature === "string" ? user.signature : null,
  ];
  for (const u of candidates) {
    if (typeof u === "string" && u.trim().length > 0) return u.trim();
  }
  return null;
}

export default function SignatureEntreprise() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(AuthContext);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [signatureUri, setSignatureUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [progress, setProgress] = useState(0);

  const syncSignatureFromUser = useCallback(() => {
    if (!user) {
      setEntrepriseId(null);
      setSignatureUri(null);
      return;
    }
    setEntrepriseId(user.entreprise_id ?? null);
    setSignatureUri(getSignatureUrlFromUser(user));
  }, [user]);

  useEffect(() => {
    syncSignatureFromUser();
  }, [syncSignatureFromUser]);

  useFocusEffect(
    useCallback(() => {
      syncSignatureFromUser();
    }, [syncSignatureFromUser])
  );

  const persistLocalSignature = async (uri) => {
    const updatedUser = {
      ...user,
      signatureBoutique: uri,
      signatureUrl: uri,
    };
    await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSignatureUri(uri);
  };

  const pickerOptions = {
    mediaType: "photo",
    quality: 0.85,
    includeBase64: false,
    maxWidth: 1200,
    maxHeight: 600,
  };

  const onPickerResult = (response) => {
    if (response.didCancel) return;
    if (response.errorCode || response.errorMessage) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          response.errorMessage ||
          "Impossible d'obtenir l'image (caméra ou galerie).",
      });
      return;
    }
    if (response.assets && response.assets.length > 0) {
      uploadSignature(response.assets[0]);
    }
  };

  const openGallery = () => {
    launchImageLibrary(
      { ...pickerOptions, selectionLimit: 1 },
      onPickerResult
    );
  };

  const openCamera = () => {
    launchCamera(pickerOptions, onPickerResult);
  };

  const chooseSignatureSource = () => {
    Alert.alert(
      "Ajouter une signature",
      "Prendre une photo ou choisir une image dans la galerie.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Galerie", onPress: openGallery },
        { text: "Appareil photo", onPress: openCamera },
      ]
    );
  };

  const getMimeType = (filename) => {
    const extension = (filename || "").split(".").pop().toLowerCase();
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return mimeTypes[extension] || "image/jpeg";
  };

  /** Extrait l’URL signature renvoyée par POST …/entreprise/update/signature/{id} */
  const extractSignatureUrlFromResponse = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    const d = payload;
    const r = d.resultat;
    const nested = d.data && typeof d.data === "object" ? d.data : null;

    const candidates = [
      d.signatureUrl,
      d.signature_url,
      d.url,
      d.img_url,
      nested?.signatureUrl,
      nested?.signature_url,
      nested?.url,
      typeof r === "string" && /^https?:\/\//i.test(r) ? r : null,
      r && typeof r === "object" ? r.signatureUrl || r.url || r.signature_url : null,
    ];

    const found = candidates.find((u) => typeof u === "string" && u.length > 0);
    return found || null;
  };

  const isUploadSuccess = (payload) => {
    if (!payload || typeof payload !== "object") return false;
    if (payload.status === 1 || payload.status === "1" || payload.success === true)
      return true;
    if (extractSignatureUrlFromResponse(payload)) return true;
    return false;
  };

  const uploadSignature = async (image) => {
    if (!image?.uri) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Image invalide" });
      return;
    }

    const id = entrepriseId ?? user?.entreprise_id;
    if (!id) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Session expirée" });
      return;
    }

    setUploading(true);
    setProgress(0);

    const fileName =
      image.fileName ||
      image.uri?.split("/").pop()?.split("?")[0] ||
      `signature_${Date.now()}.jpg`;
    const mimeType = image.type || getMimeType(fileName);

    const formData = new FormData();
    // Même convention que le logo entreprise : champ fichier `image`
    formData.append("image", {
      uri: Platform.OS === "ios" ? image.uri.replace("file://", "") : image.uri,
      name: fileName,
      type: mimeType,
    });

    try {
      const response = await api.post(
        `/sellprox/entreprise/update/signature/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setProgress(
                Math.round((progressEvent.loaded * 100) / progressEvent.total)
              );
            }
          },
        }
      );

      const data = response.data;
      if (isUploadSuccess(data)) {
        const serverUrl =
          extractSignatureUrlFromResponse(data) || image.uri;
        await persistLocalSignature(serverUrl);
        Toast.show({
          type: "success",
          text1: "Succès",
          text2: data?.msg || "Signature enregistrée sur le serveur",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2:
            data?.msg ||
            data?.message ||
            "Le serveur n’a pas validé l’enregistrement de la signature.",
        });
      }
    } catch (error) {
      const status = error.response?.status;
      const msg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message;
      Toast.show({
        type: "error",
        text1: "Envoi impossible",
        text2:
          msg ||
          (status
            ? `Erreur serveur (${status})`
            : "Vérifiez la connexion et réessayez."),
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const clearSignature = async () => {
    if (!user) return;
    const id = String(entrepriseId ?? user?.entreprise_id ?? "");
    if (!id) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Session expirée ou entreprise inconnue",
      });
      return;
    }

    setRemoving(true);
    try {
      const response = await api.post(
        `/sellprox/entreprise/signature/delete/${id}`,
        {}
      );
      const data = response.data;
      const failed =
        data &&
        typeof data === "object" &&
        (data.status === 0 ||
          data.status === "0" ||
          data.success === false);
      if (failed) {
        throw new Error(
          data?.msg || data?.message || "Suppression refusée par le serveur"
        );
      }

      const updatedUser = { ...user };
      delete updatedUser.signatureBoutique;
      delete updatedUser.signatureUrl;
      delete updatedUser.signature_url;
      if (typeof updatedUser.signature === "string") {
        delete updatedUser.signature;
      }

      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSignatureUri(null);
      Toast.show({
        type: "success",
        text1: "Signature",
        text2:
          data?.msg || data?.message || "Signature supprimée sur le serveur",
      });
    } catch (error) {
      const msg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Suppression impossible";
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: msg,
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <View style={styles.simpleHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Signature</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Photographiez ou importez une image de signature pour vos documents et
          factures.
        </Text>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Conseil pour la meilleure photo</Text>
          <Text style={styles.tipLine}>
            • Signez sur une feuille très blanche (stylo noir ou bleu foncé).
          </Text>
          <Text style={styles.tipLine}>
            • Photographiez la signature sur ce fond blanc, avec une lumière
            uniforme et peu d’ombres.
          </Text>
          <Text style={styles.tipLine}>
            • Importez l’image via « Galerie », ou capturez-la directement avec
            « Prendre une photo » ou en appuyant sur la zone ci-dessous.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.signatureCard}
          onPress={chooseSignatureSource}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              {progress > 0 ? (
                <Text style={styles.progress}>{progress}%</Text>
              ) : null}
              <Text style={styles.uploadingText}>Envoi en cours...</Text>
            </View>
          ) : signatureUri ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: signatureUri }}
                style={styles.preview}
                resizeMode="contain"
              />
              <View style={styles.overlay}>
                <Camera size={24} color="#fff" />
                <Text style={styles.overlayText}>
                  {"Photo ou galerie"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Camera size={40} color="#888" />
              <Text style={styles.changeText}>Photo ou galerie</Text>
              <Text style={styles.hint}>Appuyez pour choisir la source</Text>
            </View>
          )}
        </TouchableOpacity>

        {!uploading ? (
          <View style={styles.sourceRow}>
            <TouchableOpacity
              style={styles.sourceBtn}
              onPress={openCamera}
              activeOpacity={0.8}
            >
              <Camera size={20} color={COLORS.text} />
              <Text style={styles.sourceBtnText}>Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sourceBtn}
              onPress={openGallery}
              activeOpacity={0.8}
            >
              <Images size={20} color={COLORS.text} />
              <Text style={styles.sourceBtnText}>Galerie</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {signatureUri && !uploading ? (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={clearSignature}
            activeOpacity={0.8}
            disabled={removing}
          >
            {removing ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <Trash2 size={18} color={COLORS.danger} />
            )}
            <Text style={styles.removeText}>Supprimer la signature</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 16,
    lineHeight: 20,
  },
  tipBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 20,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  tipLine: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 8,
  },
  sourceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sourceBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  signatureCard: {
    minHeight: 200,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  previewWrap: {
    width: "100%",
    minHeight: 200,
    position: "relative",
  },
  preview: {
    width: "100%",
    height: 220,
    backgroundColor: "#fafafa",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    marginTop: 8,
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  placeholderContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  changeText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 15,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.muted,
  },
  uploadingContainer: {
    paddingVertical: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  progress: {
    marginTop: 10,
    fontWeight: "700",
    color: COLORS.primary,
    fontSize: 16,
  },
  uploadingText: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "#fff",
  },
  removeText: {
    color: COLORS.danger,
    fontWeight: "600",
    fontSize: 15,
  },
});
