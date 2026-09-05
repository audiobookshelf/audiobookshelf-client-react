'use client'

import { useWrappingMarquee } from '@/hooks/useWrappingMarquee'
import { MARQUEE_SEGMENT_CLASS } from '@/lib/player/wrappingMarquee'
import { memo } from 'react'

interface PlayerMarqueeTextProps {
  text: string
}

function PlayerMarqueeText({ text }: PlayerMarqueeTextProps) {
  const marqueeRef = useWrappingMarquee(text, { underline: false })

  return (
    <div ref={marqueeRef} className="relative min-w-0 overflow-hidden" title={text}>
      <span className="block w-max max-w-none whitespace-nowrap">
        <span className={MARQUEE_SEGMENT_CLASS}>{text}</span>
      </span>
    </div>
  )
}

export default memo(PlayerMarqueeText)
