'use client'

import { EReaderDevice, MediaProgress, ServerSettings, User, UserLoginResponse } from '@/types/api'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
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
  userIsAdminOrUp: boolean
  token: string
  serverSettings: ServerSettings
  userDefaultLibraryId?: string
  ereaderDevices: EReaderDevice[]
  Source: string
  /** Book media id or podcast episode id matches `MediaProgress.mediaItemId` */
  getMediaItemProgress: (mediaItemId: string) => MediaProgress | undefined
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser: UserLoginResponse }) {
  const [currentUserData, setCurrentUserData] = useState<UserLoginResponse>(initialUser)
  const user = currentUserData.user
  const userIsAdminOrUp = user.type === 'admin' || user.type === 'root'

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

  const contextValue: UserContextType = {
    user,
    userCanUpdate: !!(user.permissions?.update || userIsAdminOrUp),
    userCanDelete: !!(user.permissions?.delete || userIsAdminOrUp),
    userCanDownload: !!(user.permissions?.download || userIsAdminOrUp),
    userIsAdminOrUp,
    token: user.token,
    serverSettings: currentUserData.serverSettings,
    userDefaultLibraryId: currentUserData.userDefaultLibraryId,
    ereaderDevices: currentUserData.ereaderDevices,
    Source: currentUserData.Source,
    getMediaItemProgress: (mediaItemId: string) => user.mediaProgress.find((p) => p.mediaItemId === mediaItemId)
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
