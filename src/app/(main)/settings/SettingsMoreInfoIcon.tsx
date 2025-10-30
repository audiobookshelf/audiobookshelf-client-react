'use client'

import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Link from 'next/link'

export default function SettingsMoreInfoIcon(props: { moreInfoUrl: string }) {
  const t = useTypeSafeTranslations()

  return (
    <Tooltip text={t('LabelClickForMoreInfo')} position="right" closeOnClick className="leading-0">
      <Link href={props.moreInfoUrl} target="_blank" className="leading-0 text-foreground-muted">
        <span className="material-symbols text-lg">help_outline</span>
      </Link>
    </Tooltip>
  )
}
