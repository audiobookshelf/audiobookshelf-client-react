'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import LanguageDropdown from '@/components/widgets/LanguageDropdown'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { withBasePath } from '@/lib/basePath'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

export default function ServerInitForm() {
  const t = useTypeSafeTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [username, setUsername] = useState('root')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguage] = useState(locale)
  const [showNoPasswordConfirm, setShowNoPasswordConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isLanguagePending, startLanguageTransition] = useTransition()

  useEffect(() => {
    setLanguage(locale)
  }, [locale])

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (newLanguage === language) return

      setLanguage(newLanguage)
      startLanguageTransition(async () => {
        try {
          const res = await fetch(withBasePath('/internal-api/set-language'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: newLanguage, scope: 'server' })
          })
          if (!res.ok) {
            console.error('Failed to set language:', res.status, res.statusText)
            setLanguage(locale)
            return
          }
          router.refresh()
        } catch (err) {
          console.error('Error setting language:', err)
          setLanguage(locale)
        }
      })
    },
    [language, locale, router]
  )

  const submitInit = useCallback(() => {
    setError('')
    startTransition(async () => {
      try {
        const payload = {
          newRoot: {
            username: username.trim(),
            password
          }
        }
        const res = await fetch(withBasePath('/init'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data?.error || t('ErrorServerInitUnknown'))
          return
        }
        // Navigate to login with a one-time redirect to library settings after first root login.
        // reload() would keep query params like ?error=Token+refresh+failed from a stale-session redirect before init.
        window.location.replace(withBasePath('/login?redirect=/settings/libraries'))
      } catch {
        setError(t('ErrorNetwork'))
      }
    })
  }, [username, password, t])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
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
        setShowNoPasswordConfirm(true)
        return
      }

      submitInit()
    },
    [username, password, confirmPassword, t, submitInit]
  )

  const handleConfirmNoPassword = useCallback(() => {
    setShowNoPasswordConfirm(false)
    submitInit()
  }, [submitInit])

  const formDisabled = isPending || isLanguagePending

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-bg border-border w-full max-w-lg rounded-lg border p-10 shadow-lg">
        <h2 className="text-foreground mb-6 text-center text-2xl font-bold">{t('HeaderServerInit')}</h2>

        <div className="mb-6">
          <LanguageDropdown value={language} label={t('LabelLanguageDefaultServer')} disabled={formDisabled} onChange={handleLanguageChange} />
        </div>

        <p className="text-foreground mb-2 text-center text-lg font-semibold">{t('HeaderCreateRootUser')}</p>
        <div className="mb-4 flex flex-col gap-4">
          <TextInput label={t('LabelUsername')} value={username} autocomplete="username" disabled={formDisabled} onChange={setUsername} trimWhitespace />
          <TextInput label={t('LabelPassword')} value={password} type="password" autocomplete="new-password" disabled={formDisabled} onChange={setPassword} />
          <TextInput
            label={t('LabelConfirmPassword')}
            value={confirmPassword}
            type="password"
            autocomplete="new-password"
            disabled={formDisabled}
            onChange={setConfirmPassword}
          />
        </div>

        {error && <div className="mb-4 text-center text-sm text-red-400">{error}</div>}
        <div className="flex justify-end">
          <Btn type="submit" loading={isPending} disabled={formDisabled}>
            {t('ButtonSubmit')}
          </Btn>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showNoPasswordConfirm}
        message={t('MessageConfirmCreateRootUserNoPassword')}
        yesButtonText={t('ButtonSubmit')}
        processing={isPending}
        onClose={() => setShowNoPasswordConfirm(false)}
        onConfirm={handleConfirmNoPassword}
      />
    </>
  )
}
