import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { launchImageLibrary } from "react-native-image-picker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";
import { Camera, Save } from "lucide-react-native";
import COLORS from "../constants/couleurs";
import { StatusBar } from "expo-status-bar";

export default function EntrepriseInfosPro() {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [logo, setLogo] = useState(null);

  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
  });

  /* ================= SYNC FROM CONTEXT ================= */
  useEffect(() => {
    if (!user) return;
    setEntrepriseId(user.entreprise_id);
    setForm({
      nom: user.nomBoutique || "",
      email: user.emailBoutique || "",
      telephone: user.telephoneBoutique || "",
      adresse: user.adresseBoutique || "",
    });
    setLogo(user.logoBoutique || null);
  }, [user]);

  /* ================= VALIDATION ================= */
  const isValid = () => {
    return (
      form.nom?.trim() &&
      form.email?.trim() &&
      form.telephone?.trim() &&
      form.adresse?.trim()
    );
  };

  /* ================= UPDATE INFOS ================= */
  const updateEntreprise = async () => {
    if (!isValid()) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Veuillez remplir tous les champs" });
      return;
    }

    if (!entrepriseId) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Session expirée" });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        `/sellprox/entreprise/update/${entrepriseId}`,
        form
      );

      if (response.data.status === 1) {
        const updatedUser = {
          ...user,
          nomBoutique: form.nom,
          emailBoutique: form.email,
          telephoneBoutique: form.telephone,
          adresseBoutique: form.adresse,
        };
        await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        Toast.show({ type: "success", text1: "Succès", text2: "Informations mises à jour !" });
      } else {
        Toast.show({ type: "error", text1: "Erreur", text2: response.data.msg || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      if (error.response) {
        Toast.show({ type: "error", text1: "Erreur", text2: error.response.data?.msg || `Erreur ${error.response.status}` });
      } else if (error.request) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de contacter le serveur" });
      } else {
        Toast.show({ type: "error", text1: "Erreur", text2: "Erreur lors de la mise à jour" });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= IMAGE PICK ================= */
  const pickLogo = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: false,
      maxWidth: 500,
      maxHeight: 500,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        // rien à afficher
      } else if (response.error) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de sélectionner l'image" });
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        uploadLogo(asset);
      }
    });
  };

  /* ================= UPLOAD LOGO ================= */
  const uploadLogo = async (image) => {
    if (!image.uri) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Image invalide" });
      return;
    }

    if (!entrepriseId) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Session expirée" });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();

      // Déterminer le type MIME en fonction de l'extension
      const getMimeType = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
        };
        return mimeTypes[extension] || 'image/jpeg';
      };

      const mimeType = getMimeType(image.fileName || 'image.jpg');

      formData.append("image", {
        uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
        name: image.fileName || `logo_${Date.now()}.jpg`,
        type: mimeType,
      });

      const response = await api.post(
        `/sellprox/entreprise/update/logo/${entrepriseId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percentCompleted);
            }
          },
        }
      );

      if (response.data.status === 1) {
        setLogo(image.uri);

        const updatedUser = {
          ...user,
          logoBoutique: response.data?.logoUrl || image.uri,
        };
        await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        Toast.show({ type: "success", text1: "Succès", text2: "Logo mis à jour !" });
      } else {
        Toast.show({ type: "error", text1: "Erreur", text2: response.data.msg || "Erreur lors de l'upload" });
      }
    } catch (error) {
      if (error.response) {
        Toast.show({ type: "error", text1: "Erreur", text2: error.response.data?.msg || `Erreur ${error.response.status}` });
      } else if (error.request) {
        Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de contacter le serveur" });
      } else {
        Toast.show({ type: "error", text1: "Erreur", text2: "Erreur lors de l'upload du logo" });
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /* ================= UI ================= */
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >

      {/* LOGO */}
      <TouchableOpacity
        style={styles.logoCard}
        onPress={pickLogo}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.progress}>{progress}%</Text>
            <Text style={styles.uploadingText}>Téléchargement...</Text>
          </View>
        ) : (
          <>
            {logo ? (
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: logo }}
                  style={styles.logo}
                  resizeMode="cover"
                />
                <View style={styles.overlay}>
                  <Camera size={24} color="#fff" />
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Camera size={40} color="#888" />
                <Text style={styles.changeText}>Ajouter un logo</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>

      {/* FORM */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Nom de l'entreprise</Text>
        <TextInput
          placeholder="Nom de l'entreprise"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          value={form.nom}
          onChangeText={(t) => setForm({ ...form, nom: t })}
          editable={!loading}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Email de l'entreprise"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          value={form.email}
          onChangeText={(t) => setForm({ ...form, email: t })}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          placeholder="Téléphone de l'entreprise"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          value={form.telephone}
          onChangeText={(t) => setForm({ ...form, telephone: t })}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Adresse</Text>
        <TextInput
          placeholder="Adresse de l'entreprise"
          placeholderTextColor={COLORS.muted}
          style={[styles.input, styles.textArea]}
          value={form.adresse}
          onChangeText={(t) => setForm({ ...form, adresse: t })}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.saveBtn, (!isValid() || loading) && styles.saveBtnDisabled]}
        onPress={updateEntreprise}
        disabled={!isValid() || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Save color="#000000" size={18} />
            <Text style={styles.saveText}>Enregistrer les modifications</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.text,
  },
  logoCard: {
    height: 180,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  logoContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  changeText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  uploadingContainer: {
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
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveBtn: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 30,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 16,
  },
});