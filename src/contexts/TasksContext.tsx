'use client'

import { MetadataEmbedQueueUpdate, Task, TaskProgressPayload, TrackFinishedPayload, TrackProgressPayload, TrackStartedPayload } from '@/types/api'
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useSocketEvent } from './SocketContext'

interface TasksState {
  tasks: Task[]
  queuedEmbedLIds: string[]
  audioFilesEncoding: Record<string, Record<string, string>>
  audioFilesFinished: Record<string, Record<string, boolean>>
  taskProgress: Record<string, string>
}

interface TasksContextType extends TasksState {
  addUpdateTask: (task: Task) => void
  removeTask: (taskId: string) => void
  getTasksByLibraryItemId: (libraryItemId: string) => Task[]
  getAudioFilesEncoding: (libraryItemId: string) => Record<string, string> | undefined
  getAudioFilesFinished: (libraryItemId: string) => Record<string, boolean> | undefined
  getTaskProgress: (libraryItemId: string) => string | undefined
  getTasksByLibraryId: (libraryId: string) => Task[]
  getTask: (libraryItemId: string, action: string) => Task | undefined
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

interface TasksProviderProps {
  children: ReactNode
}

export function TasksProvider({ children }: TasksProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [queuedEmbedLIds, setQueuedEmbedLIds] = useState<string[]>([])
  const [audioFilesEncoding, setAudioFilesEncoding] = useState<Record<string, Record<string, string>>>({})
  const [audioFilesFinished, setAudioFilesFinished] = useState<Record<string, Record<string, boolean>>>({})
  const [taskProgress, setTaskProgress] = useState<Record<string, string>>({})

  // Actions
  const addUpdateTask = useCallback((task: Task) => {
    setTasks((prevTasks) => {
      const index = prevTasks.findIndex((t) => t.id === task.id)
      if (index >= 0) {
        // Update existing task
        const newTasks = [...prevTasks]
        newTasks[index] = task
        return newTasks
      } else {
        // Add new task (remove duplicate by libraryItemId or libraryId — whichever is provided)
        const libraryItemId = task.data?.libraryItemId
        const libraryId = task.data?.libraryId

        const filteredTasks = prevTasks.filter((t) => {
          if (t.action !== task.action) return true
          if (libraryItemId) {
            return t.data?.libraryItemId !== libraryItemId
          }
          if (libraryId) {
            return t.data?.libraryId !== libraryId
          }
          return true
        })

        return [...filteredTasks, task]
      }
    })
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId))
  }, [])

  const addQueuedEmbedLId = useCallback((libraryItemId: string) => {
    setQueuedEmbedLIds((prev) => {
      if (prev.includes(libraryItemId)) return prev
      return [...prev, libraryItemId]
    })
  }, [])

  const removeQueuedEmbedLId = useCallback((libraryItemId: string) => {
    setQueuedEmbedLIds((prev) => prev.filter((id) => id !== libraryItemId))
  }, [])

  const updateAudioFilesEncoding = useCallback((libraryItemId: string, ino: string, progress: string) => {
    setAudioFilesEncoding((prev) => ({
      ...prev,
      [libraryItemId]: {
        ...(prev[libraryItemId] || {}),
        [ino]: progress
      }
    }))
  }, [])

  const updateAudioFilesFinished = useCallback((libraryItemId: string, ino: string, finished: boolean) => {
    setAudioFilesFinished((prev) => ({
      ...prev,
      [libraryItemId]: {
        ...(prev[libraryItemId] || {}),
        [ino]: finished
      }
    }))
  }, [])

  const updateTaskProgressValue = useCallback((libraryItemId: string, progress: string) => {
    setTaskProgress((prev) => ({
      ...prev,
      [libraryItemId]: progress
    }))
  }, [])

  // Getters
  const getTasksByLibraryItemId = useCallback(
    (libraryItemId: string) => {
      return tasks.filter((t) => t.data?.libraryItemId === libraryItemId)
    },
    [tasks]
  )

  const getAudioFilesEncoding = useCallback(
    (libraryItemId: string) => {
      return audioFilesEncoding[libraryItemId]
    },
    [audioFilesEncoding]
  )

  const getAudioFilesFinished = useCallback(
    (libraryItemId: string) => {
      return audioFilesFinished[libraryItemId]
    },
    [audioFilesFinished]
  )

  const getTaskProgress = useCallback(
    (libraryItemId: string) => {
      return taskProgress[libraryItemId]
    },
    [taskProgress]
  )

  const getTasksByLibraryId = useCallback(
    (libraryId: string) => {
      return tasks.filter((t) => t.data?.libraryId === libraryId)
    },
    [tasks]
  )

  const getTask = useCallback(
    (libraryItemId: string, action: string) => {
      return tasks.find((t) => t.data?.libraryItemId === libraryItemId && t.action === action)
    },
    [tasks]
  )

  // Socket event listeners
  useSocketEvent<Task>('task_started', addUpdateTask, [addUpdateTask])
  useSocketEvent<Task>('task_finished', addUpdateTask, [addUpdateTask])

  useSocketEvent<MetadataEmbedQueueUpdate>(
    'metadata_embed_queue_update',
    (data) => {
      if (data.queued) {
        addQueuedEmbedLId(data.libraryItemId)
      } else {
        removeQueuedEmbedLId(data.libraryItemId)
      }
    },
    [addQueuedEmbedLId, removeQueuedEmbedLId]
  )

  useSocketEvent<TrackStartedPayload>(
    'track_started',
    (data) => {
      updateAudioFilesEncoding(data.libraryItemId, data.ino, '0%')
    },
    [updateAudioFilesEncoding]
  )

  useSocketEvent<TrackFinishedPayload>(
    'track_finished',
    (data) => {
      updateAudioFilesEncoding(data.libraryItemId, data.ino, '100%')
      updateAudioFilesFinished(data.libraryItemId, data.ino, true)
    },
    [updateAudioFilesEncoding, updateAudioFilesFinished]
  )

  useSocketEvent<TrackProgressPayload>(
    'track_progress',
    (data) => {
      updateAudioFilesEncoding(data.libraryItemId, data.ino, `${Math.round(data.progress)}%`)
    },
    [updateAudioFilesEncoding]
  )

  useSocketEvent<TaskProgressPayload>(
    'task_progress',
    (data) => {
      updateTaskProgressValue(data.libraryItemId, `${Math.round(data.progress)}%`)
    },
    [updateTaskProgressValue]
  )

  const value = useMemo(
    () => ({
      tasks,
      queuedEmbedLIds,
      audioFilesEncoding,
      audioFilesFinished,
      taskProgress,
      addUpdateTask,
      removeTask,
      getTasksByLibraryItemId,
      getAudioFilesEncoding,
      getAudioFilesFinished,
      getTaskProgress,
      getTasksByLibraryId,
      getTask
    }),
    [
      tasks,
      queuedEmbedLIds,
      audioFilesEncoding,
      audioFilesFinished,
      taskProgress,
      addUpdateTask,
      removeTask,
      getTasksByLibraryItemId,
      getAudioFilesEncoding,
      getAudioFilesFinished,
      getTaskProgress,
      getTasksByLibraryId,
      getTask
    ]
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}
