import { View, Text, Image } from 'react-native'
import React, { useState } from 'react'
import { Input, InputField } from '@/components/input'

import { ArrowRight, CalendarIcon, MapPin, Settings2, UserRoundPlus } from "lucide-react-native"
import { colors } from '@/styles/colors'
import { Button, ButtonTitle } from '@/components/button'

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAILS = 2
}

export const Index = () => {
  const [formStep, setFormStep] = useState<StepForm>(StepForm.TRIP_DETAILS)

  function handleNextStepForm() {
    if (formStep === StepForm.ADD_EMAILS) return
    setFormStep((prev) => prev + 1)
  }

  function handlePreviousStepForm() {
    if (formStep === StepForm.TRIP_DETAILS) return

    setFormStep((prev) => prev - 1)
  }

  return (
    <View className="flex-1 justify-center items-center px-5">
      <Image 
        source={require("@/assets/logo.png")}
        className="h-8"
        resizeMode='contain'
      />

      <Image 
        source={require("@/assets/bg.png")}
        className="absolute"
      />

      <Text className='text-zinc-400 font-regular text-center text-lg mt-3'>Invite your friends to {"\n"}your next trip!</Text>

      <View className="w-full bg-zinc-900 p-4 rounded-lg my-8 border border-zinc-800">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <InputField placeholder="Where's the destination?" editable={formStep === StepForm.TRIP_DETAILS} />
        </Input>

        <Input>
          <CalendarIcon color={colors.zinc[400]} size={20} />
          <InputField placeholder="When?" editable={formStep === StepForm.TRIP_DETAILS} />
        </Input>

        { formStep === StepForm.ADD_EMAILS && (
          <>
            <View className="border-b py-3 border-zinc-800">
              <Button variant='secondary' onPress={handlePreviousStepForm}>
                <ButtonTitle>
                  <Text>Change date/destination</Text>
                </ButtonTitle>
                <Settings2 size={20} color={colors.zinc[200]} />
              </Button>
            </View>

            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <InputField placeholder="Who's going?"/>
            </Input>
          </>
        )}

        <Button onPress={handleNextStepForm}>
          <ButtonTitle>
            <Text>
              {formStep === StepForm.TRIP_DETAILS ? "Next" : "Confirm trip"}
            </Text>
          </ButtonTitle>
          <ArrowRight size={20} color={colors.purple[950]} />
        </Button>
      </View>

      <Text className="text-zinc-500 font-regular text-center text-sm">
        When travelling with plann.it you automatically agree with our{" "}
        <Text className="text-zinc-400 underline">
          terms of use and policy services.
        </Text>
      </Text>
    </View>
  )
}

export default Index