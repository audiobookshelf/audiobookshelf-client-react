'use client'

import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable, { DataTableColumn } from '@/components/ui/SimpleDataTable'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { CustomMetadataProvider } from '@/types/api'
import { useMemo, useRef, useState } from 'react'

interface CustomMetadataProvidersTableProps {
  providers: CustomMetadataProvider[]
  processing?: boolean
  onDeleteProvider: (providerId: string) => Promise<void>
}

function MaskedAuthValue({ authHeaderValue }: { authHeaderValue: string | null }) {
  if (!authHeaderValue) return null

  return (
    <span
      className={mergeClasses(
        'inline-block rounded px-1 py-[1px] transition-all duration-300',
        'bg-table-header-bg hover:text-foreground text-transparent hover:bg-transparent'
      )}
    >
      {authHeaderValue}
    </span>
  )
}

export default function CustomMetadataProvidersTable({ providers, processing = false, onDeleteProvider }: CustomMetadataProvidersTableProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()

  const deletingProviderRef = useRef<CustomMetadataProvider | null>(null)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deletingProviderId, setDeletingProviderId] = useState<string | null>(null)

  const handleDeleteClick = (provider: CustomMetadataProvider) => {
    deletingProviderRef.current = provider
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    const provider = deletingProviderRef.current
    if (!provider) return

    setShowConfirmDialog(false)
    setDeletingProviderId(provider.id)

    try {
      await onDeleteProvider(provider.id)
      showToast(t('ToastProviderRemoveSuccess'), { type: 'success' })
    } catch (error) {
      console.error('Failed to remove provider', error)
      showToast(t('ToastRemoveFailed'), { type: 'error' })
    } finally {
      setDeletingProviderId(null)
      deletingProviderRef.current = null
    }
  }

  const columns = useMemo<DataTableColumn<CustomMetadataProvider>[]>(
    () => [
      {
        label: t('LabelName'),
        accessor: 'name'
      },
      {
        label: 'URL',
        accessor: 'url'
      },
      {
        label: t('LabelProviderAuthorizationValue'),
        accessor: (provider) => <MaskedAuthValue authHeaderValue={provider.authHeaderValue} />
      },
      {
        label: '',
        accessor: (provider) => (
          <div className="flex items-center justify-end">
            <IconBtn
              ariaLabel={t('ButtonDelete')}
              borderless
              size="small"
              className="text-foreground-muted hover:not-disabled:text-error"
              loading={deletingProviderId === provider.id && processing}
              onClick={() => handleDeleteClick(provider)}
            >
              delete
            </IconBtn>
          </div>
        )
      }
    ],
    [deletingProviderId, processing, t]
  )

  if (!providers.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg">{t('LabelNoCustomMetadataProviders')}</p>
      </div>
    )
  }

  return (
    <>
      <SimpleDataTable
        data={providers}
        columns={columns}
        getRowKey={(provider) => provider.id}
        rowClassName="bg-table-row-bg-odd even:bg-table-row-bg-even hover:bg-table-row-bg-hover"
      />

      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t('MessageConfirmDeleteMetadataProvider', { 0: deletingProviderRef.current?.name || '' })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
