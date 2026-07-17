'use client'

import { TooltipCore } from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'

interface MoreInfoIconProps {
  moreInfoUrl: string
  size?: 'lg' | 'xl'
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const iconClassMap: Record<'lg' | 'xl', string> = {
  lg: 'text-lg',
  xl: 'text-xl'
}

export default function MoreInfoIcon({ moreInfoUrl, size = 'lg', position = 'right' }: MoreInfoIconProps) {
  const t = useTypeSafeTranslations()

  return (
    <TooltipCore text={t('LabelClickForMoreInfo')} position={position} closeOnClick className="leading-0">
      <Link href={moreInfoUrl} target="_blank" rel="noreferrer" className="text-foreground-muted hover:text-foreground inline-flex leading-0">
        <span className={mergeClasses('material-symbols', iconClassMap[size])}>help_outline</span>
      </Link>
    </TooltipCore>
  )
}
