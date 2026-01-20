'use client'

import { LoggerDataLog } from '@/types/api'

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
  return (
    <div className="w-full h-full max-h-[calc(100vh-20rem)] overflow-y-auto overflow-x-hidden border border-border rounded-md">
      <div className="flex flex-col">
        {currentDailyLogs.map((log, index) => (
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
