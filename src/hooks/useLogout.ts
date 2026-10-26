'use client'

import { withBasePath } from '@/lib/basePath'
import type { ServerLogoutResponse } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Calls /internal-api/logout, then redirects to the IdP end-session URL (OIDC) or /login.
 * Pass true to end every auth session for this user.
 */
export function useLogout() {
  const router = useRouter()

  return useCallback(async (allDevices = false) => {
    const path = allDevices ? '/internal-api/logout?allDevices=1' : '/internal-api/logout'
    const res = await fetch(withBasePath(path), { method: 'POST' })
    if (!res.ok) {
      throw new Error(`Logout failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as ServerLogoutResponse
    if (data.redirect_url) {
      window.location.href = withBasePath(data.redirect_url)
    } else {
      router.replace('/login')
    }
  }, [router])
}
