import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthProvider } from "./src/context/AuthContext";
import { navigationRef } from "./src/navigationRef";
import DrawerNav from "./src/navigations/DrawerNav";
import BottomTabs from "./src/navigations/BottomTabs";
import Login from "./src/Auths/Login";
import CreationCompte from "./src/Auths/CreationCompte";
import BarcodeScannerScreen from "./src/componants/BarcodeScannerScreen";
import Abonnements from "./src/screens/Abonnements";
import PaiementCarte from "./src/screens/PaiementCarte";
import SplashScreen from "./src/screens/SplashScreen";
import Utilisateurs from "./src/screens/Utilisateurs";
import EntrepriseInfos from "./src/screens/EntrepriseInfos";
import Profiles from "./src/screens/Profiles";


const Stack = createNativeStackNavigator();




export default function App() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="#e46c35" />
        <SafeAreaView style={{ flex: 1 }}>
          <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>
          <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="CreationCompte" component={CreationCompte} options={{ headerShown: false }} />
          <Stack.Screen name="Drawer" component={DrawerNav} options={{ headerShown: false }} />
          <Stack.Screen name="BottomTabs" component={BottomTabs} options={{ headerShown: false }} />
          <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Abonnements" component={Abonnements} options={{ headerShown: false }} />
          <Stack.Screen name="PaiementCarte" component={PaiementCarte} options={{ headerShown: false }} />
          <Stack.Screen name="Utilisateurs" component={Utilisateurs} options={{ headerShown: false }} />
          <Stack.Screen name="Entreprise" component={EntrepriseInfos} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={Profiles} options={{ headerShown: false }} />
        </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </SafeAreaView>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}