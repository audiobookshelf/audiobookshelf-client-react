'use client'

import ChangelogModal from '@/components/modals/ChangelogModal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useVersionData } from '@/hooks/useVersionData'
import { mergeClasses } from '@/lib/merge-classes'
import { useState } from 'react'

interface VersionFooterProps {
  serverVersion: string
  installSource: string
  variant?: 'compact' | 'row'
}

export default function VersionFooter({ serverVersion, installSource, variant = 'compact' }: VersionFooterProps) {
  const t = useTypeSafeTranslations()
  const [showChangelogModal, setShowChangelogModal] = useState(false)
  const versionData = useVersionData(serverVersion)

  const hasUpdate = !!versionData?.hasUpdate
  const githubTagUrl = versionData?.githubTagUrl

  if (variant === 'row') {
    return (
      <>
        <div className="w-full">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-foreground-muted hover:text-foreground font-mono text-xs underline"
              onClick={() => setShowChangelogModal(true)}
            >
              v{serverVersion}
            </button>
            <p className="text-xxs text-foreground-subdued text-center italic">{installSource}</p>
          </div>
          {hasUpdate && githubTagUrl ? (
            <a href={githubTagUrl} target="_blank" rel="noopener noreferrer" className="text-warning link-underline text-xs">
              {t('LabelLatestVersionWithValue', { 0: versionData.latestVersion })}
            </a>
          ) : null}
        </div>

        <ChangelogModal isOpen={showChangelogModal} versionData={versionData} onClose={() => setShowChangelogModal(false)} />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        className={mergeClasses('text-foreground-muted hover:text-foreground mb-1 w-full text-center font-mono text-xs leading-3 underline')}
        onClick={() => setShowChangelogModal(true)}
      >
        v{serverVersion}
      </button>
      {hasUpdate && githubTagUrl ? (
        <a href={githubTagUrl} target="_blank" rel="noopener noreferrer" className="text-warning link-underline text-xxs block text-center leading-3">
          {t('ButtonUpdate')}
        </a>
      ) : (
        <p className="text-xxs text-foreground-subdued text-center leading-3 italic">{installSource}</p>
      )}

      <ChangelogModal isOpen={showChangelogModal} versionData={versionData} onClose={() => setShowChangelogModal(false)} />
    </>
  )
}
