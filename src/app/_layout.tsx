import "@/styles/global.css"

import { Slot } from 'expo-router'
import { StatusBar, View } from "react-native"

import {
  useFonts,
  Inter_500Medium,
  Inter_400Regular,
  Inter_600SemiBold
} from "@expo-google-fonts/inter"

import { Loading } from "@/components/loading"

const Layout = () => {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold})

  if (!fontsLoaded) return <Loading />

  return (
    <View className="bg-zinc-950 flex-1">
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={'transparent'}
        translucent
      />

      <Slot />
    </View>
  )
}

export default Layout