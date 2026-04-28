'use client'

import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { useSocketEmit, useSocketEvent } from '@/contexts/SocketContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LoggerDataLog, LogLevel, ServerSettings } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { UpdateServerSettingsApiResponse } from '../actions'

const MAX_LOGS = 5000
const TRIM_AMOUNT = 1000 // Remove this many logs when we hit the max

const LOG_LEVEL_NAMES: Record<number, string> = {
  [LogLevel.TRACE]: 'Trace',
  [LogLevel.ERROR]: 'Error',
  [LogLevel.FATAL]: 'Fatal',
  [LogLevel.NOTE]: 'Note'
}

interface LogsContainerProps {
  currentDailyLogs: LoggerDataLog[]
  logLevel?: number
  updateServerSettings: (settingsUpdatePayload: Partial<ServerSettings>) => Promise<UpdateServerSettingsApiResponse>
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

export default function LogsContainer({ currentDailyLogs, logLevel: initialLogLevel, updateServerSettings }: LogsContainerProps) {
  const t = useTypeSafeTranslations()
  const [logs, setLogs] = useState<LoggerDataLog[]>(currentDailyLogs)
  const [logLevel, setLogLevel] = useState<number>(initialLogLevel ?? LogLevel.INFO)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const { emit } = useSocketEmit()

  const logLevelItems: DropdownItem[] = useMemo(() => {
    const defaultItems: DropdownItem[] = [
      { text: t('LabelLogLevelDebug'), value: LogLevel.DEBUG },
      { text: t('LabelLogLevelInfo'), value: LogLevel.INFO },
      { text: t('LabelLogLevelWarn'), value: LogLevel.WARN }
    ]

    const isDefault = logLevel === LogLevel.DEBUG || logLevel === LogLevel.INFO || logLevel === LogLevel.WARN
    // If log level is not debug, info or warn, then show it in the dropdown
    if (!isDefault) {
      const name = LOG_LEVEL_NAMES[logLevel] ?? `Level ${logLevel}`
      defaultItems.unshift({ text: name, value: logLevel })
    }

    return defaultItems
  }, [t, logLevel])

  const visibleLogs = useMemo(() => logs.filter((log) => log.level >= logLevel), [logs, logLevel])

  // Emit set_log_listener when socket connects
  useEffect(() => {
    emit('set_log_listener', logLevel)

    return () => {
      emit('remove_log_listener')
    }
    // Only run on mount/unmount - logLevel changes are handled in handleLogLevelChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emit])

  const handleLogLevelChange = (value: string | number) => {
    const newLevel = Number(value)
    setLogLevel(newLevel)

    emit('set_log_listener', newLevel)

    startTransition(async () => {
      try {
        await updateServerSettings({ logLevel: newLevel as LogLevel })
      } catch (error) {
        setLogLevel(logLevel)
        console.error('Failed to update log level:', error)
      }
    })
  }

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
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <div className="w-full sm:w-44">
          <Dropdown
            items={logLevelItems}
            label={t('LabelServerLogLevel')}
            value={logLevel}
            highlightSelected
            onChange={handleLogLevelChange}
            disabled={isPending}
          />
        </div>
      </div>
      <div ref={containerRef} className="border-border h-full max-h-[calc(100vh-20rem)] w-full overflow-x-hidden overflow-y-auto rounded-md border">
        <div className="flex flex-col">
          {visibleLogs.map((log, index) => (
            <LogsRow key={index} log={log} isEven={index % 2 === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}

function LogsRow({ log, isEven }: { log: LoggerDataLog; isEven: boolean }) {
  const logLevelColor = getLogLevelColor(log.levelName)
  return (
    <div className={`flex items-start gap-2 p-2 ${isEven ? 'bg-table-row-bg-even' : ''}`}>
      <div className="text-foreground-subdued w-36 text-xs">{log.timestamp}</div>
      <div className={`w-12 text-xs ${logLevelColor}`}>{log.levelName}</div>
      <div className={`text-sm ${log.level < 2 ? 'text-foreground-subdued' : 'text-foreground'} w-[calc(100%-13rem)]`}>{log.message}</div>
    </div>
  )
}
