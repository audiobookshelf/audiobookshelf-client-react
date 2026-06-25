'use client'

import Btn from '@/components/ui/Btn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useMemo, useState, useTransition } from 'react'

interface SettingsCachePurgeProps {
  purgeCache: () => Promise<void>
  purgeItemsCache: () => Promise<void>
}

export default function SettingsCachePurge({ purgeCache, purgeItemsCache }: SettingsCachePurgeProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [showPurgeAllDialog, setShowPurgeAllDialog] = useState(false)
  const [showPurgeItemsDialog, setShowPurgeItemsDialog] = useState(false)

  const richTags = useMemo(
    () => ({
      code: (chunks: React.ReactNode) => <code className="bg-foreground/10 text-foreground rounded-md px-1 py-0.5">{chunks}</code>,
      br: () => <br />
    }),
    []
  )

  const handlePurge = (action: () => Promise<void>, onClose: () => void) => {
    onClose()
    startTransition(async () => {
      try {
        await action()
        showToast(t('ToastCachePurgeSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to purge cache', error)
        showToast(t('ToastCachePurgeFailed'), { type: 'error' })
      }
    })
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-4xl items-center px-2 py-4 md:px-6">
        <div className="grow" />
        <Btn size="small" className="mr-2 text-xs md:text-sm" loading={isPending} disabled={isPending} onClick={() => setShowPurgeAllDialog(true)}>
          {t('ButtonPurgeAllCache')}
        </Btn>
        <Btn size="small" className="mr-2 text-xs md:text-sm" loading={isPending} disabled={isPending} onClick={() => setShowPurgeItemsDialog(true)}>
          {t('ButtonPurgeItemsCache')}
        </Btn>
      </div>

      <ConfirmDialog
        isOpen={showPurgeAllDialog}
        message={t.rich('MessageConfirmPurgeCache', richTags)}
        processing={isPending}
        onClose={() => setShowPurgeAllDialog(false)}
        onConfirm={() => handlePurge(purgeCache, () => setShowPurgeAllDialog(false))}
      />

      <ConfirmDialog
        isOpen={showPurgeItemsDialog}
        message={t.rich('MessageConfirmPurgeItemsCache', richTags)}
        processing={isPending}
        onClose={() => setShowPurgeItemsDialog(false)}
        onConfirm={() => handlePurge(purgeItemsCache, () => setShowPurgeItemsDialog(false))}
      />
    </>
  )
}
