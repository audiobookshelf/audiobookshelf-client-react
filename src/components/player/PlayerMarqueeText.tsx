'use client'

import { useDomMarquee } from '@/hooks/useDomMarquee'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { mergeClasses } from '@/lib/merge-classes'
import { MARQUEE_LOOP_COPY_CLASS, MARQUEE_LOOP_GAP_CLASS, MARQUEE_LOOP_GAP_SPACES } from '@/lib/player/domWrappingMarquee'
import Link from 'next/link'
import { memo, useRef } from 'react'

const TITLE_UNDERLINE_CLASS = 'link-underline group-hover:underline group-focus-visible:underline'

interface PlayerMarqueePlainTrackProps {
  text: string
  title?: string
  containerClassName?: string
  segmentClassName?: string
  centerTrack?: boolean
}

function PlayerMarqueePlainTrack({ text, title, containerClassName, segmentClassName, centerTrack }: PlayerMarqueePlainTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLSpanElement>(null)
  const loopCopyRef = useRef<HTMLSpanElement>(null)

  useDomMarquee(containerRef, trackRef, segmentRef, loopCopyRef, [text])

  return (
    <div ref={containerRef} className={mergeClasses('relative min-w-0 overflow-hidden', containerClassName)} title={title}>
      <div ref={trackRef} className={mergeClasses('w-max max-w-none whitespace-nowrap will-change-transform', centerTrack && 'mx-auto')}>
        <span ref={segmentRef} className={mergeClasses('inline-block whitespace-nowrap', segmentClassName)}>
          {text}
        </span>
        <span className={`${MARQUEE_LOOP_GAP_CLASS} pointer-events-none hidden whitespace-pre`} aria-hidden>
          {'\u00A0'.repeat(MARQUEE_LOOP_GAP_SPACES)}
        </span>
        <span ref={loopCopyRef} className={mergeClasses(MARQUEE_LOOP_COPY_CLASS, 'hidden whitespace-nowrap', segmentClassName)} aria-hidden>
          {text}
        </span>
      </div>
    </div>
  )
}

interface PlayerMarqueeTextProps {
  text: string
  href?: string
  onNavigate?: () => void
}

function PlayerMarqueeText({ text, href, onNavigate }: PlayerMarqueeTextProps) {
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()

  if (!href) {
    return <PlayerMarqueePlainTrack text={text} title={text} />
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
      <PlayerMarqueePlainTrack
        text={text}
        containerClassName="player-title-marquee w-full"
        centerTrack={isPlayerFullscreen}
        segmentClassName={mergeClasses(
          'player-title text-foreground font-medium',
          TITLE_UNDERLINE_CLASS,
          isPlayerFullscreen ? 'text-xl' : 'text-sm leading-[1.35] lg:text-lg'
        )}
      />
    </Link>
  )
}

export default memo(PlayerMarqueeText)
