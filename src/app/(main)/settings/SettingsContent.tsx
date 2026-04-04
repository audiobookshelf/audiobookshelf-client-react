'use client'

import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import { useSettingsDrawer } from '@/contexts/SettingsDrawerContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Link from 'next/link'
import SettingsMoreInfoIcon from './SettingsMoreInfoIcon'

interface AddButtonProps {
  label: string
  onClick: () => void
}

export default function SettingsContent(props: {
  children: React.ReactNode
  title: string
  description?: string
  moreInfoUrl?: string
  backLink?: string
  addButton?: AddButtonProps
  entityCount?: number
}) {
  const t = useTypeSafeTranslations()
  const { toggle } = useSettingsDrawer()

  return (
    <div className="mx-auto w-full max-w-4xl p-2 md:p-6">
      <IconBtn className="mb-2 md:hidden" ariaLabel={t('ButtonMenu')} size="large" borderless onClick={toggle}>
        menu
      </IconBtn>
      <div className="bg-bg border-border mb-8 rounded-md border p-2 shadow-lg sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          {props.backLink && (
            <Link aria-label={t('ButtonBack')} href={props.backLink} className="text-foreground-muted hover:text-foreground">
              <span className="material-symbols text-xl">arrow_back</span>
            </Link>
          )}
          <h1 className="text-xl">{props.title}</h1>
          {props.entityCount && (
            <div className="bg-primary/50 text-foreground-muted inline-flex items-center justify-center rounded-lg px-1.5 text-sm">{props.entityCount}</div>
          )}
          {props.moreInfoUrl && <SettingsMoreInfoIcon moreInfoUrl={props.moreInfoUrl} />}
          <div className="grow" />
          {props.addButton && (
            <Btn size="small" onClick={props.addButton.onClick}>
              {props.addButton.label}
            </Btn>
          )}
        </div>
        {props.description && <p className="text-foreground-muted mb-6 text-sm">{props.description}</p>}
        {props.children}
      </div>
    </div>
  )
}
