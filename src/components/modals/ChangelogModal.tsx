'use client'

import Modal from '@/components/modals/Modal'
import { useUser } from '@/contexts/UserContext'
import { formatJsDate } from '@/lib/datefns'
import type { ReleaseInfo, VersionData } from '@/lib/version'
import { marked } from 'marked'
import { useMemo } from 'react'

interface ChangelogModalProps {
  isOpen: boolean
  versionData: VersionData | null
  onClose: () => void
}

function getChangelogHtml(release: ReleaseInfo): string {
  return marked.parse(release.changelog || 'No Changelog Available', { gfm: true, breaks: true }) as string
}

export default function ChangelogModal({ isOpen, versionData, onClose }: ChangelogModalProps) {
  const { serverSettings } = useUser()
  const dateFormat = serverSettings.dateFormat

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <h1 className="text-foreground text-xl">Changelog</h1>
    </div>
  )

  const releaseSections = useMemo(() => {
    const releasesToShow = versionData?.releasesToShow ?? []
    return releasesToShow.map((release, index) => ({
      release,
      html: getChangelogHtml(release),
      showDivider: index < releasesToShow.length - 1
    }))
  }, [versionData?.releasesToShow])

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent}>
      <div className="max-h-[80vh] w-full overflow-x-hidden overflow-y-auto px-8 py-6">
        {releaseSections.length > 0 ? (
          releaseSections.map(({ release, html, showDivider }) => (
            <div key={release.name} className="min-w-0">
              <p className="pb-4 text-xl font-bold break-words">
                Changelog{' '}
                <a href={`https://github.com/advplyr/audiobookshelf/releases/tag/${release.name}`} target="_blank" rel="noopener noreferrer">
                  {release.name}
                </a>{' '}
                ({formatJsDate(release.pubdate, dateFormat)})
              </p>
              <div className="default-style changelog-content less-spacing" dangerouslySetInnerHTML={{ __html: html }} />
              {showDivider ? <div className="border-border my-8 border-b" /> : null}
            </div>
          ))
        ) : (
          <p className="text-foreground-muted py-8 text-center">No changelog available.</p>
        )}
      </div>
    </Modal>
  )
}
