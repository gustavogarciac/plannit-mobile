import React from 'react'
import { Text } from 'react-native'
import { View } from 'react-native'
import { TripData } from './[id]'

type Props = {
  tripDetails: TripData
}

const Activities = ({ tripDetails }: Props) => {
  return (
    <View className="flex-1">
      <Text className="text-zinc-200">{tripDetails.destination}</Text>
    </View>
  )
}

export { Activities }