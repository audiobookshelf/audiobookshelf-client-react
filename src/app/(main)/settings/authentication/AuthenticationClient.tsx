'use client'

import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import SlateEditor from '@/components/ui/SlateEditor'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { AuthMethod, AuthenticationSettings } from '@/types/api'
import { FormEvent, useMemo, useState, useTransition } from 'react'
import SettingsContent from '../SettingsContent'
import SettingsMoreInfoIcon from '../SettingsMoreInfoIcon'
import { updateAuthenticationSettings } from './actions'

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={mergeClasses('border-border bg-primary/25 my-4 w-full rounded-xl border p-4', className)}>{children}</div>
}

function buildAuthMethods(enableLocalAuth: boolean, enableOpenIDAuth: boolean): AuthMethod[] {
  const methods: AuthMethod[] = []
  if (enableLocalAuth) methods.push(AuthMethod.LOCAL)
  if (enableOpenIDAuth) methods.push(AuthMethod.OPENID)
  return methods
}

function buildSavePayload(
  settings: AuthenticationSettings,
  options: {
    enableLocalAuth: boolean
    enableOpenIDAuth: boolean
    showCustomLoginMessage: boolean
    customLoginMessage: string
  }
): AuthenticationSettings {
  const authLoginCustomMessage = options.showCustomLoginMessage && options.customLoginMessage.trim() ? options.customLoginMessage : null

  return {
    ...settings,
    authLoginCustomMessage,
    authActiveAuthMethods: buildAuthMethods(options.enableLocalAuth, options.enableOpenIDAuth)
  }
}

interface AuthenticationClientProps {
  initialSettings: AuthenticationSettings
}

export default function AuthenticationClient({ initialSettings }: AuthenticationClientProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [savedSettings, setSavedSettings] = useState(initialSettings)
  const [authSettings, setAuthSettings] = useState(initialSettings)

  const [enableLocalAuth, setEnableLocalAuth] = useState(() => (savedSettings.authActiveAuthMethods || []).includes(AuthMethod.LOCAL))
  const [enableOpenIDAuth, setEnableOpenIDAuth] = useState(() => (savedSettings.authActiveAuthMethods || []).includes(AuthMethod.OPENID))
  const [showCustomLoginMessage, setShowCustomLoginMessage] = useState(() => !!savedSettings.authLoginCustomMessage)
  const [customLoginMessage, setCustomLoginMessage] = useState(() => savedSettings.authLoginCustomMessage || '')

  const savedPayload = useMemo(() => {
    const methods = savedSettings.authActiveAuthMethods || []
    return buildSavePayload(savedSettings, {
      enableLocalAuth: methods.includes(AuthMethod.LOCAL),
      enableOpenIDAuth: methods.includes(AuthMethod.OPENID),
      showCustomLoginMessage: !!savedSettings.authLoginCustomMessage,
      customLoginMessage: savedSettings.authLoginCustomMessage || ''
    })
  }, [savedSettings])

  const draftPayload = useMemo(
    () =>
      buildSavePayload(authSettings, {
        enableLocalAuth,
        enableOpenIDAuth,
        showCustomLoginMessage,
        customLoginMessage
      }),
    [authSettings, enableLocalAuth, enableOpenIDAuth, showCustomLoginMessage, customLoginMessage]
  )

  const hasUpdates = useMemo(() => {
    return JSON.stringify(draftPayload) !== JSON.stringify(savedPayload)
  }, [draftPayload, savedPayload])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPending || !hasUpdates) return

    if (!enableLocalAuth && !enableOpenIDAuth) {
      showToast('Must have at least one authentication method enabled', { type: 'error' })
      return
    }

    startTransition(async () => {
      try {
        const response = await updateAuthenticationSettings(draftPayload)
        setSavedSettings(draftPayload)
        setAuthSettings(draftPayload)
        if (response.updated) {
          showToast(t('ToastServerSettingsUpdateSuccess'), { type: 'success' })
        } else {
          showToast(t('MessageNoUpdatesWereNecessary'), { type: 'info' })
        }
      } catch (error) {
        console.error('Failed to update auth settings', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }

  return (
    <SettingsContent title={t('HeaderAuthentication')}>
      <form onSubmit={handleSubmit}>
        <SettingsCard>
          <Checkbox
            value={showCustomLoginMessage}
            onChange={setShowCustomLoginMessage}
            disabled={isPending}
            label={t('HeaderCustomMessageOnLogin')}
            labelClass="text-lg ps-3"
            className="px-0"
          />
          {showCustomLoginMessage && (
            <div className="w-full pt-4">
              <SlateEditor srcContent={customLoginMessage} onUpdate={setCustomLoginMessage} disabled={isPending} className="mt-0" />
            </div>
          )}
        </SettingsCard>

        <SettingsCard>
          <Checkbox
            value={enableLocalAuth}
            onChange={setEnableLocalAuth}
            disabled={isPending}
            label={t('HeaderPasswordAuthentication')}
            labelClass="text-lg ps-3"
            className="px-0"
          />
        </SettingsCard>

        <SettingsCard>
          <div className="flex items-center gap-1">
            <Checkbox
              value={enableOpenIDAuth}
              onChange={setEnableOpenIDAuth}
              disabled={isPending}
              label={t('HeaderOpenIDConnectAuthentication')}
              labelClass="text-lg ps-3"
              className="px-0"
            />
            <SettingsMoreInfoIcon moreInfoUrl="https://www.audiobookshelf.org/guides/oidc_authentication" />
          </div>
        </SettingsCard>

        <div className="flex w-full items-center justify-between p-4">
          {enableOpenIDAuth ? <p className="text-warning text-sm">{t('MessageAuthenticationOIDCChangesRestart')}</p> : <span />}
          <Btn type="submit" loading={isPending} disabled={!hasUpdates || isPending}>
            {t('ButtonSave')}
          </Btn>
        </div>
      </form>
    </SettingsContent>
  )
}
