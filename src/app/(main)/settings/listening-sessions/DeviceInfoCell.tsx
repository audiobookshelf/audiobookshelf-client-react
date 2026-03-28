'use client'

import Tooltip from '@/components/ui/Tooltip'
import { useTruncation } from '@/hooks/useTruncation'
import type { PlaybackSession } from '@/types/api'

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

function DeviceInfoTruncatingLine({ text, className }: { text: string; className: string }) {
  const { ref, isTruncated } = useTruncation(text, false)
  return (
    <Tooltip text={text} position="top" disabled={!isTruncated} className="block w-full">
      <p ref={ref} className={className}>
        {text}
      </p>
    </Tooltip>
  )
}

export default function DeviceInfoCell({ session }: { session: PlaybackSession }) {
  const parts = getDeviceInfoParts(session)
  if (!parts) return null

  const line2ClassName = parts.line1 ? 'text-xs text-foreground-muted truncate' : 'text-xs truncate'

  return (
    <div className="py-1 min-w-0">
      {parts.line1 ? <DeviceInfoTruncatingLine text={parts.line1} className="text-xs truncate" /> : null}
      {parts.line2 ? <DeviceInfoTruncatingLine text={parts.line2} className={line2ClassName} /> : null}
    </div>
  )
}
