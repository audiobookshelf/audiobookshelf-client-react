'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { ApiResponse } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface ChangePasswordClientProps {
  changePassword: (oldPassword: string, newPassword: string) => Promise<ApiResponse>
}

export default function ChangePasswordClient({ changePassword }: ChangePasswordClientProps) {
  const t = useTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      showToast(t('ToastUserPasswordMismatch'), { type: 'error' })
      return
    }

    if (newPassword === oldPassword) {
      showToast(t('ToastUserPasswordMustChange'), { type: 'error' })
      return
    }

    startTransition(async () => {
      try {
        const res = await changePassword(oldPassword, newPassword)
        if (res.error) {
          showToast(res.error, { type: 'error' })
        } else {
          router.push('/account')
          showToast(t('ToastUserPasswordChangeSuccess'), { type: 'success' })
        }
      } catch {
        console.error('Failed to change password')
        showToast(t('ToastUnknownError'), { type: 'error' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 mt-8">
      <TextInput label={t('LabelPassword')} value={oldPassword} type="password" onChange={setOldPassword} />
      <TextInput label={t('LabelNewPassword')} value={newPassword} type="password" onChange={setNewPassword} />
      <TextInput label={t('LabelConfirmPassword')} value={confirmPassword} type="password" onChange={setConfirmPassword} />
      <div className="flex justify-end">
        <Btn type="submit" loading={isPending} onClick={handleSubmit}>
          {t('LabelSubmit')}
        </Btn>
      </div>
    </div>
  )
}
