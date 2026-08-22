'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { ReactNode } from 'react'

interface ChaptersToolbarPanelProps {
  onClose: () => void
  children: ReactNode
  className?: string
}

export default function ChaptersToolbarPanel({ onClose, children, className }: ChaptersToolbarPanelProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className={mergeClasses('border-border bg-primary/10 mb-4 h-28 shrink-0 rounded-lg border p-4 text-sm', className)}>
      <div className="flex h-full items-start gap-2">
        <div className="flex h-full min-w-0 flex-1 flex-col">{children}</div>
        <IconBtn ariaLabel={t('ButtonClose')} borderless size="small" className="shrink-0" onClick={onClose}>
          close
        </IconBtn>
      </div>
    </div>
  )
}
