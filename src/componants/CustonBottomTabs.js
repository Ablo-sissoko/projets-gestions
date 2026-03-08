import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Users,
  User,
} from 'lucide-react-native'

const COLORS = {
  primary: '#000000',
  white: '#FFFFFF',
  grayLight: '#F4F5F7',
  grayInactive: '#707070',
  text: '#1F2937',
}

const TAB_ICONS = {
  Dashboard: LayoutDashboard,
  Ventes: ShoppingCart,
  Produits: Package,
  Clients: Users,
  Profile: User,
}

function TabButton({ label, icon: Icon, focused, onPress, onLongPress }) {
  const color = focused ? COLORS.primary : COLORS.grayInactive

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      style={styles.tabButton}
    >
      {
        label==='Ventes' ? (
          <View style={{backgroundColor:'#efd50e',padding:10,borderRadius:10,alignItems:'center',justifyContent:'center'}}>
            <Icon size={20} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <Icon size={20} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </View>
        )
      }
     
    </Pressable>
  )
}

const CustonBottomTabs = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const label = options.tabBarLabel ?? options.title ?? route.name
        const focused = state.index === index
        const Icon = TAB_ICONS[route.name] ?? Menu

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          })
        }

        return (
          <TabButton
            key={route.key}
            label={label}
            icon={Icon}
            focused={focused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        )
      })}
    </View>
  )
}

export default CustonBottomTabs

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 72,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopColor: COLORS.grayLight,
    borderTopWidth: 1,
    backgroundColor: COLORS.white,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIndicator: {
    marginTop: 6,
    width: 18,
    height: 3,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
})