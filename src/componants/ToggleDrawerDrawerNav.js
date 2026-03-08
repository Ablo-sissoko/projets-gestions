import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

const ToggleDrawerDrawerNav = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const navigation = useNavigation();

   useEffect(() => {
    navigation.toggleDrawer();
   }, [isDrawerOpen]);


  return (
    <View>
      <Pressable onclick={() => setIsDrawerOpen(!isDrawerOpen)}>
        <Text>ToggleDrawerDrawerNav</Text>
      </Pressable>
    </View>
  )
}

export default ToggleDrawerDrawerNav

const styles = StyleSheet.create({})