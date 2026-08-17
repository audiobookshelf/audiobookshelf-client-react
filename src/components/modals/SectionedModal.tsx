'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useEffect, useState, type ReactNode } from 'react'
import Modal, { type ModalProps } from './Modal'

export interface Section {
  id: string
  label: string
  icon: string
}

/** Fixed panel height for sectioned modals */
export const SECTIONED_MODAL_STABLE_HEIGHT_CLASS = 'h-[min(50rem,85vh)] max-h-[85vh]'

export interface SectionedModalBodyProps {
  sections: Section[]
  selectedSection: string
  onSectionChange: (sectionId: string) => void
  isOpen: boolean
  initialSection?: string
  children?: ReactNode
  className?: string
}

export function SectionedModalBody({ sections, selectedSection, onSectionChange, isOpen, initialSection, children, className }: SectionedModalBodyProps) {
  const t = useTypeSafeTranslations()
  const isMobile = useMediaQuery('max-md')
  const [mobileScreen, setMobileScreen] = useState<'hub' | string>(initialSection ?? 'hub')

  useEffect(() => {
    if (!isOpen) {
      setMobileScreen(initialSection ?? 'hub')
      return
    }
    if (initialSection) {
      setMobileScreen(initialSection)
    }
  }, [isOpen, initialSection])

  const handleMobileSelect = (sectionId: string) => {
    onSectionChange(sectionId)
    setMobileScreen(sectionId)
  }

  if (isMobile) {
    // List of sections displayed on mobile
    if (mobileScreen === 'hub') {
      return (
        <div className={mergeClasses('flex min-h-0 flex-1 flex-col overflow-y-auto p-2', className)}>
          <nav className="flex flex-col gap-2 px-2 py-2">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMobileSelect(item.id)}
                className="bg-primary/40 hover:bg-primary/60 text-foreground-muted hover:text-foreground rounded-md p-4 text-start transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="material-symbols text-2xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <span className="material-symbols shrink-0 text-xl" aria-hidden>
                    arrow_forward
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      )
    }

    const section = sections.find((item) => item.id === mobileScreen)!
    return (
      <div className={mergeClasses('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', SECTIONED_MODAL_STABLE_HEIGHT_CLASS, className)}>
        <div className="border-border flex shrink-0 items-center gap-1 border-b px-2 py-2">
          <IconBtn borderless ariaLabel={t('ButtonBack')} onClick={() => setMobileScreen('hub')} className="shrink-0">
            arrow_back
          </IconBtn>
          <span className="min-w-0 truncate text-xl font-semibold">{section.label}</span>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className={mergeClasses('flex min-w-0 flex-1 flex-row overflow-hidden rounded-lg', SECTIONED_MODAL_STABLE_HEIGHT_CLASS, className)}>
      <nav className="border-border bg-primary flex w-36 shrink-0 flex-col border-e py-3" aria-label={t('AriaLabelModalSections')}>
        {sections.map((item) => {
          const isActive = item.id === selectedSection
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={mergeClasses(
                'flex items-center gap-3 px-4 py-2.5 text-start text-sm font-medium transition-colors',
                isActive ? 'bg-bg text-foreground border-s-warning border-s-4' : 'text-foreground-muted hover:text-foreground border-s-4 border-s-transparent'
              )}
            >
              <span className="material-symbols text-xl" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}

export type SectionedModalProps = Omit<ModalProps, 'children'> &
  Omit<SectionedModalBodyProps, 'className'> & {
    bodyClassName?: string
  }

/**
 * Modal with section navigation. Desktop: left rail. Mobile: hub list with drill-in and Back.
 * Section panel height is fixed so switching sections does not resize the modal.
 */
export default function SectionedModal({
  isOpen,
  processing,
  persistent,
  zIndexClass,
  bgOpacityClass,
  outerContent,
  sideNavigation,
  onClose,
  className,
  style,
  sections,
  selectedSection,
  onSectionChange,
  initialSection,
  children,
  bodyClassName
}: SectionedModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      processing={processing}
      persistent={persistent}
      zIndexClass={zIndexClass}
      bgOpacityClass={bgOpacityClass}
      outerContent={outerContent}
      sideNavigation={sideNavigation}
      onClose={onClose}
      className={className}
      style={style}
    >
      <SectionedModalBody
        sections={sections}
        selectedSection={selectedSection}
        onSectionChange={onSectionChange}
        isOpen={isOpen}
        initialSection={initialSection}
        className={bodyClassName}
      >
        {children}
      </SectionedModalBody>
    </Modal>
  )
}
