'use client'

import Modal from '@/components/modals/Modal'
import ModalFooter from '@/components/modals/ModalFooter'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable, { type DataTableColumn } from '@/components/ui/SimpleDataTable'
import TextInput from '@/components/ui/TextInput'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EReaderDevice } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { updateMyEReaderDevices } from './actions'

function isOwnDevice(device: EReaderDevice) {
  return device.users?.length === 1
}

export default function AccountEReaderDevices() {
  const t = useTypeSafeTranslations()
  const { user, ereaderDevices, setEreaderDevices } = useUser()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [editingDevice, setEditingDevice] = useState<EReaderDevice | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deviceToDelete, setDeviceToDelete] = useState<EReaderDevice | null>(null)
  const [deletingDeviceName, setDeletingDeviceName] = useState<string | null>(null)

  const canManageDevices = user.type !== 'root' && user.type !== 'admin' && user.permissions.createEreader
  const ownDevices = useMemo(() => ereaderDevices.filter(isOwnDevice), [ereaderDevices])

  const saveDevices = useCallback(
    (nextDevices: EReaderDevice[], failureMessage: string, onSuccess?: () => void) => {
      startTransition(async () => {
        const result = await updateMyEReaderDevices(nextDevices)
        setDeletingDeviceName(null)
        if (!result.ok) {
          showToast(result.duplicate ? t('ToastDeviceNameAlreadyExists') : failureMessage, { type: 'error' })
          return
        }
        setEreaderDevices(result.ereaderDevices)
        onSuccess?.()
      })
    },
    [setEreaderDevices, showToast, t]
  )

  const handleConfirmDelete = useCallback(() => {
    const device = deviceToDelete
    if (!device) return
    setDeviceToDelete(null)
    setDeletingDeviceName(device.name)
    saveDevices(
      ownDevices.filter((entry) => entry.name !== device.name),
      t('ToastRemoveFailed')
    )
  }, [deviceToDelete, ownDevices, saveDevices, t])

  const columns: DataTableColumn<EReaderDevice>[] = useMemo(
    () => [
      {
        label: t('LabelName'),
        accessor: (device) => (
          <span className="block max-w-32 truncate text-sm sm:max-w-48 md:text-base" title={device.name}>
            {device.name}
          </span>
        )
      },
      {
        label: t('LabelEmail'),
        headerClassName: 'w-full',
        cellClassName: 'max-w-0',
        accessor: (device) => (
          <span className="block truncate text-sm md:text-base" title={device.email}>
            {device.email}
          </span>
        )
      },
      {
        label: '',
        headerClassName: 'w-0',
        cellClassName: 'w-0 whitespace-nowrap',
        accessor: (device) => {
          const locked = !isOwnDevice(device) || deletingDeviceName === device.name || isPending
          return (
            <div className="flex h-10 items-center justify-end gap-1">
              <IconBtn
                ariaLabel={t('ButtonEdit')}
                borderless
                size="small"
                className="text-foreground-muted"
                disabled={locked}
                onClick={() => {
                  setEditingDevice(device)
                  setIsModalOpen(true)
                }}
              >
                edit
              </IconBtn>
              <IconBtn
                ariaLabel={t('ButtonDelete')}
                borderless
                size="small"
                className="text-foreground-muted hover:not-disabled:text-error"
                disabled={locked}
                loading={deletingDeviceName === device.name}
                onClick={() => setDeviceToDelete(device)}
              >
                delete
              </IconBtn>
            </div>
          )
        }
      }
    ],
    [deletingDeviceName, isPending, t]
  )

  if (!canManageDevices) return null

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg">{t('HeaderEreaderDevices')}</h2>
          <div className="grow" />
          <Btn
            size="small"
            disabled={isPending}
            onClick={() => {
              setEditingDevice(null)
              setIsModalOpen(true)
            }}
          >
            {t('ButtonAddDevice')}
          </Btn>
        </div>
        {ereaderDevices.length > 0 ? (
          <SimpleDataTable data={ereaderDevices} columns={columns} getRowKey={(device) => device.name} tableClassName="mt-2" />
        ) : (
          <p className="text-foreground py-4 text-center text-lg">{t('MessageNoDevices')}</p>
        )}
      </div>
      <div className="bg-border h-px w-full" />

      <AccountEReaderDeviceModal
        isOpen={isModalOpen}
        device={editingDevice}
        ownDevices={ownDevices}
        userId={user.id}
        saving={isPending}
        onClose={() => {
          setIsModalOpen(false)
          setEditingDevice(null)
        }}
        onSave={(nextDevices) => {
          saveDevices(nextDevices, editingDevice ? t('ToastFailedToUpdate') : t('ToastDeviceAddFailed'), () => {
            setIsModalOpen(false)
            setEditingDevice(null)
          })
        }}
      />

      <ConfirmDialog
        isOpen={!!deviceToDelete}
        message={t('MessageConfirmDeleteDevice', { 0: deviceToDelete?.name || '' })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-error-foreground"
        onClose={() => setDeviceToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

function AccountEReaderDeviceModal({
  isOpen,
  device,
  ownDevices,
  userId,
  saving,
  onClose,
  onSave
}: {
  isOpen: boolean
  device: EReaderDevice | null
  ownDevices: EReaderDevice[]
  userId: string
  saving: boolean
  onClose: () => void
  onSave: (devices: EReaderDevice[]) => void
}) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setName(device?.name || '')
    setEmail(device?.email || '')
  }, [device, isOpen])

  const handleSubmit = () => {
    const nextName = name.trim()
    const nextEmail = email.trim()
    if (!nextName || !nextEmail) {
      showToast(t('ToastNameEmailRequired'), { type: 'error' })
      return
    }

    const nameTaken = ownDevices.some((entry) => entry.name === nextName && entry.name !== device?.name)
    if (nameTaken) {
      showToast(t('ToastDeviceNameAlreadyExists'), { type: 'error' })
      return
    }

    const nextDevice: EReaderDevice = {
      name: nextName,
      email: nextEmail,
      availabilityOption: 'specificUsers',
      users: [userId]
    }
    const nextDevices = device ? ownDevices.map((entry) => (entry.name === device.name ? nextDevice : entry)) : [...ownDevices, nextDevice]
    onSave(nextDevices)
  }

  return (
    <Modal
      isOpen={isOpen}
      processing={saving}
      onClose={onClose}
      outerContent={<ModalOuterContent>{device ? t('ButtonEditDevice') : t('ButtonAddDevice')}</ModalOuterContent>}
      className="w-full max-w-2xl"
    >
      <div className="flex flex-col">
        <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 md:grid-cols-2">
          <TextInput label={t('LabelName')} value={name} disabled={saving} onChange={setName} />
          <TextInput label={t('LabelEmail')} type="email" value={email} disabled={saving} onChange={setEmail} />
        </div>
        <ModalFooter
          primary={{
            label: t('ButtonSubmit'),
            onClick: handleSubmit,
            loading: saving,
            disabled: saving
          }}
        />
      </div>
    </Modal>
  )
}
