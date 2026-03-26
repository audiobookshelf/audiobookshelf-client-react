'use client'

import { closeRssFeed, openItemRssFeed } from '@/app/actions/rssFeedActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { RssFeed } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'

function sanitizeSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export interface RssFeedEntity {
  id: string
  name: string
  type: 'item' | 'collection' | 'series'
  feed: RssFeed | null
  hasEpisodesWithoutPubDate?: boolean
}

interface RssFeedOpenCloseModalProps {
  isOpen: boolean
  onClose: () => void
  entity: RssFeedEntity | null
  viewMode?: boolean
  onFeedChange?: (feed: RssFeed | null) => void
}

export default function RssFeedOpenCloseModal({ isOpen, onClose, entity, viewMode = false, onFeedChange }: RssFeedOpenCloseModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { userIsAdminOrUp } = useUser()
  const [newFeedSlug, setNewFeedSlug] = useState('')
  const [metadataDetails, setMetadataDetails] = useState({
    preventIndexing: true,
    ownerName: '',
    ownerEmail: ''
  })
  const [processing, setProcessing] = useState(false)
  const [currentFeed, setCurrentFeed] = useState<RssFeed | null>(null)

  const entityId = entity?.id ?? ''
  const entityName = entity?.name ?? ''
  const entityFeed = entity?.feed ?? null
  const hasEpisodesWithoutPubDate = entity?.hasEpisodesWithoutPubDate ?? false
  const isHttp = typeof window !== 'undefined' && window.location.origin.startsWith('http://')
  const demoFeedUrl = typeof window !== 'undefined' ? `${window.location.origin}/feed/${newFeedSlug || entityId}` : ''

  useEffect(() => {
    if (isOpen && entity) {
      setNewFeedSlug(entityId)
      setCurrentFeed(entityFeed)
    }
  }, [isOpen, entity, entityId, entityFeed])

  const handleOpenFeed = useCallback(async () => {
    if (!entityId || entity?.type !== 'item') return
    if (!newFeedSlug.trim()) {
      showToast(t('ToastSlugRequired'), { type: 'error' })
      return
    }
    const sanitized = sanitizeSlug(newFeedSlug)
    if (newFeedSlug !== sanitized) {
      setNewFeedSlug(sanitized)
      showToast(t('ToastSlugMustChange'), { type: 'warning' })
      return
    }
    setProcessing(true)
    try {
      const res = await openItemRssFeed(entityId, {
        serverAddress: window.location.origin,
        slug: sanitized,
        metadataDetails: {
          preventIndexing: metadataDetails.preventIndexing,
          ownerName: metadataDetails.ownerName || '',
          ownerEmail: metadataDetails.ownerEmail || ''
        }
      })
      setCurrentFeed(res.feed)
      onFeedChange?.(res.feed)
    } catch (error: unknown) {
      console.error('Failed to open RSS feed', error)
      const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : null
      showToast(msg || 'Failed to open RSS feed', { type: 'error' })
    } finally {
      setProcessing(false)
    }
  }, [entityId, entity?.type, newFeedSlug, metadataDetails, onFeedChange, showToast, t])

  const handleCloseFeed = useCallback(async () => {
    if (!currentFeed) return
    setProcessing(true)
    try {
      await closeRssFeed(currentFeed.id)
      showToast(t('ToastRSSFeedCloseSuccess'), { type: 'success' })
      setCurrentFeed(null)
      onFeedChange?.(null)
      onClose()
    } catch (error) {
      console.error('Failed to close RSS feed', error)
      showToast(t('ToastRSSFeedCloseFailed'), { type: 'error' })
    } finally {
      setProcessing(false)
    }
  }, [currentFeed, onClose, onFeedChange, showToast, t])

  if (!entity) return null

  const outerContent = (
    <div className="absolute top-0 start-0 p-4">
      <p className="text-xl font-semibold text-white truncate max-w-[calc(100vw-4rem)]" title={entityName}>
        {entityName}
      </p>
    </div>
  )

  const fullFeedUrl = typeof window !== 'undefined' && currentFeed ? `${window.location.origin}${currentFeed.feedUrl}` : ''
  const meta = currentFeed?.meta
  const hasOwnerName = meta && meta.ownerName != null && String(meta.ownerName).trim() !== ''
  const hasOwnerEmail = meta && meta.ownerEmail != null && String(meta.ownerEmail).trim() !== ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} processing={processing}>
      <div className="px-4 sm:px-6 py-6 text-sm">
        {currentFeed ? (
          <>
            <p className="text-lg font-semibold mb-4">{viewMode ? t('HeaderRSSDetails') : t('HeaderRSSFeedIsOpen')}</p>
            <TextInput value={fullFeedUrl} readOnly showCopy className="text-sm" />
            {meta && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <span className="text-foreground-subdued uppercase text-xs w-48 shrink-0">{t('LabelPreventIndexingShort')}</span>
                  <span className="text-foreground">{meta.preventIndexing ? 'Yes' : 'No'}</span>
                </div>
                {hasOwnerName && (
                  <div className="flex items-center">
                    <span className="text-foreground-subdued uppercase text-xs w-48 shrink-0">{t('LabelRSSFeedCustomOwnerName')}</span>
                    <span className="text-foreground">{meta.ownerName}</span>
                  </div>
                )}
                {hasOwnerEmail && (
                  <div className="flex items-center">
                    <span className="text-foreground-subdued uppercase text-xs w-48 shrink-0">{t('LabelRSSFeedCustomOwnerEmail')}</span>
                    <span className="text-foreground">{meta.ownerEmail}</span>
                  </div>
                )}
              </div>
            )}
            {viewMode && (
              <>
                {currentFeed.episodes && currentFeed.episodes.length > 0 ? (
                  <div className="mt-6 max-h-[300px] overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-table-header-bg sticky top-0">
                        <tr className="border-b border-border">
                          <th className="text-start text-xs font-semibold text-foreground-muted py-2 px-2">{t('LabelEpisodeTitle')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFeed.episodes.map((episode, index) => (
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
              </>
            )}
            {userIsAdminOrUp && !viewMode && (
              <div className="flex justify-end pt-4">
                <Btn color="bg-error" size="small" onClick={handleCloseFeed} disabled={processing}>
                  {t('ButtonCloseFeed')}
                </Btn>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-lg font-semibold mb-4">{t('HeaderOpenRSSFeed')}</p>
            <div className="space-y-2 mb-2">
              <label className="block text-foreground-subdued uppercase text-xs">{t('LabelRSSFeedSlug')}</label>
              <TextInput value={newFeedSlug} onChange={(value) => setNewFeedSlug(value)} className="text-sm" />
              <p className="text-xs text-foreground-muted">{t('MessageFeedURLWillBe', { 0: demoFeedUrl })}</p>
            </div>
            <div className="space-y-3 py-2">
              <Checkbox
                value={metadataDetails.preventIndexing}
                onChange={(checked) => setMetadataDetails((prev) => ({ ...prev, preventIndexing: checked }))}
                label={t('LabelPreventIndexing')}
              />
              <div>
                <label className="block text-foreground-subdued uppercase text-xs mb-1">{t('LabelRSSFeedCustomOwnerName')}</label>
                <TextInput
                  value={metadataDetails.ownerName}
                  onChange={(value) => setMetadataDetails((prev) => ({ ...prev, ownerName: value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-foreground-subdued uppercase text-xs mb-1">{t('LabelRSSFeedCustomOwnerEmail')}</label>
                <TextInput
                  value={metadataDetails.ownerEmail}
                  onChange={(value) => setMetadataDetails((prev) => ({ ...prev, ownerEmail: value }))}
                  className="text-sm"
                />
              </div>
            </div>
            {isHttp && <p className="text-warning text-xs pt-2">{t('NoteRSSFeedPodcastAppsHttps')}</p>}
            {hasEpisodesWithoutPubDate && <p className="text-warning text-xs pt-2">{t('NoteRSSFeedPodcastAppsPubDate')}</p>}
            {userIsAdminOrUp && (
              <div className="flex justify-end pt-6">
                <Btn color="bg-success" size="small" onClick={handleOpenFeed} disabled={processing}>
                  {t('ButtonOpenFeed')}
                </Btn>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
