import { SocketProvider } from '@/contexts/SocketContext'
import { getAccessToken } from '@/lib/api'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const accesstoken = await getAccessToken()
  return <SocketProvider accessToken={accesstoken}>{children}</SocketProvider>
}
