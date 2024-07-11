import { createContext, useContext } from "react"

import {
  Text,
  TextProps,
  TouchableOpacity,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native"

import clsx from "clsx"
import { colors } from "@/styles/colors"

type Variants = "primary" | "secondary"

type ButtonProps = TouchableOpacityProps & {
  variant?: Variants
  isLoading?: boolean
}

const ThemeContext = createContext<{ variant?: Variants }>({})

const Button = ({
  variant = "primary",
  children,
  isLoading,
  className,
  ...rest
}: ButtonProps) => {
  return (
    <TouchableOpacity 
      style={{
        height: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        paddingHorizontal: 8,
        gap: 8,
        flex: 1,
        backgroundColor: variant === "primary" ? "#d8b4fe" : colors.zinc[800],
      }}
      activeOpacity={0.7}
      disabled={isLoading}
      {...rest}
    >
      <ThemeContext.Provider value={{ variant }}>
        {isLoading ? <ActivityIndicator className="text-purple-950" /> : children}
      </ThemeContext.Provider>
    </TouchableOpacity>
  )
}

const ButtonTitle = ({ children }: TextProps) => {
  const { variant } = useContext(ThemeContext)

  return (
    <Text className={clsx(
      "text-base font-semibold", 
      {
        "text-purple-950" : variant === 'primary',
        "text-zinc-200" : variant === 'secondary'
      }
    )}>{children}</Text>
  )
}

ButtonTitle.displayName = ButtonTitle

export {
  Button,
  ButtonTitle
}