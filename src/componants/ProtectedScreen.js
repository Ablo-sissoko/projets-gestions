import React, { useContext } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AuthContext } from '../context/AuthContext'
import { getEffectivePermissions } from '../config/rolesPermissions'

export default function ProtectedScreen({ screen, children }) {
  const { user } = useContext(AuthContext)
  const permissions = getEffectivePermissions(user)

  if (!permissions.includes(screen)) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Accès refusé</Text>
      </View>
    )
  }

  return children
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7FB',
  },
  text: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
})
