import { completeOidcLogin, getClientBaseUrl, getServerStatus } from '@/lib/api'
import { AuthFormData } from '@/types/api'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'
import ServerInitForm from './ServerInitForm'

export const dynamic = 'force-dynamic'

interface LoginPageProps {
  searchParams: Promise<{ accessToken?: string; redirect?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  if (params.accessToken) {
    const redirectPath = await completeOidcLogin(params.accessToken, params.redirect ?? null)
    if (!redirectPath) {
      redirect('/login?error=Authorization%20failed&autoLaunch=0')
    }
    redirect(redirectPath)
  }

  try {
    const [status, serverUrl] = await Promise.all([getServerStatus(), getClientBaseUrl()])
    const isServerInitialized = !!status?.isInit

    const authMethods = status.authMethods ?? []
    const authFormData: AuthFormData = status.authFormData ?? {}

    return (
      <div className="-mt-[var(--header-height)] flex min-h-full items-center justify-center">
        {isServerInitialized ? (
          <LoginForm authMethods={authMethods} authFormData={authFormData} serverUrl={serverUrl} />
        ) : (
          <ServerInitForm configPath={status.ConfigPath ?? ''} metadataPath={status.MetadataPath ?? ''} />
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="mb-4 text-center text-sm text-red-500">{error instanceof Error ? error.message : 'Server error'}</div>
      </div>
    )
  }
}
