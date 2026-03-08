import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"

const BarcodeScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    if (!permission) requestPermission()
  }, [])

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>Permission caméra requise</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Autoriser</Text>
        </TouchableOpacity>
      </View>
    )
  }
  
  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return
  
    setScanned(true)
  
    setTimeout(() => {
      navigation.navigate("BottomTabs", {
        screen: "Ventes",
        params: { barcode: data },
      })
    }, 300)
  }
  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "code128", "qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default BarcodeScannerScreen