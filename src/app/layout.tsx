import '@/assets/globals.css'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import ServiceWorkerRegister from '../components/ServiceWorkerRegister'
import GlobalToastContainer from '../components/widgets/GlobalToastContainer'
import { CardSizeProvider } from '../contexts/CardSizeContext'
import { ToastProvider } from '../contexts/ToastContext'
import { getTheme } from '../lib/theme'

/** Base path for subfolder deploys (empty for root). */
const basePath = process.env.ROUTER_BASE_PATH ?? ''

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf',
  applicationName: 'audiobookshelf',
  // NB: the manifest <link> is rendered manually below, not via `metadata.manifest`. Next forces
  // that field to the root-relative /manifest.webmanifest, which 404s under a subfolder deploy.
  appleWebApp: {
    capable: true,
    title: 'audiobookshelf',
    statusBarStyle: 'black'
  },
  // iOS < 16.4 still needs legacy `apple-mobile-web-app-capable` to launch standalone from the home screen.
  other: {
    'apple-mobile-web-app-capable': 'yes'
  },
  icons: {
    // Dedicated iOS icon (iOS ignores transparency — the circular icon192 would
    // render as a circle floating on black). iOS applies its own rounded-corner mask.
    apple: `${basePath}/images/ios_icon.png`
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#232323'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const theme = await getTheme()

  return (
    <html lang={locale} className={`theme-${theme}`}>
      <head>
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
      </head>
      <body className="overflow-hidden">
        <NextIntlClientProvider>
          <ToastProvider>
            <CardSizeProvider>
              {children}
              <GlobalToastContainer />
            </CardSizeProvider>
          </ToastProvider>
        </NextIntlClientProvider>
        <ServiceWorkerRegister basePath={basePath} />
      </body>
    </html>
  )
}
