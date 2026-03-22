'use client'

import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import IconBtn from '@/components/ui/IconBtn'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime, secondsToTimestamp } from '@/lib/datefns'
import { elapsedPretty } from '@/lib/timeUtils'
import { GetListeningSessionsResponse, GetOpenListeningSessionsResponse, PlaybackSession, PlayMethod, User } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import { useLocale } from 'next-intl'
import { useMemo, useState } from 'react'
import { batchDeleteListeningSessions, getListeningSessionsData, getOpenListeningSessionsData } from './actions'
import ListeningSessionModal from './ListeningSessionModal'

interface ListeningSessionsTableProps {
  users: User[]
  sessionsResponse: GetListeningSessionsResponse
  openSessionsResponse: GetOpenListeningSessionsResponse
}

interface SelectableSession extends PlaybackSession {
  selected?: boolean
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

type SortColumn = 'displayTitle' | 'playMethod' | 'timeListening' | 'currentTime' | 'updatedAt'

export default function ListeningSessionsTable({ users, sessionsResponse, openSessionsResponse }: ListeningSessionsTableProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()
  const { serverSettings } = useUser()
  const { playItem } = useMediaContext()
  const { showToast } = useGlobalToast()

  const [loading, setLoading] = useState(false)
  const [deletingSessions, setDeletingSessions] = useState(false)

  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<PlaybackSession | null>(null)

  const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false)
  const [showResumePlaybackPrompt, setShowResumePlaybackPrompt] = useState(false)
  const [resumePlaybackSession, setResumePlaybackSession] = useState<PlaybackSession | null>(null)
  const [startingPlayback, setStartingPlayback] = useState(false)

  const [listeningSessions, setListeningSessions] = useState<SelectableSession[]>(
    (sessionsResponse.sessions || []).map((session) => ({
      ...session,
      selected: false
    }))
  )
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

  const selectedSessionIds = useMemo(() => listeningSessions.filter((session) => session.selected).map((session) => session.id), [listeningSessions])
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
      setListeningSessions(
        (response.sessions || []).map((session) => ({
          ...session,
          selected: false
        }))
      )
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

  const handleSortColumn = (column: SortColumn) => {
    const nextSortBy = column
    const nextSortDesc = sortBy === column ? !sortDesc : true

    setSortBy(nextSortBy)
    setSortDesc(nextSortDesc)

    loadSessions(currentPage, { sortBy: nextSortBy, sortDesc: nextSortDesc })
  }

  const handleSetSelectionForAll = (selected: boolean) => {
    setListeningSessions((currentSessions) => currentSessions.map((session) => ({ ...session, selected })))
  }

  const handleToggleSessionSelection = (sessionId: string) => {
    setListeningSessions((currentSessions) =>
      currentSessions.map((session) => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          selected: !session.selected
        }
      })
    )
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

  const handleRemoveSelectedSessions = async () => {
    if (!numSelected) return

    setShowRemoveConfirmDialog(false)
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
      }

      await loadOpenSessions()
    } catch (error) {
      console.error('Failed to remove listening sessions', error)
      showToast(t('ToastRemoveFailed'), { type: 'error' })
    } finally {
      setDeletingSessions(false)
    }
  }

  const handleSelectSession = (session: PlaybackSession) => {
    setSelectedSession(session)
    setShowSessionModal(true)
  }

  const handleSessionRemoved = async () => {
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

    setStartingPlayback(true)

    try {
      const libraryItem = await getExpandedLibraryItemAction(resumePlaybackSession.libraryItemId)

      await playItem({
        libraryItem,
        episodeId: resumePlaybackSession.episodeId || null,
        startTime: Math.max(0, resumePlaybackSession.currentTime || 0),
        queueItems: []
      })

      setShowResumePlaybackPrompt(false)
      setResumePlaybackSession(null)
    } catch (error) {
      console.error('Failed to start playback from listening session', error)
      showToast(t('ToastFailedToLoadData'), { type: 'error' })
    } finally {
      setStartingPlayback(false)
    }
  }

  const pageLabel = t('LabelPaginationPageXOfY', { 0: currentPage + 1, 1: Math.max(numPages, 1) })

  return (
    <>
      <div className="flex justify-end mb-2">
        <Dropdown value={selectedUser} items={userItems} label={t('LabelFilterByUser')} size="small" className="max-w-48" onChange={handleUpdateUserFilter} />
      </div>

      <div className="block max-w-full relative">
        {listeningSessions.length > 0 ? (
          <>
            {numSelected > 0 && (
              <div className="flex items-center px-3 py-2 bg-table-header-bg border border-border border-b-0 rounded-t-md">
                <p>{t('MessageSelected', { 0: numSelected })}</p>
                <div className="grow" />
                <Btn size="small" color="bg-error" loading={deletingSessions} onClick={() => setShowRemoveConfirmDialog(true)}>
                  {t('ButtonRemove')}
                </Btn>
              </div>
            )}

            <div className={`overflow-x-hidden border border-border ${numSelected > 0 ? 'rounded-b-md' : 'rounded-md'}`}>
              <table className="w-full border-collapse text-sm table-fixed">
                <thead className="bg-table-header-bg border-b border-border">
                  <tr>
                    <th className="w-12 min-w-12 hidden md:table-cell h-11 px-0 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <Checkbox
                          value={isAllSelected}
                          partial={numSelected > 0 && !isAllSelected}
                          size="small"
                          checkboxBgClass="bg-bg"
                          onChange={handleSetSelectionForAll}
                          ariaLabel={t('LabelSelectAll')}
                        />
                      </div>
                    </th>

                    <SortableHeader
                      label={t('LabelItem')}
                      active={sortBy === 'displayTitle'}
                      descending={sortDesc}
                      onClick={() => handleSortColumn('displayTitle')}
                    />
                    <th className="w-20 min-w-20 text-left hidden md:table-cell text-xs font-semibold text-foreground-muted">{t('LabelUser')}</th>
                    <SortableHeader
                      label={t('LabelPlayMethod')}
                      active={sortBy === 'playMethod'}
                      descending={sortDesc}
                      onClick={() => handleSortColumn('playMethod')}
                      className="w-28 min-w-28 text-left hidden md:table-cell"
                    />
                    <th className="w-32 min-w-32 text-left hidden sm:table-cell text-xs font-semibold text-foreground-muted">{t('LabelDeviceInfo')}</th>
                    <SortableHeader
                      label={t('LabelTimeListened')}
                      active={sortBy === 'timeListening'}
                      descending={sortDesc}
                      onClick={() => handleSortColumn('timeListening')}
                      className="w-24 min-w-24 sm:w-32 sm:min-w-32 text-center"
                    />
                    <SortableHeader
                      label={t('LabelLastTime')}
                      active={sortBy === 'currentTime'}
                      descending={sortDesc}
                      onClick={() => handleSortColumn('currentTime')}
                      className="w-24 min-w-24 text-center"
                    />
                    <SortableHeader
                      label={t('LabelLastUpdate')}
                      active={sortBy === 'updatedAt'}
                      descending={sortDesc}
                      onClick={() => handleSortColumn('updatedAt')}
                      className="grow hidden sm:table-cell text-left"
                    />
                  </tr>
                </thead>

                <tbody>
                  {listeningSessions.map((session, index) => (
                    <tr
                      key={session.id}
                      className={`border-b border-border ${index % 2 === 1 ? 'bg-table-row-bg-even' : ''} hover:bg-table-row-bg-hover cursor-pointer ${session.selected ? 'bg-table-row-bg-hover' : ''}`}
                      onClick={() => {
                        if (numSelected > 0) {
                          handleToggleSessionSelection(session.id)
                        } else {
                          handleSelectSession(session)
                        }
                      }}
                    >
                      <td className="hidden md:table-cell py-1 w-12 min-w-12 px-0 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            value={!!session.selected}
                            size="small"
                            checkboxBgClass="bg-bg"
                            onChange={() => handleToggleSessionSelection(session.id)}
                            ariaLabel="Select row"
                          />
                        </div>
                      </td>

                      <td className="py-1 px-2 grow sm:grow-0 sm:w-48 sm:max-w-48">
                        <p className="text-xs text-foreground truncate">{session.displayTitle}</p>
                        <p className="text-xs text-foreground-muted truncate">{session.displayAuthor}</p>
                      </td>

                      <td className="hidden md:table-cell w-20 min-w-20 px-2">
                        <p className="text-xs">{filteredUserUsername || session.user?.username || 'N/A'}</p>
                      </td>

                      <td className="hidden md:table-cell w-28 min-w-28 px-2">
                        <p className="text-xs">{getPlayMethodName(session.playMethod, t)}</p>
                      </td>

                      <td className="hidden sm:table-cell max-w-32 min-w-32 px-2">
                        <p className="text-xs truncate">{getDeviceInfoLines(session).map((line, lineIndex) => (lineIndex === 0 ? line : ` | ${line}`))}</p>
                      </td>

                      <td className="text-center w-24 min-w-24 sm:w-32 sm:min-w-32 px-2">
                        <p className="text-xs font-mono">{elapsedPretty(session.timeListening, locale)}</p>
                      </td>

                      <td
                        className="text-center hover:underline w-24 min-w-24 px-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePromptResumePlayback(session)
                        }}
                      >
                        <p className="text-xs font-mono">{secondsToTimestamp(session.currentTime)}</p>
                      </td>

                      <td className="text-center hidden sm:table-cell px-2">
                        <Tooltip text={formatJsDatetime(new Date(session.updatedAt), dateFormat, timeFormat)} position="top">
                          <p className="text-xs text-foreground-muted">{getRelativeTime(session.updatedAt)}</p>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center my-2">
              <div className="grow" />
              <div className="hidden sm:inline-flex items-center">
                <p className="text-sm whitespace-nowrap">{t('LabelRowsPerPage')}</p>
                <Dropdown
                  value={itemsPerPage}
                  items={ITEMS_PER_PAGE_OPTIONS.map((option) => ({ text: String(option), value: option }))}
                  size="small"
                  className="w-24 mx-2"
                  onChange={handleUpdateItemsPerPage}
                />
              </div>
              <div className="inline-flex items-center">
                <p className="text-sm mx-2">{pageLabel}</p>
                <IconBtn ariaLabel={t('ButtonPrevious')} size="small" disabled={currentPage === 0} onClick={() => loadSessions(currentPage - 1)}>
                  arrow_back_ios_new
                </IconBtn>
                <div className="w-1" />
                <IconBtn ariaLabel={t('ButtonNext')} size="small" disabled={currentPage >= numPages - 1} onClick={() => loadSessions(currentPage + 1)}>
                  arrow_forward_ios
                </IconBtn>
              </div>
            </div>
          </>
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
        onRemovedSession={handleSessionRemoved}
        onClosedSession={handleSessionClosed}
      />

      <ConfirmDialog
        isOpen={showRemoveConfirmDialog}
        message={t('MessageConfirmRemoveListeningSessions', { 0: numSelected })}
        yesButtonText={t('ButtonRemove')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowRemoveConfirmDialog(false)}
        onConfirm={handleRemoveSelectedSessions}
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

function SortableHeader({
  label,
  active,
  descending,
  onClick,
  className = ''
}: {
  label: string
  active: boolean
  descending: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <th className={`text-left group cursor-pointer text-xs font-semibold text-foreground-muted ${className}`} onClick={onClick}>
      <div className="inline-flex items-center px-2">
        {label}
        <span className={`material-symbols text-base pl-px ${active ? '' : 'opacity-0 group-hover:opacity-30'}`}>
          {descending ? 'arrow_drop_down' : 'arrow_drop_up'}
        </span>
      </div>
    </th>
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
  const locale = useLocale()
  const { serverSettings } = useUser()

  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  return (
    <div className="block max-w-full">
      <div className="overflow-x-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-sm table-fixed">
          <thead className="bg-table-header-bg border-b border-border">
            <tr>
              <th className="w-48 min-w-48 text-left text-xs font-semibold text-foreground-muted px-2 h-11 align-middle">{t('LabelItem')}</th>
              <th className="w-20 min-w-20 text-left hidden md:table-cell text-xs font-semibold text-foreground-muted px-2 h-11 align-middle">
                {t('LabelUser')}
              </th>
              <th className="w-32 min-w-32 text-left hidden md:table-cell text-xs font-semibold text-foreground-muted px-2 h-11 align-middle">
                {t('LabelPlayMethod')}
              </th>
              <th className="w-32 min-w-32 text-left hidden sm:table-cell text-xs font-semibold text-foreground-muted px-2 h-11 align-middle">
                {t('LabelDeviceInfo')}
              </th>
              {!isShareSessions && (
                <th className="w-32 min-w-32 text-center text-xs font-semibold text-foreground-muted px-2 h-11 align-middle">{t('LabelTimeListened')}</th>
              )}
              <th className="w-16 min-w-16 text-center text-xs font-semibold text-foreground-muted px-2 h-11 align-middle">{t('LabelLastTime')}</th>
              <th className="w-32 min-w-32 hidden sm:table-cell text-left text-xs font-semibold text-foreground-muted px-2 h-11 align-middle">
                {t('LabelLastUpdate')}
              </th>
            </tr>
          </thead>

          <tbody>
            {sessions.map((session, index) => (
              <tr
                key={`open-${session.id}`}
                className={`border-b border-border ${index % 2 === 1 ? 'bg-table-row-bg-even' : ''} hover:bg-table-row-bg-hover cursor-pointer`}
                onClick={() => onSelectSession(session)}
              >
                <td className="py-1 max-w-48 px-2">
                  <p className="text-xs text-foreground truncate">{session.displayTitle}</p>
                  <p className="text-xs text-foreground-muted truncate">{session.displayAuthor}</p>
                </td>
                <td className="hidden md:table-cell px-2">
                  <p className="text-xs">{filteredUserUsername || session.user?.username || 'N/A'}</p>
                </td>
                <td className="hidden md:table-cell px-2">
                  <p className="text-xs">{getPlayMethodName(session.playMethod, t)}</p>
                </td>
                <td className="hidden sm:table-cell max-w-32 min-w-32 px-2">
                  <p className="text-xs truncate">{getDeviceInfoLines(session).map((line, lineIndex) => (lineIndex === 0 ? line : ` | ${line}`))}</p>
                </td>
                {!isShareSessions && (
                  <td className="text-center w-32 min-w-32 px-2">
                    <p className="text-xs font-mono">{elapsedPretty(session.timeListening, locale)}</p>
                  </td>
                )}
                <td
                  className="text-center w-16 min-w-16 px-2 hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPromptResumePlayback(session)
                  }}
                >
                  <p className="text-xs font-mono">{secondsToTimestamp(session.currentTime)}</p>
                </td>
                <td className="text-left hidden sm:table-cell w-32 min-w-32 px-2">
                  <Tooltip text={formatJsDatetime(new Date(session.updatedAt), dateFormat, timeFormat)} position="top">
                    <p className="text-xs text-foreground-muted">{getRelativeTime(session.updatedAt)}</p>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getPlayMethodName(playMethod: PlayMethod, t: ReturnType<typeof useTypeSafeTranslations>) {
  if (playMethod === PlayMethod.DIRECT_PLAY) return 'Direct Play'
  if (playMethod === PlayMethod.TRANSCODE) return 'Transcode'
  if (playMethod === PlayMethod.DIRECT_STREAM) return 'Direct Stream'
  if (playMethod === PlayMethod.LOCAL) return 'Local'
  return t('LabelUnknown')
}

function getDeviceInfoLines(session: PlaybackSession): string[] {
  if (!session.deviceInfo) return []

  const lines: string[] = []
  if (session.deviceInfo.clientName) lines.push(`${session.deviceInfo.clientName} ${session.deviceInfo.clientVersion || ''}`.trim())
  if (session.deviceInfo.osName) lines.push(`${session.deviceInfo.osName} ${session.deviceInfo.osVersion || ''}`.trim())
  if (session.deviceInfo.browserName) lines.push(session.deviceInfo.browserName)
  if (session.deviceInfo.manufacturer && session.deviceInfo.model) lines.push(`${session.deviceInfo.manufacturer} ${session.deviceInfo.model}`)
  if (session.deviceInfo.sdkVersion) lines.push(`SDK Version: ${session.deviceInfo.sdkVersion}`)

  return lines
}

function getRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}
