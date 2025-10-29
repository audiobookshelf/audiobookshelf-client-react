'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { BookLibraryItem, Chapter, User } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

interface ChaptersTableProps {
  libraryItem: BookLibraryItem
  user: User
  keepOpen?: boolean
}

export default function ChaptersTable({ libraryItem, user, keepOpen = false }: ChaptersTableProps) {
  const t = useTypeSafeTranslations()
  const [expanded, setExpanded] = useState(false)

  const chapters = useMemo<Chapter[]>(() => libraryItem.media.chapters || [], [libraryItem.media.chapters])
  const userCanUpdate = useMemo(() => user.permissions?.update || false, [user.permissions])

  const handleClickBar = useCallback(() => {
    if (!keepOpen) {
      setExpanded((prev) => !prev)
    }
  }, [keepOpen])

  const handleKeyDownBar = useCallback(
    (e: React.KeyboardEvent) => {
      if (!keepOpen && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        setExpanded((prev) => !prev)
      }
    },
    [keepOpen]
  )

  const handleGoToTimestamp = useCallback((time: number) => {
    // TODO: Implement playback at timestamp
    // Original functionality:
    // - Check if media is currently streaming
    // - If streaming: emit play-item event with startTime
    // - If not streaming: show confirmation prompt, then emit play-item event with startTime
    console.log('Go to timestamp:', time)
  }, [])

  const handleKeyDownTimestamp = useCallback(
    (e: React.KeyboardEvent, time: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        handleGoToTimestamp(time)
      }
    },
    [handleGoToTimestamp]
  )

  const isExpanded = keepOpen || expanded

  const headerClasses = useMemo(() => mergeClasses('w-full bg-primary px-6 py-2 flex items-center', keepOpen ? '' : 'cursor-pointer'), [keepOpen])

  const iconClasses = useMemo(
    () =>
      mergeClasses(
        'cursor-pointer h-10 w-10 rounded-full hover:bg-black-400 flex justify-center items-center duration-500',
        expanded ? 'transform rotate-180' : ''
      ),
    [expanded]
  )

  return (
    <div className="w-full my-2">
      <div
        className={headerClasses}
        onClick={handleClickBar}
        onKeyDown={handleKeyDownBar}
        role={keepOpen ? undefined : 'button'}
        tabIndex={keepOpen ? undefined : 0}
        aria-expanded={keepOpen ? undefined : isExpanded}
        aria-controls={keepOpen ? undefined : 'chapters-table-content'}
      >
        <p className="pe-4">{t('HeaderChapters')}</p>
        <span className="bg-black-400 rounded-xl py-1 px-2 text-sm font-mono" aria-label={`${chapters.length} chapters`}>
          {chapters.length}
        </span>
        <div className="grow" />
        {userCanUpdate && (
          <Btn to={`/item/${libraryItem.id}/chapters`} color="bg-primary" size="small" className="me-2">
            {t('ButtonEditChapters')}
          </Btn>
        )}
        {!keepOpen && (
          <div className={iconClasses} aria-hidden="true">
            <span className="material-symbols text-4xl">&#xe313;</span>
          </div>
        )}
      </div>
      {isExpanded && (
        <div id="chapters-table-content" role="region" aria-label={t('HeaderChapters')}>
          <table className="text-sm tracksTable w-full">
            <caption className="sr-only">{t('HeaderChapters')}</caption>
            <thead>
              <tr>
                <th className="text-start w-16" scope="col">
                  <span className="px-4">Id</span>
                </th>
                <th className="text-start" scope="col">
                  {t('LabelTitle')}
                </th>
                <th className="text-center" scope="col">
                  {t('LabelStart')}
                </th>
                <th className="text-center" scope="col">
                  {t('LabelDuration')}
                </th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter) => (
                <tr key={chapter.id}>
                  <th className="text-start px-4" scope="row">
                    {chapter.id}
                  </th>
                  <td dir="auto">{chapter.title}</td>
                  <td
                    className="font-mono text-center hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGoToTimestamp(chapter.start)
                    }}
                    onKeyDown={(e) => handleKeyDownTimestamp(e, chapter.start)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Go to timestamp ${secondsToTimestamp(chapter.start)}`}
                  >
                    {secondsToTimestamp(chapter.start)}
                  </td>
                  <td className="font-mono text-center">{secondsToTimestamp(Math.max(0, chapter.end - chapter.start))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
