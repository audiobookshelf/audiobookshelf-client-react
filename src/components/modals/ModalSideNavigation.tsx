'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

export type ModalSideNavigationProps = {
  canGoPrev: boolean
  canGoNext: boolean
  onPrevAction: () => void
  onNextAction: () => void
}

/**
 * Left/right chevrons outside the modal panel (Vue EditModal-style).
 */
export default function ModalSideNavigation({ canGoPrev, canGoNext, onPrevAction, onNextAction }: ModalSideNavigationProps) {
  const t = useTypeSafeTranslations()

  return (
    <>
      {canGoPrev ? (
        <div className="pointer-events-none absolute start-[-6rem] top-0 bottom-0 z-[1] flex h-full items-center px-6">
          <button
            type="button"
            className="material-symbols text-5xl text-white/50 hover:text-white/90 pointer-events-auto cursor-pointer"
            aria-label={t('ButtonPrevious')}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onPrevAction()
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            arrow_back_ios
          </button>
        </div>
      ) : null}
      {canGoNext ? (
        <div className="pointer-events-none absolute end-[-6rem] top-0 bottom-0 z-[1] flex h-full items-center px-6">
          <button
            type="button"
            className="material-symbols text-5xl text-white/50 hover:text-white/90 pointer-events-auto cursor-pointer"
            aria-label={t('ButtonNext')}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onNextAction()
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            arrow_forward_ios
          </button>
        </div>
      ) : null}
    </>
  )
}
