import { Button, ButtonTitle } from '@/components/button'
import { Calendar } from '@/components/calendar'
import { Input, InputField } from '@/components/input'
import { Loading } from '@/components/loading'
import { Modal } from '@/components/modal'
import { TripDetails, tripServer } from '@/server/trip-server'
import { colors } from '@/styles/colors'
import { calendarUtils, DatesSelected } from '@/utils/calendarUtils'
import dayjs from 'dayjs'
import { router, useLocalSearchParams } from 'expo-router'
import { CalendarIcon, CalendarRange, Info, Mail, MapPin, Settings2, User } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, Image, Keyboard, Text, TouchableOpacity, View } from 'react-native'
import { DateData } from 'react-native-calendars'
import { Activities } from './activities'
import { Details } from './details'
import { validateInput } from '@/utils/validateInput'
import { participantsServer } from '@/server/participants-server'
import { tripStorage } from '@/storage/trip'

export type TripData = TripDetails & { when: string }

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2,
  CONFIRM_ATTENDANCE = 3,
}

const Trip = () => {
  const { id: tripId, participant } = useLocalSearchParams<{ id: string, participant?: string }>()

  if (!tripId) {
    return router.back()
  }

  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)
  const [tripDetails, setTripDetails] = useState<TripData>({} as TripData)
  const [option, setOption] = useState<'activities' | 'details'>('activities')
  const [showModal, setShowModal] = useState<MODAL>(MODAL.NONE)
  const [destination, setDestination] = useState<string>('')
  const [selectedDates, setSelectedDate] = useState<DatesSelected>({} as DatesSelected)
  const [guestName, setGuestName] = useState<string>('')
  const [guestEmail, setGuestEmail] = useState<string>('')
  const [isConfirmingAttendance, setIsConfirmingAttendance] = useState(false)

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true)

      if(participant) {
        setShowModal(MODAL.CONFIRM_ATTENDANCE)
      }

      if (!tripId) {
        return router.back()
      }

      const trip = await tripServer.getById(tripId)

      const maxDestinationLength = 10
      const destination = trip.destination.length > maxDestinationLength ? trip.destination.slice(0, maxDestinationLength) + '...' : trip.destination

      const starts_at = dayjs(trip.starts_at).format('DD')
      const ends_at = dayjs(trip.ends_at).format('DD')
      const month = dayjs(trip.starts_at).format('MMMM')

      setDestination(trip.destination)

      setTripDetails({
        ...trip,
        when: `${destination}, ${month}, ${starts_at} to ${ends_at}.`
      })
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoadingTrip(false)
    }
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay
    })

    setSelectedDate(dates)
  }

  async function handleUpdateTrip() {
    try {
      setIsUpdatingTrip(true)
      if (!tripId) return

      if(!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
        return Alert.alert("Update trip", "Remember, before updating the trip, you need to fill in all the fields.")
      }

      await tripServer.update({
        id: tripId,
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toISOString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toISOString()
      })

      Alert.alert("Update trip", "Trip updated successfully.", [
        {
          text: "Ok",
          onPress: () => {
            setShowModal(MODAL.NONE)
            getTripDetails()
          }
        }
      ])
    } catch (error) {
      console.log(error)
    } finally {
      setIsUpdatingTrip(false)
    }
  }

  async function handleConfirmAttendance() {
    try {
      if(!participant || !tripId) return

      if(!guestName.trim() || !guestEmail.trim()) {
        return Alert.alert("Confirm attendance", "Before confirming your attendance, fill in all the fields.")
      }

      if(!validateInput.email(guestEmail.trim())) {
        return Alert.alert("Confirm attendance", "Invalid email.")
      }

      await participantsServer.confirmTripByParticipantId({
        email: guestEmail.trim(),
        name: guestName.trim(),
        participantId: participant,
      })

      Alert.alert("Confirmation of attendance", "Your attendance has been confirmed successfully.")
      await tripStorage.save(tripId)
    } catch (error) {
      console.log(error)
      Alert.alert("Confirm attendance", "An error occurred while confirming your attendance.")
    } finally {
      setIsConfirmingAttendance(false)
    }
  }

  async function handleRemoveTrip() {
    try {
      Alert.alert("Remove trip", "Are you sure you want to remove this trip?", [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            await tripStorage.remove()
            router.navigate("/")
          }
        }
      ])
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getTripDetails()
  }, [])
  
  if(isLoadingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 px-5 pt-16">
      <Image 
        source={require("@/assets/bg.png")}
        className='absolute inset-y-1/2 inset-x-1/2 -translate-y-1/2 -translate-x-1/2'
      />
      
      <Input variant='tertiary'>
        <MapPin color={colors.zinc[400]} size={20} />

        <InputField value={tripDetails.when} readOnly/>

        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            width: 28,
            height: 28,
            backgroundColor: colors.zinc[800],
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
          onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
        >
          <Settings2 size={20} color={colors.zinc[400]} />
        </TouchableOpacity>
      </Input>

      {
        option === 'activities' ? (
          <Activities tripDetails={tripDetails} />
        ) : (
          <Details tripId={tripId} />
        )
      }
      
      <View className='w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950'>
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border-zinc-800 border gap-3">
          <Button
            onPress={() => setOption('activities')}
            variant={option === 'activities' ? 'primary' : 'secondary'}
          >
            <CalendarRange color={option === 'activities' ? colors.purple[950] : colors.zinc[200]}/>
            <ButtonTitle>Activities</ButtonTitle>
          </Button>

          <Button
            onPress={() => setOption('details')}
            variant={option === 'details' ? 'primary' : 'secondary'}
          >
            <Info color={option === 'details' ? colors.purple[950] : colors.zinc[200]}/>
            <ButtonTitle>Details</ButtonTitle>
          </Button>
        </View>
      </View>

      <Modal
        title='Update trip'
        subtitle='Only trip owner can update trip details.'
        visible={showModal === MODAL.UPDATE_TRIP}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-2 my-4">
          <Input variant='secondary'>
            <MapPin color={colors.zinc[400]} size={20}/>
            <InputField
              placeholder="Where's the destination?"
              onChangeText={setDestination}
              value={destination}
            />
          </Input>

          <Input variant='secondary'>
            <CalendarIcon color={colors.zinc[400]} size={20}/>
            <InputField
              placeholder="When?"
              value={selectedDates.formatDatesInText}
              onPressIn={() => setShowModal(MODAL.CALENDAR)}
              onFocus={() => Keyboard.dismiss()}
              showSoftInputOnFocus={false}
            />
          </Input>

          <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
            <ButtonTitle>
              Update trip
            </ButtonTitle>
          </Button>

          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10,
              backgroundColor: colors.zinc[800],
              borderRadius: 8,
            }}
            onPress={handleRemoveTrip}
          >
            <Text className="text-red-400 text-center">Remove trip</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      
      <Modal
        title="Select data"
        subtitle='Select the initial and final date of your trip'
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.UPDATE_TRIP)}
      >
        <View className='gap-4 mt-4'>
          <Calendar
            minDate={dayjs().toISOString()}
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
          />

          <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
            <ButtonTitle>Confirm</ButtonTitle>
          </Button>
        </View>
      </Modal>


      <Modal
        title="Confirm presence"
        visible={showModal === MODAL.CONFIRM_ATTENDANCE}
      >
        <View className="gap-4 mt-4">
          <Text className="text-zinc-400 font-regular leading-6 my-2">
            You have been invited to a trip to{" "}
            <Text className='font-semibold text-zinc-100'>{tripDetails.destination}</Text>
            {" "}on the dates of{" "}
            <Text className='font-semibold text-zinc-100'>{dayjs(tripDetails.starts_at).format("MMMM")},{" "}</Text>
            <Text className='font-semibold text-zinc-100'>{dayjs(tripDetails.starts_at).date()}</Text>
            {" "}to{" "}
            <Text className='font-semibold text-zinc-100'>{dayjs(tripDetails.ends_at).date()}.</Text>
          </Text>

          <Text className="text-zinc-400 font-regular leading-6 my-2">To confirm your presence on the trip, fill with your data:</Text>

          <Input variant="secondary">
            <User color={colors.zinc[400]} size={20} />
            <InputField
              placeholder="Your full name"
              onChangeText={setGuestName}
              value={guestName}
            />
          </Input>

          <Input variant="secondary">
            <Mail color={colors.zinc[400]} size={20} />
            <InputField
               placeholder="Your personal email"
               onChangeText={setGuestEmail}
               value={guestEmail}
            />
          </Input>

          <Button isLoading={isConfirmingAttendance} onPress={handleConfirmAttendance}>
            <ButtonTitle>Confirm presence</ButtonTitle>
          </Button>
        </View>
      </Modal>
    </View>
  )
}

export default Trip