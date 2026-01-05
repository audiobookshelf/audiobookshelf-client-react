'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

export default function LoginForm() {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setLoading(true)
      try {
        const res = await fetch('/internal-api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        if (!res.ok) {
          const data = await res.json()
          console.error('[LoginForm] Error:', res.statusText, data?.error)
          setError(data?.error || t('ErrorLoginFailed'))
          setLoading(false)
          return
        }
        const userResponse = await res.json()
        const userDefaultLibraryId = userResponse?.userDefaultLibraryId

        // Get redirect parameter
        const redirect = searchParams.get('redirect')
        if (redirect) {
          router.replace(redirect)
        } else if (userDefaultLibraryId) {
          router.replace(`/library/${userDefaultLibraryId}`)
        } else {
          router.replace('/settings')
        }
      } catch (error) {
        console.error('[LoginForm] Error:', error)
        setError(t('ErrorNetwork'))
        setLoading(false)
      }
    },
    [username, password, t, router, searchParams]
  )

  return (
    <form onSubmit={handleSubmit} className="bg-bg border border-border rounded-lg shadow-lg p-10 w-full max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-postcss">{t('LabelLogin')}</h1>

      <div className="flex flex-col gap-4 mb-4">
        <TextInput label={t('LabelUsername')} value={username} autocomplete="username" onChange={setUsername} />
        <TextInput label={t('LabelPassword')} value={password} type="password" autocomplete="current-password" onChange={setPassword} />
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
