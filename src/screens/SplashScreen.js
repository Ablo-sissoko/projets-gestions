import React, { useEffect, useContext } from "react"
import { View, Image, StyleSheet, StatusBar } from "react-native"
import { AuthContext } from "../context/AuthContext"

const SPLASH_LOGO = require("../../assets/deegipos_logo_avec_slogan.png")

export default function SplashScreen({ navigation }) {
  const { token, loading } = useContext(AuthContext)

  useEffect(() => {
    if (loading) return
    const go = async () => {
      await new Promise((r) => setTimeout(r, 1000))
      if (token) {
        navigation.replace("Drawer")
      } else {
        navigation.replace("Login")
      }
    }
    go()
  }, [loading, token])

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        source={SPLASH_LOGO}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "80%",
    maxWidth: 320,
    height: 160,
  },
})
