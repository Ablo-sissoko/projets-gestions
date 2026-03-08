import React, { useContext } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Menu } from 'lucide-react-native'
import { AuthContext } from '../context/AuthContext'

const Header = () => {
  const navigation = useNavigation()
  const { user } = useContext(AuthContext)

  const handleOpenDrawer = () => {
    const parent = navigation.getParent?.()
    if (parent?.openDrawer) {
      parent.openDrawer()
      return
    }
    if (navigation.openDrawer) {
      navigation.openDrawer()
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleOpenDrawer}
        accessibilityRole="button"
        style={styles.header}
      >
        <Pressable onPress={handleOpenDrawer} style={styles.burgerBtn}>
          <Menu size={30} color="#1F2937" />
        </Pressable>
        <Image
          source={require('../../assets/logo-deegipos-v2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>DEEGIPOS</Text>
          <Text style={styles.appSubtitle}>Gestion & ventes</Text>
        </View>
      </Pressable>
      <View style={styles.agentBlock}>
        <Text style={styles.agentLabel}>{user?.roleName}</Text>
        <Text style={styles.agentName}>{user?.prenom} {user?.nom}</Text>
      </View>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  burgerBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  agentBlock: {
    marginTop: 4,
  },
  agentLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
})