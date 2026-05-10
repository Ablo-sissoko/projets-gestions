import React, { useEffect, useRef, useState, useMemo, useCallback, } from 'react'
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
    Keyboard,
    Dimensions,
} from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import PhoneInput from 'react-native-phone-input'
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { Mail, Lock, Building2, User, Phone, MapPin, Calendar, ArrowLeft } from 'lucide-react-native'
import axios from 'axios'
import Toast from 'react-native-toast-message'
import COLORS from '../constants/couleurs'

const BG_IMAGE = require('../../assets/img_background_app.png')
const LOGO_IMAGE = require('../../assets/deegipos_logo_avec_slogan.png')

const API_REGISTER = 'https://deegipay.com/backend_pos/api/v1/sellprox/entreprise/register_and_admin'
const API_CATEGORIES = 'https://deegipay.com/backend_pos/api/v1/sellprox/entreprise/categories/read'

const STEP_ENTREPRISE = 1
const STEP_ADMIN = 2

const UEMOA_COUNTRIES = [
    { name: 'Bénin', iso2: 'bj', dialCode: '+229' },
    { name: 'Burkina Faso', iso2: 'bf', dialCode: '+226' },
    { name: 'Côte d’Ivoire', iso2: 'ci', dialCode: '+225' },
    { name: 'Guinée-Bissau', iso2: 'gw', dialCode: '+245' },
    { name: 'Mali', iso2: 'ml', dialCode: '+223' },
    { name: 'Niger', iso2: 'ne', dialCode: '+227' },
    { name: 'Sénégal', iso2: 'sn', dialCode: '+221' },
    { name: 'Togo', iso2: 'tg', dialCode: '+228' },
]

const WINDOW_HEIGHT = Dimensions.get('window').height

const getFlagEmoji = (iso2) => {
    const code = String(iso2 || '').toUpperCase()
    if (code.length !== 2) return '🏳️'
    return String.fromCodePoint(
        ...[...code].map((c) => 127397 + c.charCodeAt(0))
    )
}

export default function CreationCompteScreen({ navigation }) {
    const [step, setStep] = useState(STEP_ENTREPRISE)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [form, setForm] = useState({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        category_id: '',
        nom_users: '',
        prenom_users: '',
        email_users: '',
        telephone_users: '',
        password: '',
    })
    const phoneInputRef = useRef(null)
    const phoneUserInputRef = useRef(null)
    const countrySheetRef = useRef(null)
    const countrySnapPoints = useMemo(() => ['45%'], [])
    const [selectedCountryEntreprise, setSelectedCountryEntreprise] = useState(UEMOA_COUNTRIES[4])
    const [selectedCountryUser, setSelectedCountryUser] = useState(UEMOA_COUNTRIES[4])
    const [activePhoneTarget, setActivePhoneTarget] = useState('entreprise')
    /** Remount admin PhoneInput when entering step 2 so native field never reuses enterprise digits. */
    const [userPhoneMountKey, setUserPhoneMountKey] = useState(0)

    const renderCountryBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.4}
                pressBehavior="close"
            />
        ),
        []
    )

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

    const validateStep1 = () => {
        const { nom, email, telephone, adresse, category_id } = form
        if (!nom?.trim() || !email?.trim() || !telephone?.trim() || !adresse?.trim() || !category_id) {
            Toast.show({ type: 'error', text1: 'Erreur', text2: 'Remplissez toutes les informations entreprise.' })
            return false
        }
        return true
    }

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true)
                const response = await axios.get(API_CATEGORIES)
                const results = Array.isArray(response.data?.resultat) ? response.data.resultat : []
                const formatted = results.map((item) => ({
                    id: String(item.id),
                    name: item.name || item.nom || `Catégorie ${item.id}`,
                }))
                setCategories(formatted)
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response?.data?.msg || 'Impossible de charger les catégories',
                })
            } finally {
                setCategoriesLoading(false)
            }
        }
        fetchCategories()
    }, [])

    const goNext = () => {
        if (!validateStep1()) return
        Keyboard.dismiss()
        setUserPhoneMountKey((k) => k + 1)
        setStep(STEP_ADMIN)
    }

    const goBack = () => {
        Keyboard.dismiss()
        setStep(STEP_ENTREPRISE)
    }

    const handleRegister = async () => {
        console.log("form", form)
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

        if (!nom?.trim() || !email?.trim() || !telephone?.trim() || !adresse?.trim() || !form.category_id) {
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
                category_id: String(form.category_id),
                nom_users: nom_users.trim(),
                prenom_users: prenom_users.trim(),
                email_users: email_users.trim(),
                telephone_users: telephone_users.trim(),
                password: password.trim(),
            }

            console.log("payload", payload)

            const response = await axios.post(API_REGISTER, payload, {

            })
            console.log("response", response.data.status)


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
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
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
                                    <View style={styles.dropdownRow}>
                                        <Building2 size={18} color={COLORS.muted} />
                                        <Dropdown
                                            dropdownPosition="auto"
                                            style={styles.dropdown}
                                            placeholderStyle={styles.dropdownPlaceholder}
                                            selectedTextStyle={styles.dropdownSelected}
                                            inputSearchStyle={styles.dropdownSearchInput}
                                            data={categories}
                                            maxHeight={300}
                                            search
                                            labelField="name"
                                            valueField="id"
                                            placeholder={categoriesLoading ? 'Chargement...' : 'Sélectionner catégorie'}
                                            searchPlaceholder="Rechercher..."
                                            value={form.category_id}
                                            onChange={(item) => update('category_id', item.id)}
                                            disable={categoriesLoading}
                                            containerStyle={styles.dropdownContainer}
                                            itemTextStyle={styles.dropdownItemText}
                                            flatListProps={{
                                                bounces: false,
                                                contentContainerStyle: { paddingBottom: 20 }
                                            }}

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
                                        <Phone size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
                                        <PhoneInput
                                            key="phone-entreprise"
                                            ref={phoneInputRef}
                                            initialCountry={selectedCountryEntreprise.iso2}
                                            initialValue={form.telephone?.trim() ? form.telephone : undefined}
                                            onPressFlag={() => {
                                                setActivePhoneTarget('entreprise')
                                                countrySheetRef.current?.expand()
                                            }}
                                            onChangePhoneNumber={(v) => update('telephone', v)}
                                            textProps={{
                                                placeholder: 'Téléphone entreprise',
                                                placeholderTextColor: COLORS.muted,
                                            }}
                                            textStyle={styles.phoneInputText}
                                            style={styles.phoneInput}
                                            flagStyle={{ height: 17, width: 17 }}
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
                                        <Phone size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
                                        <PhoneInput
                                            key={`phone-user-${userPhoneMountKey}`}
                                            ref={phoneUserInputRef}
                                            initialCountry={selectedCountryUser.iso2}
                                            initialValue={
                                                form.telephone_users?.trim() ? form.telephone_users : undefined
                                            }
                                            onPressFlag={() => {
                                                setActivePhoneTarget('user')
                                                countrySheetRef.current?.expand()
                                            }}
                                            onChangePhoneNumber={(v) => update('telephone_users', v)}
                                            textProps={{
                                                placeholder: 'Téléphone utilisateur',
                                                placeholderTextColor: COLORS.muted,
                                            }}
                                            textStyle={styles.phoneInputText}
                                            style={styles.phoneInput}
                                            flagStyle={{ height: 17, width: 17 }}
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
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
            </ScrollView>

            <BottomSheet
                ref={countrySheetRef}
                index={-1}
                snapPoints={countrySnapPoints}
                enablePanDownToClose
                backdropComponent={renderCountryBackdrop}
            >
                <BottomSheetFlatList
                    data={UEMOA_COUNTRIES}
                    keyExtractor={(item) => item.iso2}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.countryItem}
                            onPress={() => {
                                if (activePhoneTarget === 'entreprise') {
                                    setSelectedCountryEntreprise(item)
                                    phoneInputRef.current?.selectCountry(item.iso2)
                                    if (!form.telephone?.trim()) {
                                        update('telephone', item.dialCode)
                                    }
                                } else {
                                    setSelectedCountryUser(item)
                                    phoneUserInputRef.current?.selectCountry(item.iso2)
                                    if (!form.telephone_users?.trim()) {
                                        update('telephone_users', item.dialCode)
                                    }
                                }
                                countrySheetRef.current?.close()
                            }}
                        >
                            <Text style={styles.countryFlag}>
                                {getFlagEmoji(item.iso2)}
                            </Text>
                            <Text style={styles.countryName}>{item.name}</Text>
                            <Text style={styles.countryDial}>{item.dialCode}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.countryList}
                />
            </BottomSheet>
        </KeyboardAvoidingView>

    )
}

const styles = StyleSheet.create({
    wrapper: {
        minHeight: WINDOW_HEIGHT,
        backgroundColor: COLORS.bg,
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
        flexGrow: 1,
        marginBottom: 80,
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
    dropdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 14,
        gap: 10,
        backgroundColor: COLORS.card,
    },
    dropdown: {
        flex: 1,
        height: 44,
    },
    dropdownPlaceholder: {
        color: COLORS.muted,
        fontSize: 15,
    },
    dropdownSelected: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
    dropdownSearchInput: {
        height: 40,
        fontSize: 14,
        color: COLORS.text,
    },
    dropdownContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
    dropdownItemText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
    phoneInput: {
        flex: 1,
        height: 44,
    },
    phoneInputText: {
        color: COLORS.text,
        fontSize: 15,
    },
    countryList: {
        paddingBottom: 20,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    countryFlag: {
        fontSize: 18,
    },
    countryName: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    countryDial: {
        color: COLORS.muted,
        fontSize: 14,
        fontWeight: '600',
    },

})
