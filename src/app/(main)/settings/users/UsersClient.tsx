'use client'

import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { User } from '@/types/api'
import { useState } from 'react'
import SettingsContent from '../SettingsContent'
import UserAccountModal, { UserFormData } from './UserAccountModal'
import UsersTable from './UsersTable'

interface UsersClientProps {
  users: User[]
}

export default function UsersClient({ users }: UsersClientProps) {
  const t = useTypeSafeTranslations()
  const { serverSettings } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const handleAddUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleSubmit = (formData: UserFormData) => {
    // TODO: Wire up create/update user action
    console.log('Submit user:', formData)
    handleCloseModal()
  }

  const handleUnlinkOpenId = () => {
    // TODO: Wire up unlink OpenID action
    console.log('Unlink OpenID for user:', editingUser?.id)
  }

  return (
    <>
      <SettingsContent
        title={t('HeaderUsers')}
        moreInfoUrl="https://www.audiobookshelf.org/guides/users"
        addButton={{
          label: t('ButtonAddUser'),
          onClick: handleAddUser
        }}
      >
        <UsersTable users={users} dateFormat={serverSettings.dateFormat} timeFormat={serverSettings.timeFormat} onEditUser={handleEditUser} />
      </SettingsContent>

      <UserAccountModal isOpen={isModalOpen} user={editingUser} onClose={handleCloseModal} onSubmit={handleSubmit} onUnlinkOpenId={handleUnlinkOpenId} />
    </>
  )
}
