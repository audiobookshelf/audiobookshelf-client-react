import '@/assets/globals.css'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import ServiceWorkerRegister from '../components/ServiceWorkerRegister'
import GlobalToastContainer from '../components/widgets/GlobalToastContainer'
import { ToastProvider } from '../contexts/ToastContext'
import { BASE_PATH_ATTRIBUTE, getBasePath } from '../lib/basePath'
import { getTheme } from '../lib/theme'

const basePath = getBasePath()

export const metadata: Metadata = {
  title: 'audiobookshelf', // i18n-ignore
  description: 'audiobookshelf',
  applicationName: 'Audiobookshelf',
  // NB: the manifest <link> is rendered manually below, not via `metadata.manifest`. Next forces
  // that field to the root-relative /manifest.webmanifest, which 404s under a subfolder deploy.
  appleWebApp: {
    capable: true,
    title: 'Audiobookshelf', // i18n-ignore
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

// Stylesheets cannot know the base path, so the one asset URL in CSS is overridden here.
const rootStyle = { '--bookshelf-texture-img': `url(${basePath}/images/wood_default.jpg)` } as React.CSSProperties

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const theme = await getTheme()

  return (
    <html lang={locale} className={`theme-${theme}`} style={rootStyle} {...{ [BASE_PATH_ATTRIBUTE]: basePath }}>
      <head>
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
      </head>
      <body className="overflow-hidden">
        <NextIntlClientProvider>
          <ToastProvider>
            {children}
            <GlobalToastContainer />
          </ToastProvider>
        </NextIntlClientProvider>
        <ServiceWorkerRegister basePath={basePath} />
      </body>
    </html>
  )
}
