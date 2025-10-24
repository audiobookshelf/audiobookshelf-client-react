import { MetadataProvider } from '@/contexts/MetadataContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { getAccessToken } from '@/lib/api'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const accesstoken = await getAccessToken()
  return (
    <SocketProvider accessToken={accesstoken}>
      <MetadataProvider>{children}</MetadataProvider>
    </SocketProvider>
  )
}
