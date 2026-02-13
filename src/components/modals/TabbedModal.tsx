'use client'

import { mergeClasses } from '@/lib/merge-classes'
import React, { ReactNode } from 'react'
import Modal from './Modal'

export interface Tab {
  id: string
  label: string
}

export interface TabbedModalProps {
  isOpen: boolean
  processing?: boolean
  persistent?: boolean
  zIndexClass?: string
  bgOpacityClass?: string
  tabs: Tab[]
  selectedTab: string
  onTabChange: (tabId: string) => void
  children?: ReactNode
  footer?: ReactNode
  outerContent?: ReactNode
  onClose?: () => void
  className?: string
  contentClassName?: string
  style?: React.CSSProperties
}

export default function TabbedModal({
  isOpen,
  processing,
  persistent,
  zIndexClass,
  bgOpacityClass,
  tabs,
  selectedTab,
  onTabChange,
  children,
  footer,
  outerContent,
  onClose,
  className,
  contentClassName,
  style
}: TabbedModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      processing={processing}
      persistent={persistent}
      zIndexClass={zIndexClass}
      bgOpacityClass={bgOpacityClass}
      outerContent={outerContent}
      onClose={onClose}
      className={mergeClasses('bg-transparent shadow-none rounded-none overflow-visible', className)}
      style={style}
    >
      {/* Tabs bar */}
      <div className="flex gap-1" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === selectedTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              className={mergeClasses(
                'max-w-28 flex-1 px-2 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors cursor-pointer select-none',
                'rounded-t-lg border border-border mb-[-1px]',
                isActive ? 'bg-bg text-foreground border-b-bg relative z-[1]' : 'bg-primary text-foreground-muted hover:text-foreground'
              )}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Modal content */}
      <div className="bg-bg rounded-b-lg rounded-tr-lg shadow-modal-content border-t border-border flex flex-col">
        {/* Tab content */}
        <div id={`tabpanel-${selectedTab}`} role="tabpanel" className={contentClassName} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>

        {/* Footer */}
        {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
      </div>
    </Modal>
  )
}
