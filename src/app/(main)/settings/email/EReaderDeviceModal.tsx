'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { EReaderDevice, User } from '@/types/api'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { updateEReaderDevices } from './actions'

export interface EReaderDeviceFormData {
  name: string
  email: string
  availabilityOption: EReaderDevice['availabilityOption']
  users: string[]
}

const getInitialFormData = (device: EReaderDevice | null): EReaderDeviceFormData => {
  if (device) {
    return {
      name: device.name,
      email: device.email,
      availabilityOption: device.availabilityOption || 'adminOrUp',
      users: device.users || []
    }
  }

  return {
    name: '',
    email: '',
    availabilityOption: 'adminOrUp',
    users: []
  }
}

interface EReaderDeviceModalProps {
  isOpen: boolean
  device: EReaderDevice | null
  existingDevices: EReaderDevice[]
  users: User[]
  onClose: () => void
  onSaved: (devices: EReaderDevice[]) => void
}

export default function EReaderDeviceModal({ isOpen, device, existingDevices, users, onClose, onSaved }: EReaderDeviceModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<EReaderDeviceFormData>(getInitialFormData(device))

  const isEditing = !!device

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(device))
    }
  }, [isOpen, device])

  const availabilityOptions: DropdownItem[] = useMemo(
    () => [
      { text: t('LabelAdminUsersOnly'), value: 'adminOrUp' },
      { text: t('LabelAllUsersExcludingGuests'), value: 'userOrUp' },
      { text: t('LabelAllUsersIncludingGuests'), value: 'guestOrUp' },
      { text: t('LabelSelectUsers'), value: 'specificUsers' }
    ],
    [t]
  )

  const userItems: MultiSelectItem<string>[] = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        content: user.username
      })),
    [users]
  )

  const selectedUserItems = useMemo(() => userItems.filter((item) => formData.users.includes(item.value)), [userItems, formData.users])

  const handleUserAdded = (item: MultiSelectItem<string>) => {
    if (formData.users.includes(item.value)) return
    setFormData((prev) => ({ ...prev, users: [...prev.users, item.value] }))
  }

  const handleUserRemoved = (item: MultiSelectItem<string>) => {
    setFormData((prev) => ({ ...prev, users: prev.users.filter((id) => id !== item.value) }))
  }

  const handleSubmit = () => {
    const name = formData.name.trim()
    const email = formData.email.trim()

    if (!name || !email) {
      showToast(t('ToastNameEmailRequired'), { type: 'error' })
      return
    }

    if (formData.availabilityOption === 'specificUsers' && !formData.users.length) {
      showToast(t('ToastSelectAtLeastOneUser'), { type: 'error' })
      return
    }

    const newDevice: EReaderDevice = {
      name,
      email,
      availabilityOption: formData.availabilityOption,
      users: formData.availabilityOption === 'specificUsers' ? formData.users : []
    }

    if (!device && existingDevices.some((d) => d.name === newDevice.name)) {
      showToast(t('ToastDeviceNameAlreadyExists'), { type: 'error' })
      return
    }

    if (device && device.name !== newDevice.name && existingDevices.some((d) => d.name === newDevice.name)) {
      showToast(t('ToastDeviceNameAlreadyExists'), { type: 'error' })
      return
    }

    const ereaderDevices = device ? [...existingDevices.filter((d) => d.name !== device.name), newDevice] : [...existingDevices, newDevice]

    startTransition(async () => {
      try {
        const response = await updateEReaderDevices(ereaderDevices)
        onSaved(response.ereaderDevices)
        onClose()
      } catch (error) {
        console.error('Failed to save ereader device', error)
        showToast(isEditing ? t('ToastFailedToUpdate') : t('ToastDeviceAddFailed'), { type: 'error' })
      }
    })
  }

  const outerContentTitle = (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="text-xl text-white">{isEditing ? `${t('ButtonEdit')} ${t('LabelDevice')}` : t('ButtonAddDevice')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} processing={isPending} onClose={onClose} outerContent={outerContentTitle} className="w-[800px]">
      <div className="flex max-h-[90vh] flex-col">
        <div className="overflow-y-auto px-4 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label={t('LabelName')}
              value={formData.name}
              disabled={isPending}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            />
            <TextInput
              label={t('LabelEmail')}
              type="email"
              value={formData.email}
              disabled={isPending}
              onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Dropdown
              label={t('LabelDeviceIsAvailableTo')}
              items={availabilityOptions}
              value={formData.availabilityOption}
              disabled={isPending}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  availabilityOption: value as EReaderDevice['availabilityOption'],
                  users: value === 'specificUsers' ? prev.users : []
                }))
              }
            />
            {formData.availabilityOption === 'specificUsers' && (
              <MultiSelectDropdown
                label={t('HeaderUsers')}
                items={userItems}
                selectedItems={selectedUserItems}
                disabled={isPending}
                onItemAdded={handleUserAdded}
                onItemRemoved={handleUserRemoved}
              />
            )}
          </div>
        </div>

        <div className="border-border border-t px-4 py-3">
          <div className="flex items-center justify-end">
            <Btn loading={isPending} disabled={isPending} onClick={handleSubmit}>
              {t('ButtonSubmit')}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}
