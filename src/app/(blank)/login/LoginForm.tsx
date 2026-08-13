'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getUserDefaultUrlPath } from '@/lib/userPermissions'
import { AuthFormData } from '@/types/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface LoginFormProps {
  authMethods: string[]
  authFormData: AuthFormData
  serverUrl: string
}

export default function LoginForm({ authMethods, authFormData, serverUrl }: LoginFormProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const showLocalLogin = authMethods.includes('local') || authMethods.length === 0
  const showOpenIdLogin = authMethods.includes('openid')

  const openIdButtonText = authFormData.authOpenIDButtonText || 'Login with OpenId'
  const loginCustomMessage = authFormData.authLoginCustomMessage || null

  const redirectParam = searchParams.get('redirect')
  const openIdAuthUri = useMemo(() => {
    const callbackUrl = new URL(`${serverUrl}/login`)
    if (redirectParam) {
      callbackUrl.searchParams.set('redirect', redirectParam)
    }
    return `${serverUrl}/auth/openid?callback=${encodeURIComponent(callbackUrl.href)}`
  }, [serverUrl, redirectParam])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(errorParam)
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.href)
    }

    if (!showOpenIdLogin) return

    const autoLaunchParam = searchParams.get('autoLaunch')
    const shouldAutoLaunch = (authFormData.authOpenIDAutoLaunch && autoLaunchParam !== '0') || autoLaunchParam === '1'
    if (shouldAutoLaunch) {
      window.location.href = openIdAuthUri
    }
  }, [searchParams, showOpenIdLogin, authFormData.authOpenIDAutoLaunch, openIdAuthUri])

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
        const redirect = searchParams.get('redirect')
        if (redirect) {
          router.replace(redirect)
        } else {
          router.replace(getUserDefaultUrlPath(userResponse?.userDefaultLibraryId ?? null))
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
    <div className="bg-bg border-border w-full max-w-md rounded-lg border p-4 shadow-lg">
      <h1 className="text-center text-2xl font-bold">{t('LabelLogin')}</h1>

      <div className="bg-border my-4 h-px w-full" />

      {loginCustomMessage ? <div className="default-style mb-4" dangerouslySetInnerHTML={{ __html: loginCustomMessage }} /> : null}

      {error ? <div className="mb-4 text-center text-sm text-red-400">{error}</div> : null}

      {showLocalLogin ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col gap-4">
            <TextInput label={t('LabelUsername')} value={username} autocomplete="username" onChange={setUsername} />
            <TextInput label={t('LabelPassword')} value={password} type="password" autocomplete="current-password" onChange={setPassword} />
          </div>
          <div className="flex justify-end">
            <Btn type="submit" loading={loading}>
              {t('ButtonSubmit')}
            </Btn>
          </div>
        </form>
      ) : null}

      {showLocalLogin && showOpenIdLogin ? <div className="bg-border my-4 h-px w-full" /> : null}

      {showOpenIdLogin ? (
        <div className="flex py-3">
          <a href={openIdAuthUri} className="bg-primary w-full rounded-md border border-gray-600 px-8 py-2 text-center leading-none text-white shadow-md">
            {openIdButtonText}
          </a>
        </div>
      ) : null}
    </div>
  )
}
