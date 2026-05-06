'use client'

import { OnlineUser } from '@/types/api'
import { useRouter } from 'next/navigation'
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Socket, io } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  usersOnline: OnlineUser[]
  getOnlineUser: (userId: string) => OnlineUser | undefined
  getIsUserOnline: (userId: string) => boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketInitPayload {
  userId: string
  username: string
  usersOnline?: OnlineUser[]
}

interface SocketProviderProps {
  children: ReactNode
  accessToken: string | null
}

const upsertOnlineUser = (usersOnline: OnlineUser[], onlineUser: OnlineUser) => {
  const existingUserIndex = usersOnline.findIndex((user) => user.id === onlineUser.id)

  if (existingUserIndex === -1) {
    return [...usersOnline, onlineUser]
  }

  const nextUsersOnline = [...usersOnline]
  nextUsersOnline[existingUserIndex] = onlineUser
  return nextUsersOnline
}

export function SocketProvider({ children, accessToken }: SocketProviderProps) {
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [usersOnline, setUsersOnline] = useState<OnlineUser[]>([])

  useEffect(() => {
    const socketInstance = io()
    setSocket(socketInstance)

    const handleConnect = () => {
      setIsConnected(true)
      setConnectionError(null)
      console.log('Socket connected - authenticating')
      socketInstance.emit('auth', accessToken)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setUsersOnline([])
      console.log('Socket disconnected')
    }

    const handleConnectError = (error: Error) => {
      setConnectionError(error.message)
      setIsConnected(false)
      console.error('Socket connection error:', error)
    }

    const handleInitialized = (payload: SocketInitPayload) => {
      setUsersOnline(payload.usersOnline ?? [])
      console.log('Socket initialized successfully')
    }

    const handleUserOnline = (onlineUser: OnlineUser) => {
      setUsersOnline((prev) => upsertOnlineUser(prev, onlineUser))
    }

    const handleUserOffline = (offlineUser: OnlineUser) => {
      setUsersOnline((prev) => prev.filter((onlineUser) => onlineUser.id !== offlineUser.id))
    }

    const handleAuthFailed = async () => {
      console.log('Socket auth failed. Attempting silent token refresh.')
      try {
        const res = await fetch('/internal-api/refresh', {
          headers: {
            Accept: 'application/json'
          }
        })
        if (res.ok) {
          console.log('Silent token refresh successful. Refreshing router to get new token.')
          router.refresh()
        } else {
          console.error('Silent token refresh failed.')
          window.location.reload() // Reload to let middleware trigger redirect to login
        }
      } catch (err) {
        console.error('Error during token refresh:', err)
        window.location.reload()
      }
    }

    /**
     * Force reload for all clients when a backup has been applied
     */
    const handleBackupApplied = () => {
      try {
        if (sessionStorage.getItem('abs_backup_restore_navigating') === '1') {
          sessionStorage.removeItem('abs_backup_restore_navigating')
          return
        }
      } catch {
        /* ignore */
      }
      window.location.reload()
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('connect_error', handleConnectError)
    socketInstance.on('init', handleInitialized)
    socketInstance.on('auth_failed', handleAuthFailed)
    socketInstance.on('backup_applied', handleBackupApplied)
    socketInstance.on('user_online', handleUserOnline)
    socketInstance.on('user_offline', handleUserOffline)
    socketInstance.on('user_stream_update', handleUserOnline)

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('connect_error', handleConnectError)
      socketInstance.off('init', handleInitialized)
      socketInstance.off('auth_failed', handleAuthFailed)
      socketInstance.off('backup_applied', handleBackupApplied)
      socketInstance.off('user_online', handleUserOnline)
      socketInstance.off('user_offline', handleUserOffline)
      socketInstance.off('user_stream_update', handleUserOnline)
      socketInstance.disconnect()
    }
  }, [accessToken, router])

  const getOnlineUser = useCallback((userId: string) => usersOnline.find((onlineUser) => onlineUser.id === userId), [usersOnline])

  const getIsUserOnline = useCallback((userId: string) => usersOnline.some((onlineUser) => onlineUser.id === userId), [usersOnline])

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
    usersOnline,
    getOnlineUser,
    getIsUserOnline
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

// Hook for listening to specific socket events
export function useSocketEvent(event: string, callback: () => void, dependencies?: unknown[]): void
export function useSocketEvent<T>(event: string, callback: (data: T) => void, dependencies?: unknown[]): void
export function useSocketEvent<T>(event: string, callback: ((data: T) => void) | (() => void), dependencies: unknown[] = []) {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on(event, callback)

    return () => {
      socket.off(event, callback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event, callback, ...dependencies])
}

// Hook for emitting socket events
export function useSocketEmit() {
  const { socket, isConnected } = useSocket()

  function emit(event: string): void
  function emit<T>(event: string, data: T): void
  function emit(event: string, data?: unknown): void {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  return { emit }
}
