import React from 'react'
import { ActivityIndicator } from 'react-native'

type Props = {}

export const Loading = (props: Props) => {
  return (
    <ActivityIndicator className='flex-1 bg-zinc-950 items-center justify-center text-purple-300'/>
  )
}