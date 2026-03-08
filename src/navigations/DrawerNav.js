import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import BottomTabs from './BottomTabs'
import ProtectedScreen from '../componants/ProtectedScreen'
import Rapports from '../screens/Rapports'
import Revenus from '../screens/Revenus'
import Comptes from '../screens/Comptes'
import Transferts from '../screens/Transferts'
import Depenses from '../screens/Depenses'
import Parametres from '../screens/Parametres'
import Commandes from '../screens/Commandes'
import Fournisseurs from '../screens/Fournisseurs'
import Categories from '../screens/Categories'
import VentesEmployees from '../screens/VentesEmployees'
import ProformaDevis from '../screens/ProformaDevis'
import ProduitQuantite from '../screens/ProduitQuantite'
import CustomDrawer from '../componants/CustomDrawer'

const Drawer = createDrawerNavigator()

function withProtection(ScreenComponent, screenName) {
  return function ProtectedWrapper(props) {
    return (
      <ProtectedScreen screen={screenName}>
        <ScreenComponent {...props} />
      </ProtectedScreen>
    )
  }
}


const DrawerNav = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#fff', width: '75%', borderRightWidth: 1, borderRightColor: '#F4F5F7' },
        sceneContainerStyle: { backgroundColor: '#fff' },
        swipeEnabled: false,
        overlayColor: 'transparent',
        drawerStatusBarAnimation: 'none',
      }}
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
      <Drawer.Screen name="BottomTabs" component={BottomTabs} />
      <Drawer.Screen name="Depenses" component={withProtection(Depenses, 'Depenses')} />
      <Drawer.Screen name="Transferts" component={withProtection(Transferts, 'Transferts')} />
      <Drawer.Screen name="Comptes" component={withProtection(Comptes, 'Comptes')} />
      <Drawer.Screen name="Rapports" component={withProtection(Rapports, 'Rapports')} />
      <Drawer.Screen name="Revenus" component={withProtection(Revenus, 'Revenus')} />
      <Drawer.Screen name="Commandes" component={withProtection(Commandes, 'Commandes')} />
      <Drawer.Screen name="ProformaDevis" component={withProtection(ProformaDevis, 'ProformaDevis')} />
      <Drawer.Screen name="ProduitQuantite" component={withProtection(ProduitQuantite, 'ProduitQuantite')} />
      <Drawer.Screen name="Fournisseurs" component={withProtection(Fournisseurs, 'Fournisseurs')} />
      <Drawer.Screen name="Categories" component={withProtection(Categories, 'Categories')} />
      <Drawer.Screen name="VentesEmployees" component={withProtection(VentesEmployees, 'VentesEmployees')} />
      <Drawer.Screen name="Parametres" component={withProtection(Parametres, 'Parametres')} />
    </Drawer.Navigator>
  )
}

export default DrawerNav