import React, { useContext, useMemo } from 'react'
import { Pressable, StyleSheet, Text, View, Image, Alert } from 'react-native'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { getFocusedRouteNameFromRoute, CommonActions } from '@react-navigation/native'
import {
    ArrowLeftRight,
    BarChart3,
    Calendar,
    FileText,
    Landmark,
    Layers,
    LogOut,
    Scissors,
    Settings,
    Tags,
    TrendingDown,
    TrendingUp,
    User,
    Users,
    Package,
    Truck,
} from 'lucide-react-native'

/** Clés `icon` string dans `entrepriseConfig` customScreens → composant Lucide */
const CUSTOM_SCREEN_ICON_BY_KEY = {
    BarChart3,
    Users,
    users: Users,
    Calendar,
    calendar: Calendar,
    Scissors,
    scissors: Scissors,
}

function resolveCustomScreenIcon(iconKey) {
    if (iconKey && typeof iconKey === 'string' && CUSTOM_SCREEN_ICON_BY_KEY[iconKey]) {
        return CUSTOM_SCREEN_ICON_BY_KEY[iconKey]
    }
    return BarChart3
}
import { AuthContext } from '../context/AuthContext'
import { getEffectivePermissions } from '../config/rolesPermissions'
import {
    getEntrepriseConfig,
    getUserCategoryId,
    getCategoryDisplayName,
} from '../config/entrepriseConfig'

const COLORS = {
    primary: '#efd50e',
    black: '#3d3d3d',
    white: '#fff',
    grayLight: '#F4F5F7',
    grayInactive: '#9CA3AF',
    text: '#3d3d3d',
}

function getActiveRouteName(state) {
    const route = state.routes[state.index]
    const nested = getFocusedRouteNameFromRoute(route)
    return nested ?? route.name
}

function buildDrawerSections(categoryId, permissions) {
    const config = getEntrepriseConfig(categoryId)
    const has = (routeName) => permissions.includes(routeName) && config.screens.visible.includes(routeName)

    const sections = []

    const customItems = config.customScreens
        .filter((s) => has(s.routeName))
        .map((s) => ({
            label: s.label,
            icon: resolveCustomScreenIcon(s.icon),
            routeName: s.routeName,
            isTab: s.isTab === true,
        }))

    if (customItems.length) {
        sections.push({ title: 'Métier', items: customItems })
    }

    const gestionItems = [
        { label: 'Dashboard', icon: BarChart3, routeName: 'Dashboard', isTab: true },
        { label: 'Ventes', icon: TrendingUp, routeName: 'Ventes', isTab: true },
        { label: 'Dépenses', icon: TrendingDown, routeName: 'Depenses' },
        { label: 'Transferts', icon: ArrowLeftRight, routeName: 'Transferts' },
        { label: 'Comptes', icon: Landmark, routeName: 'Comptes' },
        { label: 'Revenus', icon: TrendingUp, routeName: 'Revenus' },
        { label: 'Rapports', icon: BarChart3, routeName: 'Rapports' },
    ].filter((item) => has(item.routeName))

    if (gestionItems.length) {
        sections.push({ title: 'Gestion', items: gestionItems })
    }

    const catalogueItems = [
        { label: 'Produits', icon: Layers, routeName: 'Produits', isTab: true },
        { label: 'Ajustement Stock', icon: Package, routeName: 'ProduitQuantite' },
        { label: 'Commandes', icon: Tags, routeName: 'Commandes' },
        { label: 'Bordereau de livraison', icon: Truck, routeName: 'BordereauLivraison' },
        { label: 'Proforma / Devis', icon: FileText, routeName: 'ProformaDevis' },
        { label: 'Fournisseurs', icon: Users, routeName: 'Fournisseurs' },
        { label: 'Catégories', icon: Tags, routeName: 'Categories' },
        { label: 'Ventes Agents', icon: Users, routeName: 'VentesEmployees' },
    ].filter((item) => has(item.routeName))

    if (catalogueItems.length) {
        sections.push({ title: 'Catalogue', items: catalogueItems })
    }

    const systemItems = [
        { label: 'Paramètres', icon: Settings, routeName: 'Parametres' },
        { label: 'Profiles', icon: User, routeName: 'Profile', isTab: true },
        { label: 'Déconnexion', icon: LogOut, routeName: 'Logout' },
    ].filter((item) => item.routeName === 'Logout' || has(item.routeName))

    if (systemItems.length) {
        sections.push({ title: 'Système', items: systemItems })
    }

    return sections
}

const CustomDrawer = (props) => {
    const { user, logout } = useContext(AuthContext)
    const permissions = getEffectivePermissions(user)
    const categoryId = getUserCategoryId(user)

    const drawerSections = useMemo(
        () => buildDrawerSections(categoryId, permissions),
        [categoryId, permissions]
    )

    const activeRouteName = getActiveRouteName(props.state)

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel', onPress: () => props.navigation.closeDrawer() },
                {
                    text: 'Déconnecter',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout()
                            props.navigation.closeDrawer()
                            props.navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                })
                            )
                        } catch (error) {
                            console.log('Erreur déconnexion:', error)
                            props.navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                })
                            )
                        }
                    },
                },
            ]
        )
    }

    const onItemPress = (item) => {
        if (item.routeName === 'Logout') {
            handleLogout()
            return
        }
        if (item.isTab) {
            props.navigation.navigate('BottomTabs', { screen: item.routeName })
        } else {
            props.navigation.navigate(item.routeName)
        }
        props.navigation.closeDrawer()
    }

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../../assets/deegipos-noirv4.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                
            </View>

            {drawerSections.map((section) => (
                <View key={section.title} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.items.map((item) => {
                        const isActive = activeRouteName === item.routeName
                        const isLogout = item.routeName === 'Logout'
                        const color = isLogout ? '#DC2626' : (isActive ? COLORS.black : COLORS.text)
                        const Icon = item.icon

                        return (
                            <Pressable
                                key={`${section.title}-${item.routeName}`}
                                onPress={() => onItemPress(item)}
                                style={[
                                    styles.item,
                                    isActive ? styles.itemActive : null,
                                    isLogout ? styles.itemLogout : null,
                                ]}
                            >
                                <Icon size={18} color={color} />
                                <Text style={[styles.itemLabel, { color }]}>{item.label}</Text>
                            </Pressable>
                        )
                    })}
                </View>
            ))}
        </DrawerContentScrollView>
    )
}

export default CustomDrawer

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        backgroundColor: COLORS.white,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.grayInactive,
        marginBottom: 8,
        marginLeft: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginHorizontal: 12,
        marginVertical: 2,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    itemActive: {
        backgroundColor: 'rgba(239,213,14,0.12)',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    itemLogout: {
        marginTop: 8,
        borderColor: 'rgba(220,38,38,0.2)',
        backgroundColor: 'rgba(220,38,38,0.06)',
    },
    itemLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayLight,
        flexDirection: 'column',
        paddingHorizontal: 12,
        paddingBottom: 12,
        backgroundColor: COLORS.white,
    },
    logo: {
        width: 250,
        height: 130,
        marginBottom: 4,
    },
    boutiqueName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 4,
    },
    categoryLine: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.grayInactive,
        textAlign: 'center',
        lineHeight: 14,
        paddingHorizontal: 8,
    },
})
