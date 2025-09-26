'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { createPortal } from 'react-dom'
import { useClickOutside } from '@/hooks/useClickOutside'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import { mergeClasses } from '@/lib/merge-classes'
import { ModalProvider } from '@/contexts/ModalContext'

export interface ModalProps {
  isOpen: boolean
  processing?: boolean
  persistent?: boolean
  width?: string | number
  height?: string | number
  contentMarginTop?: number
  zIndexClass?: string
  bgOpacityClass?: string
  children?: ReactNode
  outerContent?: ReactNode
  onClose?: () => void
}

export default function Modal({
  isOpen,
  processing = false,
  persistent = false,
  width = 500,
  height = 'unset',
  contentMarginTop = 50,
  zIndexClass = 'z-50',
  bgOpacityClass = 'bg-primary/75',
  children,
  outerContent,
  onClose
}: ModalProps) {
  const t = useTypeSafeTranslations()
  const [preventClickoutside, setPreventClickoutside] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const dummyRef = useRef<HTMLDivElement>(null) // For useClickOutside trigger ref

  const modalHeight = useMemo(() => {
    if (typeof height === 'string') {
      return height
    }
    return `${height}px`
  }, [height])

  const modalWidth = useMemo(() => {
    if (typeof width === 'string') {
      return width
    }
    return `${width}px`
  }, [width])

  const mousedownModal = useCallback(() => {
    setPreventClickoutside(true)
  }, [])

  const mouseupModal = useCallback(() => {
    setPreventClickoutside(false)
  }, [])

  const clickClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const clickBg = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      if (!isOpen) return
      if (preventClickoutside) {
        setPreventClickoutside(false)
        return
      }
      if (processing || persistent) return

      const target = event.target as HTMLElement
      if (target && target.classList.contains('modal-bg')) {
        onClose?.()
      }
    },
    [isOpen, preventClickoutside, processing, persistent, onClose]
  )

  const handleClickOutside = useCallback(() => {
    if (!isOpen || preventClickoutside || processing || persistent) return
    onClose?.()
  }, [isOpen, preventClickoutside, processing, persistent, onClose])

  // Use click outside hook
  useClickOutside(contentRef, dummyRef, handleClickOutside)

  if (!isOpen) {
    return null
  }

  const modalContent = (
    <div
      ref={wrapperRef}
      role="dialog"
      aria-modal="true"
      className={mergeClasses('modal modal-bg w-full h-full fixed top-0 start-0 items-center justify-center flex', zIndexClass, bgOpacityClass)}
      onClick={clickBg}
      cy-id="modal-wrapper"
    >
      {/* Background gradient */}
      <div className="absolute inset-x-0 top-0 w-full h-36 bg-gradient-to-t from-transparent via-gray-900/50 to-gray-800/70 opacity-90 pointer-events-none" />

      {/* Close button */}
      <button
        className="absolute top-4 end-4 landscape:top-4 landscape:end-4 md:portrait:top-5 md:portrait:end-5 lg:top-5 lg:end-5 inline-flex text-gray-200 hover:text-white z-10 transition-colors"
        aria-label={t('ButtonCloseModal')}
        onClick={clickClose}
        cy-id="modal-close-button"
      >
        <span className="material-symbols text-2xl landscape:text-2xl md:portrait:text-4xl lg:text-4xl">close</span>
      </button>

      {/* Outer content slot */}
      {outerContent}

      {/* Main modal content */}
      <div
        ref={contentRef}
        tabIndex={0}
        style={{
          minWidth: '380px',
          minHeight: '200px',
          maxWidth: '100vw',
          height: modalHeight,
          width: modalWidth,
          marginTop: `${contentMarginTop}px`
        }}
        className="relative text-white outline-none focus:outline-none"
        onMouseDown={mousedownModal}
        onMouseUp={mouseupModal}
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
