'use client'

import AccordionSection from '@/components/ui/AccordionSection'
import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import HeaderActionButton from '@/components/ui/HeaderActionButton'
import Table from '@/components/ui/Table'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { bytesPretty } from '@/lib/string'
import { AudioFile, AudioTrack, BookLibraryItem, User } from '@/types/api'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface AudioTracksAccordionProps {
  libraryItem: BookLibraryItem
  user: User
  keepOpen?: boolean
  expanded?: boolean
  className?: string
}

interface TrackWithAudioFile extends AudioTrack {
  audioFile?: AudioFile
}

interface AudioTracksTableRowProps {
  track: TrackWithAudioFile
  libraryItemId: string
  showFullPath: boolean
  user: User
  onShowMore: (audioFile: AudioFile) => void
}

function AudioTracksTableRow({ track, libraryItemId, showFullPath, user, onShowMore }: AudioTracksTableRowProps) {
  const t = useTypeSafeTranslations()

  const userCanDownload = user.permissions?.download || false
  const userCanDelete = user.permissions?.delete || false
  const userIsAdmin = user.type === 'admin' || user.type === 'root'

  const contextMenuItems = useMemo(() => {
    const items: { text: string; action: string }[] = []

    if (userCanDownload) {
      items.push({ text: t('LabelDownload'), action: 'download' })
    }
    if (userCanDelete) {
      items.push({ text: t('ButtonDelete'), action: 'delete' })
    }
    if (userIsAdmin) {
      items.push({ text: t('LabelMoreInfo'), action: 'more' })
    }

    return items
  }, [userCanDownload, userCanDelete, userIsAdmin, t])

  const handleContextMenuAction = useCallback(
    (params: { action: string }) => {
      const { action } = params
      if (action === 'download') {
        // Download file
        const url = `/api/items/${libraryItemId}/file/${track.audioFile?.ino}/download`
        window.open(url, '_blank')
      } else if (action === 'delete') {
        // TODO: Implement delete with confirmation
        console.log('Delete track:', track.audioFile?.ino)
      } else if (action === 'more' && track.audioFile) {
        onShowMore(track.audioFile)
      }
    },
    [libraryItemId, track.audioFile, onShowMore]
  )

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="text-center py-2 px-2">{track.index}</td>
      <td className="py-2 px-2 font-sans text-sm break-all">{showFullPath ? track.metadata.path : track.metadata.filename}</td>
      <td className="py-2 px-2 hidden lg:table-cell text-sm">{track.audioFile?.codec || ''}</td>
      <td className="py-2 px-2 hidden lg:table-cell text-sm">{track.audioFile?.bitRate ? bytesPretty(track.audioFile.bitRate, 0) : ''}</td>
      <td className="py-2 px-2 hidden md:table-cell text-sm">{bytesPretty(track.metadata.size)}</td>
      <td className="py-2 px-2 hidden sm:table-cell text-sm">{secondsToTimestamp(track.duration)}</td>
      {contextMenuItems.length > 0 && (
        <td className="text-center py-2">
          <ContextMenuDropdown items={contextMenuItems} menuWidth={110} onAction={handleContextMenuAction} />
        </td>
      )}
    </tr>
  )
}

export default function AudioTracksAccordion({ libraryItem, user, keepOpen = false, expanded: expandedProp = false, className }: AudioTracksAccordionProps) {
  const t = useTypeSafeTranslations()
  const [expanded, setExpanded] = useState(expandedProp)
  const [showFullPath, setShowFullPath] = useState(false)
  const [, setSelectedAudioFile] = useState<AudioFile | null>(null)

  const userIsAdmin = user.type === 'admin' || user.type === 'root'

  // Get tracks with their associated audio files
  const tracksWithAudioFile = useMemo<TrackWithAudioFile[]>(() => {
    const tracks = libraryItem.media.tracks || []
    const audioFiles = libraryItem.media.audioFiles || []

    return tracks.map((track) => ({
      ...track,
      audioFile: audioFiles.find((af) => af.metadata.path === track.metadata.path)
    }))
  }, [libraryItem.media.tracks, libraryItem.media.audioFiles])

  // Sync expanded state with props
  useEffect(() => {
    setExpanded(keepOpen || expandedProp)
  }, [keepOpen, expandedProp])

  // Load showFullPath from localStorage (admin only)
  useEffect(() => {
    if (userIsAdmin) {
      const saved = localStorage.getItem('showFullPath')
      setShowFullPath(saved === '1')
    }
  }, [userIsAdmin])

  const handleToggleFullPath = useCallback(() => {
    const newValue = !showFullPath
    setShowFullPath(newValue)
    localStorage.setItem('showFullPath', newValue ? '1' : '0')
  }, [showFullPath])

  const handleShowMore = useCallback((audioFile: AudioFile) => {
    setSelectedAudioFile(audioFile)
    // TODO: Show audio file data modal
    console.log('Show more info for:', audioFile)
  }, [])

  // Measure table width for responsive columns
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [tableWidth, setTableWidth] = useState<number | null>(null)
  const isExpanded = keepOpen || expanded

  useEffect(() => {
    if (!isExpanded || !tableContainerRef.current) {
      setTableWidth(null)
      return
    }

    const updateWidth = () => {
      const width = tableContainerRef.current?.getBoundingClientRect().width ?? null
      setTableWidth(width)
    }

    updateWidth()
    const resizeObserver = new ResizeObserver(updateWidth)
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [isExpanded])

  // Calculate which columns can fit
  const { showCodec, showBitrate } = useMemo(() => {
    if (tableWidth === null) {
      return { showCodec: true, showBitrate: true }
    }
    // lg breakpoint is 1024px, xl is 1280px
    return {
      showCodec: tableWidth >= 800,
      showBitrate: tableWidth >= 800 // Reduced from 1000 to match codec/lg breakpoint
    }
  }, [tableWidth])

  const tableHeaders = useMemo(
    () => [
      { label: '#', className: 'text-center w-10 px-2' },
      { label: t('LabelFilename'), className: 'text-start px-2' },
      ...(showCodec ? [{ label: t('LabelCodec'), className: 'text-start w-20 px-2 hidden lg:table-cell' }] : []),
      ...(showBitrate ? [{ label: t('LabelBitrate'), className: 'text-start w-20 px-2 hidden lg:table-cell' }] : []),
      { label: t('LabelSize'), className: 'text-start w-20 px-2 hidden md:table-cell' },
      { label: t('LabelDuration'), className: 'text-start w-20 px-2 hidden sm:table-cell' },
      { label: '', className: 'w-16' }
    ],
    [t, showCodec, showBitrate]
  )

  const headerActions = useMemo(() => {
    const fullPathBtn = userIsAdmin ? (
      <HeaderActionButton key="full-path" onClick={handleToggleFullPath} color={showFullPath ? 'bg-button-selected-bg' : ''}>
        {t('ButtonFullPath')}
      </HeaderActionButton>
    ) : null

    const manageTracksBtn = user.permissions?.update ? (
      <HeaderActionButton key="manage-tracks" to={`/library/${libraryItem.libraryId}/item/${libraryItem.id}/tracks`}>
        {t('ButtonManage')}
      </HeaderActionButton>
    ) : null

    return (
      <div className="flex items-center">
        {manageTracksBtn}
        {fullPathBtn}
      </div>
    )
  }, [userIsAdmin, showFullPath, handleToggleFullPath, t, user.permissions?.update, libraryItem.id, libraryItem.libraryId])

  if (tracksWithAudioFile.length === 0) {
    return null
  }

  return (
    <AccordionSection
      title={t('LabelStatsAudioTracks')}
      count={tracksWithAudioFile.length}
      expanded={expanded}
      onExpandedChange={setExpanded}
      keepOpen={keepOpen}
      headerActions={headerActions}
      className={className}
    >
      <Table headers={tableHeaders} containerRef={tableContainerRef} title={t('LabelStatsAudioTracks')}>
        {tracksWithAudioFile.map((track) => (
          <AudioTracksTableRow
            key={track.index}
            track={track}
            libraryItemId={libraryItem.id}
            showFullPath={showFullPath}
            user={user}
            onShowMore={handleShowMore}
          />
        ))}
      </Table>
    </AccordionSection>
  )
}
