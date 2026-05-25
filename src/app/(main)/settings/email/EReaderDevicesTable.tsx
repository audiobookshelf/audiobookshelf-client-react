'use client'

import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable, { DataTableColumn } from '@/components/ui/SimpleDataTable'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { EReaderDevice, User } from '@/types/api'
import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { updateEReaderDevices } from './actions'

interface EReaderDevicesTableProps {
  devices: EReaderDevice[]
  users: User[]
  onDevicesChange: (devices: EReaderDevice[]) => void
  onEditClick: (device: EReaderDevice) => void
}

export default function EReaderDevicesTable({ devices, users, onDevicesChange, onEditClick }: EReaderDevicesTableProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deletingDeviceName, setDeletingDeviceName] = useState<string | null>(null)
  const deletingDeviceRef = useRef<EReaderDevice | null>(null)

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]))
  }, [users])

  const getAccessibleBy = useCallback(
    (device: EReaderDevice) => {
      if (device.availabilityOption === 'userOrUp') return t('LabelAllUsersExcludingGuests')
      if (device.availabilityOption === 'guestOrUp') return t('LabelAllUsersIncludingGuests')
      if (device.availabilityOption === 'specificUsers') {
        return (device.users || [])
          .map((id) => usersById.get(id)?.username)
          .filter(Boolean)
          .join(', ')
      }
      return t('LabelAdminUsersOnly')
    },
    [t, usersById]
  )

  const handleDeleteClick = useCallback((device: EReaderDevice) => {
    deletingDeviceRef.current = device
    setShowConfirmDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    const device = deletingDeviceRef.current
    if (!device) return

    setShowConfirmDialog(false)
    setDeletingDeviceName(device.name)

    const ereaderDevices = devices.filter((d) => d.name !== device.name)

    startTransition(async () => {
      try {
        const response = await updateEReaderDevices(ereaderDevices)
        onDevicesChange(response.ereaderDevices)
      } catch (error) {
        console.error('Failed to delete device', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      } finally {
        setDeletingDeviceName(null)
        deletingDeviceRef.current = null
      }
    })
  }, [devices, onDevicesChange, showToast, t])

  const columns: DataTableColumn<EReaderDevice>[] = [
    {
      label: t('LabelName'),
      accessor: (device) => <span className="text-sm md:text-base">{device.name}</span>
    },
    {
      label: t('LabelEmail'),
      accessor: (device) => <span className="text-sm md:text-base">{device.email}</span>
    },
    {
      label: t('LabelAccessibleBy'),
      accessor: (device) => <span className="text-sm md:text-base">{getAccessibleBy(device)}</span>
    },
    {
      label: '',
      accessor: (device) => (
        <div className="flex h-10 items-center justify-end gap-1">
          <IconBtn
            ariaLabel={t('ButtonEdit')}
            borderless
            size="small"
            className="text-foreground-muted"
            disabled={deletingDeviceName === device.name || isPending}
            onClick={() => onEditClick(device)}
          >
            edit
          </IconBtn>
          <IconBtn
            ariaLabel={t('ButtonDelete')}
            borderless
            size="small"
            className="text-foreground-muted hover:not-disabled:text-error"
            loading={deletingDeviceName === device.name}
            disabled={isPending}
            onClick={() => handleDeleteClick(device)}
          >
            delete
          </IconBtn>
        </div>
      )
    }
  ]

  return (
    <>
      <SimpleDataTable data={devices} columns={columns} getRowKey={(device) => device.name} tableClassName="mt-4" />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t('MessageConfirmDeleteDevice', { 0: deletingDeviceRef.current?.name || '' })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
