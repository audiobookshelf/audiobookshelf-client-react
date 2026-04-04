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
      className={mergeClasses('overflow-visible rounded-none bg-transparent shadow-none', className)}
      style={style}
    >
      {/* Tabs bar */}
      <div className="flex gap-1 pr-2" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === selectedTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              className={mergeClasses(
                'max-w-28 flex-1 cursor-pointer px-2 py-2 text-sm font-medium transition-colors select-none sm:px-4 sm:text-base',
                'border-border mb-[-1px] rounded-t-lg border',
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
      <div className="bg-bg shadow-modal-content border-border flex flex-col rounded-tr-lg rounded-b-lg border-t">
        {/* Tab content */}
        <div id={`tabpanel-${selectedTab}`} role="tabpanel" className={contentClassName} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>

        {/* Footer */}
        {footer && <div className="border-border border-t px-4 py-3">{footer}</div>}
      </div>
    </Modal>
  )
}
