'use client'

import { Task } from '@/types/api'
import Link from 'next/link'
import { useCallback, useMemo, useRef, useState } from 'react'

import { useTasks } from '@/contexts/TasksContext'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Tooltip from '../ui/Tooltip'
import ItemTaskRunningCard from './ItemTaskRunningCard'
import LoadingSpinner from './LoadingSpinner'

function getActionLink(task: Task): string {
  const libraryId = task.data?.libraryId
  const libraryItemId = task.data?.libraryItemId

  switch (task.action) {
    case 'download-podcast-episode':
      return libraryId ? `/library/${libraryId}/podcast/download-queue` : ''
    case 'encode-m4b':
    case 'embed-metadata':
    case 'scan-item':
      return libraryId && libraryItemId ? `/library/${libraryId}/item/${libraryItemId}` : ''
    default:
      return ''
  }
}

interface NotificationWidgetProps {
  className?: string
}

export default function NotificationWidget({ className = '' }: NotificationWidgetProps) {
  const t = useTypeSafeTranslations()
  const { tasks } = useTasks()
  const [showMenu, setShowMenu] = useState(false)
  const [tasksSeen, setTasksSeen] = useState<string[]>([])

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const tasksRunning = useMemo(() => {
    return tasks.some((task) => !task.isFinished)
  }, [tasks])

  const tasksToShow = useMemo(() => {
    return [...tasks].sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
  }, [tasks])

  const showUnseenSuccessIndicator = useMemo(() => {
    return tasksToShow.some((task) => task.isFinished && !task.isFailed && !tasksSeen.includes(task.id))
  }, [tasksSeen, tasksToShow])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
  }, [])

  useClickOutside(menuRef, triggerRef, closeMenu)

  const clickShowMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      event.preventDefault()

      setShowMenu((prev) => {
        const next = !prev

        if (next) {
          setTasksSeen((previous) => {
            const seenTaskIds = new Set(previous)
            tasksToShow.forEach((task) => seenTaskIds.add(task.id))
            return Array.from(seenTaskIds)
          })
        }

        return next
      })
    },
    [tasksToShow]
  )

  if (!tasksToShow.length) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="text-foreground hover:text-foreground/80 relative flex h-10 w-10 cursor-pointer items-center justify-center"
        aria-haspopup="listbox"
        aria-expanded={showMenu}
        onClick={clickShowMenu}
      >
        {tasksRunning ? (
          <Tooltip text={t('LabelTasks')} position="bottom" className="flex items-center">
            <span className="relative">
              <LoadingSpinner className="!cursor-pointer scale-110" />
              {showUnseenSuccessIndicator && (
                <span className="bg-success pointer-events-none absolute -top-1 -right-0.5 h-2 w-2 rounded-full" />
              )}
            </span>
          </Tooltip>
        ) : (
          <Tooltip text={t('LabelActivities')} position="bottom" className="flex items-center">
            <span className="relative">
              <span className="material-symbols text-xl" aria-label={t('LabelActivities')} role="button">
                notifications
              </span>
              {showUnseenSuccessIndicator && (
                <span className="bg-success pointer-events-none absolute -top-1 -right-0.5 h-2 w-2 rounded-full" />
              )}
            </span>
          </Tooltip>
        )}
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          className="bg-bg border-border fixed top-16 right-4 left-auto z-[70] mt-0 md:mt-1.5 w-auto max-w-[24rem] min-w-[16rem] overflow-y-auto overflow-x-hidden rounded-md border text-base shadow-lg ring-1 ring-black/5 focus:outline-none"
          style={{ maxHeight: '80vh' }}
        >
          <ul className="h-full w-full" role="listbox" aria-label={t('LabelTasks')}>
            {tasksToShow.map((task) => {
              const actionLink = getActionLink(task)

              if (actionLink) {
                return (
                  <li key={task.id} className="text-foreground hover:bg-primary/40 relative select-none py-1">
                    <Link href={actionLink} onClick={closeMenu} className="block cursor-pointer">
                      <ItemTaskRunningCard task={task} />
                    </Link>
                  </li>
                )
              }

              return (
                <li key={task.id} className="text-foreground hover:bg-primary/40 relative select-none py-1">
                  <ItemTaskRunningCard task={task} />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
