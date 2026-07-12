import type { ConfirmState } from '@/components/widgets/ConfirmDialog'
import type { TypeSafeTranslations } from '@/types/translations'
import type { ReactNode } from 'react'

type SetConfirmState = (state: ConfirmState | null) => void

function saveSoftDeleteDefault(hardDelete: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('softDeleteDefault', hardDelete ? '0' : '1')
  } catch {
    // ignore
  }
}

interface HardDeleteConfirmOptions {
  message: ReactNode
  t: TypeSafeTranslations
  setConfirmState: SetConfirmState
  onDelete: (hardDelete: boolean) => void
}

export function openHardDeleteConfirm({ message, t, setConfirmState, onDelete }: HardDeleteConfirmOptions) {
  setConfirmState({
    isOpen: true,
    message,
    checkboxLabel: t('LabelDeleteFromFileSystemCheckbox'),
    yesButtonText: t('ButtonDelete'),
    yesButtonClassName: 'bg-error',
    onConfirm: (hardDeleteChecked?: boolean) => {
      setConfirmState(null)
      const hardDelete = !!hardDeleteChecked
      saveSoftDeleteDefault(hardDelete)
      onDelete(hardDelete)
    }
  })
}

interface SimpleConfirmOptions {
  message: ReactNode
  yesButtonText: string
  yesButtonClassName?: string
  setConfirmState: SetConfirmState
  onConfirm: () => void
}

export function openSimpleConfirm({ message, yesButtonText, yesButtonClassName, setConfirmState, onConfirm }: SimpleConfirmOptions) {
  setConfirmState({
    isOpen: true,
    message,
    yesButtonText,
    yesButtonClassName,
    onConfirm: () => {
      setConfirmState(null)
      onConfirm()
    }
  })
}
