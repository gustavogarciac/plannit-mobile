import { Button, ButtonTitle } from '@/components/button'
import { Modal } from '@/components/modal'
import { colors } from '@/styles/colors'
import { CalendarIcon, ClockIcon, PlusIcon, Tag } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, Keyboard, SectionList, Text, View } from 'react-native'
import { TripData } from './[id]'
import { Input, InputField } from '@/components/input'
import dayjs from 'dayjs'
import { Calendar } from '@/components/calendar'
import { activitiesServer } from '@/server/activities-server'
import { Activity, ActivityProps } from '@/components/activity'
import { Loading } from '@/components/loading'

type Props = {
  tripDetails: TripData
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  NEW_ACTIVITY = 2,
}

type TripActivities = {
  title: {
    dayNumber: number
    dayName: string
  }
  data: ActivityProps[]
}

const Activities = ({ tripDetails }: Props) => {
  const [showModal, setShowModal] = useState(MODAL.NONE)
  const [tripActivities, setTripActivities] = useState<TripActivities[]>([])
  const [activityTitle, setActivityTitle] = useState("")
  const [activityDate, setActivityDate] = useState("")
  const [activityHour, setActivityHour] = useState("")
  const [isCreatingActivity, setIsCreatingActivity] = useState(false)
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)

  function resetNewActivityFields() {
    setActivityTitle("")
    setActivityDate("")
    setActivityHour("")
  }

  async function handleCreateActivity() {
    try {
      if(!activityTitle || !activityDate || !activityHour) {
        return Alert.alert("Create activity", "Fill all fields to create an activity.")
      }

      setIsCreatingActivity(true)

      await activitiesServer.create({
        tripId: tripDetails.id,
        title: activityTitle,
        occurs_at: dayjs(activityDate).add(Number(activityHour), 'h').toString(),
      })

      Alert.alert("New activity", "Activity created successfully.")

      await getTripActivities()
      resetNewActivityFields()

    } catch (error) {
      console.log(error)
    } finally {
      setIsCreatingActivity(false)
    }
  }

  async function getTripActivities() {
    try {
      const activities = await activitiesServer.getActivitiesByTripId(tripDetails.id)

      const activitiesToSectionList = activities.map((item) => ({
        title: {
          dayNumber: dayjs(item.date).date(),
          dayName: dayjs(item.date).format("dddd"),
        },
        data: item.activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          hour: dayjs(activity.occurs_at).format("HH:mm"),
          isBefore: dayjs(activity.occurs_at).isBefore(dayjs()),
        }))
      }))
      setTripActivities(activitiesToSectionList)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  useEffect(() => {
    getTripActivities()
  }, [])

  
  return (
    <View className="flex-1">
      <View className="w-full flex-row mt-5 mb-6 items-center">
        <Text className="text-zinc-50 font-semibold text-2xl w-[60%]">Activities</Text>

        <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
          <PlusIcon color={colors.purple[950]} size={20}/>
          <ButtonTitle>
            New Activity
          </ButtonTitle>
        </Button>
      </View>

      {
        isLoadingActivities ? (
          <Loading />
        ) : (
          <SectionList 
            sections={tripActivities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Activity data={item} />
            )}
            renderSectionHeader={({ section }) => (
              <View className="w-full">
                <Text className="text-zinc-50 text-2xl font-semibold py-2">
                  Day {section.title.dayNumber + " "}
                  <Text className="text-zinc-500 text-base font-regular capitalize">
                    ({section.title.dayName})
                  </Text>
                </Text>

                { 
                  section.data.length === 0 && (
                    <Text className="text-zinc-500 font-regular text-sm mb-8">
                      There are no activities on this date.
                    </Text>
                  )
                }
              </View>
            )}
            contentContainerClassName='gap-3 pb-48'
            showsVerticalScrollIndicator={false}
          />
        )
      }

      <Modal
        title="New activity"
        subtitle="Every guest can see the activities."
        visible={showModal === MODAL.NEW_ACTIVITY}
        onClose={() => setShowModal(MODAL.NONE)} 
      >
        <View className="mt-4 mb-3 gap-2">
          <Input variant="secondary">
            <Tag color={colors.zinc[400]} size={20} />
            <InputField
              placeholder="What's the activity?"
              onChangeText={setActivityTitle}
              value={activityTitle}
            />
          </Input>

          <View className='w-full flex-row gap-2'>
            <Input variant="secondary" className='flex-1'>
              <CalendarIcon color={colors.zinc[400]} size={20} />
              <InputField
                placeholder="Date?"
                onChangeText={setActivityHour}
                value={activityDate ? dayjs(activityDate).format("MMMM, DD") : ""}
                onFocus={() => Keyboard.dismiss()}
                showSoftInputOnFocus={false}
                onPressIn={() => setShowModal(MODAL.CALENDAR)}
              />
            </Input>

            <Input variant="secondary" className="flex-1">
              <ClockIcon color={colors.zinc[400]} size={20} />
              <InputField
                placeholder="Hour?"
                onChangeText={(text) => setActivityHour(text.replace('.', '').replace(',', ''))}
                value={activityHour}
                keyboardType='numeric'
                maxLength={2}
              />
            </Input>

          </View>

          <Button
            onPress={() => {
              handleCreateActivity()
              setShowModal(MODAL.NONE)
            }}
            isLoading={isCreatingActivity}
          >
            <ButtonTitle>
              Create activity
            </ButtonTitle>
          </Button>

        </View>
      </Modal>

      <Modal
        title='Select data'
        subtitle='Select activity date'
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar
            onDayPress={(day) => setActivityDate(day.dateString)}
            markedDates={{ [activityDate]: { selected: true }}}
            initialDate={tripDetails.starts_at.toString()}
            minDate={tripDetails.starts_at.toString()}
            maxDate={tripDetails.ends_at.toString()}
          />

          <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
            <ButtonTitle>Save</ButtonTitle>
          </Button>
        </View>
      </Modal>
    </View>
  )
}

export { Activities }
