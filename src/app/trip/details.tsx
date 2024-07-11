import React from 'react'
import { Text } from 'react-native'
import { View } from 'react-native'
import { TripData } from './[id]'

type Props = {
  tripId: string
}

const Details = ({ tripId }: Props) => {
  return (
    <View className="flex-1">
      <Text className="text-zinc-200">{tripId}</Text>
    </View>
  )
}

export { Details }