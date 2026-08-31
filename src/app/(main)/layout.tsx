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
import { getClientSettings } from '@/lib/clientSettings'
import { coverSizeToMultiplier } from '@/lib/coverSizes'
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
  const clientSettings = getClientSettings(currentUser.user.clientSettings)
  const { device } = userAgent({ headers: await headers() })

  return (
    <SocketProvider accessToken={accesstoken}>
      <UserProvider initialUser={currentUser}>
        <CardSizeProvider
          initialSizeMultiplier={coverSizeToMultiplier(clientSettings.bookshelfCoverSize, false)}
          initialMobileSizeMultiplier={coverSizeToMultiplier(clientSettings.bookshelfCoverSizeMobile, true)}
          initialIsMobile={device.type === 'mobile'}
        >
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
