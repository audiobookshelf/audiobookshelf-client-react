import '@/assets/globals.css'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import GlobalToastContainer from '../components/widgets/GlobalToastContainer'
import { ToastProvider } from '../contexts/ToastContext'

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
