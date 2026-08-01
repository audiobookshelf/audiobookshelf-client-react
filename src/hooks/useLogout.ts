'use client'

import type { ServerLogoutResponse } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/** Calls /internal-api/logout, then redirects to the IdP end-session URL (OIDC) or /login. */
export function useLogout() {
  const router = useRouter()

  return useCallback(async () => {
    const res = await fetch('/internal-api/logout', { method: 'POST' })
    if (!res.ok) {
      throw new Error(`Logout failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as ServerLogoutResponse
    if (data.redirect_url) {
      window.location.href = data.redirect_url
    } else {
      router.replace('/login')
    }
  }, [router])
}
