'use client'

import { updateClientSettingsAction } from '@/app/actions/clientSettingsActions'
import { getClientSettings, withClientSettings } from '@/lib/clientSettings'
import { getUserPermissionFlags } from '@/lib/userPermissions'
import { AudioBookmark, ClientSettings, EReaderDevice, MediaProgress, ServerSettings, User, UserLoginResponse } from '@/types/api'
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSocketEvent } from './SocketContext'

interface UserItemProgressUpdatedPayload {
  id: string // MediaProgress ID
  data?: MediaProgress | null
  deviceDescription?: string // e.g. "Windows 10 / Chrome"
  sessionId?: string // PlaybackSession ID
}

export interface UserContextType {
  user: User
  userCanUpdate: boolean
  userCanDelete: boolean
  userCanDownload: boolean
  userCanUpload: boolean
  userIsAdminOrUp: boolean
  token: string
  serverSettings: ServerSettings
  userDefaultLibraryId?: string
  ereaderDevices: EReaderDevice[]
  Source: string
  /** Book media id or podcast episode id matches `MediaProgress.mediaItemId` */
  getMediaItemProgress: (mediaItemId: string) => MediaProgress | undefined
  getBookmarksForLibraryItem: (libraryItemId: string) => AudioBookmark[]
  mergeServerSettings: (settings: ServerSettings | null | undefined) => void
  clientSettings: ClientSettings
  updateClientSetting: <K extends keyof ClientSettings>(key: K, value: ClientSettings[K]) => void
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser: UserLoginResponse }) {
  const [currentUserData, setCurrentUserData] = useState<UserLoginResponse>(initialUser)
  const user = currentUserData.user
  const permissionFlags = getUserPermissionFlags(user)

  useSocketEvent<User>('user_updated', (updatedUser) => {
    if (updatedUser.id === currentUserData.user.id) {
      setCurrentUserData((prev) => ({
        ...prev,
        user: updatedUser
      }))
    }
  })

  useSocketEvent<UserItemProgressUpdatedPayload>('user_item_progress_updated', (payload) => {
    if (!payload?.id) return

    // TODO: handle check if media item is currently playing to show alert if another device is playing the same item

    setCurrentUserData((prev) => {
      const currentProgress = prev.user.mediaProgress || []

      const index = currentProgress.findIndex((entry) => entry.id === payload.id)
      const nextProgress = [...currentProgress]

      if (index >= 0) {
        nextProgress[index] = payload.data!
      } else {
        nextProgress.push(payload.data!)
      }

      return {
        ...prev,
        user: {
          ...prev.user,
          mediaProgress: nextProgress
        }
      }
    })
  })

  // To capture if initialUser changes from server refresh
  useEffect(() => {
    setCurrentUserData(initialUser)
  }, [initialUser])

  const clientSettings = getClientSettings(user.clientSettings)
  /** Settings changed while a save is in flight, sent once it finishes */
  const pendingClientSettingsRef = useRef<ClientSettings | null>(null)
  const clientSettingsSavingRef = useRef(false)

  /**
   * Sends pending settings one request at a time. Rapid changes such as dragging the cover
   * size collapse into the latest value rather than queueing a request per change, so the
   * server ends up holding what is on screen without a round trip for every step.
   */
  const flushClientSettings = useCallback(async () => {
    if (clientSettingsSavingRef.current) return
    clientSettingsSavingRef.current = true

    try {
      while (pendingClientSettingsRef.current) {
        const settings = pendingClientSettingsRef.current
        pendingClientSettingsRef.current = null

        // The response is not applied to state: the value is already there optimistically,
        // and writing it back would fight whatever the user has changed since
        await updateClientSettingsAction(settings)
      }
    } catch (error) {
      console.error('Failed to save client settings', error)
    } finally {
      clientSettingsSavingRef.current = false
    }
  }, [])

  const updateClientSetting = useCallback(
    <K extends keyof ClientSettings>(key: K, value: ClientSettings[K]) => {
      // Applied locally first so the widget responds without waiting for the request
      setCurrentUserData((prev) => ({
        ...prev,
        user: { ...prev.user, clientSettings: withClientSettings(prev.user.clientSettings, { ...getClientSettings(prev.user.clientSettings), [key]: value }) }
      }))

      pendingClientSettingsRef.current = { ...pendingClientSettingsRef.current, [key]: value }
      flushClientSettings()
    },
    [flushClientSettings]
  )

  const mergeServerSettings = useCallback((settings: ServerSettings | null | undefined) => {
    if (!settings) {
      return
    }
    setCurrentUserData((prev) => ({
      ...prev,
      serverSettings: settings
    }))
  }, [])

  const contextValue: UserContextType = {
    user,
    ...permissionFlags,
    token: user.token,
    serverSettings: currentUserData.serverSettings,
    userDefaultLibraryId: currentUserData.userDefaultLibraryId,
    ereaderDevices: currentUserData.ereaderDevices,
    Source: currentUserData.Source,
    getMediaItemProgress: (mediaItemId: string) => user.mediaProgress.find((p) => p.mediaItemId === mediaItemId),
    getBookmarksForLibraryItem: (libraryItemId: string) => user.bookmarks?.filter((bm) => bm.libraryItemId === libraryItemId) ?? [],
    mergeServerSettings,
    clientSettings,
    updateClientSetting
  }

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
