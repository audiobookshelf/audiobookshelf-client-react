'use client'

import Link from 'next/link'
import { socket } from '@/lib/socket'
import { useEffect, useState } from 'react'

interface HomeClientProps {
  statusData: any
}

export default function HomeClient({ statusData }: HomeClientProps) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (socket.connected) {
      onConnect()
    }

    function onConnect() {
      console.log('connected to socket')
      setIsConnected(true)
    }
    function onDisconnect() {
      console.log('disconnected from socket')
      setIsConnected(false)
    }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      console.log('unmounting')
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return (
    <div className="mb-6 p-4 bg-primary rounded-lg">
      <h2 className="text-2xl font-semibold mb-2">Server Status</h2>
      <pre className="text-sm bg-black p-2 rounded border">{JSON.stringify(statusData, null, 2)}</pre>

      <div className="mt-4">
        <p>Socket Connected: {isConnected ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
