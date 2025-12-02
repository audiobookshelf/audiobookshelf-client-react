'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string | ReactNode
  title?: string
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
  title,
  checkboxLabel,
  yesButtonText,
  yesButtonClassName = 'bg-success text-white',
  onClose,
  onConfirm,
  className
}: ConfirmDialogProps) {
  const t = useTypeSafeTranslations()
  const [checkboxValue, setCheckboxValue] = useState(false)
  const titleId = useId()
  const messageId = useId()
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  const handleConfirm = useCallback(() => {
    onConfirm(checkboxValue)
    setCheckboxValue(false)
  }, [checkboxValue, onConfirm])

  const handleClose = useCallback(() => {
    setCheckboxValue(false)
    onClose()
  }, [onClose])

  // Store the previously focused element when dialog opens and manage focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement
      // Focus the first focusable element (cancel button) when dialog opens
      // Using setTimeout to ensure the DOM is ready
      setTimeout(() => {
        const firstButton = dialogContentRef.current?.querySelector('button') as HTMLButtonElement
        if (firstButton) {
          firstButton.focus()
        } else {
          // Fallback: focus the dialog content itself
          dialogContentRef.current?.focus()
        }
      }, 0)
    } else {
      // Restore focus to the previously focused element when dialog closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
        previousActiveElementRef.current = null
      }
    }
  }, [isOpen])

  // Handle ESC key to close dialog
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose])

  // Default title if not provided
  const dialogTitle = title || 'Confirm'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-sm">
      <div ref={dialogContentRef} className={mergeClasses('px-4 text-sm py-6', className)} aria-labelledby={titleId} aria-describedby={messageId} tabIndex={-1}>
        <h2 id={titleId} className="sr-only">
          {dialogTitle}
        </h2>
        <p id={messageId} className="text-lg mb-6 mt-2 px-1">
          {message}
        </p>

        {checkboxLabel && (
          <div className="mb-6 px-1">
            <Checkbox label={checkboxLabel} value={checkboxValue} onChange={setCheckboxValue} />
          </div>
        )}

        <div className="flex px-1 items-center justify-end gap-2">
          <div className="grow" />
          <Btn color="bg-primary" onClick={handleClose} ariaLabel={t('ButtonCancel')} type="button">
            {t('ButtonCancel')}
          </Btn>
          <Btn color={yesButtonClassName} onClick={handleConfirm} ariaLabel={yesButtonText || t('ButtonYes')} type="button">
            {yesButtonText || t('ButtonYes')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
