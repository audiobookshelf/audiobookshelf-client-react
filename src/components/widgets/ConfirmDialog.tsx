'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useState } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  checkboxLabel?: string
  yesButtonText?: string
  yesButtonClassName?: string
  onClose: () => void
  onConfirm: (checkboxValue?: boolean) => void
  className?: string
}

/**
 * Reusable confirmation dialog component
 *
 * Used for confirming destructive or important actions.
 * Optionally includes a checkbox for "don't ask again" or similar functionality.
 */
export default function ConfirmDialog({
  isOpen,
  message,
  checkboxLabel,
  yesButtonText,
  yesButtonClassName = 'bg-success',
  onClose,
  onConfirm,
  className
}: ConfirmDialogProps) {
  const t = useTypeSafeTranslations()
  const [checkboxValue, setCheckboxValue] = useState(false)

  const handleConfirm = useCallback(() => {
    onConfirm(checkboxValue)
    setCheckboxValue(false)
  }, [checkboxValue, onConfirm])

  const handleClose = useCallback(() => {
    setCheckboxValue(false)
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-sm">
      <div className={mergeClasses('px-4 text-sm py-6', className)}>
        <p className="text-lg mb-6 mt-2 px-1">{message}</p>

        {checkboxLabel && (
          <div className="mb-6 px-1">
            <Checkbox label={checkboxLabel} value={checkboxValue} onChange={setCheckboxValue} />
          </div>
        )}

        <div className="flex px-1 items-center justify-end gap-2">
          <div className="grow" />
          <Btn color="bg-primary" onClick={handleClose}>
            {t('ButtonCancel')}
          </Btn>
          <Btn color={yesButtonClassName} onClick={handleConfirm}>
            {yesButtonText || t('ButtonYes')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
