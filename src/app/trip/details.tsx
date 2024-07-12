import React, { useEffect, useState } from 'react'
import { Alert, FlatList, Text } from 'react-native'
import { View } from 'react-native'
import { TripData } from './[id]'
import { Button, ButtonTitle } from '@/components/button'
import { PlusIcon } from 'lucide-react-native'
import { colors } from '@/styles/colors'
import { Modal } from '@/components/modal'
import { Input, InputField } from '@/components/input'
import { validateInput } from '@/utils/validateInput'
import { linksServer } from '@/server/links-server'
import { TripLink, TripLinkProps } from '@/components/tripLink'
import { Loading } from '@/components/loading'
import { participantsServer } from '@/server/participants-server'
import { Participant, ParticipantProps } from '@/components/participant'

type Props = {
  tripId: string
}

const Details = ({ tripId }: Props) => {
  const [showModal, setShowModal] = useState(false)
  const [linkName, setLinkName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [isLoadingLinks, setIsLoadingLinks] = useState(true)
  const [links, setLinks] = useState<TripLinkProps[]>([])
  const [participants, setParticipants] = useState<ParticipantProps[]>([])

  function resetNewLinkFields() {
    setLinkName("")
    setLinkUrl("")
  }

  async function handleCreateLink() {
    try {
      if (!linkName.trim()) {
        return Alert.alert('Invalid link title', 'Please enter a link title.')
      }

      if(!validateInput.url(linkUrl.trim())) {
        return Alert.alert('Invalid URL', 'Please enter a valid URL.')
      }

      setIsCreatingLink(true)

      await linksServer.create({
        title: linkName,
        url: linkUrl,
        tripId,
      })

      Alert.alert("Create link", "Link created successfully.")
      resetNewLinkFields()
      getLinks()
    } catch (error) {
      console.log(error)
    } finally {
      setIsCreatingLink(false)
    }
  }

  async function getLinks() {
    try {
      const links = await linksServer.getLinksByTripId(tripId)

      setLinks(links)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoadingLinks(false)
    }
  }

  async function getParticipants() {
    try {
      const participants = await participantsServer.getByTripId(tripId)

      setParticipants(participants)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getLinks()
    getParticipants()
  }, [])

  if(isLoadingLinks) {
    return <Loading />
  }

  return (
    <View className="flex-1 mt-5">
      <Text className="text-zinc-50 text-2xl font-semibold">Important links</Text>
        
      <View className='flex-1'>
        { links.length > 0 ? (
            <FlatList 
              keyExtractor={(item) => item.id}
              data={links}
              renderItem={({ item }) => (
                <TripLink data={item} />
              )}
              contentContainerClassName='gap-4'
            />
          ) : (
            <Text className="text-zinc-400 font-regular text-base mt-2 mb-6">There are no links yet.</Text>
          )
        }

        <View className="flex-row">
          <Button variant="secondary" onPress={() => setShowModal(true)}>
            <PlusIcon size={20} color={colors.zinc[200]} />
            <ButtonTitle>New link</ButtonTitle>
          </Button>
        </View>
      </View>

      <View style={{ flex: 1, marginVertical: 8 }}>
        <Text className="text-zinc-50 text-2xl font-semibold my-6">Guests</Text>

        <FlatList 
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Participant data={item} />
          )}
          contentContainerClassName='gap-4'
        />
      </View>

      <Modal
        title="New link"
        subtitle='Every guest can see the links.'
        visible={showModal}
        onClose={() => setShowModal(false)}
      >
        <View className="gap-2 mb-3">
          <Input variant='secondary'>
            <InputField 
              placeholder='Link title'
              onChangeText={setLinkName}
              value={linkName}
            />
          </Input>

          <Input variant='secondary'>
            <InputField 
              placeholder='Link URL'
              onChangeText={setLinkUrl}
              value={linkUrl}
            />
          </Input>
        </View>

        <Button isLoading={isCreatingLink} onPress={() => {
          handleCreateLink()
          setShowModal(false)
        }}>
          <ButtonTitle>Save link</ButtonTitle>
        </Button>
      </Modal>
    </View>
  )
}

export { Details }