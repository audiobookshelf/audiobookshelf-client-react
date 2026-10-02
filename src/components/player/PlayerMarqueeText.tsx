'use client'

import Marquee from '@/components/ui/Marquee'
import Link from 'next/link'
import { memo } from 'react'

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
    <Marquee className="player-title-marquee w-full" segmentClassName="player-title text-foreground font-medium" title={text}>
      <Link href={href} className="player-title-link link-underline" onClick={onNavigate}>
        {text}
      </Link>
    </Marquee>
  )
}

export default memo(PlayerMarqueeText)
