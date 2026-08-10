'use client'

import { removeLibraryItemsWithIssuesAction } from '@/app/actions/libraryActions'
import Btn from '@/components/ui/Btn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { isLibraryIssuesPage } from '@/hooks/useLibraryRouteGuard'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'

export default function RemoveAllIssuesButton() {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const { showToast } = useGlobalToast()
  const { userIsAdminOrUp } = useUser()
  const { isSelectionMode } = useBookshelfSelection()
  const { library, itemCount, refetchFilterDataSilently } = useLibrary()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isIssuesPage = isLibraryIssuesPage(pathname)

  const handleConfirm = useCallback(() => {
    startTransition(async () => {
      try {
        await removeLibraryItemsWithIssuesAction(library.id)
        showToast(t('ToastRemoveItemsWithIssuesSuccess'), { type: 'success' })
        setShowConfirmDialog(false)
        refetchFilterDataSilently()
        router.push(`/library/${library.id}/items`)
      } catch (error) {
        console.error('Failed to remove library items with issues', error)
        showToast(t('ToastRemoveItemsWithIssuesFailed'), { type: 'error' })
      }
    })
  }, [library.id, refetchFilterDataSilently, router, showToast, t])

  if (!isIssuesPage || !userIsAdminOrUp || isSelectionMode || !itemCount) {
    return null
  }

  const removeLabel =
    library.mediaType === 'podcast' ? t('ButtonRemoveIssuesPodcasts', { count: itemCount }) : t('ButtonRemoveIssuesBooks', { count: itemCount })

  return (
    <>
      <Btn
        color="bg-error"
        size="small"
        className="flex h-9 shrink-0 items-center px-3 text-xs whitespace-nowrap"
        loading={isPending}
        onClick={() => setShowConfirmDialog(true)}
      >
        {removeLabel}
      </Btn>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={
          <>
            {t('MessageConfirmRemoveItemsWithIssues')}
            <br />
            <br />
            {t('MessageConfirmRemoveItemsWithIssuesNote')}
          </>
        }
        yesButtonText={t('ButtonRemoveAll')}
        yesButtonClassName="bg-error text-white"
        processing={isPending}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirm}
      />
    </>
  )
}
