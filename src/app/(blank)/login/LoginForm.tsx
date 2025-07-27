'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function LoginForm() {
  const t = useTranslations()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

      // Get redirect parameter from URL search params
      const urlParams = new URLSearchParams(window.location.search)
      const redirect = urlParams.get('redirect')
      if (redirect) {
        router.replace(redirect)
      } else if (userDefaultLibraryId) {
        router.replace(`/library/${userDefaultLibraryId}`)
      } else {
        router.replace('/settings')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg border border-gray-600 rounded-lg shadow-lg p-10 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-postcss">{t('LabelLogin')}</h2>

      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="username" className="text-gray-300 text-sm font-semibold">
          {t('LabelUsername')}
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className="bg-primary border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="password" className="text-gray-300 text-sm font-semibold">
          {t('LabelPassword')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="bg-primary border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <div className="text-red-400 text-center text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary border border-gray-600 rounded px-8 py-2 text-white font-semibold hover:bg-gray-700 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : t('LabelSubmit')}
        </button>
      </div>
    </form>
  )
}
