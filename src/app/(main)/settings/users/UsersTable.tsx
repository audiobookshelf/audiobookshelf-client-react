'use client'

import DataTable, { DataTableColumn } from '@/components/ui/DataTable'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import OnlineIndicator from '@/components/widgets/OnlineIndicator'
import { useSocket } from '@/contexts/SocketContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate, formatJsDatetime } from '@/lib/datefns'
import { DeviceInfo, User } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useRef, useState } from 'react'
import { deleteUser } from './actions'

interface UsersTableProps {
  users: User[]
  dateFormat: string
  timeFormat: string
  onEditUser: (user: User) => void
}

type SortColumn = 'username' | 'type' | 'activity' | 'lastSeen' | 'createdAt'

export default function UsersTable({ users, dateFormat, timeFormat, onEditUser }: UsersTableProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const { getIsUserOnline, getOnlineUser } = useSocket()
  const { user: currentUser } = useUser()
  const isRootUser = currentUser.type === 'root'
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortColumn>('createdAt')
  const [sortDesc, setSortDesc] = useState(false)
  const deletingUserRef = useRef<User | null>(null)

  const sortedUsers = useMemo(() => {
    const getSortValue = (user: User) => {
      if (sortBy === 'activity') {
        return getOnlineUser(user.id)?.session?.displayTitle || user.latestSession?.displayTitle || null
      }
      return user[sortBy] ?? null
    }

    return [...users].sort((a, b) => {
      const aValue = getSortValue(a)
      const bValue = getSortValue(b)

      // Keep missing values at the bottom in both directions.
      if (aValue === null || aValue === '') return bValue === null || bValue === '' ? 0 : 1
      if (bValue === null || bValue === '') return -1

      const comparison =
        typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
      return sortDesc ? -comparison : comparison
    })
  }, [users, sortBy, sortDesc, getOnlineUser])

  const handleDeleteClick = useCallback((user: User) => {
    deletingUserRef.current = user
    setShowConfirmDialog(true)
  }, [])

  const handleConfirmDeleteUser = useCallback(async () => {
    if (!deletingUserRef.current) return
    setShowConfirmDialog(false)

    const userToDelete = deletingUserRef.current
    setDeletingUserId(userToDelete.id)

    try {
      await deleteUser(userToDelete.id)
      showToast(t('ToastUserDeleteSuccess'), { type: 'success' })
      router.refresh()
    } catch (error) {
      showToast(t('ToastUserDeleteFailed'), { type: 'error' })
      console.error('Failed to delete user:', error)
    } finally {
      setDeletingUserId(null)
      deletingUserRef.current = null
    }
  }, [router, showToast, t])

  const getDeviceInfoString = (deviceInfo: DeviceInfo | null | undefined) => {
    if (!deviceInfo) return ''
    if (deviceInfo.manufacturer && deviceInfo.model) return `${deviceInfo.manufacturer} ${deviceInfo.model}`

    return `${deviceInfo.osName || 'Unknown'} ${deviceInfo.osVersion || ''} ${deviceInfo.browserName || ''}`
  }

  const columns: DataTableColumn<User>[] = [
    {
      label: t('LabelUsername'),
      sortKey: 'username',
      sortable: true,
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <OnlineIndicator value={user.id === currentUser.id || getIsUserOnline(user.id)} />
          <p className="truncate text-base font-medium">{user.username}</p>
        </div>
      )
    },
    {
      label: t('LabelAccountType'),
      sortable: true,
      accessor: 'type',
      cellClassName: 'text-sm'
    },
    {
      label: t('LabelActivity'),
      sortKey: 'activity',
      sortable: true,
      hiddenBelow: 'lg',
      accessor: (user) => {
        const isOnline = getIsUserOnline(user.id)
        const onlineSession = getOnlineUser(user.id)?.session
        if (isOnline && onlineSession?.displayTitle) {
          return (
            <div className="flex flex-col text-xs">
              <span>{t('LabelListeningWithValue', { 0: onlineSession.displayTitle })}</span>
              <span className="text-foreground-muted">{getDeviceInfoString(onlineSession.deviceInfo)}</span>
            </div>
          )
        }

        const latestSession = user.latestSession
        if (!latestSession?.displayTitle) return ''

        return (
          <div className="flex flex-col text-xs">
            <span>{t('LabelLastWithValue', { 0: latestSession.displayTitle })}</span>
            <span className="text-foreground-muted">{getDeviceInfoString(latestSession.deviceInfo)}</span>
          </div>
        )
      }
    },
    {
      label: t('LabelLastSeen'),
      sortKey: 'lastSeen',
      sortable: true,
      hiddenBelow: 'sm',
      headerClassName: 'w-32',
      accessor: (user) => {
        if (!user.lastSeen) return ''
        return (
          <Tooltip text={formatJsDatetime(new Date(user.lastSeen), dateFormat, timeFormat)} position="top">
            <span className="text-xs">{formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}</span>
          </Tooltip>
        )
      }
    },
    {
      label: t('LabelCreatedAt'),
      sortKey: 'createdAt',
      sortable: true,
      hiddenBelow: 'sm',
      headerClassName: 'w-32',
      accessor: (user) => {
        return (
          <Tooltip text={formatJsDatetime(new Date(user.createdAt), dateFormat, timeFormat)} position="top">
            <span className="text-xs">{formatJsDate(new Date(user.createdAt), dateFormat)}</span>
          </Tooltip>
        )
      }
    },
    {
      label: '',
      headerClassName: 'w-32',
      accessor: (user) => {
        const showEdit = user.type !== 'root' || isRootUser
        const showDelete = user.type !== 'root' && user.id !== currentUser.id

        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {showEdit ? (
              <IconBtn
                ariaLabel={t('ButtonUserEdit', { 0: user.username })}
                borderless
                size="small"
                className="text-foreground-muted"
                onClick={() => onEditUser(user)}
              >
                edit
              </IconBtn>
            ) : (
              <span className="inline-block w-9 shrink-0" aria-hidden="true" />
            )}
            {showDelete ? (
              <IconBtn
                ariaLabel={t('ButtonUserDelete', { 0: user.username })}
                borderless
                size="small"
                className="text-foreground-muted hover:not-disabled:text-error"
                loading={deletingUserId === user.id}
                onClick={() => handleDeleteClick(user)}
              >
                delete
              </IconBtn>
            ) : (
              <span className="inline-block w-9 shrink-0" aria-hidden="true" />
            )}
          </div>
        )
      }
    }
  ]

  return (
    <>
      <DataTable
        data={sortedUsers}
        columns={columns}
        getRowKey={(user) => user.id}
        rowClassName={(user) => (!user.isActive ? 'bg-error/10 even:bg-error/10 hover:bg-error/5' : '')}
        onRowClick={(user) => router.push(`/settings/users/${user.id}`)}
        sorting={{
          sortBy,
          sortDesc,
          onSortChange: (nextSortBy, nextSortDesc) => {
            setSortBy(nextSortBy as SortColumn)
            setSortDesc(nextSortDesc)
          }
        }}
      />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t('MessageRemoveUserWarning', { 0: deletingUserRef.current?.username || '' })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-error-foreground"
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDeleteUser}
      />
    </>
  )
}
