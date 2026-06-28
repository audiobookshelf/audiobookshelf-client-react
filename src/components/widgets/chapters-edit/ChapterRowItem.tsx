'use client'

import { CSSTransition } from 'react-transition-group'
import { useRef, type ComponentProps } from 'react'
import ChapterRow from './ChapterRow'

export default function ChapterRowItem({
  in: inProp,
  onExited,
  appear,
  enter,
  exit,
  ...chapterRowProps
}: ComponentProps<typeof ChapterRow> & {
  in?: boolean
  onExited?: () => void
  appear?: boolean
  enter?: boolean
  exit?: boolean
}) {
  const nodeRef = useRef<HTMLDivElement>(null)

  return (
    <CSSTransition
      nodeRef={nodeRef}
      timeout={{ enter: 300, exit: 250 }}
      classNames="chapter-row"
      in={inProp}
      onExited={onExited}
      appear={appear}
      enter={enter}
      exit={exit}
    >
      <div ref={nodeRef} className="chapter-row-anim">
        <div className="chapter-row-anim-inner">
          <ChapterRow {...chapterRowProps} />
        </div>
      </div>
    </CSSTransition>
  )
}
