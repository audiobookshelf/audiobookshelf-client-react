import { MetadataProvider } from '@/contexts/MetadataContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { TasksProvider } from '@/contexts/TasksContext'
import { getAccessToken } from '@/lib/api'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const accesstoken = await getAccessToken()
  return (
    <SocketProvider accessToken={accesstoken}>
      <TasksProvider>
        <MetadataProvider>{children}</MetadataProvider>
      </TasksProvider>
    </SocketProvider>
  )
}
