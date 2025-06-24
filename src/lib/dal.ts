import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const session = cookieStore.get('connect.sid')

  if (!session) {
    redirect('/login')
  }

  return session
})
