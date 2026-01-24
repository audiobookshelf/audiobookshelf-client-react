'use client'

import Modal from '@/components/modals/Modal'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { RssFeed } from '@/types/api'
import { useEffect, useState } from 'react'

interface RssFeedModalProps {
  isOpen: boolean
  onClose: () => void
  rssFeed: RssFeed | null
}

export default function RssFeedModal({ isOpen, onClose, rssFeed }: RssFeedModalProps) {
  const t = useTypeSafeTranslations()
  const [fullFeedUrl, setFullFeedUrl] = useState('')

  useEffect(() => {
    if (isOpen && rssFeed) {
      // Construct the full feed URL from current browser origin + feedUrl
      const origin = window.location.origin
      setFullFeedUrl(`${origin}${rssFeed.feedUrl}`)
    }
  }, [isOpen, rssFeed])

  if (!rssFeed) return null

  const { meta, episodes } = rssFeed
  const hasOwnerName = meta.ownerName && meta.ownerName.trim() !== ''
  const hasOwnerEmail = meta.ownerEmail && meta.ownerEmail.trim() !== ''

  const outerContentTitle = (
    <div className="absolute top-0 start-0 p-4">
      <h2 className="text-xl text-foreground">{t('HeaderRSSFeedGeneral')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle}>
      <div className="px-4 sm:px-6 py-8">
        {/* RSS Feed URL */}
        <TextInput value={fullFeedUrl} readOnly showCopy className="text-sm" />

        {/* Details */}
        <div className="mt-6 space-y-2">
          <div className="flex">
            <span className="text-sm text-foreground-subdued uppercase w-48 shrink-0">{t('LabelRSSFeedPreventIndexing')}</span>
            <span className="text-sm text-foreground">{meta.preventIndexing ? 'Yes' : 'No'}</span>
          </div>

          {hasOwnerName && (
            <div className="flex items-center">
              <span className="text-sm text-foreground-subdued uppercase w-48 shrink-0">{t('LabelRSSFeedCustomOwnerName')}</span>
              <span className="text-sm text-foreground">{meta.ownerName}</span>
            </div>
          )}

          {hasOwnerEmail && (
            <div className="flex items-center">
              <span className="text-sm text-foreground-subdued uppercase w-48 shrink-0">{t('LabelRSSFeedCustomOwnerEmail')}</span>
              <span className="text-sm text-foreground">{meta.ownerEmail}</span>
            </div>
          )}
        </div>

        {/* Episodes Table */}
        {episodes && episodes.length > 0 ? (
          <div className="mt-6 max-h-[300px] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-table-header-bg sticky top-0">
                <tr className="border-b border-border">
                  <th className="text-start text-xs font-semibold text-foreground-muted py-2 px-2">{t('LabelEpisodeTitle')}</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((episode, index) => (
                  <tr key={episode.id} className={`border-b border-border last:border-b-0 ${index % 2 === 1 ? 'bg-table-row-bg-even' : ''}`}>
                    <td className="py-2 px-2 text-sm text-foreground">{episode.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 text-sm text-foreground-muted">{t('MessageNoEpisodes')}</div>
        )}
      </div>
    </Modal>
  )
}
