'use client'

import { useGlobalToast } from '@/contexts/ToastContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiError } from '@/lib/apiErrors'
import { User, UserAccountPayload } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import SettingsContent from '../SettingsContent'
import UserAccountModal, { UserFormData } from './UserAccountModal'
import UsersTable from './UsersTable'
import { createUser, unlinkUserOpenId, updateUser } from './actions'

interface UsersClientProps {
  users: User[]
}

function buildAccountPayload(formData: UserFormData): UserAccountPayload {
  const account: UserAccountPayload = {
    username: formData.username.trim(),
    email: formData.email.trim() || undefined,
    type: formData.type,
    isActive: formData.isActive,
    permissions: { ...formData.permissions },
    librariesAccessible: [...formData.librariesAccessible],
    itemTagsSelected: [...formData.itemTagsSelected]
  }

  if (formData.password) {
    account.password = formData.password
  }

  return account
}

function upsertUser(users: User[], user: User): User[] {
  const index = users.findIndex((u) => u.id === user.id)
  if (index >= 0) {
    const next = [...users]
    next[index] = user
    return next
  }
  return [...users, user]
}

export default function UsersClient({ users }: UsersClientProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const { serverSettings } = useUser()
  const [usersList, setUsersList] = useState(users)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setUsersList(users)
  }, [users])

  const handleUserAdded = useCallback((user: User) => {
    setUsersList((prev) => upsertUser(prev, user))
  }, [])

  const handleUserUpdated = useCallback((user: User) => {
    setUsersList((prev) => upsertUser(prev, user))
  }, [])

  const handleUserRemoved = useCallback((user: User) => {
    setUsersList((prev) => prev.filter((u) => u.id !== user.id))
  }, [])

  useSocketEvent<User>('user_added', handleUserAdded, [handleUserAdded])
  useSocketEvent<User>('user_updated', handleUserUpdated, [handleUserUpdated])
  useSocketEvent<User>('user_removed', handleUserRemoved, [handleUserRemoved])

  const handleAddUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingUser(null)
  }, [])

  const handleSubmit = useCallback(
    (formData: UserFormData) => {
      if (editingUser) {
        if (editingUser.type === 'root' && !formData.isActive) return

        const account = buildAccountPayload(formData)
        if (!formData.password || editingUser.type === 'root') {
          delete account.password
        }

        startTransition(async () => {
          try {
            await updateUser(editingUser.id, account)
            showToast(t('ToastAccountUpdateSuccess'), { type: 'success' })
            handleCloseModal()
            router.refresh()
          } catch (error) {
            console.error('Failed to update account', error)
            const message = error instanceof ApiError && error.message ? error.message : t('ToastFailedToUpdate')
            showToast(message, { type: 'error' })
          }
        })
        return
      }

      const account = buildAccountPayload(formData)

      startTransition(async () => {
        try {
          await createUser(account)
          showToast(t('ToastNewUserCreatedSuccess'), { type: 'success' })
          handleCloseModal()
          router.refresh()
        } catch (error) {
          console.error('Failed to create account', error)
          const message = error instanceof ApiError && error.message ? error.message : t('ToastNewUserCreatedFailed', { 0: '' })
          showToast(message, { type: 'error' })
        }
      })
    },
    [editingUser, handleCloseModal, router, showToast, t]
  )

  const handleUnlinkOpenId = useCallback(() => {
    if (!editingUser) return

    startTransition(async () => {
      try {
        await unlinkUserOpenId(editingUser.id)
        showToast(t('ToastUnlinkOpenIdSuccess'), { type: 'success' })
        handleCloseModal()
        router.refresh()
      } catch (error) {
        console.error('Failed to unlink user from OpenID', error)
        showToast(t('ToastUnlinkOpenIdFailed'), { type: 'error' })
      }
    })
  }, [editingUser, handleCloseModal, router, showToast, t])

  return (
    <>
      <SettingsContent
        title={t('HeaderUsers')}
        moreInfoUrl="https://www.audiobookshelf.org/guides/users"
        addButton={{
          label: t('ButtonAddUser'),
          onClick: handleAddUser
        }}
        entityCount={usersList.length}
      >
        <UsersTable users={usersList} dateFormat={serverSettings.dateFormat} timeFormat={serverSettings.timeFormat} onEditUser={handleEditUser} />
      </SettingsContent>

      <UserAccountModal
        isOpen={isModalOpen}
        user={editingUser}
        processing={isPending}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onUnlinkOpenId={handleUnlinkOpenId}
      />
    </>
  )
}
