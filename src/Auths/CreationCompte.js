import React, { useState } from 'react'
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
    ScrollView,
} from 'react-native'
import { Mail, Lock, Building2, User, Phone, MapPin, Calendar, ArrowLeft } from 'lucide-react-native'
import axios from 'axios'
import Toast from 'react-native-toast-message'
import COLORS from '../constants/couleurs'

const BG_IMAGE = require('../../assets/img_background_app.png')
const LOGO_IMAGE = require('../../assets/deegipos_logo_avec_slogan.png')

const API_REGISTER = 'https://deegipay.com/backend_pos/api/v1/sellprox/entreprise/register_and_admin'

const STEP_ENTREPRISE = 1
const STEP_ADMIN = 2

export default function CreationCompteScreen({ navigation }) {
    const [step, setStep] = useState(STEP_ENTREPRISE)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        nom_users: '',
        prenom_users: '',
        email_users: '',
        telephone_users: '',
        password: '',
    })

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

    const validateStep1 = () => {
        const { nom, email, telephone, adresse } = form
        if (!nom?.trim() || !email?.trim() || !telephone?.trim() || !adresse?.trim()) {
            Toast.show({ type: 'error', text1: 'Erreur', text2: 'Remplissez toutes les informations entreprise.' })
            return false
        }
        return true
    }

    const goNext = () => {
        if (validateStep1()) setStep(STEP_ADMIN)
    }

    const goBack = () => setStep(STEP_ENTREPRISE)

    const handleRegister = async () => {
        console.log( "form", form)
        const {
            nom,
            email,
            telephone,
            adresse,
            nom_users,
            prenom_users,
            email_users,
            telephone_users,
            password,
        } = form

        if (!nom?.trim() || !email?.trim() || !telephone?.trim() || !adresse?.trim()) {
            Toast.show({ type: 'error', text1: 'Erreur', text2: 'Remplissez toutes les informations entreprise.' })
            return
        }
        if (!nom_users?.trim() || !prenom_users?.trim() || !email_users?.trim() || !telephone_users?.trim() || !password?.trim()) {
            Toast.show({ type: 'error', text1: 'Erreur', text2: 'Remplissez toutes les informations administrateur.' })
            return
        }
        if (password.length < 6) {
            Toast.show({ type: 'error', text1: 'Erreur', text2: 'Le mot de passe doit contenir au moins 6 caractères.' })
            return
        }

        setLoading(true)
        try {
            const payload = {
                nom: nom.trim(),
                email: email.trim(),
                telephone: telephone.trim(),
                adresse: adresse.trim(),
                nom_users: nom_users.trim(),
                prenom_users: prenom_users.trim(),
                email_users: email_users.trim(),
                telephone_users: telephone_users.trim(),
                password: password.trim(),
            }

            console.log( "payload", payload)

            const response = await axios.post(API_REGISTER, payload, {
             
            })

            console.log( "response", response)

            const ok = response.data?.status === 1 || response.data?.status === 200 || response.status === 200
            if (ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Compte créé',
                    text2: response.data?.msg || 'Vous pouvez vous connecter.',
                })
                navigation.replace('Login')
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: response.data?.msg || 'Impossible de créer le compte.',
                })
            }
        } catch (error) {
            const msg = error?.response?.data?.msg || error?.message || 'Erreur serveur. Vérifiez votre connexion.'
            Toast.show({ type: 'error', text1: 'Erreur', text2: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <View style={styles.wrapper}>
                <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
                <View style={styles.bgLayer}>
                    <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
                </View>
                <View style={styles.bgOverlay} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Image source={LOGO_IMAGE} style={styles.logoImage} resizeMode="contain" />

                    </View>

                   
                        <View style={styles.card}>
                            {/* Indicateur d'étape */}
                            <View style={styles.stepIndicator}>
                                <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
                                <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                                <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
                            </View>
                            <Text style={styles.stepLabel}>
                                Étape {step} sur 2 — {step === STEP_ENTREPRISE ? 'Entreprise' : 'Administrateur'}
                            </Text>

                            {step === STEP_ENTREPRISE ? (
                                <>
                                    <Text style={styles.sectionLabel}>Informations entreprise</Text>
                                    <View style={styles.inputGroup}>
                                        <Building2 size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Nom de l'entreprise"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.nom}
                                            onChangeText={(v) => update('nom', v)}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Mail size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Email entreprise"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.email}
                                            onChangeText={(v) => update('email', v)}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Phone size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Téléphone entreprise"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.telephone}
                                            onChangeText={(v) => update('telephone', v)}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <MapPin size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Adresse"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.adresse}
                                            onChangeText={(v) => update('adresse', v)}
                                        />
                                    </View>
                                    <TouchableOpacity style={styles.button} onPress={goNext}>
                                        <Text style={styles.buttonText}>Suivant</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.sectionLabel}>Informations administrateur</Text>
                                    <View style={styles.inputGroup}>
                                        <User size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Nom"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.nom_users}
                                            onChangeText={(v) => update('nom_users', v)}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <User size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Prénom"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.prenom_users}
                                            onChangeText={(v) => update('prenom_users', v)}
                                        />
                                    </View>
                                    {/* <View style={styles.inputGroup}>
                                        <Calendar size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Date de naissance (YYYY-MM-DD)"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.dateNaissance}
                                            onChangeText={(v) => update('dateNaissance', v)}
                                        />
                                    </View> */}
                                    <View style={styles.inputGroup}>
                                        <Mail size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Email utilisateur"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.email_users}
                                            onChangeText={(v) => update('email_users', v)}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Phone size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Téléphone utilisateur"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.telephone_users}
                                            onChangeText={(v) => update('telephone_users', v)}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Lock size={18} color={COLORS.muted} />
                                        <TextInput
                                            placeholder="Mot de passe (min. 6 caractères)"
                                            placeholderTextColor={COLORS.muted}
                                            style={styles.input}
                                            value={form.password}
                                            onChangeText={(v) => update('password', v)}
                                            secureTextEntry
                                        />
                                    </View>
                                    <View style={{ flexDirection:'row', justifyContent:'space-between'}}>
                                        <TouchableOpacity
                                            style={[styles.button1]}
                                            onPress={goBack}
                                        >
                                            <ArrowLeft size={18} color={"red"} />
                                            <Text style={styles.buttonTextOutlined}>Retour</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.button}
                                            onPress={handleRegister}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color={COLORS.white} />
                                            ) : (
                                                <Text style={styles.buttonText}>Créer le compte</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.linkButton}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
                            </TouchableOpacity>
                        </View>
                   
                </View>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',

    },
    bgLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgImage: {
        width: '100%',
        height: '100%',
    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        padding: 20,
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    logoImage: {
        width: 200,
        height: 80,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 8,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        elevation: 3,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.border,
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
    },
    stepLine: {
        width: 40,
        height: 3,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        marginHorizontal: 6,
    },
    stepLineActive: {
        backgroundColor: COLORS.primary,
    },
    stepLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.muted,
        marginBottom: 16,
        textAlign: 'center',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.muted,
        marginBottom: 10,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        marginBottom: 14,
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    button1: {
        backgroundColor: "#ffffff",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },
    buttonOutlined: {
        backgroundColor: 'transparent',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        borderWidth: 2,
        borderColor: "red",
        marginTop: 8,
    },
    buttonTextOutlined: {
        color: "red",
        fontWeight: '700',
        fontSize: 16,
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 8,
    },
    linkText: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: '600',
    },
})
