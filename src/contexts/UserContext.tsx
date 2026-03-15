'use client'

import { EReaderDevice, MediaProgress, ServerSettings, User, UserLoginResponse } from '@/types/api'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useSocketEvent } from './SocketContext'

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
  getLibraryItemProgress: (libraryItemId: string) => MediaProgress | undefined
  getEpisodeProgress: (episodeId: string) => MediaProgress | undefined
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
    getLibraryItemProgress: (libraryItemId: string) => user.mediaProgress.find((p) => p.libraryItemId === libraryItemId && !p.episodeId),
    getEpisodeProgress: (episodeId: string) => user.mediaProgress.find((p) => p.mediaItemId === episodeId)
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
