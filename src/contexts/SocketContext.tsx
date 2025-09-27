'use client'

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { Socket, io } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: ReactNode
  accessToken: string | null
}

export function SocketProvider({ children, accessToken }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

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
      console.log('Socket disconnected')
    }

    const handleConnectError = (error: Error) => {
      setConnectionError(error.message)
      setIsConnected(false)
      console.error('Socket connection error:', error)
    }

    const handleInitialized = () => {
      console.log('Socket initialized successfully')
    }

    const handleAuthFailed = () => {
      console.error('Socket auth failed')
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('connect_error', handleConnectError)
    socketInstance.on('init', handleInitialized)
    socketInstance.on('auth_failed', handleAuthFailed)

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('connect_error', handleConnectError)
      socketInstance.off('init', handleInitialized)
      socketInstance.off('auth_failed', handleAuthFailed)
      socketInstance.disconnect()
    }
  }, [accessToken])

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError
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
export function useSocketEvent<T = any>(event: string, callback: (data: T) => void, dependencies: any[] = []) {
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

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  return { emit }
}
