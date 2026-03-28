'use client'

import Btn from '@/components/ui/Btn'
import DataTable, { DataTableColumn } from '@/components/ui/DataTable'
import Dropdown from '@/components/ui/Dropdown'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import SimpleDataTable from '@/components/ui/SimpleDataTable'
import Tooltip from '@/components/ui/Tooltip'
import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime, secondsToTimestamp } from '@/lib/datefns'
import { formatDuration } from '@/lib/formatDuration'
import { GetListeningSessionsResponse, GetOpenListeningSessionsResponse, PlaybackSession, PlayMethod, User } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import { useMemo, useState } from 'react'
import { batchDeleteListeningSessions, getListeningSessionsData, getOpenListeningSessionsData } from './actions'
import DeviceInfoCell from './DeviceInfoCell'
import ListeningSessionModal from './ListeningSessionModal'

interface ListeningSessionsTableProps {
  users: User[]
  sessionsResponse: GetListeningSessionsResponse
  openSessionsResponse: GetOpenListeningSessionsResponse
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

type SortColumn = 'displayTitle' | 'playMethod' | 'timeListening' | 'currentTime' | 'updatedAt'

export default function ListeningSessionsTable({ users, sessionsResponse, openSessionsResponse }: ListeningSessionsTableProps) {
  const t = useTypeSafeTranslations()
  const { serverSettings } = useUser()
  const { showToast } = useGlobalToast()

  const [loading, setLoading] = useState(false)
  const [deletingSessions, setDeletingSessions] = useState(false)

  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<PlaybackSession | null>(null)

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [showResumePlaybackPrompt, setShowResumePlaybackPrompt] = useState(false)
  const [resumePlaybackSession, setResumePlaybackSession] = useState<PlaybackSession | null>(null)
  const [startingPlayback, setStartingPlayback] = useState(false)

  const [listeningSessions, setListeningSessions] = useState<PlaybackSession[]>(sessionsResponse.sessions || [])
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [openListeningSessions, setOpenListeningSessions] = useState<PlaybackSession[]>(
    (openSessionsResponse.sessions || []).map((session) => ({
      ...session,
      open: true
    }))
  )
  const [openShareListeningSessions, setOpenShareListeningSessions] = useState<PlaybackSession[]>(openSessionsResponse.shareSessions || [])

  const [numPages, setNumPages] = useState(sessionsResponse.numPages)
  const [total, setTotal] = useState(sessionsResponse.total)
  const [currentPage, setCurrentPage] = useState(sessionsResponse.page)
  const [itemsPerPage, setItemsPerPage] = useState(sessionsResponse.itemsPerPage)

  const [selectedUser, setSelectedUser] = useState(sessionsResponse.userId || '')
  const [sortBy, setSortBy] = useState<SortColumn>('updatedAt')
  const [sortDesc, setSortDesc] = useState(true)

  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  const numSelected = selectedSessionIds.length
  const isAllSelected = listeningSessions.length > 0 && numSelected === listeningSessions.length

  const userItems = useMemo(() => [{ value: '', text: t('LabelAllUsers') }, ...users.map((user) => ({ value: user.id, text: user.username }))], [users, t])

  const filteredUserUsername = useMemo(() => {
    if (!selectedUser) return null
    return users.find((user) => user.id === selectedUser)?.username || null
  }, [selectedUser, users])

  const loadSessions = async (page: number, overrides?: { sortBy?: SortColumn; sortDesc?: boolean; selectedUser?: string; itemsPerPage?: number }) => {
    const nextSortBy = overrides?.sortBy ?? sortBy
    const nextSortDesc = overrides?.sortDesc ?? sortDesc
    const nextSelectedUser = overrides?.selectedUser ?? selectedUser
    const nextItemsPerPage = overrides?.itemsPerPage ?? itemsPerPage

    setLoading(true)

    try {
      const response = await getListeningSessionsData({
        page,
        itemsPerPage: nextItemsPerPage,
        sort: nextSortBy,
        desc: nextSortDesc,
        user: nextSelectedUser || undefined
      })

      setNumPages(response.numPages)
      setTotal(response.total)
      setCurrentPage(response.page)
      setListeningSessions(response.sessions || [])
      setSelectedSessionIds([])
    } catch (error) {
      console.error('Failed to load listening sessions', error)
      showToast(t('ToastFailedToLoadData'), { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadOpenSessions = async () => {
    try {
      const response = await getOpenListeningSessionsData()
      setOpenListeningSessions(
        (response.sessions || []).map((session) => ({
          ...session,
          open: true
        }))
      )
      setOpenShareListeningSessions(response.shareSessions || [])
    } catch (error) {
      console.error('Failed to load open sessions', error)
      showToast(t('ToastFailedToLoadData'), { type: 'error' })
    }
  }

  const handleSortColumn = (column: SortColumn, nextSortDescOverride?: boolean) => {
    const nextSortBy = column
    const nextSortDesc = nextSortDescOverride ?? (sortBy === column ? !sortDesc : true)

    setSortBy(nextSortBy)
    setSortDesc(nextSortDesc)

    loadSessions(currentPage, { sortBy: nextSortBy, sortDesc: nextSortDesc })
  }

  const handleSetSelectionForAll = (selected: boolean) => {
    setSelectedSessionIds(selected ? listeningSessions.map((session) => session.id) : [])
  }

  const handleToggleSessionSelection = (sessionId: string, selected: boolean) => {
    setSelectedSessionIds((currentIds) => {
      if (selected) {
        if (currentIds.includes(sessionId)) return currentIds
        return [...currentIds, sessionId]
      }
      return currentIds.filter((id) => id !== sessionId)
    })
  }

  const handleUpdateUserFilter = async (userId: string | number) => {
    const nextSelectedUser = String(userId)
    setSelectedUser(nextSelectedUser)
    await loadSessions(0, { selectedUser: nextSelectedUser })
  }

  const handleUpdateItemsPerPage = async (value: string | number) => {
    const nextItemsPerPage = Number(value)
    setItemsPerPage(nextItemsPerPage)
    await loadSessions(0, { itemsPerPage: nextItemsPerPage })
  }

  const handleDeleteSelectedSessions = async () => {
    if (!numSelected) return

    setShowDeleteConfirmDialog(false)
    setDeletingSessions(true)

    try {
      const selectedIds = [...selectedSessionIds]
      const allRowsOnPageSelected = isAllSelected

      await batchDeleteListeningSessions(selectedIds)

      if (allRowsOnPageSelected) {
        const newPage = currentPage > 0 ? currentPage - 1 : 0
        await loadSessions(newPage)
      } else {
        setListeningSessions((sessions) => sessions.filter((session) => !selectedIds.includes(session.id)))
        setSelectedSessionIds([])
      }

      await loadOpenSessions()
    } catch (error) {
      console.error('Failed to delete listening sessions', error)
      showToast(t('ToastDeleteFailed'), { type: 'error' })
    } finally {
      setDeletingSessions(false)
    }
  }

  const handleSelectSession = (session: PlaybackSession) => {
    setSelectedSession(session)
    setShowSessionModal(true)
  }

  const handleSessionDeleted = async () => {
    if (currentPage === numPages - 1) {
      const newTotal = total - 1
      const newNumPages = Math.ceil(newTotal / itemsPerPage)
      if (newNumPages < numPages) {
        await loadSessions(Math.max(currentPage - 1, 0))
        return
      }
    }

    await loadSessions(currentPage)
    await loadOpenSessions()
  }

  const handleSessionClosed = async () => {
    await loadOpenSessions()
  }

  const handlePromptResumePlayback = (session: PlaybackSession) => {
    setResumePlaybackSession(session)
    setShowResumePlaybackPrompt(true)
  }

  const handleStartPlaybackAtTime = async () => {
    if (!resumePlaybackSession) return
  }

  const listeningSessionColumns = useMemo<DataTableColumn<PlaybackSession>[]>(
    () => [
      {
        label: t('LabelItem'),
        sortKey: 'displayTitle',
        sortable: true,
        accessor: (session) => (
          <div className="py-1 min-w-0">
            <TruncatingTooltipText text={session.displayTitle} className="text-xs text-foreground" />
            <TruncatingTooltipText text={session.displayAuthor} className="text-xs text-foreground-muted" />
          </div>
        ),
        headerClassName: 'w-32 text-start px-2',
        cellClassName: 'px-2 grow py-1'
      },
      {
        label: t('LabelUser'),
        accessor: (session) => <p className="text-xs truncate">{filteredUserUsername || session.user?.username || 'N/A'}</p>,
        headerClassName: 'w-16 text-left hidden md:table-cell',
        cellClassName: 'hidden md:table-cell py-1 w-16'
      },
      {
        label: t('LabelPlayMethod'),
        sortKey: 'playMethod',
        sortable: true,
        accessor: (session) => <p className="text-xs">{getPlayMethodName(session.playMethod, t)}</p>,
        headerClassName: 'w-26 text-left hidden md:table-cell',
        cellClassName: 'hidden md:table-cell py-1 w-26'
      },
      {
        label: t('LabelDeviceInfo'),
        accessor: (session) => <DeviceInfoCell session={session} />,
        headerClassName: 'w-32 text-left hidden sm:table-cell',
        cellClassName: 'hidden sm:table-cell py-1 w-32'
      },
      {
        label: t('LabelTimeListened'),
        sortKey: 'timeListening',
        sortable: true,
        accessor: (session) => <p className="text-xs font-mono">{formatDuration(session.timeListening, t, { showSeconds: true })}</p>,
        headerClassName: 'w-20 text-center',
        cellClassName: 'text-center w-20 py-1'
      },
      {
        label: t('LabelLastTime'),
        sortKey: 'currentTime',
        sortable: true,
        accessor: (session) => (
          <button
            type="button"
            className="w-full text-center hover:underline cursor-pointer text-xs font-mono"
            onClick={(e) => {
              e.stopPropagation()
              handlePromptResumePlayback(session)
            }}
          >
            {secondsToTimestamp(session.currentTime)}
          </button>
        ),
        headerClassName: 'w-20 text-center',
        cellClassName: 'text-center w-20 py-1'
      },
      {
        label: t('LabelLastUpdate'),
        sortKey: 'updatedAt',
        sortable: true,
        accessor: (session) => (
          <Tooltip text={formatJsDatetime(new Date(session.updatedAt), dateFormat, timeFormat)} position="top">
            <p className="text-xs text-foreground-muted">{getRelativeTime(session.updatedAt)}</p>
          </Tooltip>
        ),
        headerClassName: 'w-24 hidden sm:table-cell text-left',
        cellClassName: 'text-left hidden sm:table-cell w-24 py-1'
      }
    ],
    [t, filteredUserUsername, dateFormat, timeFormat]
  )

  const pageLabel = t('LabelPaginationPageXOfY', { 0: currentPage + 1, 1: Math.max(numPages, 1) })

  return (
    <>
      <div className="flex justify-end mb-2">
        <Dropdown value={selectedUser} items={userItems} label={t('LabelFilterByUser')} size="small" className="max-w-48" onChange={handleUpdateUserFilter} />
      </div>

      <div className="block max-w-full relative">
        {listeningSessions.length > 0 ? (
          <DataTable
            data={listeningSessions}
            columns={listeningSessionColumns}
            getRowKey={(session) => session.id}
            tableClassName="table-fixed"
            selection={{
              selectedRowKeys: selectedSessionIds,
              onToggleAllRows: handleSetSelectionForAll,
              onToggleRow: (session, _index, selected) => handleToggleSessionSelection(session.id, selected)
            }}
            bulkActions={{
              selectedLabel: t('MessageSelected', { 0: numSelected }),
              actions: (
                <Btn className="h-7" size="small" color="bg-error" loading={deletingSessions} onClick={() => setShowDeleteConfirmDialog(true)}>
                  {t('ButtonDelete')}
                </Btn>
              )
            }}
            sorting={{
              sortBy,
              sortDesc,
              onSortChange: (nextSortBy, nextSortDesc) => handleSortColumn(nextSortBy as SortColumn, nextSortDesc)
            }}
            onRowClick={(session) => {
              if (numSelected > 0) {
                const isSelected = selectedSessionIds.includes(session.id)
                handleToggleSessionSelection(session.id, !isSelected)
              } else {
                handleSelectSession(session)
              }
            }}
            pagination={{
              currentPage: currentPage + 1,
              totalPages: Math.max(numPages, 1),
              rowsPerPage: itemsPerPage,
              rowsPerPageOptions: ITEMS_PER_PAGE_OPTIONS,
              onPageChange: (page) => loadSessions(page - 1),
              onRowsPerPageChange: handleUpdateItemsPerPage,
              rowsPerPageLabel: t('LabelRowsPerPage'),
              pageLabel
            }}
          />
        ) : (
          <p className="text-foreground-muted">{t('MessageNoListeningSessions')}</p>
        )}

        {(deletingSessions || loading) && <LoadingIndicator />}
      </div>

      {openListeningSessions.length > 0 && <div className="w-full my-8 h-px bg-border" />}

      {openListeningSessions.length > 0 && <p className="text-lg my-4">{t('HeaderOpenListeningSessions')}</p>}
      {openListeningSessions.length > 0 && (
        <SessionListTable
          sessions={openListeningSessions}
          onSelectSession={handleSelectSession}
          onPromptResumePlayback={handlePromptResumePlayback}
          filteredUserUsername={filteredUserUsername}
        />
      )}

      {openShareListeningSessions.length > 0 && <div className="w-full my-8 h-px bg-border" />}

      {openShareListeningSessions.length > 0 && <p className="text-lg my-4">Open Share Listening Sessions</p>}
      {openShareListeningSessions.length > 0 && (
        <SessionListTable
          sessions={openShareListeningSessions}
          onSelectSession={handleSelectSession}
          onPromptResumePlayback={handlePromptResumePlayback}
          isShareSessions
        />
      )}

      <ListeningSessionModal
        isOpen={showSessionModal}
        session={selectedSession}
        onClose={() => setShowSessionModal(false)}
        onSessionDeleted={handleSessionDeleted}
        onClosedSession={handleSessionClosed}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirmDialog}
        message={t('MessageConfirmDeleteListeningSessions', { count: numSelected })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowDeleteConfirmDialog(false)}
        onConfirm={handleDeleteSelectedSessions}
      />

      <ConfirmDialog
        isOpen={showResumePlaybackPrompt}
        message={
          resumePlaybackSession
            ? t('MessageStartPlaybackAtTime', {
                0: resumePlaybackSession.displayTitle,
                1: secondsToTimestamp(Math.max(0, resumePlaybackSession.currentTime || 0))
              })
            : ''
        }
        yesButtonText={t('ButtonPlay')}
        onClose={() => {
          if (startingPlayback) return
          setShowResumePlaybackPrompt(false)
          setResumePlaybackSession(null)
        }}
        onConfirm={handleStartPlaybackAtTime}
      />
    </>
  )
}

function SessionListTable({
  sessions,
  onSelectSession,
  onPromptResumePlayback,
  filteredUserUsername,
  isShareSessions = false
}: {
  sessions: PlaybackSession[]
  onSelectSession: (session: PlaybackSession) => void
  onPromptResumePlayback: (session: PlaybackSession) => void
  filteredUserUsername?: string | null
  isShareSessions?: boolean
}) {
  const t = useTypeSafeTranslations()
  const { serverSettings } = useUser()

  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  const columns = useMemo<DataTableColumn<PlaybackSession>[]>(
    () => [
      {
        label: t('LabelItem'),
        accessor: (session) => (
          <div className="py-1 min-w-0">
            <TruncatingTooltipText text={session.displayTitle} className="text-xs text-foreground" />
            <TruncatingTooltipText text={session.displayAuthor} className="text-xs text-foreground-muted" />
          </div>
        ),
        headerClassName: 'w-32 text-left px-2',
        cellClassName: 'py-1'
      },
      {
        label: t('LabelUser'),
        accessor: (session) => <p className="text-xs">{filteredUserUsername || session.user?.username || 'N/A'}</p>,
        headerClassName: 'w-20 text-left hidden md:table-cell px-2',
        cellClassName: 'hidden md:table-cell py-1 w-20'
      },
      {
        label: t('LabelPlayMethod'),
        accessor: (session) => <p className="text-xs">{getPlayMethodName(session.playMethod, t)}</p>,
        headerClassName: 'w-20 text-left hidden md:table-cell px-2',
        cellClassName: 'hidden md:table-cell py-1 w-20'
      },
      {
        label: t('LabelDeviceInfo'),
        accessor: (session) => <DeviceInfoCell session={session} />,
        headerClassName: 'w-32 text-left hidden sm:table-cell px-2',
        cellClassName: 'hidden sm:table-cell w-32 py-1'
      },
      ...(!isShareSessions
        ? [
            {
              label: t('LabelTimeListened'),
              accessor: (session: PlaybackSession) => <p className="text-xs font-mono">{formatDuration(session.timeListening, t, { showSeconds: true })}</p>,
              headerClassName: 'w-20 text-center px-2',
              cellClassName: 'text-center w-20 py-1'
            }
          ]
        : []),
      {
        label: t('LabelLastTime'),
        accessor: (session) => (
          <button
            type="button"
            className="w-full text-center hover:underline cursor-pointer text-xs font-mono"
            onClick={(e) => {
              e.stopPropagation()
              onPromptResumePlayback(session)
            }}
          >
            {secondsToTimestamp(session.currentTime)}
          </button>
        ),
        headerClassName: 'w-16 text-center px-2',
        cellClassName: 'text-center w-16 py-1'
      },
      {
        label: t('LabelLastUpdate'),
        accessor: (session) => (
          <Tooltip text={formatJsDatetime(new Date(session.updatedAt), dateFormat, timeFormat)} position="top">
            <p className="text-xs text-foreground-muted">{getRelativeTime(session.updatedAt)}</p>
          </Tooltip>
        ),
        headerClassName: 'w-24 hidden sm:table-cell text-left px-2',
        cellClassName: 'text-left hidden sm:table-cell w-24 py-1'
      }
    ],
    [t, filteredUserUsername, isShareSessions, dateFormat, timeFormat, onPromptResumePlayback]
  )

  return (
    <SimpleDataTable
      data={sessions}
      columns={columns}
      getRowKey={(session) => session.id}
      tableClassName="table-fixed"
      onRowClick={(session) => onSelectSession(session)}
    />
  )
}

function getPlayMethodName(playMethod: PlayMethod, t: ReturnType<typeof useTypeSafeTranslations>) {
  if (playMethod === PlayMethod.DIRECT_PLAY) return 'Direct Play'
  if (playMethod === PlayMethod.TRANSCODE) return 'Transcode'
  if (playMethod === PlayMethod.DIRECT_STREAM) return 'Direct Stream'
  if (playMethod === PlayMethod.LOCAL) return 'Local'
  return t('LabelUnknown')
}

function getRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}
