import React, { useState, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Mail, Lock } from "lucide-react-native";
import Toast from "react-native-toast-message";
import COLORS from "../constants/couleurs";
import { AuthContext } from "../context/AuthContext";
import api from "../api/Axios";

const BG_IMAGE = require("../../assets/img_background_app.png");
const LOGO_IMAGE = require("../../assets/deegipos_logo_avec_slogan.png");

export default function LoginScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);




    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({ type: "error", text1: "Erreur", text2: "Veuillez remplir tous les champs." });
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/sellprox/login", { email, password });

            if (response.data?.status == 1) {
                const userInfos = response.data.userInfos;
                const accessToken = response.data.access_token;
                await login(accessToken, userInfos);

                Toast.show({
                    type: "success",
                    text1: "Connexion réussie",
                    text2: `Bienvenue ${response.data.userInfos?.prenom || ""} 👋`,
                });

                navigation.replace("Drawer");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Erreur",
                    text2: response.data?.msg || "Identifiants incorrects",
                });
            }
        } catch (error) {
            const message =
                error?.response?.data?.msg ||
                "Erreur serveur. Vérifiez votre connexion.";
            Toast.show({
                type: "error",
                text1: "Erreur",
                text2: message,
            });
        } finally {
            setLoading(false);
        }
    };



    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
            <View style={styles.wrapper}>
                <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

                <View style={styles.bgLayer}>
                    <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
                </View>
                <View style={styles.bgOverlay} />
                <View style={styles.content}>
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Image source={LOGO_IMAGE} style={styles.logoImage} resizeMode="contain" />
                    </View>

                    {/* CARD */}
                    <View style={styles.card}>
                        {/* EMAIL */}
                        <View style={styles.inputGroup}>
                            <Mail size={18} color={COLORS.muted} />
                            <TextInput
                                placeholder="Adresse email"
                                placeholderTextColor={COLORS.muted}
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* PASSWORD */}
                        <View style={styles.inputGroup}>
                            <Lock size={18} color={COLORS.muted} />
                            <TextInput
                                placeholder="Mot de passe"
                                placeholderTextColor={COLORS.muted}
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {/* BUTTON */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.buttonText}>Se connecter</Text>
                            )}
                        </TouchableOpacity>


                    </View>
                    {/* LINK CREER UN COMPTE */}
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('CreationCompte')}
                    >
                        <Text style={styles.linkText}>Créer un compte</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    bgLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    bgImage: {
        width: "100%",
        height: "100%",

    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 30,
    },
    logoImage: {
        width: 240,
        height: 100,
    },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 25,
        elevation: 3,
    },

    inputGroup: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        marginBottom: 18,
    },

    input: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 10,
        fontSize: 15,
        color: COLORS.text,
    },

    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
    },

    buttonText: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 16,
    },
    linkButton: {
        alignItems: "center",
        marginTop: 18,
        paddingVertical: 8,
    },
    linkText: {
        fontSize: 14,
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 24,
        fontFamily: "Bold",

    },
});
