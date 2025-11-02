import TableRow from '@/components/ui/TableRow'
import { secondsToTimestamp } from '@/lib/datefns'
import { Chapter } from '@/types/api'
import { memo, useCallback, useMemo } from 'react'

interface ChapterTableRowProps {
  chapter: Chapter
  onGoToTimestamp: (time: number) => void
}

function ChapterTableRow({ chapter, onGoToTimestamp }: ChapterTableRowProps) {
  const startTimestamp = useMemo(() => secondsToTimestamp(chapter.start), [chapter.start])
  const durationTimestamp = useMemo(() => secondsToTimestamp(Math.max(0, chapter.end - chapter.start)), [chapter.end, chapter.start])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onGoToTimestamp(chapter.start)
    },
    [onGoToTimestamp, chapter.start]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        onGoToTimestamp(chapter.start)
      }
    },
    [onGoToTimestamp, chapter.start]
  )

  return (
    <TableRow>
      <td className="text-start px-2 py-1">
        <p className="px-4">{chapter.id}</p>
      </td>
      <td dir="auto" className="px-2 py-1">
        {chapter.title}
      </td>
      <td
        className="font-mono text-center hover:underline cursor-pointer px-2 py-1"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Go to timestamp ${startTimestamp}`}
      >
        {startTimestamp}
      </td>
      <td className="font-mono text-center px-2 py-1">{durationTimestamp}</td>
    </TableRow>
  )
}

export default memo(ChapterTableRow)
