'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useEffect, useMemo, useState } from 'react'

// Constants for layout calculations to avoid magic numbers in the component.
const MODAL_VERTICAL_MARGIN = 32
const MODAL_LANDSCAPE_MAX_HEIGHT = 700
const MODAL_HORIZONTAL_MARGIN = 32
const MODAL_PORTRAIT_MAX_WIDTH = 600
const MODAL_HEADER_FOOTER_HEIGHT = 64 // Approximate combined height for modal header, footer, and vertical padding.
const MODAL_IMAGE_HORIZONTAL_PADDING = 48 // Total horizontal padding for the image container.
const PREVIEW_COVER_MAX_WIDTH_LANDSCAPE = 500
const PREVIEW_COVER_FALLBACK_WIDTH_LANDSCAPE = 400

interface CoverPreviewModalProps {
  isOpen: boolean
  selectedCover: string | null
  bookCoverAspectRatio: number
  onClose: () => void
  onApply: () => void
}

export default function CoverPreviewModal({ isOpen, selectedCover, bookCoverAspectRatio, onClose, onApply }: CoverPreviewModalProps) {
  const t = useTypeSafeTranslations()

  // Track actual window dimensions for accurate orientation detection.
  const [actualWindowWidth, setActualWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)
  const [actualWindowHeight, setActualWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0)

  // Update window dimensions on resize. This effect runs only on the client.
  useEffect(() => {
    const handleResize = () => {
      setActualWindowWidth(window.innerWidth)
      setActualWindowHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Use the most up-to-date window dimensions for calculations.
  const currentWindowWidth = actualWindowWidth
  const currentWindowHeight = actualWindowHeight

  // Determine if the window is in landscape mode (width > height).
  const isLandscape = useMemo(() => {
    return currentWindowWidth > currentWindowHeight
  }, [currentWindowWidth, currentWindowHeight])

  const modalClassName = useMemo(() => {
    return 'mt-0'
  }, [])

  const modalStyle = useMemo(() => {
    if (isLandscape) {
      const height = Math.min(currentWindowHeight - MODAL_VERTICAL_MARGIN, MODAL_LANDSCAPE_MAX_HEIGHT)
      return { height: `${height}px` } as React.CSSProperties
    } else {
      const width = Math.min(currentWindowWidth - MODAL_HORIZONTAL_MARGIN, MODAL_PORTRAIT_MAX_WIDTH)
      return { width: `${width}px` } as React.CSSProperties
    }
  }, [isLandscape, currentWindowHeight, currentWindowWidth])

  // Calculate the available vertical space for the image within the modal.
  const availableImageHeight = useMemo(() => {
    if (isLandscape) {
      // In landscape, available height is the modal's height minus the header and footer.
      const modalHeight = Math.min(currentWindowHeight - MODAL_VERTICAL_MARGIN, MODAL_LANDSCAPE_MAX_HEIGHT)
      return modalHeight - MODAL_HEADER_FOOTER_HEIGHT
    }
    // In portrait mode, height is not a constraint, so we don't need to calculate it.
    return undefined
  }, [isLandscape, currentWindowHeight])

  // Calculate the width for the PreviewCover component based on available space and orientation.
  const previewCoverWidth = useMemo(() => {
    if (isLandscape) {
      // In landscape, width is derived from the available height and the book's aspect ratio.
      if (availableImageHeight) {
        const calculatedWidth = availableImageHeight / bookCoverAspectRatio
        // Subtract horizontal padding to ensure the image fits within the padded container.
        const adjustedWidth = calculatedWidth - MODAL_IMAGE_HORIZONTAL_PADDING
        // The width is capped to prevent it from being too large on wide screens.
        return Math.min(adjustedWidth, currentWindowWidth * 0.7, PREVIEW_COVER_MAX_WIDTH_LANDSCAPE)
      }
      // Fallback width calculation if `availableImageHeight` is not available.
      return Math.min(PREVIEW_COVER_FALLBACK_WIDTH_LANDSCAPE - MODAL_IMAGE_HORIZONTAL_PADDING, currentWindowWidth * 0.6)
    } else {
      // In portrait, the cover's width is based on the modal's width, accounting for padding.
      const modalWidth = Math.min(currentWindowWidth - MODAL_HORIZONTAL_MARGIN, MODAL_PORTRAIT_MAX_WIDTH)
      return modalWidth - MODAL_IMAGE_HORIZONTAL_PADDING
    }
  }, [isLandscape, currentWindowWidth, availableImageHeight, bookCoverAspectRatio])

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={modalClassName} style={modalStyle}>
      <div className="bg-bg rounded-lg h-full w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-3 text-center">
          <p className="text-base font-semibold">{t('HeaderPreviewCover')}</p>
        </div>

        {/* Image area - takes remaining space */}
        <div className="flex-1 flex justify-center items-center px-6 min-h-0">
          {selectedCover && <PreviewCover src={selectedCover} width={previewCoverWidth} bookCoverAspectRatio={bookCoverAspectRatio} showResolution={false} />}
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex gap-3 sm:gap-4 justify-center py-3 px-6">
          <Btn onClick={onClose} className="flex-1 sm:flex-none sm:min-w-24">
            {t('ButtonCancel')}
          </Btn>
          <Btn color="bg-success" onClick={onApply} className="flex-1 sm:flex-none sm:min-w-24">
            {t('ButtonApply')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
