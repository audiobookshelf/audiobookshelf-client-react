'use client'

import Marquee from '@/components/ui/Marquee'
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
  if (!href) {
    return <Marquee title={text}>{text}</Marquee>
  }

  return (
    <Link href={href} className="player-title-link group block w-full min-w-0 no-underline" onClick={onNavigate} aria-label={text}>
      <Marquee className="player-title-marquee w-full" segmentClassName={mergeClasses('player-title text-foreground font-medium', TITLE_UNDERLINE_CLASS)}>
        {text}
      </Marquee>
    </Link>
  )
}

export default memo(PlayerMarqueeText)
