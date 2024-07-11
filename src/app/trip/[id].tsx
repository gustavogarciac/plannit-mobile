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
import { CalendarIcon, CalendarRange, Info, MapPin, Settings2 } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, Keyboard, Text, TouchableOpacity, View } from 'react-native'
import { DateData } from 'react-native-calendars'
import { Activities } from './activities'
import { Details } from './details'

export type TripData = TripDetails & { when: string }

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2,
}

const Trip = () => {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()

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

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true)

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

  useEffect(() => {
    getTripDetails()
  }, [])
  
  if(isLoadingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 px-5 pt-16">
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

    </View>
  )
}

export default Trip