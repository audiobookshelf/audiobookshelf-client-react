'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'
import MoreInfoIcon from '@/components/ui/MoreInfoIcon'

interface AddButtonProps {
  label: string
  onClick: () => void
}

export default function SettingsContent(props: {
  children: React.ReactNode
  title: string
  description?: React.ReactNode
  moreInfoUrl?: string
  backLink?: string
  addButton?: AddButtonProps
  entityCount?: number
  className?: string
}) {
  const t = useTypeSafeTranslations()
  // Back link, title and more info icon are shown in the app bar on mobile
  const hasMobileHeaderContent = !!props.entityCount || !!props.addButton

  return (
    <div className={mergeClasses('mx-auto w-full max-w-4xl p-2 md:p-6', props.className ?? '')}>
      <div className="bg-bg border-border rounded-md border p-2 shadow-lg sm:p-4">
        <div className={mergeClasses('mb-2 flex items-center gap-2', !hasMobileHeaderContent && 'max-md:hidden')}>
          {props.backLink && (
            <Link aria-label={t('ButtonBack')} href={props.backLink} className="text-foreground-muted hover:text-foreground hidden md:inline-flex">
              <span className="material-symbols text-xl">arrow_back</span>
            </Link>
          )}
          <h1 className="hidden text-xl md:block">{props.title}</h1>
          {props.entityCount ? (
            <div className="bg-primary/50 text-foreground-muted inline-flex items-center justify-center rounded-lg px-1.5 text-sm">{props.entityCount}</div>
          ) : null}
          {props.moreInfoUrl && (
            <div className="hidden md:inline-flex">
              <MoreInfoIcon moreInfoUrl={props.moreInfoUrl} />
            </div>
          )}
          <div className="grow" />
          {props.addButton && (
            <Btn size="small" onClick={props.addButton.onClick}>
              {props.addButton.label}
            </Btn>
          )}
        </div>
        {props.description ? <div className="text-foreground-muted default-style mb-6 text-sm">{props.description}</div> : null}
        {props.children}
      </div>
    </div>
  )
}
