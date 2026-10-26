'use client'

import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable, { type DataTableColumn } from '@/components/ui/SimpleDataTable'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useLogout } from '@/hooks/useLogout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime } from '@/lib/datefns'
import type { AuthSession } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deleteAuthSession, getAuthSessions } from './actions'

function getAuthSessionDeviceLabel(session: AuthSession) {
  const deviceInfo = session.deviceInfo
  if (!deviceInfo) return session.userAgent || '-'

  const parts: string[] = []
  if (deviceInfo.model) parts.push(deviceInfo.model)
  if (deviceInfo.osName) parts.push(`${deviceInfo.osName}${deviceInfo.osVersion ? ` ${deviceInfo.osVersion}` : ''}`)
  if (deviceInfo.browserName) parts.push(deviceInfo.browserName)
  return parts.join(' / ') || session.userAgent || '-'
}

export default function AuthSessionsTable() {
  const t = useTypeSafeTranslations()
  const { user, serverSettings } = useUser()
  const { showToast } = useGlobalToast()
  const logout = useLogout()
  const isGuest = user.type === 'guest'

  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [page, setPage] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')

  const loadingRef = useRef(false)
  const numPagesRef = useRef(0)
  const sessionToDeleteRef = useRef<AuthSession | null>(null)

  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  const loadSessions = useCallback(
    async (nextPage: number) => {
      if (loadingRef.current) return
      if (nextPage < 0) return
      if (numPagesRef.current > 0 && nextPage > numPagesRef.current - 1) return

      loadingRef.current = true
      setLoading(true)
      try {
        const data = await getAuthSessions(nextPage)
        const nextNumPages = data.numPages ?? 0
        numPagesRef.current = nextNumPages
        setSessions(data.sessions ?? [])
        setPage(data.page ?? nextPage)
        setNumPages(nextNumPages)
      } catch (error) {
        console.error('Failed to load sessions', error)
        showToast(t('ToastFailedToLoadData'), { type: 'error' })
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [showToast, t]
  )

  useEffect(() => {
    if (isGuest) return
    void loadSessions(0)
  }, [isGuest, loadSessions])

  const handleDeleteClick = useCallback(
    (session: AuthSession) => {
      sessionToDeleteRef.current = session
      setConfirmMessage(t('MessageConfirmLogoutDevice', { 0: getAuthSessionDeviceLabel(session) }))
      setConfirmOpen(true)
    },
    [t]
  )

  const handleConfirmDelete = useCallback(async () => {
    const session = sessionToDeleteRef.current
    setConfirmOpen(false)
    if (!session) return

    if (session.current) {
      setDeletingSessionId(session.id)
      try {
        await logout(false)
      } catch (error) {
        console.error('Failed to delete session', error)
        showToast(t('ToastFailedToDelete'), { type: 'error' })
        setDeletingSessionId(null)
      }
      return
    }

    setDeletingSessionId(session.id)
    try {
      await deleteAuthSession(session.id)
      const nextPage = sessions.length === 1 && page > 0 ? page - 1 : page
      await loadSessions(nextPage)
    } catch (error) {
      console.error('Failed to delete session', error)
      showToast(t('ToastFailedToDelete'), { type: 'error' })
    } finally {
      setDeletingSessionId(null)
      sessionToDeleteRef.current = null
    }
  }, [loadSessions, logout, page, sessions.length, showToast, t])

  const columns = useMemo<DataTableColumn<AuthSession>[]>(
    () => [
      {
        label: t('LabelDeviceInfo'),
        cellClassName: 'max-w-0',
        accessor: (session) => (
          <div className="flex min-w-0 items-center gap-0.5">
            <span className="text-foreground min-w-0 truncate text-sm" title={session.userAgent || undefined}>
              {getAuthSessionDeviceLabel(session)}
            </span>
            {session.current && (
              <Tooltip text={t('LabelCurrent')} position="top" className="inline-flex shrink-0">
                <span className="material-symbols text-success text-sm leading-none" role="img" aria-label={t('LabelCurrent')}>
                  check
                </span>
              </Tooltip>
            )}
          </div>
        )
      },
      {
        label: t('LabelIpAddress'),
        hiddenBelow: 'sm',
        headerClassName: 'w-36',
        cellClassName: 'w-36',
        accessor: (session) => (
          <p className="text-foreground truncate text-sm" title={session.ipAddress || undefined}>
            {session.ipAddress || '-'}
          </p>
        )
      },
      {
        label: t('LabelLastUpdate'),
        headerClassName: 'w-28 sm:w-40',
        cellClassName: 'w-28 sm:w-40',
        accessor: (session) =>
          session.updatedAt ? (
            <Tooltip lazy text={formatJsDatetime(new Date(session.updatedAt), dateFormat, timeFormat)} position="top">
              <p className="text-foreground text-xs sm:text-sm">{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</p>
            </Tooltip>
          ) : (
            <span>-</span>
          )
      },
      {
        label: '',
        headerClassName: 'w-12',
        cellClassName: 'w-12',
        accessor: (session) => (
          <div className="flex h-10 items-center justify-end">
            <IconBtn
              ariaLabel={t('LabelLogout')}
              borderless
              size="small"
              className="text-foreground-muted hover:not-disabled:text-error"
              disabled={deletingSessionId === session.id || loading}
              loading={deletingSessionId === session.id}
              onClick={() => handleDeleteClick(session)}
            >
              delete
            </IconBtn>
          </div>
        )
      }
    ],
    [dateFormat, deletingSessionId, handleDeleteClick, loading, t, timeFormat]
  )

  if (isGuest) return null

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-lg">{t('HeaderSessions')}</h2>
      {sessions.length > 0 ? (
        <SimpleDataTable data={sessions} columns={columns} getRowKey={(session) => session.id} tableClassName="table-fixed" caption={t('HeaderSessions')} />
      ) : loading ? (
        <p className="text-foreground-muted py-2 text-sm">{t('LabelLoadingIndicator')}</p>
      ) : null}
      {numPages > 1 && (
        <div className="flex items-center justify-end py-1">
          <IconBtn ariaLabel={t('ButtonPrevious')} size="small" className="mx-1" disabled={loading || page === 0} onClick={() => void loadSessions(page - 1)}>
            chevron_left
          </IconBtn>
          <p className="mx-1 text-sm">{t('LabelPaginationPageXOfY', { 0: page + 1, 1: numPages })}</p>
          <IconBtn
            ariaLabel={t('ButtonNext')}
            size="small"
            className="mx-1"
            disabled={loading || page >= numPages - 1}
            onClick={() => void loadSessions(page + 1)}
          >
            chevron_right
          </IconBtn>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmOpen}
        message={confirmMessage}
        yesButtonText={t('LabelLogout')}
        yesButtonClassName="bg-error text-error-foreground"
        onClose={() => {
          setConfirmOpen(false)
          sessionToDeleteRef.current = null
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
