import { colors } from '@/styles/colors'
import clsx from 'clsx'
import React from 'react'
import { Platform, TextInput, View, ViewProps } from 'react-native'
import { TextInputProps } from 'react-native/Libraries/Components/TextInput/TextInput'

type Variants = 'primary' | 'secondary' | 'tertiary'

type Props = ViewProps & {
  children: React.ReactNode
  variant?: Variants
}

const Input = ({ children, variant = 'primary', className, ...props}: Props) => {
  return (
    <View
      className={clsx(
        "min-h-16 max-h-16 flex-row items-center gap-2",
        {
          "h-14 px-4 rounded-lg border border-zinc-800": variant !== "primary",
          "bg-zinc-950": variant === "secondary",
          "bg-zinc-900": variant === "tertiary"
        },
        className
      )}
      {...props}  
    >
      {children}
    </View>
  )
}

const InputField = ({ ...props } : TextInputProps) => {
  return (
    <TextInput 
      className='flex-1 text-zinc-100 text-lg font-regular'
      placeholderTextColor={colors.zinc[400]}
      cursorColor={colors.zinc[100]}
      selectionColor={Platform.OS === 'ios' ? colors.zinc[100] : undefined}
      {...props}
    />
  )
}

InputField.displayName = InputField

export {
  Input,
  InputField
}