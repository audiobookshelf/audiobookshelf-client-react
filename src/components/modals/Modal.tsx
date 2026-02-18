'use client'

import LoadingIndicator from '@/components/ui/LoadingIndicator'
import { ModalProvider } from '@/contexts/ModalContext'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React, { ReactNode, useCallback, useEffect, useRef } from 'react'
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

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (!isOpen || processing || persistent) return

      // Only close if the click occurred strictly within this modal's wrapper.
      // If the click was on a nested modal (which is a sibling in the DOM due to portals),
      // wrapperRef.current.contains(taget) will be false, so we ignore it.
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        return
      }

      onClose?.()
    },
    [isOpen, processing, persistent, onClose]
  )

  // Use click outside hook
  useClickOutside(contentRef, null, handleClickOutside)

  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      // Focus the modal content when it opens
      // We use requestAnimationFrame to ensure the element is ready to receive focus
      requestAnimationFrame(() => {
        contentRef.current?.focus()
      })
    }
    return () => {
      // Restore focus when modal closes or unmounts (if it was open)
      if (isOpen && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen])

  // Handle keydown events (Escape and Tab)
  // We attach this to the wrapper div so it respects React event propagation.
  // This means that if a nested modal handles the event and stops propagation,
  // this handler will never see it, solving the "close all modals" issue naturally.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape key to close
      if (e.key === 'Escape' && !processing && !persistent) {
        e.preventDefault()
        e.stopPropagation()
        onClose?.()
        return
      }

      // Focus trap
      if (e.key === 'Tab') {
        if (!contentRef.current) return

        const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )

        // If no focusable elements, keep focus on content container
        if (focusableElements.length === 0) {
          e.preventDefault()
          contentRef.current.focus()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Check if focus is within the modal
        const isFocusInModal = contentRef.current.contains(document.activeElement)

        console.log('isFocusInModal', isFocusInModal)

        if (!isFocusInModal) {
          // If focus somehow got outside, bring it back
          e.preventDefault()
          if (e.shiftKey) lastElement.focus()
          else firstElement.focus()
        } else {
          // Normal trap logic
          if (e.shiftKey) {
            if (document.activeElement === firstElement || document.activeElement === contentRef.current) {
              e.preventDefault()
              lastElement.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault()
              firstElement.focus()
            }
          }
        }
      }
    },
    [processing, persistent, onClose]
  )

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
      onKeyDown={handleKeyDown}
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
        onClick={(e) => e.stopPropagation()}
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
