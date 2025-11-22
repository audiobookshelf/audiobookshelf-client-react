'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function LoginForm() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Invalid username or password.')
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
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg border border-border rounded-lg shadow-lg p-10 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-postcss">{t('LabelLogin')}</h2>

      <div className="flex flex-col gap-4 mb-4">
        <TextInput label={t('LabelUsername')} value={username} onChange={(e) => setUsername(e)} />
        <TextInput label={t('LabelPassword')} value={password} type="password" onChange={(e) => setPassword(e)} />
      </div>
      {error && <div className="text-red-400 text-center text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <Btn type="submit" disabled={loading}>
          {loading ? 'Logging in...' : t('LabelSubmit')}
        </Btn>
      </div>
    </form>
  )
}
