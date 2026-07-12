/** Audiobookshelf Chromecast receiver application ID (matches Vue client). */
export const CHROMECAST_RECEIVER_APP_ID = process.env.NEXT_PUBLIC_CHROMECAST_RECEIVER_APP_ID ?? 'FD1F76C5'

export const CHROMECAST_SCRIPT_URL = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'

export const CHROMECAST_CUSTOM_NAMESPACE = 'urn:x-cast:com.audiobookshelf.cast'

let remotePlayer: cast.framework.RemotePlayer | null = null
let remotePlayerController: cast.framework.RemotePlayerController | null = null
let castApiInitialized = false
let sessionStateHandler: ((sessionState: string) => void) | null = null

export function getCastRemotePlayerHandles(): { player: cast.framework.RemotePlayer; controller: cast.framework.RemotePlayerController } | null {
  if (!remotePlayer || !remotePlayerController) return null
  return { player: remotePlayer, controller: remotePlayerController }
}

/** Register session handler and initialize the Cast API once per page load. */
export function initializeCastApi(onSessionStateChanged: (sessionState: string) => void): boolean {
  sessionStateHandler = onSessionStateChanged

  if (castApiInitialized) return true

  const castFramework = window.cast?.framework
  if (typeof window === 'undefined' || !castFramework) return false

  const castContext = castFramework.CastContext.getInstance()
  castContext.setOptions({
    receiverApplicationId: CHROMECAST_RECEIVER_APP_ID,
    autoJoinPolicy: chrome.cast?.AutoJoinPolicy?.ORIGIN_SCOPED ?? null
  })

  castContext.addEventListener(castFramework.CastContextEventType.SESSION_STATE_CHANGED, (event) => {
    sessionStateHandler?.(event.sessionState)
  })

  remotePlayer = new castFramework.RemotePlayer()
  remotePlayerController = new castFramework.RemotePlayerController(remotePlayer)
  castApiInitialized = true
  return true
}

export function ensureCastSenderScript(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`script[src="${CHROMECAST_SCRIPT_URL}"]`)) return

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = CHROMECAST_SCRIPT_URL
  script.async = true
  document.head.appendChild(script)
}
