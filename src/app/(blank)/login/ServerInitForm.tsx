'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

export default function ServerInitForm() {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!username.trim()) {
        setError(t('ErrorServerInitUsernameRequired'))
        return
      }
      if (password !== confirmPassword) {
        setError(t('ToastUserPasswordMismatch'))
        return
      }
      if (!password) {
        if (!confirm(t('MessageConfirmCreateRootUserNoPassword'))) {
          return
        }
      }

      setError('')
      setLoading(true)
      try {
        const payload = {
          newRoot: {
            username,
            password
          }
        }
        const res = await fetch('/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data?.error || t('ErrorServerInitUnknown'))
          setLoading(false)
          return
        }
        router.replace('/')
      } catch {
        setError(t('ErrorNetwork'))
        setLoading(false)
      }
    },
    [username, password, confirmPassword, t, router]
  )

  return (
    <form onSubmit={handleSubmit} className="bg-bg border border-border rounded-lg shadow-lg p-10 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-foreground">{t('HeaderServerInit')}</h2>

      <div className="flex flex-col gap-4 mb-4">
        <TextInput label={t('LabelUsername')} value={username} onChange={setUsername} />
        <TextInput label={t('LabelPassword')} value={password} type="password" onChange={setPassword} />
        <TextInput label={t('LabelConfirmPassword')} value={confirmPassword} type="password" onChange={setConfirmPassword} />
      </div>
      {error && <div className="text-red-400 text-center text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <Btn type="submit" loading={loading}>
          {t('LabelSubmit')}
        </Btn>
      </div>
    </form>
  )
}
