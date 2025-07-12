import { getServerStatus } from '@/lib/api'
import LoginForm from './LoginForm'
import ServerInitForm from './ServerInitForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const status = await getServerStatus()
  const isServerInitialized = !!status.data?.isInit

  if (status.error) {
    return (
      <div className="min-h-[calc(100vh-var(--header-height))] flex items-center justify-center">
        <div className="text-red-500 text-center text-sm mb-4">{status.error}</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-[calc(100vh-var(--header-height))] flex items-center justify-center">{isServerInitialized ? <LoginForm /> : <ServerInitForm />}</div>
  )
}
