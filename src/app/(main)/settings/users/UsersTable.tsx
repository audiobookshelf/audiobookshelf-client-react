'use client'

import DataTable, { DataTableColumn } from '@/components/ui/DataTable'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import OnlineIndicator from '@/components/widgets/OnlineIndicator'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate, formatJsDatetime } from '@/lib/datefns'
import { DeviceInfo, User, UserLoginResponse } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface UsersTableProps {
  currentUser: UserLoginResponse
  users: User[]
  dateFormat: string
  timeFormat: string
}

export default function UsersTable({ currentUser, users, dateFormat, timeFormat }: UsersTableProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const currentUserId = currentUser.user.id

  const getDeviceInfoString = (deviceInfo: DeviceInfo | null) => {
    if (!deviceInfo) return ''
    if (deviceInfo.manufacturer && deviceInfo.model) return `${deviceInfo.manufacturer} ${deviceInfo.model}`

    return `${deviceInfo.osName || 'Unknown'} ${deviceInfo.osVersion || ''} ${deviceInfo.browserName || ''}`
  }

  const columns: DataTableColumn<User>[] = [
    {
      label: t('LabelUsername'),
      accessor: (user) => (
        <div className="flex items-center gap-2">
          {/* TODO: Use actual user online status that comes from web socket */}
          <OnlineIndicator value={user.id === currentUserId} />
          <p className="font-medium text-base">{user.username}</p>
        </div>
      )
    },
    {
      label: t('LabelAccountType'),
      accessor: 'type'
    },
    {
      label: t('LabelActivity'),
      accessor: (user) => {
        const latestSession = user.latestSession
        if (!latestSession) return ''
        const latestSessionDisplayTitle = latestSession.displayTitle || ''
        const latestSessionDeviceInfo = getDeviceInfoString(latestSession.deviceInfo)
        return (
          <div className="flex flex-col text-xs">
            <span>{latestSessionDisplayTitle}</span>
            <span className="text-foreground-muted">{latestSessionDeviceInfo}</span>
          </div>
        )
      }
    },
    {
      label: t('LabelLastSeen'),
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
      accessor: (user) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconBtn
            ariaLabel={t('ButtonUserEdit', { 0: user.username })}
            borderless
            size="small"
            className="text-foreground-muted"
            onClick={() => console.log('Edit', user.id)}
          >
            edit
          </IconBtn>
          {user.type !== 'root' && (
            <IconBtn
              ariaLabel={t('ButtonUserDelete', { 0: user.username })}
              borderless
              size="small"
              className="text-foreground-muted hover:not-disabled:text-error"
              onClick={() => console.log('Delete', user.id)}
            >
              delete
            </IconBtn>
          )}
        </div>
      )
    }
  ]

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowKey={(user) => user.id}
      rowClassName={(user) => (!user.isActive ? 'bg-error/10 even:bg-error/10 hover:bg-error/5' : '')}
      onRowClick={(user) => router.push(`/settings/users/${user.id}`)}
    />
  )
}
