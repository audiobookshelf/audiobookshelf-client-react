'use client'

import { useSocket, useSocketEmit, useSocketEvent } from '@/contexts/SocketContext'
import { ServerStatus } from '@/types/api'
import { useEffect } from 'react'

interface AdminMessage {
  message: string
}

interface HomeClientProps {
  statusData: ServerStatus
}

export default function HomeClient({ statusData }: HomeClientProps) {
  const { isConnected } = useSocket()
  const { emit } = useSocketEmit()
  useSocketEvent<AdminMessage>('admin_message', (data) => {
    console.log('received socket event admin_message', data)
  })
  useEffect(() => {
    console.log('emitting socket event message_all_users')
    emit<AdminMessage>('message_all_users', { message: 'Hello from server status card' })
  }, [emit])

  return (
    <div className="mb-6 p-4 bg-primary rounded-lg">
      <h2 className="text-2xl font-semibold mb-2">Server Status</h2>
      <pre className="text-sm bg-black p-2 rounded border whitespace-pre-wrap">{JSON.stringify(statusData, null, 2)}</pre>

      <div className="mt-4">
        <p>Socket Connected: {isConnected ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
