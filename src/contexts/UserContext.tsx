'use client'

import { EReaderDevice, MediaProgress, ServerSettings, User, UserLoginResponse } from '@/types/api'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useSocketEvent } from './SocketContext'

interface UserContextType {
  user: User
  token: string
  serverSettings: ServerSettings
  userDefaultLibraryId?: string
  ereaderDevices: EReaderDevice[]
  Source: string
  getLibraryItemProgress: (libraryItemId: string) => MediaProgress | undefined
  getEpisodeProgress: (episodeId: string) => MediaProgress | undefined
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser: UserLoginResponse }) {
  const [currentUserData, setCurrentUserData] = useState<UserLoginResponse>(initialUser)

  useSocketEvent<User>('user_updated', (updatedUser) => {
    if (updatedUser.id === currentUserData.user.id) {
      setCurrentUserData((prev) => ({
        ...prev,
        user: updatedUser
      }))
    }
  })

  // To capture if initialUser changes from server refresh
  useEffect(() => {
    setCurrentUserData(initialUser)
  }, [initialUser])

  const contextValue: UserContextType = {
    user: currentUserData.user,
    token: currentUserData.user.token,
    serverSettings: currentUserData.serverSettings,
    userDefaultLibraryId: currentUserData.userDefaultLibraryId,
    ereaderDevices: currentUserData.ereaderDevices,
    Source: currentUserData.Source,
    getLibraryItemProgress: (libraryItemId: string) => currentUserData.user.mediaProgress.find((p) => p.libraryItemId === libraryItemId && !p.episodeId),
    getEpisodeProgress: (episodeId: string) => currentUserData.user.mediaProgress.find((p) => p.mediaItemId === episodeId)
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
