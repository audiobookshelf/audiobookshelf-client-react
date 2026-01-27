'use client'

import DataTable, { DataTableColumn } from '@/components/ui/DataTable'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate, formatJsDatetime } from '@/lib/datefns'
import { ApiKey, UserLoginResponse } from '@/types/api'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { deleteApiKey } from './actions'

interface ApiKeysTableProps {
  apiKeys: ApiKey[]
  currentUser: UserLoginResponse
}

export default function ApiKeysTable({ apiKeys, currentUser }: ApiKeysTableProps) {
  const t = useTypeSafeTranslations()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deletingApiKeyId, setDeletingApiKeyId] = useState<string | null>(null)
  const deletingApiKeyRef = useRef<ApiKey | null>(null)
  const serverSettings = currentUser.serverSettings
  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  const handleDeleteClick = useCallback((apiKey: ApiKey) => {
    deletingApiKeyRef.current = apiKey
    setShowConfirmDialog(true)
  }, [])

  const handleConfirmDeleteApiKey = useCallback(async () => {
    if (!deletingApiKeyRef.current) return
    setShowConfirmDialog(false)

    const apiKeyToDelete = deletingApiKeyRef.current
    setDeletingApiKeyId(apiKeyToDelete.id)

    try {
      await deleteApiKey(apiKeyToDelete.id)
    } catch (error) {
      console.error('Failed to delete API key:', error)
    } finally {
      setDeletingApiKeyId(null)
      deletingApiKeyRef.current = null
    }
  }, [])

  const getExpiresAtDisplay = (expiresAt: string | null) => {
    if (!expiresAt) return t('LabelExpiresNever')

    const expiryDate = new Date(expiresAt)
    const now = new Date()

    if (expiryDate < now) return t('LabelExpired')

    return formatJsDatetime(expiryDate, dateFormat, timeFormat)
  }

  const columns: DataTableColumn<ApiKey>[] = [
    {
      label: t('LabelName'),
      accessor: 'name'
    },
    {
      label: t('LabelApiKeyUser'),
      accessor: (apiKey) => (
        <Link href={`/settings/users/${apiKey.user.id}`} className="text-foreground hover:underline">
          {apiKey.user.username}
        </Link>
      )
    },
    {
      label: t('LabelExpiresAt'),
      accessor: (apiKey) => getExpiresAtDisplay(apiKey.expiresAt),
      cellClassName: 'text-xs'
    },
    {
      label: t('LabelCreatedAt'),
      accessor: (apiKey) => {
        return (
          <Tooltip text={formatJsDatetime(new Date(apiKey.createdAt), dateFormat, timeFormat)} position="top">
            <span className="text-xs">{formatJsDate(new Date(apiKey.createdAt), dateFormat)}</span>
          </Tooltip>
        )
      }
    },
    {
      label: '',
      accessor: (apiKey) => (
        <div className="flex items-center justify-end gap-1">
          <IconBtn ariaLabel={t('ButtonEdit')} borderless size="small" className="text-foreground-muted" onClick={() => console.log('Edit', apiKey.id)}>
            edit
          </IconBtn>
          <IconBtn
            ariaLabel={t('ButtonDelete')}
            borderless
            size="small"
            className="text-foreground-muted hover:not-disabled:text-error"
            loading={deletingApiKeyId === apiKey.id}
            onClick={() => handleDeleteClick(apiKey)}
          >
            delete
          </IconBtn>
        </div>
      )
    }
  ]

  return (
    <>
      <DataTable
        data={apiKeys}
        columns={columns}
        getRowKey={(apiKey) => apiKey.id}
        rowClassName={(apiKey) => (!apiKey.isActive ? 'bg-error/10 even:bg-error/10 hover:bg-error/5' : '')}
      />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t('MessageConfirmDeleteApiKey', { 0: deletingApiKeyRef.current?.name || '' })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDeleteApiKey}
      />
    </>
  )
}
