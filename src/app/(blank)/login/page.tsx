import { getServerStatus } from '@/lib/api'
import LoginForm from './LoginForm'
import ServerInitForm from './ServerInitForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  try {
    const status = await getServerStatus()
    const isServerInitialized = !!status?.isInit

    return (
      <div className="min-h-full flex items-center justify-center -mt-[var(--header-height)]">{isServerInitialized ? <LoginForm /> : <ServerInitForm />}</div>
    )
  } catch (error) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-red-500 text-center text-sm mb-4">{error instanceof Error ? error.message : 'Server error'}</div>
      </div>
    )
  }
}
