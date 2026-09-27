'use client'

import Marquee from '@/components/ui/Marquee'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'
import { memo } from 'react'

const TITLE_UNDERLINE_CLASS = 'link-underline group-hover:underline group-focus-visible:underline'

interface PlayerMarqueeTextProps {
  text: string
  href?: string
  onNavigate?: () => void
}

function PlayerMarqueeText({ text, href, onNavigate }: PlayerMarqueeTextProps) {
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()

  if (!href) {
    return <Marquee title={text}>{text}</Marquee>
  }

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
      <Marquee
        className="player-title-marquee w-full"
        segmentClassName={mergeClasses(
          'player-title text-foreground font-medium',
          TITLE_UNDERLINE_CLASS,
          isPlayerFullscreen ? 'text-xl' : 'text-sm leading-snug lg:text-lg'
        )}
      >
        {text}
      </Marquee>
    </Link>
  )
}

export default memo(PlayerMarqueeText)
