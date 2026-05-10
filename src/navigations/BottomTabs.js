import React, { useContext, useMemo } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Dashboard from '../screens/Dashboard'
import Ventes from '../screens/Ventes'
import Produits from '../screens/Produits'
import Clients from '../screens/Clients'
import CustonBottomTabs from '../componants/CustonBottomTabs'
import Profiles from '../screens/Profiles'
import { AuthContext } from '../context/AuthContext'
import { getEffectivePermissions } from '../config/rolesPermissions'
import { getUserCategoryId, getBottomTabRouteOrder } from '../config/entrepriseConfig'

import DashboardBoulangerie from '../screens/Boulangeries/DashboardBoulangerie'
import DashboardSalon from '../screens/SalonCoiffure/DashboardSalon'
import DashboardTransferts from '../screens/TransfertsArgents/DashboardTransferts'
import DashboardPrestations from '../screens/PrestationServices/DashboardPrestations'

const Tabs = createBottomTabNavigator()

const Accueil = DashboardSalon
/** Composant par nom d’onglet (écrans racine + 1er tableau de bord métier par catégorie). */
const TAB_COMPONENTS = {
  Dashboard,
  Ventes,
  Produits,
  Clients,
  Profile: Profiles,
  DashboardBoulangerie,
  Accueil,
  DashboardTransferts,
  DashboardPrestations,
}

const BottomTabs = () => {
  const { user } = useContext(AuthContext)
  const permissions = getEffectivePermissions(user)
  const categoryId = getUserCategoryId(user)

  const tabRoutes = useMemo(() => getBottomTabRouteOrder(categoryId), [categoryId])

  const screens = tabRoutes
    .filter((routeName) => permissions.includes(routeName))
    .map((routeName) => {
      const Component = TAB_COMPONENTS[routeName]
      return Component ? { routeName, Component } : null
    })
    .filter(Boolean)

  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustonBottomTabs {...props} />}
    >
      {screens.map(({ routeName, Component }) => (
        <Tabs.Screen key={routeName} name={routeName} component={Component} />
      ))}
    </Tabs.Navigator>
  )
}

export default BottomTabs
