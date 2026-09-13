import { COOKIE_NAMES } from '@/lib/cookies'
import { parseCoverSize } from '@/lib/coverSizes'
import { cookies } from 'next/headers'

/** Get the saved cover size from cookies (server-side). Mobile always uses a fixed size */
export async function getCoverSize(): Promise<number | undefined> {
  const cookieStore = await cookies()
  return parseCoverSize(cookieStore.get(COOKIE_NAMES.coverSize)?.value)
}
