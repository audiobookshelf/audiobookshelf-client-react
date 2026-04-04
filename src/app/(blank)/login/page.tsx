import { getServerStatus } from '@/lib/api'
import LoginForm from './LoginForm'
import ServerInitForm from './ServerInitForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  try {
    const status = await getServerStatus()
    const isServerInitialized = !!status?.isInit

    return (
      <div className="-mt-[var(--header-height)] flex min-h-full items-center justify-center">{isServerInitialized ? <LoginForm /> : <ServerInitForm />}</div>
    )
  } catch (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="mb-4 text-center text-sm text-red-500">{error instanceof Error ? error.message : 'Server error'}</div>
      </div>
    )
  }
}
