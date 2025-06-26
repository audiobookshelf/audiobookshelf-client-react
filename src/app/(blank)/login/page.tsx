import { getServerStatus } from '@/lib/api'
import LoginForm from './LoginForm'
import ServerInitForm from './ServerInitForm'

export default async function LoginPage() {
  const status = await getServerStatus()

  return (
    <div className="min-h-[calc(100vh-var(--header-height))] flex items-center justify-center">
      {status.error && <div className="text-red-500 text-center text-sm mb-4">{status.error}</div>}
      {status.data?.isInit ? <LoginForm /> : <ServerInitForm />}
    </div>
  )
}
