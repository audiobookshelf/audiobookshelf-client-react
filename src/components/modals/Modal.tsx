'use client'

import LoadingIndicator from '@/components/ui/LoadingIndicator'
import { ModalProvider } from '@/contexts/ModalContext'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React, { ReactNode, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  isOpen: boolean
  processing?: boolean
  persistent?: boolean
  zIndexClass?: string
  bgOpacityClass?: string
  children?: ReactNode
  outerContent?: ReactNode
  onClose?: () => void
  className?: string
  style?: React.CSSProperties
}

export default function Modal({
  isOpen,
  processing = false,
  persistent = false,
  zIndexClass = 'z-70',
  bgOpacityClass = 'bg-primary/75',
  children,
  outerContent,
  onClose,
  className,
  style
}: ModalProps) {
  const t = useTypeSafeTranslations()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const clickClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const handleClickOutside = useCallback(() => {
    if (!isOpen || processing || persistent) return
    onClose?.()
  }, [isOpen, processing, persistent, onClose])

  // Use click outside hook
  useClickOutside(contentRef, null, handleClickOutside)

  if (!isOpen) {
    return null
  }

  const modalContent = (
    <div
      ref={wrapperRef}
      role="dialog"
      aria-modal="true"
      className={mergeClasses(
        'modal modal-bg w-full h-full fixed top-0 start-0 items-center justify-center flex overflow-x-hidden',
        zIndexClass,
        bgOpacityClass
      )}
      cy-id="modal-wrapper"
    >
      {/* Background gradient */}
      <div className="absolute inset-x-0 top-0 w-full h-36 bg-gradient-to-t from-transparent via-gray-900/50 to-gray-800/70 opacity-90 pointer-events-none" />

      {/* Close button */}
      <button
        className="absolute top-2 end-2 sm:top-4 sm:end-4 inline-flex text-foreground-muted hover:text-foreground z-10 transition-colors"
        aria-label={t('ButtonCloseModal')}
        onClick={clickClose}
        cy-id="modal-close-button"
      >
        <span className="material-symbols text-xl sm:text-2xl">close</span>
      </button>

      {/* Outer content slot */}
      {outerContent}

      {/* Main modal content */}
      <div
        ref={contentRef}
        tabIndex={0}
        style={style}
        className={mergeClasses(
          'relative text-foreground outline-none focus:outline-none shadow-modal-content rounded-lg bg-bg',
          // Responsive width: full width with margin on mobile, fixed width on larger screens
          'w-[calc(100vw-1rem)] max-w-[90vw] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]',
          'mt-[50px]',
          className
        )}
        cy-id="modal-content"
      >
        <ModalProvider modalRef={wrapperRef as React.RefObject<HTMLDivElement>}>{children}</ModalProvider>

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 w-full h-full bg-gray-900/60 rounded-lg flex items-center justify-center" cy-id="modal-processing-overlay">
            <LoadingIndicator />
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
