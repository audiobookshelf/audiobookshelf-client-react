import { AppNavigationProvider } from '@/contexts/AppNavigationContext'
import { CardSizeProvider } from '@/contexts/CardSizeContext'
import { ChromecastProvider } from '@/contexts/ChromecastContext'
import { EreaderProvider } from '@/contexts/EreaderContext'
import { LibrariesProvider } from '@/contexts/LibrariesContext'
import { MediaProvider } from '@/contexts/MediaContext'
import { MetadataProvider } from '@/contexts/MetadataContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { TasksProvider } from '@/contexts/TasksContext'
import { UserProvider } from '@/contexts/UserContext'
import { getAccessToken, getCurrentUser, getData, getLibraries } from '@/lib/api'
import { getCoverSize } from '@/lib/coverSizeSettings'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { userAgent } from 'next/server'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const accesstoken = await getAccessToken()
  const [currentUser, librariesResponse] = await getData(getCurrentUser(), getLibraries())

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  // Seeded here so the first server-rendered paint already uses the saved size
  const width = await getCoverSize()
  // Best guess for the first paint, since the server cannot measure the viewport
  const initialIsMobile = userAgent({ headers: await headers() }).device.type === 'mobile'

  return (
    <SocketProvider accessToken={accesstoken}>
      <UserProvider initialUser={currentUser}>
        <CardSizeProvider initialCoverSize={width} initialIsMobile={initialIsMobile}>
          <ChromecastProvider>
            <TasksProvider>
              <MetadataProvider>
                <AppNavigationProvider>
                  <LibrariesProvider initialLibraries={librariesResponse.libraries}>
                    <MediaProvider>
                      <EreaderProvider>{children}</EreaderProvider>
                    </MediaProvider>
                  </LibrariesProvider>
                </AppNavigationProvider>
              </MetadataProvider>
            </TasksProvider>
          </ChromecastProvider>
        </CardSizeProvider>
      </UserProvider>
    </SocketProvider>
  )
}
