'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useWrappingMarquee } from '@/hooks/useWrappingMarquee'
import { mergeClasses } from '@/lib/merge-classes'
import { MARQUEE_SEGMENT_CLASS, MARQUEE_SEGMENT_UNDERLINE_CLASS } from '@/lib/player/wrappingMarquee'
import Link from 'next/link'
import { memo } from 'react'

interface PlayerMarqueeTitleProps {
  href: string
  text: string
  onNavigate?: () => void
}

function PlayerMarqueeTitle({ href, text, onNavigate }: PlayerMarqueeTitleProps) {
  const marqueeRef = useWrappingMarquee(text)
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()

  return (
    <Link
      href={href}
      className={mergeClasses(
        'player-title-link group block min-w-0 no-underline',
        isPlayerFullscreen ? mergeClasses('w-full max-w-full self-stretch', isLandscapeCompact && 'col-span-full') : 'w-max max-w-full self-start'
      )}
      onClick={onNavigate}
      aria-label={text}
    >
      <div ref={marqueeRef} className="player-title-marquee relative w-full min-w-0 overflow-hidden">
        <span
          className={mergeClasses(
            'player-title text-foreground block w-max max-w-none font-medium whitespace-nowrap',
            isPlayerFullscreen ? 'mx-auto text-xl' : 'text-sm leading-[1.35] lg:text-lg'
          )}
        >
          <span className={`${MARQUEE_SEGMENT_CLASS} ${MARQUEE_SEGMENT_UNDERLINE_CLASS}`}>{text}</span>
        </span>
      </div>
    </Link>
  )
}

export default memo(PlayerMarqueeTitle)
