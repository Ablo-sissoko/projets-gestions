import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

const ORANGE = "#efd50e";
const BLACK = "#000000";

const SIZE = 100;
const STROKE = 10;

export default function LoadingScreen({
  message = "Chargement des données...",
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        {/* Cercle léger background */}
        <View style={styles.backgroundCircle} />

        {/* Arc Orange */}
        <Animated.View
          style={[
            styles.arc,
            {
              borderTopColor: ORANGE,
              borderRightColor: ORANGE,
              transform: [{ rotate }],
            },
          ]}
        />

        {/* Arc Noir opposé */}
        <Animated.View
          style={[
            styles.arc,
            {
              borderBottomColor: BLACK,
              borderLeftColor: BLACK,
              transform: [{ rotate }],
            },
          ]}
        />
      </View>

      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width,
    height,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,

  },

  loaderWrapper: {
    width: SIZE,
    height: SIZE,
    justifyContent: "center",
    alignItems: "center",
  },

  backgroundCircle: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: "#f1f1f1",
  },

  arc: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: "transparent",
  },

  text: {
    marginTop: 35,
    fontSize: 15,
    color: "#444",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});