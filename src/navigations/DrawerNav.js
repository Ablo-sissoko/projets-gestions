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
import BordereauLivraison from '../screens/BordereauLivraison'
import CustomDrawer from '../componants/CustomDrawer'

import DashboardBoulangerie from '../screens/Boulangeries/DashboardBoulangerie'
import ProductionLabo from '../screens/Boulangeries/ProductionLabo'
import StocksAchats from '../screens/Boulangeries/StocksAchats'
import VenteEncaissement from '../screens/Boulangeries/VenteEncaissement'
import RessourcesHumaines from '../screens/Boulangeries/RessourcesHumaines'
import AnalyseFinanciere from '../screens/Boulangeries/AnalyseFinanciere'

import DashboardSalon from '../screens/SalonCoiffure/DashboardSalon'
import CoiffeursEtServices from '../screens/SalonCoiffure/CoiffeursEtServices'
import RendezVous from '../screens/SalonCoiffure/RendezVous'
import AgendaEtAbsences from '../screens/SalonCoiffure/AgendaEtAbsences'
import AtelierEtCouture from '../screens/SalonCoiffure/AtelierEtCouture'

import DashboardTransferts from '../screens/TransfertsArgents/DashboardTransferts'
import OperationsTransferts from '../screens/TransfertsArgents/OperationsTransferts'
import ApprovisionnementTransferts from '../screens/TransfertsArgents/ApprovisionnementTransferts'
import JournalCaisseTransferts from '../screens/TransfertsArgents/JournalCaisseTransferts'
import SecuriteTransferts from '../screens/TransfertsArgents/SecuriteTransferts'
import ComptesUvTransferts from '../screens/TransfertsArgents/ComptesUvTransferts'

import DashboardPrestations from '../screens/PrestationServices/DashboardPrestations'
import CrmDevisPrestations from '../screens/PrestationServices/CrmDevisPrestations'
import PlanificationExecutionPrestations from '../screens/PrestationServices/PlanificationExecutionPrestations'
import SuiviInterventionsPrestations from '../screens/PrestationServices/SuiviInterventionsPrestations'
import FacturationFinancesPrestations from '../screens/PrestationServices/FacturationFinancesPrestations'
import EspaceCollaborateursPrestations from '../screens/PrestationServices/EspaceCollaborateursPrestations'

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

const CUSTOM_SCREEN_MAP = {
  DashboardBoulangerie,
  ProductionLabo,
  StocksAchats,
  VenteEncaissement,
  RessourcesHumaines,
  AnalyseFinanciere,
  DashboardSalon,
  CoiffeursEtServices,
  RendezVous,
  AgendaEtAbsences,
  AtelierEtCouture,
  DashboardTransferts,
  OperationsTransferts,
  ApprovisionnementTransferts,
  JournalCaisseTransferts,
  SecuriteTransferts,
  ComptesUvTransferts,
  DashboardPrestations,
  CrmDevisPrestations,
  PlanificationExecutionPrestations,
  SuiviInterventionsPrestations,
  FacturationFinancesPrestations,
  EspaceCollaborateursPrestations,
}

const DrawerNav = () => (
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
    <Drawer.Screen
      name="BordereauLivraison"
      component={withProtection(BordereauLivraison, 'BordereauLivraison')}
    />
    <Drawer.Screen name="ProformaDevis" component={withProtection(ProformaDevis, 'ProformaDevis')} />
    <Drawer.Screen
      name="ProduitQuantite"
      component={withProtection(ProduitQuantite, 'ProduitQuantite')}
    />
    <Drawer.Screen name="Fournisseurs" component={withProtection(Fournisseurs, 'Fournisseurs')} />
    <Drawer.Screen name="Categories" component={withProtection(Categories, 'Categories')} />
    <Drawer.Screen
      name="VentesEmployees"
      component={withProtection(VentesEmployees, 'VentesEmployees')}
    />
    <Drawer.Screen name="Parametres" component={withProtection(Parametres, 'Parametres')} />

    {Object.entries(CUSTOM_SCREEN_MAP).map(([name, Comp]) => (
      <Drawer.Screen key={name} name={name} component={withProtection(Comp, name)} />
    ))}
  </Drawer.Navigator>
)

export default DrawerNav
