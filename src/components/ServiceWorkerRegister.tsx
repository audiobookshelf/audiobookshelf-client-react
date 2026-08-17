'use client'

import { useEffect } from 'react'

interface ServiceWorkerRegisterProps {
  /** Subfolder base path for the SW url + scope (empty for root deploys). */
  basePath: string
}

/**
 * Registers the app-shell service worker (public/sw.js) once on mount.
 *
 * Only runs in production: in dev the SW would fight Next's HMR and serve stale assets.
 * The url and scope are base-path aware so subfolder deploys (ROUTER_BASE_PATH) register the
 * SW under the correct scope rather than the origin root.
 */
export default function ServiceWorkerRegister({ basePath }: ServiceWorkerRegisterProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch((error) => {
        console.error('[SW] registration failed', error)
      })
    }

    // Defer until after load so registration never competes with the initial render.
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [basePath])

  return null
}
