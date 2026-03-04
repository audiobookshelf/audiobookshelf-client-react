import { MediaProvider } from '@/contexts/MediaContext'
import { MetadataProvider } from '@/contexts/MetadataContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { TasksProvider } from '@/contexts/TasksContext'
import { UserProvider } from '@/contexts/UserContext'
import { getAccessToken, getCurrentUser, getData } from '@/lib/api'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const accesstoken = await getAccessToken()
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  return (
    <SocketProvider accessToken={accesstoken}>
      <UserProvider initialUser={currentUser}>
        <TasksProvider>
          <MetadataProvider>
            <MediaProvider>{children}</MediaProvider>
          </MetadataProvider>
        </TasksProvider>
      </UserProvider>
    </SocketProvider>
  )
}
