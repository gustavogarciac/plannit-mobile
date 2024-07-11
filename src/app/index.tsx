import { Input, InputField } from '@/components/input'
import React, { useEffect, useState } from 'react'
import { Alert, Image, Keyboard, Text, View } from 'react-native'

import { Button, ButtonTitle } from '@/components/button'
import { Calendar } from '@/components/calendar'
import { GuestEmail } from '@/components/email'
import { Modal } from '@/components/modal'
import { tripStorage } from '@/storage/trip'
import { colors } from '@/styles/colors'
import { calendarUtils, DatesSelected } from '@/utils/calendarUtils'
import { validateInput } from '@/utils/validateInput'
import dayjs from 'dayjs'
import { ArrowRight, AtSign, CalendarIcon, MapPin, Settings2, UserRoundPlus } from "lucide-react-native"
import { DateData } from 'react-native-calendars'
import { router } from 'expo-router'
import { tripServer } from '@/server/trip-server'
import { Loading } from '@/components/loading'

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAILS = 2
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2
}

export const Index = () => {
  const [formStep, setFormStep] = useState<StepForm>(StepForm.TRIP_DETAILS)
  const [selectedDates, setSelectedDate] = useState<DatesSelected>({} as DatesSelected)
  const [destination, setDestination] = useState<string>("")
  const [emailToInvite, setEmailToInvite] = useState<string>("")
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])
  const [isCreatingTrip, setIsCreatingTrip] = useState<boolean>(false)
  const [isGettingTrip, setIsGettingTrip] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<MODAL>(MODAL.NONE)

  function handleNextStepForm() {
    if (
      destination.trim().length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert(
        "Detalhes da viagem",
        "Preencha todos as informações da viagem para seguir."
      )
    }

    if (destination.length < 4) {
      return Alert.alert(
        "Detalhes da viagem",
        "O destino deve ter pelo menos 4 caracteres."
      )
    }

    if (formStep === StepForm.TRIP_DETAILS) {
      return setFormStep(StepForm.ADD_EMAILS)
    }

    Alert.alert("New trip", "Confirm trip?", [
      {
        text: 'No',
        style: 'cancel'
      },
      {
        text: 'Yes',
        onPress: createTrip
      }
    ])
  }

  function handlePreviousStepForm() {
    if (formStep === StepForm.TRIP_DETAILS) return

    setFormStep((prev) => prev - 1)
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay
    })

    setSelectedDate(dates)
  }

  function handleRemoveEmail(emailToRemove: string) {
    setEmailsToInvite((prev) => prev.filter((email) => email !== emailToRemove))
  }
  
  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert("Invite guests", "Invalid email.")
    }

    const emailAlreadyInvited = emailsToInvite.find((email) => email === emailToInvite)

    if (emailAlreadyInvited) {
      return Alert.alert("Invite guests", "Email already invited.")
    }

    setEmailsToInvite((prev) => [...prev, emailToInvite])
    setEmailToInvite("")
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId)
      router.navigate(`/trip/${tripId}`)
    } catch (error) {
      Alert.alert("Saving trip", "It was not possible to save the trip. Try again later.")
      console.log(error)
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTrip(true)

      const tripId = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
        emails_to_invite: emailsToInvite
      })

      Alert.alert("New trip", 'Trip created successfully!', [
        {
          text: "Ok, continue.",
          onPress: () => saveTrip(tripId)
        }
      ])
    } catch (error) {
      console.log(error)
    } finally {
      setIsCreatingTrip(false)
    }
  }

  async function getTrip() {
    try {
      const tripId = await tripStorage.get()

      if (!tripId) return setIsGettingTrip(false)

      const trip = await tripServer.getById(tripId)

      if(trip) {
        router.navigate(`/trip/${trip.id}`)
      }
    } catch (error) {
      setIsGettingTrip(false)
      console.log(error)
    }
  }

  useEffect(() => {
    getTrip()
  }, [])
  
  if(isGettingTrip) {
    return <Loading />
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
          <InputField 
            placeholder="Where's the destination?" 
            editable={formStep === StepForm.TRIP_DETAILS} 
            onChangeText={setDestination}
            value={destination}
          />
        </Input>

        <Input>
          <CalendarIcon color={colors.zinc[400]} size={20} />
          <InputField 
            placeholder="When?"
            editable={formStep === StepForm.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() => {
              formStep === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)
            }}
            value={selectedDates.formatDatesInText}
          />
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
              <InputField 
                placeholder="Who's going?"
                autoCorrect={false}
                value={
                  emailsToInvite.length > 0 ? `${emailsToInvite.length} guests invited` : ""
                }
                onPress={() => {
                  Keyboard.dismiss()
                  setShowModal(MODAL.GUESTS)
                }}
                showSoftInputOnFocus={false}
              />
            </Input>
          </>
        )}

        <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
          <ButtonTitle>
              {formStep === StepForm.TRIP_DETAILS ? "Next" : "Confirm trip"}
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

      <Modal
        title="Select data"
        subtitle='Select the initial and final date of your trip'
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className='gap-4 mt-4'>
          <Calendar
            minDate={dayjs().toISOString()}
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
          />

          <Button onPress={() => setShowModal(MODAL.NONE)}>
            <ButtonTitle>Confirm</ButtonTitle>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Select guests"
        subtitle="Guests will receive an email to confirm their participation on the trip."
        visible={showModal === MODAL.GUESTS}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start">
          {
            emailsToInvite.length > 0 ? (
              emailsToInvite.map((email, index) => (
                <GuestEmail key={`${index} - ${email}`} email={email} onRemove={() => handleRemoveEmail(email)}/>
              ))
            ) : (
              <Text className='text-zinc-600 text-base font-regular'>No email added yet.</Text>
            )
          }
        </View>

        <View className="gap-4 mt-4">
          <Input variant="secondary">
            <AtSign size={20} color={colors.purple[300]} />
            <InputField
              placeholder="Type guest's email."
              keyboardType="email-address"
              onChangeText={setEmailToInvite}
              value={emailToInvite}
              returnKeyType='send'
              onSubmitEditing={handleAddEmail}
            />
          </Input>

          <Button onPress={handleAddEmail}>
            <ButtonTitle>Invite</ButtonTitle>
          </Button>
        </View>
      </Modal>
    </View>
  )
}

export default Index