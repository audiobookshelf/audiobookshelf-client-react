import type { Metadata } from 'next'
import '@/assets/globals.css'
import { getLocale } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'

import { ToastProvider } from '../contexts/ToastContext'
import GlobalToastContainer from '../components/widgets/GlobalToastContainer'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale}>
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
