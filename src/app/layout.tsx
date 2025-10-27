import '@/assets/globals.css'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import GlobalToastContainer from '../components/widgets/GlobalToastContainer'
import { ToastProvider } from '../contexts/ToastContext'
import { getTheme } from '../lib/theme'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const theme = await getTheme()

  return (
    <html lang={locale} className={`theme-${theme}`}>
      <body className="overflow-x-hidden">
        <NextIntlClientProvider>
          <ToastProvider>
            {children}
            <GlobalToastContainer />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
