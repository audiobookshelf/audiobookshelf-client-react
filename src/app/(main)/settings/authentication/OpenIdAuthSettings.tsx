'use client'

import Btn from '@/components/ui/Btn'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { MultiSelect, MultiSelectItem } from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { AuthenticationSettings, OpenIdIssuerConfig } from '@/types/api'
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { getOpenIdIssuerConfig } from './actions'
import { getMobileAppCallbackUrl, getWebCallbackUrl, normalizeIssuerUrl } from './authenticationUtils'

// classes put on <code> tags
const authSettingsCodeClass = 'bg-foreground/10 text-foreground rounded-md px-1 py-0.5 text-xs whitespace-nowrap'

interface OpenIdAuthSettingsProps {
  settings: AuthenticationSettings
  onChange: Dispatch<SetStateAction<AuthenticationSettings>>
  disabled?: boolean
  routerBasePath?: string
}

export default function OpenIdAuthSettings({ settings, onChange, disabled = false, routerBasePath = '' }: OpenIdAuthSettingsProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [signingAlgorithms, setSigningAlgorithms] = useState<string[]>([])
  const [isAutoPopulating, setIsAutoPopulating] = useState(false)

  const updateField = useCallback(
    <K extends keyof AuthenticationSettings>(key: K, value: AuthenticationSettings[K]) => {
      onChange((prev) => ({ ...prev, [key]: value }))
    },
    [onChange]
  )

  const subfolderOptions: DropdownItem[] = useMemo(() => {
    const options: DropdownItem[] = [{ text: 'None', value: '' }]
    if (routerBasePath) {
      options.push({ text: routerBasePath, value: routerBasePath })
    }
    return options
  }, [routerBasePath])

  const matchExistingOptions: DropdownItem[] = useMemo(
    () => [
      { text: 'Do not match', value: '' },
      { text: 'Match by email', value: 'email' },
      { text: 'Match by username', value: 'username' }
    ],
    []
  )

  const signingAlgorithmItems: DropdownItem[] = useMemo(
    () => signingAlgorithms.map((algorithm) => ({ text: algorithm, value: algorithm })),
    [signingAlgorithms]
  )

  const redirectUriItems: MultiSelectItem<string>[] = useMemo(
    () => (settings.authOpenIDMobileRedirectURIs ?? []).map((uri) => ({ value: uri, content: uri })),
    [settings.authOpenIDMobileRedirectURIs]
  )

  const webCallbackURL = getWebCallbackUrl(settings.authOpenIDSubfolderForRedirectURLs)
  const mobileAppCallbackURL = getMobileAppCallbackUrl(settings.authOpenIDSubfolderForRedirectURLs)

  const applyIssuerConfig = useCallback(
    (data: OpenIdIssuerConfig) => {
      if (data.id_token_signing_alg_values_supported?.length && Array.isArray(data.id_token_signing_alg_values_supported)) {
        const algorithms = data.id_token_signing_alg_values_supported
        setSigningAlgorithms(algorithms)
      } else {
        setSigningAlgorithms([])
      }

      onChange((prev) => {
        const next = { ...prev }
        if (data.issuer) next.authOpenIDIssuerURL = data.issuer
        if (data.authorization_endpoint) next.authOpenIDAuthorizationURL = data.authorization_endpoint
        if (data.token_endpoint) next.authOpenIDTokenURL = data.token_endpoint
        if (data.userinfo_endpoint) next.authOpenIDUserInfoURL = data.userinfo_endpoint
        if (data.end_session_endpoint) next.authOpenIDLogoutURL = data.end_session_endpoint
        if (data.jwks_uri) next.authOpenIDJwksURL = data.jwks_uri

        if (data.id_token_signing_alg_values_supported?.length) {
          const algorithms = data.id_token_signing_alg_values_supported
          if (!algorithms.includes(next.authOpenIDTokenSigningAlgorithm)) {
            next.authOpenIDTokenSigningAlgorithm = algorithms[0]
          }
        }

        return next
      })
    },
    [onChange]
  )

  const handleAutoPopulate = async () => {
    if (!settings.authOpenIDIssuerURL?.trim()) {
      showToast('Issuer URL required', { type: 'error' })
      return
    }

    const issuerUrl = normalizeIssuerUrl(settings.authOpenIDIssuerURL.trim())
    updateField('authOpenIDIssuerURL', issuerUrl)

    setIsAutoPopulating(true)
    try {
      const data = await getOpenIdIssuerConfig(issuerUrl)
      applyIssuerConfig(data)
    } catch (error) {
      console.error('Failed to receive openid configuration', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      showToast(message, { type: 'error' })
    } finally {
      setIsAutoPopulating(false)
    }
  }

  const richTags = useMemo(
    () => ({
      code: (chunks: React.ReactNode) => <code className={authSettingsCodeClass}>{chunks}</code>,
      b: (chunks: React.ReactNode) => <b>{chunks}</b>
    }),
    []
  )

  return (
    <div className="flex w-full flex-wrap pt-4">
      <div className="mb-2 flex w-full items-center">
        <div className="grow">
          <TextInput
            label="Issuer URL"
            value={settings.authOpenIDIssuerURL ?? ''}
            disabled={disabled}
            onChange={(value) => updateField('authOpenIDIssuerURL', value || null)}
          />
        </div>
        <div className="mx-1 mt-[1.375rem] w-36 shrink-0">
          <Btn
            type="button"
            className="inline-flex h-[2.375rem] w-full items-center justify-center text-sm"
            disabled={disabled || isAutoPopulating}
            loading={isAutoPopulating}
            onClick={handleAutoPopulate}
          >
            <span className="material-symbols text-base">auto_fix_high</span>
            <span className="pl-1 break-keep whitespace-nowrap">Auto-populate</span>
          </Btn>
        </div>
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label="Authorize URL"
          value={settings.authOpenIDAuthorizationURL ?? ''}
          disabled={disabled}
          onChange={(value) => updateField('authOpenIDAuthorizationURL', value || null)}
        />
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label="Token URL"
          value={settings.authOpenIDTokenURL ?? ''}
          disabled={disabled}
          onChange={(value) => updateField('authOpenIDTokenURL', value || null)}
        />
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label="Userinfo URL"
          value={settings.authOpenIDUserInfoURL ?? ''}
          disabled={disabled}
          onChange={(value) => updateField('authOpenIDUserInfoURL', value || null)}
        />
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label="JWKS URL"
          value={settings.authOpenIDJwksURL ?? ''}
          disabled={disabled}
          onChange={(value) => updateField('authOpenIDJwksURL', value || null)}
        />
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label="Logout URL"
          value={settings.authOpenIDLogoutURL ?? ''}
          disabled={disabled}
          onChange={(value) => updateField('authOpenIDLogoutURL', value || null)}
        />
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label="Client ID"
          value={settings.authOpenIDClientID ?? ''}
          disabled={disabled}
          onChange={(value) => updateField('authOpenIDClientID', value || null)}
        />
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label="Client Secret"
          type="password"
          value={settings.authOpenIDClientSecret ?? ''}
          disabled={disabled}
          autocomplete="current-password"
          onChange={(value) => updateField('authOpenIDClientSecret', value || null)}
        />
      </div>

      <div className="mb-2 w-full">
        {signingAlgorithms.length > 0 ? (
          <Dropdown
            label="Signing Algorithm"
            items={signingAlgorithmItems}
            value={settings.authOpenIDTokenSigningAlgorithm}
            disabled={disabled}
            onChange={(value) => updateField('authOpenIDTokenSigningAlgorithm', String(value))}
          />
        ) : (
          <TextInput
            label="Signing Algorithm"
            value={settings.authOpenIDTokenSigningAlgorithm ?? ''}
            disabled={disabled}
            onChange={(value) => updateField('authOpenIDTokenSigningAlgorithm', value)}
          />
        )}
      </div>

      <div className="mb-2 w-full">
        <MultiSelect
          label={t('LabelMobileRedirectURIs')}
          selectedItems={redirectUriItems}
          items={redirectUriItems}
          menuDisabled
          disabled={disabled}
          onItemAdded={(item) => {
            const uris = settings.authOpenIDMobileRedirectURIs ?? []
            if (!uris.includes(item.content)) {
              updateField('authOpenIDMobileRedirectURIs', [...uris, item.content])
            }
          }}
          onItemRemoved={(item) => {
            updateField(
              'authOpenIDMobileRedirectURIs',
              (settings.authOpenIDMobileRedirectURIs ?? []).filter((uri) => uri !== item.content)
            )
          }}
          onItemEdited={(item) => {
            updateField(
              'authOpenIDMobileRedirectURIs',
              (settings.authOpenIDMobileRedirectURIs ?? []).map((uri) => (uri === item.value ? item.content : uri))
            )
          }}
        />
        <p className="text-foreground-muted mb-2 text-sm sm:pl-4">{t.rich('LabelMobileRedirectURIsDescription', richTags)}</p>
      </div>

      <div className="mb-2 flex w-full flex-col pt-1 sm:flex-row sm:items-center">
        <div className="w-44 shrink-0">
          <Dropdown
            label={t('LabelWebRedirectURLsSubfolder')}
            size="small"
            items={subfolderOptions}
            value={settings.authOpenIDSubfolderForRedirectURLs ?? ''}
            disabled={disabled}
            onChange={(value) => updateField('authOpenIDSubfolderForRedirectURLs', String(value))}
          />
        </div>
        <div className="mt-2 sm:mt-5">
          <p className="text-foreground-muted text-sm sm:pl-4">{t('LabelWebRedirectURLsDescription')}</p>
          <p className="text-foreground-muted mb-2 text-sm sm:pl-4">
            <code className={authSettingsCodeClass}>{webCallbackURL}</code>
            <br />
            <code className={authSettingsCodeClass}>{mobileAppCallbackURL}</code>
          </p>
        </div>
      </div>

      <div className="mb-2 w-full">
        <TextInput
          label={t('LabelButtonText')}
          value={settings.authOpenIDButtonText ?? ''}
          disabled={disabled}
          onChange={(value) => updateField('authOpenIDButtonText', value)}
        />
      </div>

      <div className="mb-2 flex w-full flex-col pt-1 sm:flex-row sm:items-center">
        <div className="w-44 shrink-0">
          <Dropdown
            label={t('LabelMatchExistingUsersBy')}
            size="small"
            items={matchExistingOptions}
            value={settings.authOpenIDMatchExistingBy ?? ''}
            disabled={disabled}
            onChange={(value) => updateField('authOpenIDMatchExistingBy', value === '' ? null : String(value))}
          />
        </div>
        <p className="text-foreground-muted mt-2 text-sm sm:mt-5 sm:pl-4">{t('LabelMatchExistingUsersByDescription')}</p>
      </div>

      <div className="flex w-full items-center px-1 py-4">
        <ToggleSwitch
          value={settings.authOpenIDAutoLaunch}
          disabled={disabled}
          ariaLabelledBy="auto-launch-toggle"
          onChange={(value) => updateField('authOpenIDAutoLaunch', value)}
        />
        <p id="auto-launch-toggle" className="pl-4 whitespace-nowrap">
          {t('LabelAutoLaunch')}
        </p>
        <p className="text-foreground-muted pl-4 text-sm">{t.rich('LabelAutoLaunchDescription', richTags)}</p>
      </div>

      <div className="flex w-full items-center px-1 py-4">
        <ToggleSwitch
          value={settings.authOpenIDAutoRegister}
          disabled={disabled}
          ariaLabelledBy="auto-register-toggle"
          onChange={(value) => updateField('authOpenIDAutoRegister', value)}
        />
        <p id="auto-register-toggle" className="pl-4 whitespace-nowrap">
          {t('LabelAutoRegister')}
        </p>
        <p className="text-foreground-muted pl-4 text-sm">{t('LabelAutoRegisterDescription')}</p>
      </div>

      <p className="mb-4 px-1 pt-6">{t('LabelOpenIDClaims')}</p>

      <div className="mb-4 flex w-full flex-col sm:flex-row">
        <div className="w-44 min-w-44 shrink-0">
          <TextInput
            label="Group Claim"
            placeholder="groups"
            value={settings.authOpenIDGroupClaim ?? ''}
            disabled={disabled}
            onChange={(value) => updateField('authOpenIDGroupClaim', value || null)}
          />
        </div>
        <p className="text-foreground-muted pt-2 text-sm sm:pt-0 sm:pl-4">{t.rich('LabelOpenIDGroupClaimDescription', richTags)}</p>
      </div>

      <div className="mb-4 flex w-full flex-col sm:flex-row">
        <div className="w-44 min-w-44 shrink-0">
          <TextInput
            label="Advanced Permission Claim"
            placeholder="abspermissions"
            value={settings.authOpenIDAdvancedPermsClaim ?? ''}
            disabled={disabled}
            onChange={(value) => updateField('authOpenIDAdvancedPermsClaim', value || null)}
          />
        </div>
        <div className="text-foreground-muted pt-2 text-sm sm:pt-0 sm:pl-4">
          <p>{t.rich('LabelOpenIDAdvancedPermsClaimDescription', richTags)}</p>
          <pre className="text-pre-wrap mt-2">{settings.authOpenIDSamplePermissions}</pre>
        </div>
      </div>
    </div>
  )
}
