'use client'

import { useWrappingMarquee } from '@/hooks/useWrappingMarquee'
import { MARQUEE_SEGMENT_CLASS } from '@/lib/player/wrappingMarquee'
import Link from 'next/link'
import { memo } from 'react'

interface PlayerMarqueeTitleProps {
  href: string
  text: string
  onNavigate?: () => void
}

function PlayerMarqueeTitle({ href, text, onNavigate }: PlayerMarqueeTitleProps) {
  const marqueeRef = useWrappingMarquee(text)

  return (
    <Link href={href} className="player-title-link block min-w-0" onClick={onNavigate} aria-label={text}>
      <div ref={marqueeRef} className="player-title-marquee relative min-w-0 overflow-hidden">
        <span className="player-title text-foreground block w-max max-w-none font-medium whitespace-nowrap">
          <span className={`${MARQUEE_SEGMENT_CLASS} link-underline`}>{text}</span>
        </span>
      </div>
    </Link>
  )
}

export default memo(PlayerMarqueeTitle)
