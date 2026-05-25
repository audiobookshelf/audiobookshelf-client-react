'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { EReaderDevice, User } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'
import SettingsContent from '../SettingsContent'
import EReaderDeviceModal from './EReaderDeviceModal'
import EReaderDevicesTable from './EReaderDevicesTable'

interface EReaderDevicesClientProps {
  initialDevices: EReaderDevice[]
  users: User[]
}

export default function EReaderDevicesClient({ initialDevices, users }: EReaderDevicesClientProps) {
  const t = useTypeSafeTranslations()
  const [devices, setDevices] = useState(initialDevices)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<EReaderDevice | null>(null)

  useEffect(() => {
    setDevices(initialDevices)
  }, [initialDevices])

  const handleAddClick = useCallback(() => {
    setEditingDevice(null)
    setIsModalOpen(true)
  }, [])

  const handleEditClick = useCallback((device: EReaderDevice) => {
    setEditingDevice(device)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingDevice(null)
  }, [])

  const handleDevicesSaved = useCallback((ereaderDevices: EReaderDevice[]) => {
    setDevices(ereaderDevices)
  }, [])

  const handleDeleteDevicesChange = useCallback((ereaderDevices: EReaderDevice[]) => {
    setDevices(ereaderDevices)
  }, [])

  return (
    <>
      <SettingsContent
        title={t('HeaderEreaderDevices')}
        description={t('MessageEreaderDevices')}
        addButton={{
          label: t('ButtonAddDevice'),
          onClick: handleAddClick
        }}
        hideMobileMenu={true}
        className="-mt-4"
      >
        {devices.length > 0 ? (
          <EReaderDevicesTable devices={devices} users={users} onDevicesChange={handleDeleteDevicesChange} onEditClick={handleEditClick} />
        ) : (
          <p className="text-foreground py-8 text-center text-lg">{t('MessageNoDevices')}</p>
        )}
      </SettingsContent>

      <EReaderDeviceModal
        isOpen={isModalOpen}
        device={editingDevice}
        existingDevices={devices}
        users={users}
        onClose={handleCloseModal}
        onSaved={handleDevicesSaved}
      />
    </>
  )
}
