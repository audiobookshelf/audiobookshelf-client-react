'use client'

import { useSocketEmit, useSocketEvent } from '@/contexts/SocketContext'
import { LoggerDataLog } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_LOGS = 5000
const TRIM_AMOUNT = 1000 // Remove this many logs when we hit the max

interface LogsContainerProps {
  currentDailyLogs: LoggerDataLog[]
}

function getLogLevelColor(levelName: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'TRACE'): string {
  switch (levelName) {
    case 'TRACE':
      return 'text-foreground-subdued'
    case 'DEBUG':
      return 'text-foreground-subdued'
    case 'INFO':
      return 'text-foreground'
    case 'WARN':
      return 'text-warning'
    case 'ERROR':
      return 'text-error'
  }
}

export default function LogsContainer({ currentDailyLogs }: LogsContainerProps) {
  const [logs, setLogs] = useState<LoggerDataLog[]>(currentDailyLogs)
  const containerRef = useRef<HTMLDivElement>(null)
  const { emit } = useSocketEmit()

  // Emit set_log_listener when socket connects
  useEffect(() => {
    emit('set_log_listener', 1)

    return () => {
      emit('remove_log_listener')
    }
  }, [emit])

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [])

  // Scroll to bottom on initial load
  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  // Handle incoming log events
  const handleLogEvent = useCallback(
    (log: LoggerDataLog) => {
      setLogs((prevLogs) => {
        let newLogs = [...prevLogs, log]

        // Trim old logs if we exceed the max (prevents memory leak)
        if (newLogs.length > MAX_LOGS) {
          newLogs = newLogs.slice(TRIM_AMOUNT)
        }

        return newLogs
      })

      // Scroll to bottom after adding new log
      // Use setTimeout to ensure DOM has updated
      setTimeout(scrollToBottom, 0)
    },
    [scrollToBottom]
  )

  useSocketEvent<LoggerDataLog>('log', handleLogEvent, [handleLogEvent])

  return (
    <div ref={containerRef} className="w-full h-full max-h-[calc(100vh-20rem)] overflow-y-auto overflow-x-hidden border border-border rounded-md">
      <div className="flex flex-col">
        {logs.map((log, index) => (
          <LogsRow key={index} log={log} isEven={index % 2 === 0} />
        ))}
      </div>
    </div>
  )
}

function LogsRow({ log, isEven }: { log: LoggerDataLog; isEven: boolean }) {
  const logLevelColor = getLogLevelColor(log.levelName)
  return (
    <div className={`flex gap-2 items-start p-2 ${isEven ? 'bg-table-row-bg-even' : ''}`}>
      <div className="text-xs text-foreground-subdued w-36">{log.timestamp}</div>
      <div className={`w-12 text-xs ${logLevelColor}`}>{log.levelName}</div>
      <div className={`text-sm ${log.level < 2 ? 'text-foreground-subdued' : 'text-foreground'} w-[calc(100%-13rem)]`}>{log.message}</div>
    </div>
  )
}
