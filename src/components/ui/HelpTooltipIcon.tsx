'use client'

import IconBtn from '@/components/ui/IconBtn'
import { TooltipCore } from '@/components/ui/Tooltip'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { mergeClasses } from '@/lib/merge-classes'

interface HelpTooltipIconProps {
  text: React.ReactNode
  size?: 'sm' | 'lg'
  ariaLabel?: string
}

const iconClassMap: Record<'sm' | 'lg', string> = {
  sm: 'text-sm',
  lg: 'text-lg'
}

export default function HelpTooltipIcon({ text, size = 'lg', ariaLabel }: HelpTooltipIconProps) {
  const primaryInputCanHover = usePrimaryInputCanHover()
  const openOnClick = !primaryInputCanHover
  const resolvedAriaLabel = ariaLabel ?? (typeof text === 'string' ? text : undefined)

  return (
    <TooltipCore
      inline
      activateOnFocus
      text={text}
      position="right"
      maxWidth={280}
      tooltipClassName="text-start"
      openOnClick={openOnClick}
      className="inline-flex align-middle"
    >
      <IconBtn
        borderless
        size="custom"
        ariaLabel={resolvedAriaLabel ?? 'Help'}
        iconClass={iconClassMap[size]}
        className={mergeClasses('h-auto min-h-0 w-auto shadow-none', openOnClick ? 'cursor-pointer' : 'cursor-default')}
      >
        info
      </IconBtn>
    </TooltipCore>
  )
}
