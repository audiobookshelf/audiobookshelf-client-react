'use client'

import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import type { PlaybackSession } from '@/types/api'

/**
 * Line 1: Client name and version
 * Line 2: OS name, version and browser name OR mobile device and SDK version
 */
function getDeviceInfoParts(session: PlaybackSession): { line1: string; line2: string | null } | null {
  if (!session.deviceInfo) return null

  const d = session.deviceInfo
  const line1 = [d.clientName, d.clientVersion].filter(Boolean).join(' ').trim()

  const useMobileLine = Boolean(d.sdkVersion) || (Boolean(d.manufacturer && d.model) && !d.browserName)

  let line2: string | null = null
  if (useMobileLine) {
    const devicePart = [d.manufacturer, d.model].filter(Boolean).join(' ').trim()
    const sdkPart = d.sdkVersion?.trim()
    if (devicePart && sdkPart) line2 = `${devicePart} · ${sdkPart}`
    else line2 = devicePart || sdkPart || null
  } else {
    const osPart = [d.osName, d.osVersion].filter(Boolean).join(' ').trim()
    const browserPart = d.browserName?.trim() || ''
    if (osPart && browserPart) line2 = `${osPart} · ${browserPart}`
    else line2 = osPart || browserPart || null
  }

  if (!line1 && !line2) return null
  return { line1, line2 }
}

export default function DeviceInfoCell({ session }: { session: PlaybackSession }) {
  const parts = getDeviceInfoParts(session)
  if (!parts) return null

  return (
    <div className="py-1 min-w-0">
      {parts.line1 ? <TruncatingTooltipText text={parts.line1} className="text-xs" /> : null}
      {parts.line2 ? <TruncatingTooltipText text={parts.line2} className={parts.line1 ? 'text-xs text-foreground-muted' : 'text-xs'} /> : null}
    </div>
  )
}
