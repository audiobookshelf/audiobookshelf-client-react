'use client'

import { batchQuickMatchLibraryItemsAction } from '@/app/actions/batchActions'
import Modal from '@/components/modals/Modal'
import ModalFooter from '@/components/modals/ModalFooter'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import Dropdown from '@/components/ui/Dropdown'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { useLibrary } from '@/contexts/LibraryContext'
import { useBookProviders, useMetadata } from '@/contexts/MetadataContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface BatchQuickMatchModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItemIds: string[]
  onSuccess?: () => void
}

export default function BatchQuickMatchModal({ isOpen, onClose, libraryItemIds, onSuccess }: BatchQuickMatchModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { library } = useLibrary()
  const { ensureProvidersLoaded } = useMetadata()
  const bookProviders = useBookProviders()
  const [isPending, startTransition] = useTransition()
  const [provider, setProvider] = useState(library.provider || 'google')
  const [overrideCover, setOverrideCover] = useState(true)
  const [overrideDetails, setOverrideDetails] = useState(true)

  const providerItems = useMemo(() => bookProviders.map((item) => ({ text: item.text, value: item.value })), [bookProviders])

  useEffect(() => {
    if (!isOpen) return
    void ensureProvidersLoaded()
    setProvider(library.provider || 'google')
    setOverrideCover(true)
    setOverrideDetails(true)
  }, [ensureProvidersLoaded, isOpen, library.provider])

  const handleSubmit = useCallback(() => {
    if (!libraryItemIds.length || isPending) return

    startTransition(async () => {
      try {
        await batchQuickMatchLibraryItemsAction(libraryItemIds, {
          provider,
          overrideCover,
          overrideDetails
        })
        showToast(t('ToastBatchQuickMatchStarted', { 0: libraryItemIds.length }), { type: 'info' })
        onSuccess?.()
        onClose()
      } catch (error) {
        console.error('Failed to batch quick match', error)
        showToast(t('ToastBatchQuickMatchFailed'), { type: 'error' })
      }
    })
  }, [isPending, libraryItemIds, onClose, onSuccess, overrideCover, overrideDetails, provider, showToast, t])

  const outerContent = <ModalOuterContent>{t('MessageBooksSelected', { count: libraryItemIds.length })}</ModalOuterContent>

  return (
    <Modal isOpen={isOpen} onClose={onClose} processing={isPending} outerContent={outerContent} className="max-w-lg sm:max-w-lg md:max-w-lg lg:max-w-lg">
      <div className="flex max-h-[80vh] flex-col">
        {isOpen && (
          <>
            <div className="overflow-y-auto px-4 py-4">
              <div className="flex items-center py-2">
                <p className="pe-4">{t('LabelProvider')}</p>
                <Dropdown
                  items={providerItems}
                  value={provider}
                  onChange={(value) => setProvider(String(value))}
                  size="small"
                  disabled={isPending || providerItems.length === 0}
                />
              </div>

              <p className="px-1 py-2 text-base">{t('MessageBatchQuickMatchDescription')}</p>

              <div className="flex items-center gap-4 px-1 py-2">
                <ToggleSwitch value={overrideCover} onChange={setOverrideCover} disabled={isPending} className="h-auto px-0" />
                <p>
                  {t('LabelUpdateCover')}
                  {'\u00A0'}
                  <HelpTooltipIcon text={t('LabelUpdateCoverHelp')} />
                </p>
              </div>

              <div className="flex items-center gap-4 px-1 py-2">
                <ToggleSwitch value={overrideDetails} onChange={setOverrideDetails} disabled={isPending} className="h-auto px-0" />
                <p>
                  {t('LabelUpdateDetails')}
                  {'\u00A0'}
                  <HelpTooltipIcon text={t('LabelUpdateDetailsHelp')} />
                </p>
              </div>
            </div>

            <ModalFooter
              secondary={{ label: t('ButtonCancel'), onClick: onClose, disabled: isPending, type: 'button' }}
              primary={{
                label: t('ButtonSubmit'),
                onClick: handleSubmit,
                loading: isPending,
                disabled: !libraryItemIds.length
              }}
            />
          </>
        )}
      </div>
    </Modal>
  )
}
