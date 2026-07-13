import Btn from '@/components/ui/Btn'
import { useTasks } from '@/contexts/TasksContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { useMemo, useTransition } from 'react'
import { requestScanLibrary } from '../../settings/libraries/actions'

export type LibraryEmptyStateVariant = 'library-empty' | 'no-home-shelves'

interface LibraryEmptyStateProps {
  library: Library
  showScanButton: boolean
  variant?: LibraryEmptyStateVariant
}

export default function LibraryEmptyState({ library, showScanButton, variant = 'library-empty' }: LibraryEmptyStateProps) {
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()
  const { getTasksByLibraryId } = useTasks()

  const isLibraryTaskRunning = useMemo(() => {
    return getTasksByLibraryId(library.id).some((task) => task.action === 'library-scan' && !task.isFinished)
  }, [getTasksByLibraryId, library.id])

  const handleScanLibrary = () => {
    startTransition(async () => {
      try {
        await requestScanLibrary(library.id)
      } catch (error) {
        console.error('Failed to scan library', error)
      }
    })
  }

  if (variant === 'no-home-shelves') {
    const browseLabel = library.mediaType === 'podcast' ? t('LabelPodcasts') : t('LabelBooks')

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <p className="mb-2 max-w-lg text-center text-xl">{t('MessageNoHomeShelves')}</p>
        <Btn size="small" color="bg-success" to={`/library/${library.id}/items`}>
          {browseLabel}
        </Btn>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <p className="mb-2 text-xl">{t('MessageXLibraryIsEmpty', { 0: library.name })}</p>
      {showScanButton && (
        <div className="flex items-center justify-center gap-2">
          <Btn size="small" color="bg-success" onClick={handleScanLibrary} loading={isPending || isLibraryTaskRunning}>
            {t('ButtonScanLibrary')}
          </Btn>
        </div>
      )}
    </div>
  )
}
