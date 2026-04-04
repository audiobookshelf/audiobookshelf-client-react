import Btn from '@/components/ui/Btn'
import { useTasks } from '@/contexts/TasksContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { useMemo, useTransition } from 'react'
import { requestScanLibrary } from '../../settings/libraries/actions'

interface LibraryEmptyStateProps {
  library: Library
  showScanButton: boolean
}

export default function LibraryEmptyState({ library, showScanButton }: LibraryEmptyStateProps) {
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
