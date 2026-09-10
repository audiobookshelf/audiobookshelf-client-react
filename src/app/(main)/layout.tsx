import { AppNavigationProvider } from '@/contexts/AppNavigationContext'
import { CardSizeProvider } from '@/contexts/CardSizeContext'
import { ChromecastProvider } from '@/contexts/ChromecastContext'
import { EreaderProvider } from '@/contexts/EreaderContext'
import { MediaProvider } from '@/contexts/MediaContext'
import { MetadataProvider } from '@/contexts/MetadataContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { TasksProvider } from '@/contexts/TasksContext'
import { UserProvider } from '@/contexts/UserContext'
import { getAccessToken, getCurrentUser, getData } from '@/lib/api'
import { getCoverSizes } from '@/lib/coverSizeSettings'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { userAgent } from 'next/server'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const accesstoken = await getAccessToken()
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  // Seeded here so the first server-rendered paint already uses the saved sizes
  const { width, mobileWidth, isMobile } = await getCoverSizes()
  // Only parsed on a first visit, before the client has reported its viewport
  const initialIsMobile = isMobile ?? userAgent({ headers: await headers() }).device.type === 'mobile'

  return (
    <SocketProvider accessToken={accesstoken}>
      <UserProvider initialUser={currentUser}>
        <CardSizeProvider initialCoverSize={width} initialMobileCoverSize={mobileWidth} initialIsMobile={initialIsMobile}>
          <ChromecastProvider>
            <TasksProvider>
              <MetadataProvider>
                <AppNavigationProvider>
                  <MediaProvider>
                    <EreaderProvider>{children}</EreaderProvider>
                  </MediaProvider>
                </AppNavigationProvider>
              </MetadataProvider>
            </TasksProvider>
          </ChromecastProvider>
        </CardSizeProvider>
      </UserProvider>
    </SocketProvider>
  )
}
