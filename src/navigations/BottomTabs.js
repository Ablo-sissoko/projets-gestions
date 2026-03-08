import React, { useContext } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Dashboard from '../screens/Dashboard'
import Ventes from '../screens/Ventes'
import Produits from '../screens/Produits'
import Clients from '../screens/Clients'
import CustonBottomTabs from '../componants/CustonBottomTabs'
import Profiles from '../screens/Profiles'
import { AuthContext } from '../context/AuthContext'
import { getPermissionsForRole } from '../config/rolesPermissions'

const Tabs = createBottomTabNavigator()

const BottomTabs = () => {
  const { user } = useContext(AuthContext)
  const permissions = getPermissionsForRole(user)

  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustonBottomTabs {...props} />}
    >
      {permissions.includes('Dashboard') && (
        <Tabs.Screen name="Dashboard" component={Dashboard} />
      )}
      {permissions.includes('Clients') && (
        <Tabs.Screen name="Clients" component={Clients} />
      )}
      {permissions.includes('Ventes') && (
        <Tabs.Screen name="Ventes" component={Ventes} />
      )}
      {permissions.includes('Produits') && (
        <Tabs.Screen name="Produits" component={Produits} />
      )}
      {permissions.includes('Profile') && (
        <Tabs.Screen name="Profile" component={Profiles} />
      )}
    </Tabs.Navigator>
  )
}

export default BottomTabs